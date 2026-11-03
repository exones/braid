import { mkdir, readdir, unlink } from "node:fs/promises";
import type { Command } from "./args.js";
import { errnoCode, LedgerFailure } from "./errors.js";
import { analyzeEvents, serializeEvent, type LedgerEvent } from "./events.js";
import {
  acquireLock,
  createDefaultLedgerIo,
  ledgerPaths,
  pathKind,
  readRegularFile,
  releaseLock,
  resolveRoot,
  STORAGE_DIRECTORY,
  type LedgerIo,
  type LedgerPaths,
  type PathKind,
} from "./ledger-fs.js";
import { formatStatusJson, formatStatusText, formatWarnings } from "./status.js";
import { parseState, serializeState, type Epic, type LedgerState, type WorkItem } from "./state.js";
import { LIMITS, type ItemState, type Kind } from "./text.js";

const STORAGE_MUST_BE_REAL = `error: ${STORAGE_DIRECTORY} must be a real directory inside the project root`;
const STATE_MUST_BE_REGULAR = `error: state file must be a regular file inside ${STORAGE_DIRECTORY}`;
const EVENTS_MUST_BE_REGULAR = `error: events file must be a regular file inside ${STORAGE_DIRECTORY}`;
const STORAGE_NOT_EMPTY = `error: ${STORAGE_DIRECTORY} is not an empty ledger directory; state preserved`;
const CANNOT_WRITE = "error: cannot write state";

export interface Outcome {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface ExecuteContext {
  readonly rootArg: string | undefined;
  readonly cwd: string;
  readonly io: Partial<LedgerIo> | undefined;
}

interface Applied {
  readonly state: LedgerState;
  readonly event: LedgerEvent;
  readonly stdout: string;
}

function resolveIo(override: Partial<LedgerIo> | undefined): LedgerIo {
  const defaults = createDefaultLedgerIo();
  if (override === undefined) {
    return defaults;
  }
  return {
    writeTempFile: override.writeTempFile ?? defaults.writeTempFile,
    replaceTemp: override.replaceTemp ?? defaults.replaceTemp,
    appendEventLine: override.appendEventLine ?? defaults.appendEventLine,
    createEmptyEvents: override.createEmptyEvents ?? defaults.createEmptyEvents,
  };
}

function mapStorageError(error: unknown): Error {
  const code = errnoCode(error);
  if (code === "EACCES" || code === "EPERM" || code === "EROFS" || code === "ENOSPC") {
    return new LedgerFailure(5, CANNOT_WRITE);
  }
  return error instanceof Error ? error : new Error("storage failure");
}

async function readLedgerFile(filePath: string): Promise<Buffer> {
  try {
    return await readRegularFile(filePath);
  } catch (error) {
    if (error instanceof LedgerFailure) {
      throw error;
    }
    const code = errnoCode(error);
    if (code === "EACCES" || code === "EPERM" || code === "ELOOP") {
      throw new LedgerFailure(5, CANNOT_WRITE);
    }
    throw error;
  }
}

async function locked(
  paths: LedgerPaths,
  linkExit: 1 | 3,
  body: () => Promise<Outcome>,
): Promise<Outcome> {
  await acquireLock(paths.lock);
  try {
    const kind = await pathKind(paths.dir);
    if (kind !== "directory") {
      throw new LedgerFailure(linkExit, STORAGE_MUST_BE_REAL);
    }
    return await body();
  } finally {
    await releaseLock(paths.lock);
  }
}

async function ensureStorageForInit(paths: LedgerPaths): Promise<void> {
  const kind = await pathKind(paths.dir);
  if (kind === "directory") {
    return;
  }
  if (kind !== "absent") {
    throw new LedgerFailure(1, STORAGE_MUST_BE_REAL);
  }
  try {
    await mkdir(paths.dir);
  } catch (error) {
    if (errnoCode(error) !== "EEXIST") {
      throw mapStorageError(error);
    }
  }
  const created = await pathKind(paths.dir);
  if (created !== "directory") {
    throw new LedgerFailure(1, STORAGE_MUST_BE_REAL);
  }
}

async function ensureRealStorage(paths: LedgerPaths): Promise<void> {
  const kind = await pathKind(paths.dir);
  if (kind === "absent") {
    throw new LedgerFailure(1, "error: not initialized; run braid init");
  }
  if (kind !== "directory") {
    throw new LedgerFailure(3, STORAGE_MUST_BE_REAL);
  }
}

async function inspectFiles(paths: LedgerPaths): Promise<{ state: PathKind; events: PathKind }> {
  const state = await pathKind(paths.state);
  const events = await pathKind(paths.events);
  const temp = await pathKind(paths.temp);
  if (state !== "absent" && state !== "file") {
    throw new LedgerFailure(3, STATE_MUST_BE_REGULAR);
  }
  if (events !== "absent" && events !== "file") {
    throw new LedgerFailure(3, EVENTS_MUST_BE_REGULAR);
  }
  if (temp !== "absent" && temp !== "file") {
    throw new LedgerFailure(3, "error: temporary state file is not a regular file; preserved");
  }
  return { state, events };
}

async function loadState(paths: LedgerPaths, kind: PathKind): Promise<LedgerState> {
  if (kind === "absent") {
    throw new LedgerFailure(3, "error: state file missing; not recovered automatically");
  }
  const raw = await readLedgerFile(paths.state);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString("utf8"));
  } catch {
    throw new LedgerFailure(3, "error: state file is invalid JSON; preserved for diagnosis");
  }
  return parseState(parsed);
}

