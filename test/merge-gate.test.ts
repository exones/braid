import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { acceptCommand, git, world } from "./support/done-fixtures.ts";

// BRAID.md `merge-gate:` and `merge-gate-on:`: the command `braid accept --merge` runs before its merges (0073/B).

/** A world whose BRAID.md names a gate that logs its arguments to calls.txt and exits with the code it is given. */
function gated(preset: string, code: number, on = "") {
  const w = world(preset);
  const script = join(w.root, "..", "gate.mjs");
  const calls = join(w.root, "..", "calls.txt");
  writeFileSync(script, `import { appendFileSync } from "node:fs";\nappendFileSync(${JSON.stringify(calls)}, process.argv.slice(2, 4).join(" ") + String.fromCharCode(10));\nif (process.argv[4] === "sleep") { await new Promise((r) => setTimeout(r, 20000)); }\nconsole.log("gate output line");\nconsole.error("gate says " + (process.argv[4] === "0" ? "yes" : "no"));\nprocess.exit(Number(process.argv[4]) || 0);\n`);
  const front = ["---", "main: main", "ci: [verify]", ...(preset === "" ? [] : [`autonomy: ${preset}`]), `merge-gate: node "${script}" <pr> <sha> ${code}`, ...(on === "" ? [] : [`merge-gate-on: ${on}`]), "---", ""].join("\n");
  writeFileSync(join(w.root, "BRAID.md"), front);
  git(w.root, "commit", "-q", "-am", "gate");
  git(w.root, "push", "-q", "origin", "HEAD:refs/heads/braid/0001-alpha");
  return { w, calls: () => { try { return readFileSync(calls, "utf8").trim().split("\n"); } catch { return []; } } };
}

test("a passing gate runs on a strand merge with <pr> and <sha> filled in, and the merge goes on", async () => {
  const { w, calls } = gated("", 0);
  const head = w.headOf("braid/0001/A-first");
  const out = await acceptCommand(w.root, ["0001/A", "--head", head, "--merge"], w.opts);
  assert.match(out, new RegExp(`merged PR #5 at ${head}`));
  assert.deepEqual(calls(), [`5 ${head}`]);
  assert.equal(w.merges.length, 1);
});

test("a failing gate refuses the merge with its command, exit code and output, with and without --preset", async () => {
  for (const [preset, extra] of [["", []], ["steady", ["--preset"]]] as const) {
    const { w, calls } = gated(preset, 3);
    const head = w.headOf("braid/0001/A-first");
    await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", head, "--merge", ...extra], w.opts), (e: Error) => {
      assert.match(e.message, /PR #5 not merged: the merge gate failed \(exit code 3\)/);
      assert.match(e.message, /gate: node .*gate\.mjs" 5 [0-9a-f]{40} 3/);
      assert.match(e.message, /gate output line/);
      assert.match(e.message, /gate says no/);
      return true;
    });
    assert.equal(calls().length, 1);
    assert.equal(w.merges.length, 0);
    assert.equal(w.prs[0]!.state, "OPEN");
  }
});

test("a gate that outlives its time limit refuses the merge and says to run braid accept again", async () => {
  const { w } = gated("", 0);
  writeFileSync(join(w.root, "BRAID.md"), readFileSync(join(w.root, "BRAID.md"), "utf8").replace(/ 0\n/, " sleep\n"));
  git(w.root, "commit", "-q", "-am", "slow gate");
  git(w.root, "push", "-q", "origin", "HEAD:refs/heads/braid/0001-alpha");
  const head = w.headOf("braid/0001/A-first");
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", head, "--merge"], { ...w.opts, gateMs: 400 }), /the merge gate didn't finish in 0 minutes; run braid accept again/);
  assert.equal(w.merges.length, 0);
});

test("without merge-gate nothing changes", async () => {
  const w = world();
  const out = await acceptCommand(w.root, ["0001/A", "--head", w.headOf("braid/0001/A-first"), "--merge"], w.opts);
  assert.match(out, /merged PR #5/);
});

test("by default the gate runs on a merge into main as well", async () => {
  const { w, calls } = gated("free", 0);
  const out = await acceptCommand(w.root, ["0002", "--head", w.headOf("braid/0002-story"), "--merge", "--preset"], w.opts);
  assert.match(out, /merged PR #6 at /);
  assert.equal(calls().length, 1);
  assert.match(calls()[0]!, /^6 [0-9a-f]{40}$/);
  const f = gated("free", 1);
  await assert.rejects(acceptCommand(f.w.root, ["0002", "--head", f.w.headOf("braid/0002-story"), "--merge", "--preset"], f.w.opts), /PR #6 not merged: the merge gate failed \(exit code 1\)/);
  assert.equal(f.w.merges.length, 0);
});

test("merge-gate-on: [main] skips the gate on a strand merge but not on a merge into main; [strand] the reverse", async () => {
  const m = gated("", 1, "[main]");
  await acceptCommand(m.w.root, ["0001/A", "--head", m.w.headOf("braid/0001/A-first"), "--merge"], m.w.opts);
  assert.equal(m.calls().length, 0);
  assert.equal(m.w.merges.length, 1);
  const s = gated("", 1, "[strand]");
  await assert.rejects(acceptCommand(s.w.root, ["0001/A", "--head", s.w.headOf("braid/0001/A-first"), "--merge"], s.w.opts), /merge gate failed/);
  const st = gated("free", 1, "[strand]");
  await acceptCommand(st.w.root, ["0002", "--head", st.w.headOf("braid/0002-story"), "--merge", "--preset"], st.w.opts);
  assert.equal(st.calls().length, 0);
});

test("merge-gate-on with an unknown scope is refused", async () => {
  const { w } = gated("", 0, "[strand, everything]");
  await assert.rejects(acceptCommand(w.root, ["0001/A", "--head", w.headOf("braid/0001/A-first"), "--merge"], w.opts), /merge-gate-on must list strand and\/or main/);
  assert.equal(w.merges.length, 0);
});
