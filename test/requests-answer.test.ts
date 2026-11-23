import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { acceptCommand, brief, git, load, world } from "./support/done-fixtures.ts";

// 0070/B: answering, withdrawing and showing a request by its code; who answered and the PM's reason;
// "done when"; answers never commit on a braid branch (k5d1); items found after their branch is gone.

type Cmd = (root: string, args: string[], opts?: object) => string;
const R = (await load("../../dist/commands/requests.js")) as {
  askCommand: Cmd;
  answerCommand: (root: string, cwd: string, args: string[]) => string;
  withdrawCommand: Cmd;
  requestsCommand: Cmd;
};
const { decisionsCommand } = (await load("../../dist/commands/decisions.js")) as { decisionsCommand: (root: string, args: string[]) => string };
const { recapCommand } = (await load("../../dist/commands/facts.js")) as { recapCommand: (root: string, args: string[], opts: object) => Promise<string> };
const Rec = (await load("../../dist/braids/requests.js")) as {
  loadRecord: (root: string) => { requests: { code: string; id: string; state: string; to?: string; doneWhen: string; events: { event: string; by: string; text?: string; reason?: string }[] }[] };
  loadRequests: (root: string) => { code: string }[];
  forwardRequest: (root: string, id: string, at: string, note: string) => unknown;
  filterLive: (requests: object[], prOf: (n: number) => { state: string; headRefOid: string } | null) => object[];
};
const { fetchBranch } = (await load("../../dist/braids/gitbranch.js")) as { fetchBranch: (root: string, b: object) => unknown };
const { REQUESTS } = (await load("../../dist/braids/requests.js")) as { REQUESTS: object };

const codeOf = (out: string): string => /^(q-[a-z0-9]{4,})/.exec(out)?.[1] ?? assert.fail(`no code in: ${out}`);
const record = (root: string, code: string) => Rec.loadRecord(root).requests.find((r) => r.code === code) ?? assert.fail(`no ${code}`);
const file = (root: string, text: string): string => {
  const path = join(dirname(root), `answer-${Math.random().toString(36).slice(2)}.txt`);
  writeFileSync(path, text);
  return path;
};