async function replaceState(paths: LedgerPaths, contents: string, io: LedgerIo): Promise<void> {
  const tempKind = await pathKind(paths.temp);
  if (tempKind !== "absent" && tempKind !== "file") {
    throw new LedgerFailure(3, "error: temporary state file is not a regular file; preserved");
  }
  if (tempKind === "file") {
    try {
      await unlink(paths.temp);
    } catch (error) {
      if (errnoCode(error) !== "ENOENT") {
        throw mapStorageError(error);
      }
    }
  }
  try {
    await io.writeTempFile(paths.temp, contents);
    await io.replaceTemp(paths.temp, paths.state);
  } catch (error) {
    if (error instanceof LedgerFailure) {
      throw error;
    }
    throw new LedgerFailure(5, CANNOT_WRITE);
  }
}

function requireEpic(state: LedgerState, epicId: string): Epic {
  const epic = state.epics.find((candidate) => candidate.id === epicId);
  if (epic === undefined) {
    throw new LedgerFailure(2, `error: epic ${epicId} not found`);
  }
  return epic;
}

function requireItem(epic: Epic, itemId: string): WorkItem {
  const item = epic.items.find((candidate) => candidate.id === itemId);
  if (item === undefined) {
    throw new LedgerFailure(2, `error: item ${itemId} not found`);
  }
  return item;
}

function replaceEpic(state: LedgerState, epic: Epic, revision: number): LedgerState {
  return {
    schemaVersion: 1,
    revision,
    epics: state.epics.map((candidate) => (candidate.id === epic.id ? epic : candidate)),
  };
}

function withItem(epic: Epic, item: WorkItem, now: string): Epic {
  return {
    id: epic.id,
    title: epic.title,
    outcome: epic.outcome,
    createdAt: epic.createdAt,
    updatedAt: now,
    items: epic.items.map((candidate) => (candidate.id === item.id ? item : candidate)),
  };
}

function keptNote(explicit: string | null, current: string | null): string | null {
  return explicit === null ? current : explicit;
}

function eventFor(
  revision: number,
  at: string,
  action: LedgerEvent["action"],
  epicId: string,
  itemId: string | null,
  kind: Kind | null,
  from: ItemState | null,
  to: ItemState | null,
  note: string | null,
  nextAction: string | null,
  reason: string | null,
  evidenceNote: string | null,
): LedgerEvent {
  return {
    schemaVersion: 1,
    revision,
    at,
    action,
    epicId,
    itemId,
    kind,
    from,
    to,
    note,
    nextAction,
    reason,
    evidenceNote,
  };
}

function applyNew(state: LedgerState, command: Extract<Command, { type: "new" }>, now: string): Applied {
  if (state.epics.some((epic) => epic.id === command.epicId)) {
    throw new LedgerFailure(2, `error: epic ${command.epicId} already exists`);
  }
  const revision = state.revision + 1;
  const epic: Epic = {
    id: command.epicId,
    title: command.title,
    outcome: command.outcome,
    createdAt: now,
    updatedAt: now,
    items: [],
  };
  return {
    state: { schemaVersion: 1, revision, epics: [...state.epics, epic] },
    event: eventFor(revision, now, "epic.new", command.epicId, null, null, null, null, null, null, null, null),
    stdout: `created epic ${command.epicId}\n`,
  };
}

