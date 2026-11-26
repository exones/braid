// `braid gate`: BRAID.md's `gate` command under a machine-wide limit of two at once. Each running gate holds one
// of two slot files in the braid home (`gate-1.lock`, `gate-2.lock`); a slot whose process is gone is taken over.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { constants } from "node:os";
import { basename, join } from "node:path";
import { repoNameOf } from "../braids/repo.js";
import { takeOverStale } from "../braids/state.js";
import { braidHome } from "../notify/config.js";
import { UsageError } from "./braids.js";

/** The exit code of `--no-wait` when both slots are held (EX_TEMPFAIL: try again later). */
export const BUSY_EXIT = 75;

const SLOTS = [1, 2] as const;
const POLL_MS = 1000;
/** How long a slot file without a readable holder counts as one being written. */
const UNREADABLE_MS = 30_000;

interface Holder {
  readonly pid: number;
  readonly project: string;
  readonly worktree: string;
  readonly since: string;
}

function slotFile(home: string, slot: number): string {
  return join(home, `gate-${slot}.lock`);
}

/** The `gate` command of BRAID.md's front matter. */
function gateCommandOf(root: string): string {
  let text = "";
  try {
    text = readFileSync(join(root, "BRAID.md"), "utf8").replace(/^﻿/, "");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
  const command = (/^gate:[ \t]*(.*?)[ \t]*$/m.exec(front)?.[1] ?? "").replace(/^(["'])(.*)\1$/, "$2");
  if (command === "") {
    throw new UsageError(`braid gate: ${join(root, "BRAID.md")} names no gate in its front matter`);
  }
  return command;
}

function readHolder(file: string): Holder | null {
  try {
    const holder = JSON.parse(readFileSync(file, "utf8")) as Holder;
    return Number.isInteger(holder.pid) && holder.pid > 0 ? holder : null;
  } catch {
    return null;
  }
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Whether the slot's holder is gone; false when the slot was just released. */
function abandoned(file: string): boolean {
  const holder = readHolder(file);
  if (holder !== null) {
    return !alive(holder.pid);
  }
  try {
    return Date.now() - statSync(file).mtimeMs > UNREADABLE_MS;
  } catch {
    return false;
  }
}

/** Takes a free or abandoned slot for `holder`; null when both are held. */
function takeSlot(home: string, holder: Holder): string | null {
  for (const slot of SLOTS) {
    const file = slotFile(home, slot);
    for (;;) {
      try {
        writeFileSync(file, `${JSON.stringify(holder)}\n`, { flag: "wx" });
        return file;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "EEXIST" && code !== "EPERM") {
          throw error;
        }
        if (!abandoned(file) || !takeOverStale(file, UNREADABLE_MS, abandoned)) {
          break;
        }
      }
    }
  }
  return null;
}

function holders(home: string): string {
  return SLOTS.map((slot) => {
    const h = readHolder(slotFile(home, slot));
    return h === null ? "" : `  ${h.project} (${h.worktree}) since ${h.since}, pid ${h.pid}\n`;
  }).join("");
}

function release(file: string): void {
  if (readHolder(file)?.pid === process.pid) {
    try {
      unlinkSync(file);
    } catch {
      // gone already
    }
  }
}

/**
 * Runs `command` in `root` with this process's input and output, and returns its exit code. Ctrl+C reaches the
 * command by itself (same console or process group), so braid only stays alive until it ends and the slot can be
 * released; a SIGTERM sent to braid alone is passed on.
 */
function execute(command: string, root: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd: root, shell: true, stdio: "inherit" });
    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"];
    const onSignal = (signal: NodeJS.Signals): void => {
      if (signal === "SIGTERM") {
        child.kill(signal);
      }
    };
    for (const s of signals) {
      process.on(s, onSignal);
    }
    const detach = (): void => {
      for (const s of signals) {
        process.off(s, onSignal);
      }
    };
    child.on("error", (error) => {
      detach();
      reject(new UsageError(`braid gate: can't run ${command} (${error.message})`));
    });
    child.on("close", (code, signal) => {
      detach();
      resolve(code ?? 128 + (signal === null ? 0 : constants.signals[signal]));
    });
  });
}

export async function gateCommand(root: string, args: readonly string[], home: string = braidHome()): Promise<number> {
  if (args.some((a) => a !== "--no-wait")) {
    throw new UsageError("usage: braid gate [--no-wait]");
  }
  const command = gateCommandOf(root);
  mkdirSync(home, { recursive: true });
  const me = { pid: process.pid, project: repoNameOf(root) ?? basename(root), worktree: root };
  const take = (): string | null => takeSlot(home, { ...me, since: new Date().toISOString() });
  let slot = take();
  if (slot === null) {
    const noWait = args.includes("--no-wait");
    process.stderr.write(`braid gate: both gate slots are held${noWait ? "" : "; waiting for one"}:\n${holders(home)}`);
    if (noWait) {
      return BUSY_EXIT;
    }
    while (slot === null) {
      await new Promise((done) => setTimeout(done, POLL_MS));
      slot = take();
    }
    process.stderr.write("braid gate: got a slot, running the gate\n");
  }
  try {
    return await execute(command, root);
  } finally {
    release(slot);
  }
}