test("k5d1: answering a final PR's item commits nothing on a braid branch, and the merge of the recapped head goes through", async () => {
  const w = world();
  const braidHead = git(w.root, "rev-parse", "HEAD");
  const storyHead = w.headOf("braid/0002-story");
  // The coordinator's checkout is on the braid branch, as for a braid's final PR.
  const braidCode = codeOf(R.askCommand(w.root, ["0001", "Merge the braid?", "--kind", "decision"]));
  const storyCode = codeOf(R.askCommand(w.root, ["0002", "Merge the story?", "--kind", "decision"]));
  assert.match(R.answerCommand(w.root, w.root, [braidCode, "--log", file(w.root, "Merge it.\n")]), new RegExp(`^${braidCode} 0001: answered by the user: Merge it\\.\\n$`));
  assert.match(R.answerCommand(w.root, w.root, ["0002", "--file", file(w.root, "Merge now.")]), /answered by the user: Merge now\./);
  assert.equal(git(w.root, "rev-parse", "HEAD"), braidHead, "the braid branch in the checkout didn't move");
  assert.equal(w.headOf("braid/0001-alpha"), braidHead, "nor on origin");
  assert.equal(w.headOf("braid/0002-story"), storyHead, "the story's PR head didn't move");
  assert.equal(git(w.root, "status", "--porcelain"), "");
  assert.equal(record(w.root, storyCode).events.at(-1)?.text, "Merge now.");
  // The merge of the head the recap named: Done is stamped, checks go green, and exactly that head merges.
  let polls = 0;
  const sleep = () => {
    polls += 1;
    w.prs[1]!.checks = "SUCCESS";
    return Promise.resolve();
  };
  const gh = (r: string, args: readonly string[]) => {
    if (args[1] === "view" && polls === 0 && w.headOf("braid/0002-story") !== storyHead) {
      w.prs[1]!.checks = "PENDING";
    }
    return w.opts.gh(r, args);
  };
  const out = await acceptCommand(w.root, ["0002", "--head", storyHead.slice(0, 7), "--merge"], { ...w.opts, gh, sleep });
  assert.match(out, /merged PR #6 at [0-9a-f]{40}/);
  assert.equal(w.merges.length, 1);
});

test("an answer to a closed code is refused, naming its state and who closed it; nothing changes", () => {
  const w = world();
  const code = codeOf(R.askCommand(w.root, ["0002", "Which name?"]));
  R.answerCommand(w.root, w.root, [code, "--file", file(w.root, "beta")]);
  const before = git(w.root, "rev-parse", "refs/heads/braid-requests");
  assert.throws(() => R.answerCommand(w.root, w.root, [code, "--file", file(w.root, "gamma")]), new RegExp(`braid answer: ${code} \\(0002\\) is already answered by the user at \\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}Z; nothing changed`));
  assert.throws(() => R.withdrawCommand(w.root, [code, "--why", "late"]), /is already answered by the user/);
  assert.equal(git(w.root, "rev-parse", "refs/heads/braid-requests"), before, "no write");
  assert.deepEqual(record(w.root, code).events.map((e) => e.event), ["opened", "answered"]);
  assert.throws(() => R.answerCommand(w.root, w.root, ["q-zzzz"]), /no request q-zzzz on braid-requests; nothing changed/);
  assert.throws(() => R.answerCommand(w.root, w.root, [code, "--by", "pm"]), /--by is for an id/);
});

test("who answered and the PM's reason round-trip, and show in the history, decisions and the recap draft", async () => {
  const w = world();
  const code = codeOf(R.askCommand(w.root, ["0002", "Ship the CLI flag as --from?", "--kind", "decision"]));
  assert.throws(() => R.answerCommand(w.root, w.root, [code, "--from", "pm"]), /--from pm needs --reason/);
  assert.throws(() => R.answerCommand(w.root, w.root, [code, "--reason", "x"]), /--reason is the PM's: add --from pm/);
  assert.throws(() => R.answerCommand(w.root, w.root, [code, "--from", "board"]), /--from is user or pm/);
  const out = R.answerCommand(w.root, w.root, [code, "--from", "pm", "--reason", "the user chose names like this   before", "--file", file(w.root, "Yes, --from.")]);
  assert.match(out, new RegExp(`^${code} 0002: answered by the PM: Yes, --from\\.\\n$`));
  const e = record(w.root, code).events.at(-1);
  assert.deepEqual([e?.event, e?.by, e?.text, e?.reason], ["answered", "pm", "Yes, --from.", "the user chose names like this before"]);
  const shown = R.requestsCommand(w.root, [code]);
  assert.match(shown, new RegExp(`^${code}  0002  decision  answered\\nShip the CLI flag as --from\\?\\nasked by the coordinator; for the user; done when answered\\n`));
  assert.match(shown, /\d{4}-\d{2}-\d{2} \d{2}:\d{2}Z {2}opened {5}the coordinator\n/);
  assert.match(shown, /answered {3}the PM: Yes, --from\. \(reason: the user chose names like this before\)\n$/);
  assert.match(decisionsCommand(w.root, ["0002"]), new RegExp(`0002  ${code} answered by the PM: Ship the CLI flag as --from\\? -> Yes, --from\\. \\(reason: the user chose names like this before\\)`));
  const recap = await recapCommand(w.root, ["0002"], { gh: w.opts.gh });
  assert.match(recap, new RegExp(`- \\d{4}-\\d{2}-\\d{2} 0002: ${code} answered by the PM`));
  // An answer without text is still the user's decision.
  const other = codeOf(R.askCommand(w.root, ["0001", "Start it?"]));
  R.answerCommand(w.root, w.root, [other]);
  assert.match(decisionsCommand(w.root, ["0001"]), new RegExp(`0001  ${other} answered by the user: Start it\\?\\n`));
});

test("an id with two open requests names both codes and changes nothing; withdraw keeps the record and lists it as closed", () => {
  const w = world();
  const mine = codeOf(R.askCommand(w.root, ["0002", "Coordinator asks"]));
  const pms = codeOf(R.askCommand(w.root, ["0002", "PM asks", "--by", "pm", "--thread", "mcp:launch:pm0000001"]));
  const before = git(w.root, "rev-parse", "refs/heads/braid-requests");
  for (const run of [() => R.answerCommand(w.root, w.root, ["0002"]), () => R.withdrawCommand(w.root, ["0002", "--why", "x"])]) {
    assert.throws(run, new RegExp(`0002 has 2 open requests: ${mine} \\(the coordinator's\\), ${pms} \\(the PM's\\); give the code, or --by coordinator\\|pm; nothing changed`));
  }
  assert.equal(git(w.root, "rev-parse", "refs/heads/braid-requests"), before, "no write");
  assert.throws(() => R.withdrawCommand(w.root, [mine]), /usage: braid withdraw/);
  assert.match(R.withdrawCommand(w.root, ["0002", "--by", "pm", "--why", "the  user answered in chat"]), new RegExp(`^${pms} 0002: withdrawn: the user answered in chat\\n$`));
  assert.match(R.withdrawCommand(w.root, [mine, "--why", "no longer needed"]), new RegExp(`^${mine} 0002: withdrawn: no longer needed`));
  assert.deepEqual([record(w.root, pms).state, record(w.root, pms).events.at(-1)?.by, record(w.root, pms).events.at(-1)?.text], ["withdrawn", "pm", "the user answered in chat"]);
  assert.equal(record(w.root, mine).events.at(-1)?.by, "coordinator");
  assert.equal(R.requestsCommand(w.root, []), "no open requests\n");
  const closed = R.requestsCommand(w.root, ["--closed"]).trim().split("\n");
  assert.equal(closed.length, 2);
  assert.match(closed[0] ?? "", new RegExp(`^${mine}  0002  question  withdrawn  \\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}Z  by the coordinator  Coordinator asks -> no longer needed$`), "newest first");
  assert.equal(R.requestsCommand(w.root, ["--closed", "--since", "2999-01-01"]), "no closed requests since 2999-01-01\n");
  assert.throws(() => R.requestsCommand(w.root, ["--since", "2026-01-01"]), /usage: braid requests/);
  assert.throws(() => R.requestsCommand(w.root, ["0002"]), /0002 is not a request code/);
  assert.throws(() => R.requestsCommand(w.root, ["q-zzzz"]), /no request q-zzzz/);
});

test("ask --to a braid number and --done-when: stored, shown; a pr: condition is met when its PR merges", () => {
  const w = world();
  const wait = R.askCommand(w.root, ["0001", "Wait for strand A's PR", "--done-when", "pr:#5"]);
  assert.match(wait, /^q-[a-z0-9]{4} 0001: question request opened \(done when pr:5\): Wait for strand A's PR\n$/);
  const other = R.askCommand(w.root, ["0001/A", "Does 0002 rename the flag?", "--to", "2", "--done-when", "braid:2"]);
  assert.match(other, /^q-[a-z0-9]{4} 0001\/A: question request to braid 0002 opened \(done when braid:0002\)/);
  const later = R.askCommand(w.root, ["0002", "Remind me", "--done-when", "time:2026-12-01T09:00:00+01:00"]);
  assert.match(later, /done when time:2026-12-01T08:00:00\.000Z/);
  assert.deepEqual([record(w.root, codeOf(other)).to, record(w.root, codeOf(other)).doneWhen], ["0002", "braid:0002"]);
  assert.throws(() => R.askCommand(w.root, ["0001", "x", "--to", "9"]), /--to 9: no braid 0009; nothing changed/);
  assert.throws(() => R.askCommand(w.root, ["0001", "x", "--done-when", "soon"]), /--done-when is answered, pr:<n>, braid:<number> or time:<iso>/);
  const listed = R.requestsCommand(w.root, [], { gh: w.opts.gh });
  assert.match(listed, /0001  question  \d+[mhd]  done when pr:5  Wait for strand A's PR/);
  assert.match(listed, /0001\/A  question  \d+[mhd]  to braid 0002  done when braid:0002  Does 0002/);
  // The board's pure filter hides it once the PR merged; braid requests records it as met.
  w.prs[0]!.state = "MERGED";
  const merged = () => ({ state: "MERGED", headRefOid: "x" });
  assert.equal(Rec.filterLive([{ kind: "question", doneWhen: "pr:5" }, { kind: "question", doneWhen: "answered" }], merged).length, 1);
  assert.doesNotMatch(R.requestsCommand(w.root, [], { gh: w.opts.gh }), /Wait for strand A's PR/);
  const met = record(w.root, codeOf(wait));
  assert.deepEqual([met.state, met.events.at(-1)?.by, met.events.at(-1)?.text], ["met", "board", "PR #5 merged"]);
  assert.equal(record(w.root, codeOf(other)).state, "open", "braid: conditions are only stored");
});

test("ask, answer and withdraw work on a merged story whose branch is gone, from a checkout that hasn't pulled it", () => {
  const w = world();
  // Story 0003 lives only on its branch, merges into main on origin, and its branch is deleted.
  git(w.worker, "fetch", "-q", "origin");
  git(w.worker, "checkout", "-q", "-B", "braid/0003-late", "origin/main");
  mkdirSync(join(w.worker, "braids", "0003-late"), { recursive: true });
  writeFileSync(join(w.worker, "braids", "0003-late", "brief.md"), brief("0003", "Done"));
  git(w.worker, "add", "-A");
  git(w.worker, "commit", "-q", "-m", "feat: 0003");
  git(w.worker, "push", "-q", "origin", "braid/0003-late");
  git(w.worker, "checkout", "-q", "-B", "main", "origin/main");
  git(w.worker, "merge", "-q", "--no-ff", "-m", "Merge 0003", "braid/0003-late");
  git(w.worker, "push", "-q", "origin", "main", ":refs/heads/braid/0003-late");
  git(w.root, "fetch", "-q", "--prune", "origin");
  assert.throws(() => git(w.root, "rev-parse", "--verify", "--quiet", "origin/braid/0003-late"));
  const code = codeOf(R.askCommand(w.root, ["0003", "Leftovers: sweep now?", "--kind", "decision"]));
  assert.match(R.answerCommand(w.root, w.root, ["0003", "--file", file(w.root, "Sweep later.")]), new RegExp(`^${code} 0003: answered by the user`));
  const again = codeOf(R.askCommand(w.root, ["0003", "Install the CLI?", "--kind", "action", "--by", "pm"]));
  assert.match(R.withdrawCommand(w.root, [again, "--why", "done by hand"]), /withdrawn: done by hand/);
  assert.throws(() => R.askCommand(w.root, ["0009", "x"]), /no braid 0009/);
});

test("a read while the local and remote record differ shows both sides' events of one request", () => {
  const w = world();
  const code = codeOf(R.askCommand(w.root, ["0002", "Which name?"]));
  git(w.root, "remote", "set-url", "origin", join(dirname(w.root), "nowhere.git"));
  assert.match(R.answerCommand(w.root, w.root, [code, "--file", file(w.root, "beta")]), /warning: can't reach origin/);
  // Meanwhile another clone forwards it, online.
  Rec.forwardRequest(w.worker, "0002", new Date().toISOString(), "over to you");
  git(w.root, "remote", "set-url", "origin", w.remote);
  fetchBranch(w.root, REQUESTS);
  assert.deepEqual(record(w.root, code).events.map((e) => e.event).sort(), ["answered", "forwarded", "opened"]);
});