function applyAdd(state: LedgerState, command: Extract<Command, { type: "story-add" }>, now: string): Applied {
  const epic = requireEpic(state, command.epicId);
  if (epic.items.some((item) => item.id === command.itemId)) {
    throw new LedgerFailure(2, `error: item ${command.itemId} already exists`);
  }
  const nextAction = command.next === null ? `Start item ${command.itemId}.` : command.next;
  const item: WorkItem = {
    id: command.itemId,
    kind: command.kind,
    title: command.title,
    state: "backlog",
    note: command.note,
    blockedFrom: null,
    blockReason: null,
    evidenceNote: null,
    acceptance: null,
    nextAction,
    createdAt: now,
    updatedAt: now,
  };
  const revision = state.revision + 1;
  return {
    state: replaceEpic(
      state,
      {
        id: epic.id,
        title: epic.title,
        outcome: epic.outcome,
        createdAt: epic.createdAt,
        updatedAt: now,
        items: [...epic.items, item],
      },
      revision,
    ),
    event: eventFor(
      revision,
      now,
      "story.add",
      epic.id,
      item.id,
      item.kind,
      null,
      "backlog",
      command.note,
      nextAction,
      null,
      null,
    ),
    stdout: `added ${item.kind} ${item.id} backlog\n`,
  };
}

function applyStart(state: LedgerState, command: Extract<Command, { type: "story-start" }>, now: string): Applied {
  const epic = requireEpic(state, command.epicId);
  const item = requireItem(epic, command.itemId);
  if (item.state !== "backlog" && item.state !== "blocked") {
    throw new LedgerFailure(2, `error: cannot start item ${item.id} from ${item.state}`);
  }
  const resumed = item.state === "blocked";
  const nextAction = command.next === null ? `Continue item ${item.id}.` : command.next;
  const updated: WorkItem = {
    id: item.id,
    kind: item.kind,
    title: item.title,
    state: "in-progress",
    note: keptNote(command.note, item.note),
    blockedFrom: null,
    blockReason: null,
    evidenceNote: null,
    acceptance: null,
    nextAction,
    createdAt: item.createdAt,
    updatedAt: now,
  };
  const revision = state.revision + 1;
  return {
    state: replaceEpic(state, withItem(epic, updated, now), revision),
    event: eventFor(
      revision,
      now,
      "story.start",
      epic.id,
      item.id,
      item.kind,
      item.state,
      "in-progress",
      command.note,
      nextAction,
      null,
      null,
    ),
    stdout: `${resumed ? "resumed" : "started"} ${item.kind} ${item.id} in-progress\n`,
  };
}

function applyBlock(state: LedgerState, command: Extract<Command, { type: "story-block" }>, now: string): Applied {
  const epic = requireEpic(state, command.epicId);
  const item = requireItem(epic, command.itemId);
  if (item.state !== "in-progress") {
    throw new LedgerFailure(2, `error: cannot block item ${item.id} from ${item.state}`);
  }
  const defaultNext = `Resolve: ${command.reason}`;
  const nextAction = command.next ??
    (defaultNext.length <= LIMITS.next ? defaultNext : "Resolve block; see block reason.");
  const updated: WorkItem = {
    id: item.id,
    kind: item.kind,
    title: item.title,
    state: "blocked",
    note: keptNote(command.note, item.note),
    blockedFrom: "in-progress",
    blockReason: command.reason,
    evidenceNote: null,
    acceptance: null,
    nextAction,
    createdAt: item.createdAt,
    updatedAt: now,
  };
  const revision = state.revision + 1;
  return {
    state: replaceEpic(state, withItem(epic, updated, now), revision),
    event: eventFor(
      revision,
      now,
      "story.block",
      epic.id,
      item.id,
      item.kind,
      "in-progress",
      "blocked",
      command.note,
      nextAction,
      command.reason,
      null,
    ),
    stdout: `blocked ${item.kind} ${item.id}\n`,
  };
}

function applyComplete(state: LedgerState, command: Extract<Command, { type: "story-complete" }>, now: string): Applied {
  const epic = requireEpic(state, command.epicId);
  const item = requireItem(epic, command.itemId);
  if (item.state !== "in-progress") {
    throw new LedgerFailure(2, `error: cannot complete item ${item.id} from ${item.state}`);
  }
  const nextAction = command.next === null ? "None. Manual record only." : command.next;
  const updated: WorkItem = {
    id: item.id,
    kind: item.kind,
    title: item.title,
    state: "done",
    note: keptNote(command.note, item.note),
    blockedFrom: null,
    blockReason: null,
    evidenceNote: command.evidence,
    acceptance: "manual",
    nextAction,
    createdAt: item.createdAt,
    updatedAt: now,
  };
  const revision = state.revision + 1;
  return {
    state: replaceEpic(state, withItem(epic, updated, now), revision),
    event: eventFor(
      revision,
      now,
      "story.complete",
      epic.id,
      item.id,
      item.kind,
      "in-progress",
      "done",
      command.note,
      nextAction,
      null,
      command.evidence,
    ),
    stdout: `completed ${item.kind} ${item.id} manual\n`,
  };
}

