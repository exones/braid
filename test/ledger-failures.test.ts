import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { describe, test } from "node:test";
import {
  assertSameBytes,
  expectErr,
  expectOk,
  loadMain,
  runCli,
  runInProcess,
  snapshotLedger,
  withRoot,
} from "./helpers.ts";

async function initDemo(root: string): Promise<void> {
  await expectOk(root, ["init"], "initialized schema 1\n");
  await expectOk(
    root,
    ["new", "DEMO-001", "--title", "Demo ledger", "--outcome", "Track one story by hand"],
    "created epic DEMO-001\n",
  );
}

async function plant(root: string, name: string, contents: string | Buffer): Promise<void> {
  await writeFile(join(root, ".braid", name), contents);
}

describe("ledger preservation and failure boundaries", () => {
  test("safe paths reject traversal ids and do not create ledger files", async () => {
    await withRoot(async (root) => {
      const cases: readonly (readonly [readonly string[], string])[] = [
        [["story", "add", "DEMO-001", "..", "--title", "Title"], "error: invalid item id\n"],
        [["new", "DEMO-001/../NO", "--title", "Title", "--outcome", "Outcome"], "error: invalid epic id\n"],
        [["new", "DEMO-001\\NO", "--title", "Title", "--outcome", "Outcome"], "error: invalid epic id\n"],
      ];
      for (const [args, stderr] of cases) {
        const result = await runCli(args, root);
        expectErr(result, 1, stderr);
      }
      assert.deepEqual(await readdir(root), []);
    });
  });

  test("a junction or directory symlink at .braid is not followed", async () => {
    await withRoot(async (root) => {
      for (const kind of ["junction", "dir"] as const) {
        const outside = join(root, `outside-${kind}`);
        await mkdir(outside);
        await writeFile(join(outside, "marker.txt"), "keep");
        await symlink(outside, join(root, ".braid"), kind);
        const init = await runCli(["init"], root);
        expectErr(init, 1, "error: .braid must be a real directory inside the project root\n");
        assert.equal(await readFile(join(outside, "marker.txt"), "utf8"), "keep");
        assert.deepEqual(await readdir(outside), ["marker.txt"]);
        await rm(join(root, ".braid"));
        await rm(outside, { recursive: true });
      }
    });
  });

  test("a later command rejects a linked .braid and leaves the target ledger unchanged", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const before = await snapshotLedger(root);
      const moved = join(root, "ledger-data");
      await rename(join(root, ".braid"), moved);
      await symlink(moved, join(root, ".braid"), "junction");
      const status = await runCli(["status"], root);
      expectErr(status, 3, "error: .braid must be a real directory inside the project root\n");
      const add = await runCli(["story", "add", "DEMO-001", "S", "--title", "Ship"], root);
      expectErr(add, 3, "error: .braid must be a real directory inside the project root\n");
      assert.deepEqual(await readFile(join(moved, "state.json")), before.state);
      assert.deepEqual(await readFile(join(moved, "events.jsonl")), before.events);
      assert.deepEqual((await readdir(moved)).sort(), ["events.jsonl", "state.json"]);
    });
  });

  test("linked state, events, and temp files are preserved and not opened", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const statePath = join(root, ".braid", "state.json");
      const realState = join(root, ".braid", "state.real");
      const stateBytes = await readFile(statePath);
      await rename(statePath, realState);
      await symlink(realState, statePath, "file");
      const stateResult = await runCli(["status"], root);
      expectErr(stateResult, 3, "error: state file must be a regular file inside .braid\n");
      assert.deepEqual(await readFile(realState), stateBytes);
      assert.equal((await lstat(statePath)).isSymbolicLink(), true);
      await unlink(statePath);
      await rename(realState, statePath);

      const eventsPath = join(root, ".braid", "events.jsonl");
      const realEvents = join(root, ".braid", "events.real");
      const eventBytes = await readFile(eventsPath);
      await rename(eventsPath, realEvents);
      await symlink(realEvents, eventsPath, "file");
      const eventsResult = await runCli(["story", "add", "DEMO-001", "S", "--title", "Ship"], root);
      expectErr(eventsResult, 3, "error: events file must be a regular file inside .braid\n");
      assert.deepEqual(await readFile(realEvents), eventBytes);
      await unlink(eventsPath);
      await rename(realEvents, eventsPath);

      const target = join(root, "do-not-delete.txt");
      await writeFile(target, "keep");
      await symlink(target, join(root, ".braid", "state.json.tmp"), "file");
      const tempResult = await runCli(["status"], root);
      expectErr(tempResult, 3, "error: temporary state file is not a regular file; preserved\n");
      assert.equal(await readFile(target, "utf8"), "keep");
      assert.equal((await lstat(join(root, ".braid", "state.json.tmp"))).isSymbolicLink(), true);
    });
  });

  test("unknown schema, invalid JSON, and invalid state are preserved", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const cases: readonly (readonly [string, string])[] = [
        [
          '{"schemaVersion":2,"revision":0,"epics":[]}\n',
          "error: unsupported schema version 2; supported schema 1; state preserved\n",
        ],
        ["{", "error: state file is invalid JSON; preserved for diagnosis\n"],
        ["{}", "error: unsupported schema version missing; supported schema 1; state preserved\n"],
        [
          '{"schemaVersion":1,"revision":0,"epics":[],"extra":true}\n',
          "error: state file is invalid; preserved for diagnosis\n",
        ],
        [
          '{"schemaVersion":1,"revision":-1,"epics":[]}\n',
          "error: state file is invalid; preserved for diagnosis\n",
        ],
      ];
      for (const [contents, stderr] of cases) {
        await plant(root, "state.json", contents);
        const before = await snapshotLedger(root);
        const result = await runCli(["story", "add", "DEMO-001", "S", "--title", "Ship"], root);
        expectErr(result, 3, stderr);
        assertSameBytes(before, await snapshotLedger(root));
        const init = await runCli(["init"], root);
        expectErr(init, 3, stderr);
        assertSameBytes(before, await snapshotLedger(root));
      }
    });
  });

  test("status reads state.json and leaves a stale temp and backup in place", async () => {
    await withRoot(async (root) => {
      await expectOk(root, ["init"], "initialized schema 1\n");
      await plant(root, "state.json.tmp", '{"revision":999}\n');
      await plant(root, "state.json.bak", "operator backup\n");
      const status = await runCli(["status"], root);
      assert.equal(status.code, 0);
      assert.match(status.stdout, /revision 0/u);
      assert.equal(status.stdout.includes("999"), false);
      assert.equal(await readFile(join(root, ".braid", "state.json.tmp"), "utf8"), '{"revision":999}\n');
      assert.equal(await readFile(join(root, ".braid", "state.json.bak"), "utf8"), "operator backup\n");

      await expectOk(
        root,
        ["new", "DEMO-001", "--title", "Demo ledger", "--outcome", "Track one story by hand"],
        "created epic DEMO-001\n",
      );
      assert.equal(existsSync(join(root, ".braid", "state.json.tmp")), false);
      assert.equal(await readFile(join(root, ".braid", "state.json.bak"), "utf8"), "operator backup\n");
    });
  });

  test("a diagnostic temp survives an invalid ledger and an invalid transition", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      await plant(root, "state.json.tmp", "diagnostic\n");
      const before = await snapshotLedger(root);
      const rejected = await runCli(["new", "DEMO-001", "--title", "Other", "--outcome", "Other"], root);
      expectErr(rejected, 2, "error: epic DEMO-001 already exists\n");
      assertSameBytes(before, await snapshotLedger(root));
      assert.equal(await readFile(join(root, ".braid", "state.json.tmp"), "utf8"), "diagnostic\n");

      await plant(root, "state.json", '{"schemaVersion":2}\n');
      await plant(root, "state.json.tmp", "still here\n");
      const invalid = await runCli(["status"], root);
      expectErr(invalid, 3, "error: unsupported schema version 2; supported schema 1; state preserved\n");
      assert.equal(await readFile(join(root, ".braid", "state.json.tmp"), "utf8"), "still here\n");
      assert.equal(await readFile(join(root, ".braid", "state.json"), "utf8"), '{"schemaVersion":2}\n');
    });
  });

  test("init does not repair or empty a ledger that is not ready", async () => {
    await withRoot(async (root) => {
      await mkdir(join(root, ".braid"));
      await writeFile(join(root, ".braid", "notes.bak"), "keep");
      const occupied = await runCli(["init"], root);
      expectErr(occupied, 3, "error: .braid is not an empty ledger directory; state preserved\n");
      assert.equal(await readFile(join(root, ".braid", "notes.bak"), "utf8"), "keep");
      assert.equal(existsSync(join(root, ".braid", "state.json")), false);

      await rm(join(root, ".braid"), { recursive: true });
      await mkdir(join(root, ".braid"));
      await expectOk(root, ["init"], "initialized schema 1\n");
      await rm(join(root, ".braid", "events.jsonl"));
      await mkdir(join(root, ".braid", "events.jsonl"));
      await writeFile(join(root, ".braid", "events.jsonl", "marker.txt"), "keep");
      await expectOk(root, ["init"], "already initialized schema 1\n");
      assert.equal(await readFile(join(root, ".braid", "events.jsonl", "marker.txt"), "utf8"), "keep");
      const status = await runCli(["status"], root);
      expectErr(status, 3, "error: events file must be a regular file inside .braid\n");
      assert.equal(await readFile(join(root, ".braid", "events.jsonl", "marker.txt"), "utf8"), "keep");
    });
  });

  test("a missing state file is not recovered from temp, backup, or events", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const events = await readFile(join(root, ".braid", "events.jsonl"));
      await unlink(join(root, ".braid", "state.json"));
      await plant(root, "state.json.tmp", '{"revision":999}\n');
      await plant(root, "state.json.bak", "backup\n");
      const status = await runCli(["status"], root);
      expectErr(status, 3, "error: state file missing; not recovered automatically\n");
      const add = await runCli(["story", "add", "DEMO-001", "S", "--title", "Ship"], root);
      expectErr(add, 3, "error: state file missing; not recovered automatically\n");
      assert.equal(existsSync(join(root, ".braid", "state.json")), false);
      assert.equal(await readFile(join(root, ".braid", "state.json.tmp"), "utf8"), '{"revision":999}\n');
      assert.equal(await readFile(join(root, ".braid", "state.json.bak"), "utf8"), "backup\n");
      assert.deepEqual(await readFile(join(root, ".braid", "events.jsonl")), events);
    });
  });

  test("partial, lagging, missing, ahead, duplicate, and skipped events stay visible", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      await expectOk(root, ["story", "add", "DEMO-001", "S", "--title", "Ship"], "added story S backlog\n");
      await expectOk(root, ["story", "add", "DEMO-001", "T", "--title", "Next"], "added story T backlog\n");
      const eventsPath = join(root, ".braid", "events.jsonl");
      const healthy = await readFile(eventsPath);
      const lines = healthy.toString("utf8").split("\n").filter((line) => line.length > 0);

      await writeFile(eventsPath, Buffer.concat([healthy, Buffer.from("{")]));
      let before = await snapshotLedger(root);
      let status = await runCli(["status", "DEMO-001"], root);
      assert.equal(status.code, 0);
      assert.match(status.stdout, /revision 3/u);
      assert.match(status.stdout, /S story backlog Ship/u);
      assert.equal(status.stderr, "warning: events log ends with a partial line; ignored for display\n");
      const partialAdd = await runCli(["story", "add", "DEMO-001", "U", "--title", "Nope"], root);
      expectErr(partialAdd, 3, "error: events log has a partial trailing line; state preserved\n");
      assertSameBytes(before, await snapshotLedger(root));

      await writeFile(eventsPath, `${lines[0] ?? ""}\n{`);
      before = await snapshotLedger(root);
      status = await runCli(["status", "--json"], root);
      assert.equal(status.code, 0);
      assert.equal(
        status.stderr,
        [
          "warning: events log ends with a partial line; ignored for display",
          "warning: events lag state (state revision 3, last event revision 1); not repaired",
          "",
        ].join("\n"),
      );
      const laggingPartial = JSON.parse(status.stdout) as { revision: number; eventsRevision: number; eventsLag: boolean };
      assert.equal(laggingPartial.revision, 3);
      assert.equal(laggingPartial.eventsRevision, 1);
      assert.equal(laggingPartial.eventsLag, true);
      const partialMutation = await runCli(["story", "add", "DEMO-001", "U", "--title", "Nope"], root);
      expectErr(partialMutation, 3, "error: events log has a partial trailing line; state preserved\n");
      assertSameBytes(before, await snapshotLedger(root));

      await writeFile(eventsPath, `${lines[0] ?? ""}\n`);
      before = await snapshotLedger(root);
      status = await runCli(["status", "DEMO-001"], root);
      assert.equal(status.code, 0);
      assert.match(status.stdout, /T story backlog Next/u);
      assert.equal(status.stderr, "warning: events lag state (state revision 3, last event revision 1); not repaired\n");
      const lag = await runCli(["story", "add", "DEMO-001", "U", "--title", "Nope"], root);
      expectErr(lag, 3, "error: events lag state; mutation refused; state preserved\n");
      assertSameBytes(before, await snapshotLedger(root));

      await unlink(eventsPath);
      before = await snapshotLedger(root);
      status = await runCli(["status", "--json"], root);
      assert.equal(status.code, 0);
      assert.equal(status.stderr, "warning: events file missing; not repaired\n");
      assert.equal(status.stderr.includes("events lag"), false);
      const missing = JSON.parse(status.stdout) as { eventsRevision: number | null; eventsLag: boolean };
      assert.equal(missing.eventsRevision, null);
      assert.equal(missing.eventsLag, true);
      const missingMutation = await runCli(["story", "start", "DEMO-001", "S"], root);
      expectErr(missingMutation, 3, "error: events lag state; mutation refused; state preserved\n");
      assertSameBytes(before, await snapshotLedger(root));
      assert.equal(existsSync(eventsPath), false);

      const aheadLine = JSON.parse(lines[0] ?? "{}") as { revision: number };
      aheadLine.revision = 9;
      await writeFile(eventsPath, `${lines[0] ?? ""}\n${JSON.stringify(aheadLine)}\n{`);
      before = await snapshotLedger(root);
      const ahead = await runCli(["status"], root);
      expectErr(ahead, 3, "error: events are ahead of state; preserved for diagnosis\n");
      const aheadMutation = await runCli(["story", "start", "DEMO-001", "S"], root);
      expectErr(aheadMutation, 3, "error: events are ahead of state; preserved for diagnosis\n");
      assertSameBytes(before, await snapshotLedger(root));

      await writeFile(eventsPath, `${lines[0] ?? ""}\n${lines[0] ?? ""}\n`);
      before = await snapshotLedger(root);
      const duplicate = await runCli(["status"], root);
      expectErr(duplicate, 3, "error: events log is invalid; state preserved\n");
      const duplicateMutation = await runCli(["story", "start", "DEMO-001", "S"], root);
      expectErr(duplicateMutation, 3, "error: events log is invalid; state preserved\n");
      assertSameBytes(before, await snapshotLedger(root));

      await writeFile(eventsPath, `${lines[0] ?? ""}\n${lines[2] ?? ""}\n`);
      before = await snapshotLedger(root);
      const skipped = await runCli(["status"], root);
      expectErr(skipped, 3, "error: events log is invalid; state preserved\n");
      const skippedMutation = await runCli(["story", "start", "DEMO-001", "S"], root);
      expectErr(skippedMutation, 3, "error: events log is invalid; state preserved\n");
      assertSameBytes(before, await snapshotLedger(root));
    });
  });

  test("a missing event file at revision 0 warns and the first mutation may create it", async () => {
    await withRoot(async (root) => {
      await expectOk(root, ["init"], "initialized schema 1\n");
      await unlink(join(root, ".braid", "events.jsonl"));
      const status = await runCli(["status", "--json"], root);
      assert.equal(status.code, 0);
      assert.equal(status.stderr, "warning: events file missing; not repaired\n");
      const body = JSON.parse(status.stdout) as { revision: number; eventsRevision: number; eventsLag: boolean };
      assert.equal(body.revision, 0);
      assert.equal(body.eventsRevision, 0);
      assert.equal(body.eventsLag, false);
      await expectOk(
        root,
        ["new", "DEMO-001", "--title", "Demo ledger", "--outcome", "Track one story by hand"],
        "created epic DEMO-001\n",
      );
      const events = await readFile(join(root, ".braid", "events.jsonl"), "utf8");
      assert.equal(events.endsWith("\n"), true);
      assert.equal(JSON.parse(events.trim()).revision, 1);
    });
  });

  test("two init processes leave one schema 1 ledger and both exit 0", async () => {
    await withRoot(async (root) => {
      const [first, second] = await Promise.all([runCli(["init"], root), runCli(["init"], root)]);
      assert.equal(first.code, 0, first.stderr);
      assert.equal(second.code, 0, second.stderr);
      assert.deepEqual([first.stdout, second.stdout].sort(), ["already initialized schema 1\n", "initialized schema 1\n"]);
      const state = JSON.parse(await readFile(join(root, ".braid", "state.json"), "utf8")) as { schemaVersion: number; revision: number };
      assert.equal(state.schemaVersion, 1);
      assert.equal(state.revision, 0);
      assert.equal((await readFile(join(root, ".braid", "events.jsonl"))).length, 0);
      assert.equal(existsSync(join(root, ".braid", "lock")), false);
    });
  });

  test("concurrent adds keep both items and increase the revision by 2", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const [first, second] = await Promise.all([
        runCli(["story", "add", "DEMO-001", "A", "--title", "Alpha"], root),
        runCli(["story", "add", "DEMO-001", "B", "--title", "Beta"], root),
      ]);
      assert.equal(first.code, 0, first.stderr);
      assert.equal(second.code, 0, second.stderr);
      const state = JSON.parse(await readFile(join(root, ".braid", "state.json"), "utf8")) as {
        revision: number;
        epics: Array<{ items: Array<{ id: string }> }>;
      };
      assert.equal(state.revision, 3);
      assert.deepEqual(state.epics[0]?.items.map((item) => item.id).sort(), ["A", "B"]);
      const events = (await readFile(join(root, ".braid", "events.jsonl"), "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as { revision: number });
      assert.deepEqual(events.map((event) => event.revision), [1, 2, 3]);
    });
  });

  test("a held lock times out without stealing it or changing state", { timeout: 20_000 }, async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      await mkdir(join(root, ".braid", "lock"));
      const before = await snapshotLedger(root);
      const started = Date.now();
      const result = await runCli(["story", "add", "DEMO-001", "S", "--title", "Ship"], root);
      const elapsed = Date.now() - started;
      expectErr(result, 4, "error: state lock held at .braid/lock\n");
      assert.ok(elapsed >= 5000, `elapsed ${elapsed}`);
      assert.ok(elapsed < 15_000, `elapsed ${elapsed}`);
      assertSameBytes(before, await snapshotLedger(root));
      assert.equal((await lstat(join(root, ".braid", "lock"))).isDirectory(), true);
    });
  });

  test("a read-only state destination follows platform replacement semantics", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const before = await snapshotLedger(root);
      const statePath = join(root, ".braid", "state.json");
      await chmod(statePath, 0o444);
      try {
        const result = await runCli(["story", "add", "DEMO-001", "S", "--title", "Ship"], root);
        if (process.platform === "win32") {
          expectErr(result, 5, "error: cannot write state\n");
          assertSameBytes(before, await snapshotLedger(root));
          const temp = await readFile(join(root, ".braid", "state.json.tmp"), "utf8");
          assert.match(temp, /"revision": 2/u);
          assert.match(temp, /Ship/u);
        } else {
          // POSIX rename-over checks the directory, not the destination's write bit.
          assert.equal(result.code, 0, result.stderr);
          assert.equal(result.stdout, "added story S backlog\n");
          assert.equal(result.stderr, "");
          const committed = await snapshotLedger(root);
          assert.notDeepEqual(committed.state, before.state);
          assert.notDeepEqual(committed.events, before.events);
          const status = await runCli(["status", "--json"], root);
          assert.equal(status.code, 0, status.stderr);
          const body = JSON.parse(status.stdout) as { revision: number; eventsRevision: number; eventsLag: boolean };
          assert.equal(body.revision, 2);
          assert.equal(body.eventsRevision, 2);
          assert.equal(body.eventsLag, false);
        }
      } finally {
        await chmod(statePath, 0o666);
      }
    });
  });

  test("a read-only events file reports the committed state and does not roll it back", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const before = await snapshotLedger(root);
      const eventsPath = join(root, ".braid", "events.jsonl");
      await chmod(eventsPath, 0o444);
      try {
        const result = await runCli(["story", "add", "DEMO-001", "S", "--title", "Ship"], root);
        expectErr(result, 5, "error: state updated to revision 2 but the event append failed; not rolled back\n");
        const committed = await snapshotLedger(root);
        assert.deepEqual(committed.events, before.events);
        assert.notDeepEqual(committed.state, before.state);
        const state = JSON.parse(committed.state?.toString("utf8") ?? "{}") as {
          revision: number;
          epics: Array<{ items: Array<{ id: string }> }>;
        };
        assert.equal(state.revision, 2);
        assert.equal(state.epics[0]?.items[0]?.id, "S");
        const status = await runCli(["status", "--json"], root);
        assert.equal(status.code, 0);
        assert.equal(status.stderr, "warning: events lag state (state revision 2, last event revision 1); not repaired\n");
        const body = JSON.parse(status.stdout) as { eventsLag: boolean; eventsRevision: number };
        assert.equal(body.eventsLag, true);
        assert.equal(body.eventsRevision, 1);
        const refused = await runCli(["story", "add", "DEMO-001", "T", "--title", "Other"], root);
        expectErr(refused, 3, "error: events lag state; mutation refused; state preserved\n");
        assertSameBytes(committed, await snapshotLedger(root));
      } finally {
        await chmod(eventsPath, 0o666);
      }
    });
  });

  test("an injected pre-commit replace failure leaves the live state in place", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const before = await snapshotLedger(root);
      let sawLiveState = false;
      const result = await runInProcess(["story", "add", "DEMO-001", "S", "--title", "Ship"], root, {
        replaceTemp: async (tempPath, statePath) => {
          assert.equal(dirname(tempPath), dirname(statePath));
          assert.equal(basename(tempPath), "state.json.tmp");
          assert.equal(basename(statePath), "state.json");
          const live = await readFile(statePath, "utf8");
          assert.match(live, /"revision": 1/u);
          sawLiveState = true;
          throw new Error("injected replace failure");
        },
      });
      assert.equal(sawLiveState, true);
      expectErr(result, 5, "error: cannot write state\n");
      assert.equal(result.stderr.includes("injected"), false);
      assertSameBytes(before, await snapshotLedger(root));
      const temp = await readFile(join(root, ".braid", "state.json.tmp"), "utf8");
      assert.match(temp, /"revision": 2/u);
    });
  });

  test("an injected event sync failure reports commit without claiming rollback", async () => {
    await withRoot(async (root) => {
      await initDemo(root);
      const io = (await loadMain()).createDefaultLedgerIo();
      const result = await runInProcess(["story", "add", "DEMO-001", "S", "--title", "Ship"], root, {
        appendEventLine: async (eventsPath, line) => {
          await io.appendEventLine(eventsPath, line);
          throw new Error("injected sync failure");
        },
      });
      expectErr(result, 5, "error: state updated to revision 2 but the event append failed; not rolled back\n");
      assert.equal(result.stderr.includes("injected"), false);
      const state = JSON.parse(await readFile(join(root, ".braid", "state.json"), "utf8")) as { revision: number };
      const events = (await readFile(join(root, ".braid", "events.jsonl"), "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as { revision: number });
      assert.equal(state.revision, 2);
      assert.deepEqual(events.map((event) => event.revision), [1, 2]);
      const status = await runCli(["status", "--json"], root);
      assert.equal(status.code, 0);
      assert.equal(status.stderr, "");
      const body = JSON.parse(status.stdout) as { eventsLag: boolean; eventsRevision: number };
      assert.equal(body.eventsLag, false);
      assert.equal(body.eventsRevision, 2);
    });
  });

  test("init reports a committed revision 0 when the empty event file cannot be created", async () => {
    await withRoot(async (root) => {
      const created = await runInProcess(["init"], root, {
        createEmptyEvents: async () => {
          throw new Error("injected event file failure");
        },
      });
      expectErr(created, 5, "error: state updated to revision 0 but the event append failed; not rolled back\n");
      assert.equal(existsSync(join(root, ".braid", "events.jsonl")), false);
      const state = JSON.parse(await readFile(join(root, ".braid", "state.json"), "utf8")) as { revision: number };
      assert.equal(state.revision, 0);
      const status = await runCli(["status", "--json"], root);
      assert.equal(status.code, 0);
      assert.equal(status.stderr, "warning: events file missing; not repaired\n");
      await expectOk(
        root,
        ["new", "DEMO-001", "--title", "Demo ledger", "--outcome", "Track one story by hand"],
        "created epic DEMO-001\n",
      );
    });
  });

  test("init leaves a temp file when replacement fails and will not overwrite a non-empty directory", async () => {
    await withRoot(async (root) => {
      const failed = await runInProcess(["init"], root, {
        replaceTemp: async () => {
          throw new Error("injected replace failure");
        },
      });
      expectErr(failed, 5, "error: cannot write state\n");
      assert.equal(existsSync(join(root, ".braid", "state.json")), false);
      assert.equal(existsSync(join(root, ".braid", "events.jsonl")), false);
      assert.equal(existsSync(join(root, ".braid", "state.json.tmp")), true);
      const again = await runCli(["init"], root);
      expectErr(again, 3, "error: .braid is not an empty ledger directory; state preserved\n");
      assert.equal(existsSync(join(root, ".braid", "state.json")), false);
      assert.equal(existsSync(join(root, ".braid", "lock")), false);
    });
  });
});
