import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import {
  assertSameBytes,
  expectErr,
  expectOk,
  runCli,
  runInProcess,
  snapshotLedger,
  withRoot,
  type RunResult,
} from "./helpers.ts";

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

interface ItemRecord {
  id: string;
  kind: string;
  title: string;
  state: string;
  note: string | null;
  blockedFrom: string | null;
  blockReason: string | null;
  evidenceNote: string | null;
  acceptance: string | null;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

interface EpicRecord {
  id: string;
  title: string;
  outcome: string;
  createdAt: string;
  updatedAt: string;
  items: ItemRecord[];
}

interface StateRecord {
  schemaVersion: number;
  revision: number;
  epics: EpicRecord[];
}

async function readState(root: string): Promise<StateRecord> {
  return JSON.parse(await readFile(join(root, ".braid", "state.json"), "utf8")) as StateRecord;
}

async function readEvents(root: string): Promise<Array<Record<string, unknown>>> {
  const raw = await readFile(join(root, ".braid", "events.jsonl"), "utf8");
  assert.equal(raw.includes("\r"), false);
  if (raw.length === 0) {
    return [];
  }
  assert.equal(raw.endsWith("\n"), true);
  return raw
    .slice(0, -1)
    .split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function assertKeyOrder(raw: string, keys: readonly string[]): void {
  let position = -1;
  for (const key of keys) {
    const found = raw.indexOf(`"${key}"`);
    assert.ok(found > position, key);
    position = found;
  }
}

async function initDemo(root: string): Promise<void> {
  await expectOk(root, ["init"], "initialized schema 1\n");
  await expectOk(
    root,
    ["new", "DEMO-001", "--title", "Demo ledger", "--outcome", "Track one story by hand"],
    "created epic DEMO-001\n",
  );
}

describe("manual ledger lifecycle", () => {
  test("separate processes track a story, task, and spike and resume in a new process", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const initialEvents = await readEvents(root);
      assert.equal(initialEvents.length, 1);
      assert.equal(initialEvents[0]?.action, "epic.new");
      const initial = await readState(root);
      assert.equal(initial.revision, 1);
      assert.equal(initial.epics[0]?.items.length, 0);
      assert.equal(initial.epics[0]?.createdAt, initial.epics[0]?.updatedAt);
      assert.match(initial.epics[0]?.createdAt ?? "", TIMESTAMP);

      await expectOk(
        root,
        ["story", "add", "DEMO-001", "S", "--title", "Ship the ledger", "--kind", "story", "--note", "operator note"],
        "added story S backlog\n",
      );
      await expectOk(
        root,
        ["story", "start", "DEMO-001", "S", "--next", "Write the ledger."],
        "started story S in-progress\n",
      );

      const json = await runCli(["status", "DEMO-001", "--json"], root);
      assert.equal(json.code, 0);
      assert.equal(json.stderr, "");
      const body = JSON.parse(json.stdout) as {
        schemaVersion: number;
        revision: number;
        eventsRevision: number;
        eventsLag: boolean;
        epic: EpicRecord;
      };
      assert.equal(body.schemaVersion, 1);
      assert.equal(body.revision, 3);
      assert.equal(body.eventsRevision, 3);
      assert.equal(body.eventsLag, false);
      assert.equal(body.epic.items[0]?.state, "in-progress");
      assert.equal(body.epic.items[0]?.note, "operator note");
      assert.equal(body.epic.items[0]?.nextAction, "Write the ledger.");
      assert.equal(body.epic.items[0]?.kind, "story");
      const text = await expectOk(
        root,
        ["status", "DEMO-001"],
        [
          "schema 1",
          "revision 3",
          "epic DEMO-001",
          "title Demo ledger",
          "outcome Track one story by hand",
          "",
          "S story in-progress Ship the ledger",
          "  next: Write the ledger.",
          "  note: operator note",
          "",
        ].join("\n"),
      );
      assert.equal(text.stdout.includes("gate acceptance"), false);

      await expectOk(
        root,
        ["story", "block", "DEMO-001", "S", "--reason", "Waiting on review notes"],
        "blocked story S\n",
      );
      const blocked = await expectOk(
        root,
        ["status", "DEMO-001"],
        [
          "schema 1",
          "revision 4",
          "epic DEMO-001",
          "title Demo ledger",
          "outcome Track one story by hand",
          "",
          "S story blocked Ship the ledger",
          "  next: Resolve: Waiting on review notes",
          "  note: operator note",
          "  blocked-from: in-progress",
          "  reason: Waiting on review notes",
          "",
        ].join("\n"),
      );
      assert.equal(blocked.code, 0);
      await expectOk(root, ["story", "start", "DEMO-001", "S"], "resumed story S in-progress\n");
      const resumed = await readState(root);
      assert.equal(resumed.epics[0]?.items[0]?.state, "in-progress");
      assert.equal(resumed.epics[0]?.items[0]?.blockReason, null);
      assert.equal(resumed.epics[0]?.items[0]?.blockedFrom, null);
      assert.equal(resumed.epics[0]?.items[0]?.note, "operator note");
      assert.equal(resumed.epics[0]?.items[0]?.nextAction, "Continue item S.");
      assert.equal(resumed.epics[0]?.createdAt, initial.epics[0]?.createdAt);
      assert.notEqual(resumed.epics[0]?.updatedAt, initial.epics[0]?.updatedAt);

      await expectOk(
        root,
        ["story", "complete", "DEMO-001", "S", "--evidence", "Reviewed the manual record"],
        "completed story S manual\n",
      );
      await expectOk(
        root,
        ["status", "DEMO-001"],
        [
          "schema 1",
          "revision 6",
          "epic DEMO-001",
          "title Demo ledger",
          "outcome Track one story by hand",
          "",
          "S story done Ship the ledger",
          "  next: None. Manual record only.",
          "  note: operator note",
          "  evidence: manual record; not gate acceptance",
          "  evidence-note: Reviewed the manual record",
          "",
        ].join("\n"),
      );
      const done = await readState(root);
      assert.equal(done.epics[0]?.items[0]?.acceptance, "manual");
      assert.equal(done.epics[0]?.items[0]?.evidenceNote, "Reviewed the manual record");
      assert.equal(done.epics[0]?.outcome, "Track one story by hand");

      const kinds: readonly (readonly [string, string, string])[] = [
        ["T", "task", "Prepare the package"],
        ["K", "spike", "Check a limit"],
      ];
      for (const [id, kind, title] of kinds) {
        await expectOk(
          root,
          ["story", "add", "DEMO-001", id, "--kind", kind, "--title", title],
          `added ${kind} ${id} backlog\n`,
        );
        await expectOk(root, ["story", "start", "DEMO-001", id], `started ${kind} ${id} in-progress\n`);
        await expectOk(
          root,
          ["story", "block", "DEMO-001", id, "--reason", `Wait on ${id}`],
          `blocked ${kind} ${id}\n`,
        );
        await expectOk(root, ["story", "start", "DEMO-001", id], `resumed ${kind} ${id} in-progress\n`);
        await expectOk(
          root,
          ["story", "complete", "DEMO-001", id, "--evidence", `Recorded ${id}`],
          `completed ${kind} ${id} manual\n`,
        );
      }

      await expectOk(
        root,
        ["status"],
        [
          "schema 1",
          "revision 16",
          "epics 1",
          "",
          "DEMO-001 backlog=0 in-progress=0 blocked=0 done=3 Demo ledger",
          "",
        ].join("\n"),
      );
      const finalState = await readState(root);
      assert.deepEqual(
        finalState.epics[0]?.items.map((item) => [item.id, item.kind, item.state, item.acceptance]),
        [
          ["S", "story", "done", "manual"],
          ["T", "task", "done", "manual"],
          ["K", "spike", "done", "manual"],
        ],
      );
      const events = await readEvents(root);
      assert.deepEqual(
        events.map((event) => event.revision),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      );
      assert.equal(events[0]?.action, "epic.new");
      assert.equal(events[1]?.action, "story.add");
      assert.equal(events[1]?.kind, "story");
      assert.equal(events[6]?.action, "story.add");
      assert.equal(events[6]?.kind, "task");
      assert.equal(events[11]?.action, "story.add");
      assert.equal(events[11]?.kind, "spike");
      const eventText = await readFile(join(root, ".braid", "events.jsonl"), "utf8");
      assertKeyOrder(eventText.slice(0, eventText.indexOf("\n")), [
        "schemaVersion",
        "revision",
        "at",
        "action",
        "epicId",
        "itemId",
        "kind",
        "from",
        "to",
        "note",
        "nextAction",
        "reason",
        "evidenceNote",
      ]);
      const stateText = await readFile(join(root, ".braid", "state.json"), "utf8");
      assert.equal(stateText.includes("\r"), false);
      assert.equal(stateText.endsWith("\n"), true);
      assert.equal(stateText.charCodeAt(0), "{".charCodeAt(0));
      assertKeyOrder(stateText, ["schemaVersion", "revision", "epics", "id", "title", "outcome", "createdAt", "updatedAt", "items"]);
      assert.deepEqual((await readdir(join(root, ".braid"))).sort(), ["events.jsonl", "state.json"]);
      assert.equal(existsSync(join(root, ".crew")), false);
      assert.deepEqual(await readdir(root), [".braid"]);
    });
  });