function apply(state: LedgerState, command: Exclude<Command, { type: "init" | "status" }>, now: string): Applied {
  switch (command.type) {
    case "new":
      return applyNew(state, command, now);
    case "story-add":
      return applyAdd(state, command, now);
    case "story-start":
      return applyStart(state, command, now);
    case "story-block":
      return applyBlock(state, command, now);
    case "story-complete":
      return applyComplete(state, command, now);
    default: {
      const neverCommand: never = command;
      throw new Error(`unexpected command: ${String(neverCommand)}`);
    }
  }
}

async function initCommand(paths: LedgerPaths, io: LedgerIo): Promise<Outcome> {
  await ensureStorageForInit(paths);
  return locked(paths, 1, async () => {
    const stateKind = await pathKind(paths.state);
    if (stateKind === "absent") {
      const entries = await readdir(paths.dir);
      if (entries.some((entry) => entry !== "lock")) {
        throw new LedgerFailure(3, STORAGE_NOT_EMPTY);
      }
      await replaceState(paths, serializeState({ schemaVersion: 1, revision: 0, epics: [] }), io);
      try {
        await io.createEmptyEvents(paths.events);
      } catch (error) {
        if (error instanceof LedgerFailure) {
          throw error;
        }
        throw new LedgerFailure(5, "error: state updated to revision 0 but the event append failed; not rolled back");
      }
      return { code: 0, stdout: "initialized schema 1\n", stderr: "" };
    }
    if (stateKind !== "file") {
      throw new LedgerFailure(3, STATE_MUST_BE_REGULAR);
    }
    const raw = await readLedgerFile(paths.state);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new LedgerFailure(3, "error: state file is invalid JSON; preserved for diagnosis");
    }
    parseState(parsed);
    return { code: 0, stdout: "already initialized schema 1\n", stderr: "" };
  });
}

async function statusCommand(paths: LedgerPaths, command: Extract<Command, { type: "status" }>): Promise<Outcome> {
  const kinds = await inspectFiles(paths);
  const state = await loadState(paths, kinds.state);
  const events = await analyzeEvents(
    kinds.events === "absent" ? null : (await readLedgerFile(paths.events)).toString("utf8"),
    state.revision,
  );
  if (events.fatal !== null) {
    throw new LedgerFailure(3, events.fatal);
  }
  const epic = command.epicId === null ? null : requireEpic(state, command.epicId);
  return {
    code: 0,
    stdout: command.json ? formatStatusJson(state, epic, events) : formatStatusText(state, epic),
    stderr: formatWarnings(events),
  };
}

async function mutationCommand(
  paths: LedgerPaths,
  io: LedgerIo,
  command: Exclude<Command, { type: "init" | "status" }>,
): Promise<Outcome> {
  const kinds = await inspectFiles(paths);
  const state = await loadState(paths, kinds.state);
  const events = await analyzeEvents(
    kinds.events === "absent" ? null : (await readLedgerFile(paths.events)).toString("utf8"),
    state.revision,
  );
  if (events.fatal !== null) {
    throw new LedgerFailure(3, events.fatal);
  }
  if (events.mutationBlock !== null) {
    throw new LedgerFailure(3, events.mutationBlock);
  }
  const applied = apply(state, command, new Date().toISOString());
  await replaceState(paths, serializeState(applied.state), io);
  try {
    await io.appendEventLine(paths.events, serializeEvent(applied.event));
  } catch (error) {
    if (error instanceof LedgerFailure) {
      throw error;
    }
    throw new LedgerFailure(
      5,
      `error: state updated to revision ${applied.state.revision} but the event append failed; not rolled back`,
    );
  }
  return { code: 0, stdout: applied.stdout, stderr: "" };
}

export async function executeCommand(command: Command, context: ExecuteContext): Promise<Outcome> {
  try {
    const root = await resolveRoot(context.rootArg, context.cwd);
    const paths = ledgerPaths(root);
    const io = resolveIo(context.io);
    if (command.type === "init") {
      return await initCommand(paths, io);
    }
    await ensureRealStorage(paths);
    return await locked(paths, 3, async () => {
      if (command.type === "status") {
        return statusCommand(paths, command);
      }
      return mutationCommand(paths, io, command);
    });
  } catch (error) {
    if (error instanceof LedgerFailure) {
      return { code: error.exitCode, stdout: "", stderr: `${error.message}\n` };
    }
    throw error;
  }
}