  test("invalid transitions and duplicate ids leave accepted bytes unchanged", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      await expectOk(root, ["story", "add", "DEMO-001", "S", "--title", "Ship", "--note", "kept"], "added story S backlog\n");
      await expectOk(root, ["story", "start", "DEMO-001", "S"], "started story S in-progress\n");
      await expectOk(root, ["story", "block", "DEMO-001", "S", "--reason", "Pause"], "blocked story S\n");
      await expectOk(root, ["story", "start", "DEMO-001", "S"], "resumed story S in-progress\n");
      await expectOk(
        root,
        ["story", "complete", "DEMO-001", "S", "--evidence", "Reviewed the manual record"],
        "completed story S manual\n",
      );
      await expectOk(root, ["story", "add", "DEMO-001", "B", "--title", "Backlog"], "added story B backlog\n");
      await expectOk(root, ["story", "add", "DEMO-001", "P", "--title", "Paused"], "added story P backlog\n");
      await expectOk(root, ["story", "start", "DEMO-001", "P"], "started story P in-progress\n");
      await expectOk(root, ["story", "block", "DEMO-001", "P", "--reason", "Hold"], "blocked story P\n");
      await expectOk(root, ["story", "add", "DEMO-001", "R", "--title", "Running"], "added story R backlog\n");
      await expectOk(root, ["story", "start", "DEMO-001", "R"], "started story R in-progress\n");

      const before = await snapshotLedger(root);
      const failures: readonly (readonly [readonly string[], string])[] = [
        [["story", "start", "DEMO-001", "S"], "error: cannot start item S from done\n"],
        [["story", "complete", "DEMO-001", "B", "--evidence", "No"], "error: cannot complete item B from backlog\n"],
        [["story", "complete", "DEMO-001", "P", "--evidence", "No"], "error: cannot complete item P from blocked\n"],
        [["story", "block", "DEMO-001", "B", "--reason", "No"], "error: cannot block item B from backlog\n"],
        [["story", "block", "DEMO-001", "S", "--reason", "No"], "error: cannot block item S from done\n"],
        [["story", "block", "DEMO-001", "P", "--reason", "No"], "error: cannot block item P from blocked\n"],
        [["story", "start", "DEMO-001", "R"], "error: cannot start item R from in-progress\n"],
        [["story", "add", "DEMO-001", "S", "--title", "Again"], "error: item S already exists\n"],
        [["new", "DEMO-001", "--title", "Other", "--outcome", "Other"], "error: epic DEMO-001 already exists\n"],
        [["story", "add", "NOPE-001", "Z", "--title", "Missing"], "error: epic NOPE-001 not found\n"],
        [["story", "start", "DEMO-001", "Z"], "error: item Z not found\n"],
        [["status", "NOPE-001"], "error: epic NOPE-001 not found\n"],
      ];
      for (const [args, stderr] of failures) {
        const result = await runCli(args, root);
        expectErr(result, 2, stderr);
        assertSameBytes(before, await snapshotLedger(root));
      }
      const state = await readState(root);
      const done = state.epics[0]?.items.find((item) => item.id === "S");
      assert.equal(done?.title, "Ship");
      assert.equal(done?.note, "kept");
      assert.equal(done?.state, "done");
      assert.equal(done?.evidenceNote, "Reviewed the manual record");
      const status = await runCli(["status"], root);
      assert.equal(status.code, 0);
      assertSameBytes(before, await snapshotLedger(root));
    });
  });

  test("repeated init preserves bytes, including an unhealthy event log", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      await expectOk(root, ["story", "add", "DEMO-001", "S", "--title", "Ship", "--note", "kept"], "added story S backlog\n");
      const eventsPath = join(root, ".braid", "events.jsonl");
      const original = await readFile(eventsPath);
      await writeFile(eventsPath, Buffer.concat([original, Buffer.from("{")]));
      const before = await snapshotLedger(root);
      await expectOk(root, ["init"], "already initialized schema 1\n");
      assertSameBytes(before, await snapshotLedger(root));
      assert.deepEqual(await readFile(eventsPath), Buffer.concat([original, Buffer.from("{")]));
    });
  });

  test("argument checks reject bad ids and text before creating a ledger", async () => {
    const cases: readonly (readonly [readonly string[], string])[] = [
      [["new"], "error: missing required argument: epic-id\n"],
      [["new", "DEMO-001"], "error: missing required option: --title\n"],
      [["new", "DEMO-001", "--title", "Title"], "error: missing required option: --outcome\n"],
      [["new", "demo-001", "--title", "Title", "--outcome", "Outcome"], "error: invalid epic id\n"],
      [["new", "DEMO-001/../NO", "--title", "Title", "--outcome", "Outcome"], "error: invalid epic id\n"],
      [["new", "DEMO-001\\NO", "--title", "Title", "--outcome", "Outcome"], "error: invalid epic id\n"],
      [["new", "DEMO-001", "extra", "--title", "Title", "--outcome", "Outcome"], "error: unexpected argument: extra\n"],
      [["story"], "error: missing required argument: subcommand\n"],
      [["story", "add"], "error: missing required argument: epic-id\n"],
      [["story", "add", "DEMO-001"], "error: missing required argument: item-id\n"],
      [["story", "add", "DEMO-001", "S"], "error: missing required option: --title\n"],
      [["story", "add", "DEMO-001", "..", "--title", "Title"], "error: invalid item id\n"],
      [["story", "add", "DEMO-001", "S", "--title", "Title", "--kind", "Task"], "error: invalid option: --kind\n"],
      [["story", "block", "DEMO-001", "S"], "error: missing required option: --reason\n"],
      [["story", "complete", "DEMO-001", "S"], "error: missing required option: --evidence\n"],
      [["init", "extra"], "error: unexpected argument: extra\n"],
      [["status", "DEMO-001", "extra"], "error: unexpected argument: extra\n"],
      [["new", "DEMO-001", "--title", "bad\nTitle", "--outcome", "Outcome"], "error: invalid option: --title\n"],
      [["new", "DEMO-001", "--title", "\t", "--outcome", "Outcome"], "error: invalid option: --title\n"],
      [["new", "DEMO-001", "--title", "Title", "--outcome", "bad\u0007"], "error: invalid option: --outcome\n"],
      [["new", "DEMO-001", "--title", "   ", "--outcome", "Outcome"], "error: invalid option: --title\n"],
      [["new", "DEMO-001", "--title", "x".repeat(201), "--outcome", "Outcome"], "error: invalid option: --title\n"],
      [["new", "DEMO-001", "--title", "Title", "--outcome", "y".repeat(2001)], "error: invalid option: --outcome\n"],
      [["story", "add", "DEMO-001", "S", "--title", "Title", "--next", "n".repeat(501)], "error: invalid option: --next\n"],
      [["story", "add", "DEMO-001", "S", "--title", "Title", "--note", "\u007F"], "error: invalid option: --note\n"],
      [["new", "NOT-AN-EPIC", "--title", "Title", "--outcome", "Outcome"], "error: invalid epic id\n"],
      [["status", ".."], "error: invalid epic id\n"],
    ];
    await withRoot(async (root) => {
      for (const [args, stderr] of cases) {
        const result = await runCli(args, root);
        expectErr(result, 1, stderr);
        assert.equal(existsSync(join(root, ".braid")), false, args.join(" "));
      }
      assert.deepEqual(await readdir(root), []);
    });
  });

  test("a null byte in option text is rejected before any ledger directory is created", async () => {
    await withRoot(async (root) => {
      const result = await runInProcess(
        ["new", "DEMO-001", "--title", "Title", "--outcome", "bad\u0000"],
        root,
      );
      expectErr(result, 1, "error: invalid option: --outcome\n");
      assert.equal(existsSync(join(root, ".braid")), false);
      assert.equal(existsSync(join(root, ".crew")), false);
      assert.deepEqual(await readdir(root), []);
    });
  });

  test("commands that need a ledger do not create .braid when it is absent", async () => {
    await withRoot(async (root) => {
      for (const args of [
        ["new", "DEMO-001", "--title", "Title", "--outcome", "Outcome"],
        ["status"],
        ["status", "DEMO-001"],
        ["story", "add", "DEMO-001", "S", "--title", "Title"],
        ["story", "start", "DEMO-001", "S"],
      ]) {
        const result = await runCli(args, root);
        expectErr(result, 1, "error: not initialized; run braid init\n");
        assert.equal(existsSync(join(root, ".braid")), false);
        assert.equal(existsSync(join(root, ".crew")), false);
      }
      assert.deepEqual(await readdir(root), []);
    });
  });

  test("accepted text boundaries, flag forms, defaults, and a second epic are stored", async () => {
    await withRoot(async (root) => {
      const elsewhere = await mkdtemp(join(tmpdir(), "braid cwd "));
      try {
        await expectOk(elsewhere, ["--root", root, "init"], "initialized schema 1\n");
        assert.equal(existsSync(join(elsewhere, ".braid")), false);
        assert.equal(existsSync(join(elsewhere, ".crew")), false);
        assert.equal(existsSync(join(root, ".crew")), false);
        assert.equal(existsSync(join(root, ".braid", "state.json")), true);
        await expectOk(
          root,
          ["--title", "  Trimmed title  ", "--outcome=Track one story by hand", "new", "DEMO-001"],
          "created epic DEMO-001\n",
        );
        await expectOk(
          root,
          ["new", "DEMO-002", "--title=Second", "--outcome=Also"],
          "created epic DEMO-002\n",
        );
        const title = "T".repeat(200);
        const next = "N".repeat(500);
        await expectOk(
          root,
          ["story", "add", "DEMO-001", "S", "--title", title, "--next", next],
          "added story S backlog\n",
        );
        const added = await readState(root);
        assert.equal(added.epics[0]?.items[0]?.title, title);
        assert.equal(added.epics[0]?.items[0]?.nextAction, next);
        await expectOk(
          root,
          ["story", "add", "DEMO-002", "S", "--title", "Same id", "--kind", "task"],
          "added task S backlog\n",
        );
        await expectOk(root, ["story", "start", "DEMO-001", "S", "--note", "replaced"], "started story S in-progress\n");
        const state = await readState(root);
        assert.equal(state.epics[0]?.title, "Trimmed title");
        assert.equal(state.epics[0]?.items[0]?.title, title);
        assert.equal(state.epics[0]?.items[0]?.nextAction, "Continue item S.");
        assert.equal(state.epics[0]?.items[0]?.note, "replaced");
        assert.equal(state.epics[0]?.items[0]?.kind, "story");
        assert.equal(state.epics[1]?.id, "DEMO-002");
        assert.equal(state.epics[1]?.items[0]?.id, "S");
        assert.equal(state.epics[1]?.items[0]?.kind, "task");
        assert.deepEqual(
          state.epics.map((epic) => epic.id),
          ["DEMO-001", "DEMO-002"],
        );
        const list = await runCli(["status"], root);
        assert.match(list.stdout, /DEMO-001 backlog=0 in-progress=1 blocked=0 done=0 Trimmed title/u);
        assert.match(list.stdout, /DEMO-002 backlog=1 in-progress=0 blocked=0 done=0 Second/u);
      } finally {
        await rm(elsewhere, { recursive: true, force: true });
      }
    });
  });

  test("empty and detail status shapes do not write", async () => {
    await withRoot(async (root) => {
      await expectOk(root, ["init"], "initialized schema 1\n");
      const before = await snapshotLedger(root);
      assert.equal(before.events?.length, 0);
      await expectOk(root, ["status"], ["schema 1", "revision 0", "epics 0", ""].join("\n"));
      await expectOk(
        root,
        ["status", "--json"],
        `${JSON.stringify(
          { schemaVersion: 1, revision: 0, eventsRevision: 0, eventsLag: false, epics: [] },
          null,
          2,
        )}\n`,
      );
      assertSameBytes(before, await snapshotLedger(root));
      await expectOk(
        root,
        ["new", "DEMO-001", "--title", "Demo ledger", "--outcome", "Track one story by hand"],
        "created epic DEMO-001\n",
      );
      await expectOk(
        root,
        ["status", "DEMO-001"],
        [
          "schema 1",
          "revision 1",
          "epic DEMO-001",
          "title Demo ledger",
          "outcome Track one story by hand",
          "",
          "no items",
          "",
        ].join("\n"),
      );
    });
  });

  test("an explicit root that is missing or not a directory is rejected", async () => {
    await withRoot(async (root) => {
      const missing = join(root, "missing root");
      const missingResult = await runCli(["--root", missing, "init"], root);
      expectErr(missingResult, 1, "error: root does not exist\n");
      assert.equal(existsSync(missing), false);

      const file = join(root, "not-a-dir");
      await writeFile(file, "keep");
      const fileResult = await runCli(["--root", file, "status"], root);
      expectErr(fileResult, 1, "error: root is not a directory\n");
      assert.equal(await readFile(file, "utf8"), "keep");
    });
  });

  test("a symlinked root is resolved and the ledger is created in the real directory", async () => {
    await withRoot(async (root) => {
      const real = join(root, "real root");
      const link = join(root, "link root");
      await mkdir(real);
      await symlink(real, link, "dir");
      await expectOk(root, ["--root", link, "init"], "initialized schema 1\n");
      assert.equal(existsSync(join(real, ".braid", "state.json")), true);
      assert.equal(existsSync(join(real, ".crew")), false);
      assert.deepEqual(await readdir(real), [".braid"]);
      const result: RunResult = await runCli(["--root", link, "status"], root);
      assert.equal(result.code, 0);
      assert.match(result.stdout, /epics 0/u);
    });
  });

  test("block defaults stay readable at reason and next-action length boundaries", async () => {
    await withRoot(async (root) => {
      await expectOk(root, ["init"], "initialized schema 1\n");
      await expectOk(root, ["new", "DEMO-001", "--title", "Demo", "--outcome", "Check limits"], "created epic DEMO-001\n");
      for (const length of [491, 492, 2000]) {
        const id = `S${length}`;
        await expectOk(root, ["story", "add", "DEMO-001", id, "--title", "Ship"], `added story ${id} backlog\n`);
        await expectOk(root, ["story", "start", "DEMO-001", id], `started story ${id} in-progress\n`);
        const reason = "R".repeat(length);
        await expectOk(root, ["story", "block", "DEMO-001", id, "--reason", reason], `blocked story ${id}\n`);
        const status = await runCli(["status", "DEMO-001", "--json"], root);
        assert.equal(status.code, 0, status.stderr);
        assert.equal(status.stderr, "");
        const body = JSON.parse(status.stdout) as { epic: EpicRecord; eventsLag: boolean; revision: number; eventsRevision: number };
        const item = body.epic.items.find((candidate) => candidate.id === id);
        assert.equal(item?.blockReason, reason);
        assert.equal(item?.nextAction, length === 491 ? `Resolve: ${reason}` : "Resolve block; see block reason.");
        assert.equal(body.eventsLag, false);
        assert.equal(body.eventsRevision, body.revision);
        await expectOk(root, ["story", "start", "DEMO-001", id], `resumed story ${id} in-progress\n`);
        await expectOk(root, ["story", "block", "DEMO-001", id, "--reason", reason, "--next", "N".repeat(500)], `blocked story ${id}\n`);
        assert.equal((await readState(root)).epics[0]?.items.find((candidate) => candidate.id === id)?.nextAction, "N".repeat(500));
        await expectOk(root, ["story", "start", "DEMO-001", id], `resumed story ${id} in-progress\n`);
      }
    });
  });

  test("pre-existing .crew and .agento directories are left untouched and are not the ledger", async () => {
    await withRoot(async (root) => {
      const oldDir = join(root, ".crew");
      const formerDir = join(root, ".agento");
      await mkdir(oldDir);
      await mkdir(formerDir);
      const stateBytes = Buffer.from('{"schemaVersion":1,"revision":9,"kept":true}\n');
      const eventBytes = Buffer.from('{"revision":9}\n');
      const noteBytes = Buffer.from("disposable ledger\n");
      await writeFile(join(oldDir, "state.json"), stateBytes);
      await writeFile(join(oldDir, "events.jsonl"), eventBytes);
      await writeFile(join(oldDir, "notes.txt"), noteBytes);
      await writeFile(join(formerDir, "state.json"), stateBytes);
      await writeFile(join(formerDir, "notes.txt"), noteBytes);

      const status = await runCli(["status"], root);
      expectErr(status, 1, "error: not initialized; run braid init\n");
      assert.equal(existsSync(join(root, ".braid")), false);
      assert.deepEqual(await readFile(join(oldDir, "state.json")), stateBytes);
      assert.deepEqual(await readFile(join(formerDir, "state.json")), stateBytes);

      await expectOk(root, ["init"], "initialized schema 1\n");
      await expectOk(
        root,
        ["new", "DEMO-001", "--title", "Demo ledger", "--outcome", "Track one story by hand"],
        "created epic DEMO-001\n",
      );

      assert.deepEqual(await readFile(join(oldDir, "state.json")), stateBytes);
      assert.deepEqual(await readFile(join(oldDir, "events.jsonl")), eventBytes);
      assert.deepEqual(await readFile(join(oldDir, "notes.txt")), noteBytes);
      assert.deepEqual(await readFile(join(formerDir, "state.json")), stateBytes);
      assert.deepEqual(await readFile(join(formerDir, "notes.txt")), noteBytes);
      assert.deepEqual((await readdir(oldDir)).sort(), ["events.jsonl", "notes.txt", "state.json"]);
      assert.deepEqual((await readdir(formerDir)).sort(), ["notes.txt", "state.json"]);
      assert.deepEqual((await readdir(root)).sort(), [".agento", ".braid", ".crew"]);

      const fresh = await readState(root);
      assert.equal(fresh.schemaVersion, 1);
      assert.equal(fresh.revision, 1);
      assert.equal(fresh.epics[0]?.id, "DEMO-001");
      const events = await readEvents(root);
      assert.deepEqual(
        events.map((event) => event.revision),
        [1],
      );
      assert.equal(events[0]?.action, "epic.new");
      assert.equal(existsSync(join(root, ".braid", "lock")), false);
    });
  });
});
