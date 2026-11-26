import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// Programmes on the board (0062/D): the plan front matter and `braid check --plan`, reading `pm/*` branches, the
// panel's sections and the programme stall, the hold, the keys across projects, the filter and the pushes.
// Computed specifiers keep the compiled modules out of the typecheck.
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
/* eslint-disable @typescript-eslint/no-explicit-any */
const { parsePlan }: any = await load("../dist/braids/plan.js");
const { FormatError }: any = await load("../dist/braids/frontmatter.js");
const { readPlans, planOf }: any = await load("../dist/board/plans.js");
const model: any = await load("../dist/board/model.js");
const signals: any = await load("../dist/board/signals.js");
const programme: any = await load("../dist/board/programme.js");
const message: any = await load("../dist/notify/message.js");
const { combine }: any = await load("../dist/board/combined.js");
const filter: any = await load("../dist/board/filter.js");
const route: any = await load("../dist/board/route.js");
const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

const NOW = new Date("2026-11-22T12:00:00Z");
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();
const PM = "11111111-aaaa-4bbb-8ccc-222222222222";
const LINK = `http://127.0.0.1:3773/env1/${PM}`;

/** The template's front matter, as the PM writes it. */
const TEMPLATE = [
  "---",
  "programme: working-product",
  "title: Working product",
  "goal: A working product per the specs",
  `thread: ${PM}`,
  "limit: 3",
  "state: running",
  "hold:",
  "next: P3 Packaging, after 0006 merges",
  "digest: 20:03 · 3 done · 3 running",
  "rows:",
  "  - P1 | 0001 | Login | running",
  "  - P2 | 0002 | Search | done",
  "  - P3 | - | Packaging | planned",
  "---",
  "",
  "# PM plan: working product",
  "",
].join("\n");
const plan = (lines: string[]) => `---\n${lines.join("\n")}\n---\n`;

const scratch = mkdtempSync(join(tmpdir(), "braid-programmes-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

test("parsePlan reads the template's front matter", () => {
  const p = parsePlan(TEMPLATE, "pm/working-product.md");
  assert.equal(p.programme, "working-product");
  assert.equal(p.thread, PM);
  assert.equal(p.limit, 3);
  assert.equal(p.state, "running");
  assert.equal(p.hold, null, "an empty hold is no hold");
  assert.deepEqual(p.rows[2], { row: "P3", braid: null, title: "Packaging", state: "planned" });
  const held = parsePlan(TEMPLATE.replace("hold:", "hold: 2026-11-22T16:30:00Z Please freeze work"), "x");
  assert.deepEqual(held.hold, { since: "2026-11-22T16:30:00.000Z", words: "Please freeze work" });
});

test("parsePlan names the line of each error", () => {
  const fails = (text: string, pattern: RegExp) => assert.throws(() => parsePlan(text, "pm/x.md"), (e: any) => e instanceof FormatError && pattern.test(e.message));
  fails(TEMPLATE.replace("state: running", "state: paused"), /^line 7: state is running, held, done, stopped; got: paused/);
  fails(TEMPLATE.replace("  - P3 | - | Packaging | planned", "  - P3 | - | Packaging"), /^line 14: a row is/);
  fails(TEMPLATE.replace("  - P1 | 0001 | Login | running", "  - P1 | 1 | Login | running"), /^line 12: a row's braid is a four-digit number/);
  fails(TEMPLATE.replace("limit: 3", "limit: three"), /^line 6: limit is a whole number/);
  fails(TEMPLATE.replace("hold:", "hold: soon please"), /^line 8: hold is "<ISO time> <the user's words>"/);
  fails(TEMPLATE.replace("digest:", "owner: me\ndigest:"), /^line 10: unknown key: owner/);
  fails(TEMPLATE.replace("title: Working product\n", ""), /^missing key: title/);
  fails(TEMPLATE.replace("programme: working-product", "programme: Working Product"), /^line 2: programme is the slug/);
});

test("braid check --plan accepts the template and names the line of an error", () => {
  const root = mkdtempSync(join(scratch, "check-"));
  mkdirSync(join(root, "braids"));
  spawnSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  writeFileSync(join(root, "good.md"), TEMPLATE);
  writeFileSync(join(root, "bad.md"), TEMPLATE.replace("state: running", "state: paused"));
  const good = spawnSync(process.execPath, [cli, "check", "--plan", "good.md"], { cwd: root, encoding: "utf8" });
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /^plan OK: pm\/working-product, running, 3 rows/);
  const bad = spawnSync(process.execPath, [cli, "check", "--plan", "bad.md"], { cwd: root, encoding: "utf8" });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /bad\.md: line 7: state is/);
});

test("readPlans reads each pm/* branch's plan, a local branch before origin's, and says why one can't be read", async () => {
  const root = mkdtempSync(join(scratch, "read-"));
  const git = (...args: string[]) => {
    const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  };
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  writeFileSync(join(root, "README.md"), "x\n");
  git("add", "-A");
  git("commit", "-q", "-m", "init");
  const branch = (name: string, file: string, text: string) => {
    git("checkout", "-q", "-b", name, "main");
    mkdirSync(join(root, "pm"), { recursive: true });
    writeFileSync(join(root, file), text);
    git("add", "-A");
    git("commit", "-q", "-m", name);
    git("checkout", "-q", "main");
    rmSync(join(root, "pm"), { recursive: true, force: true });
  };
  branch("pm/working-product", "pm/working-product.md", TEMPLATE);
  // origin: an older copy of pm/working-product (the local one wins) and pm/remote-only (read from origin).
  const origin = mkdtempSync(join(scratch, "origin-"));
  spawnSync("git", ["init", "-q", "--bare", origin]);
  git("remote", "add", "origin", origin);
  branch("pm/remote-only", "pm/remote-only.md", plan(["programme: remote-only", "title: R", "goal: G", "state: running"]));
  git("push", "-q", "origin", "pm/remote-only");
  git("branch", "-q", "-D", "pm/remote-only");
  git("push", "-q", "origin", "pm/working-product:pm/working-product");
  git("checkout", "-q", "pm/working-product");
  mkdirSync(join(root, "pm"), { recursive: true });
  writeFileSync(join(root, "pm/working-product.md"), TEMPLATE.replace("limit: 3", "limit: 5"));
  git("commit", "-q", "-am", "newer local");
  git("checkout", "-q", "main");
  rmSync(join(root, "pm"), { recursive: true, force: true });
  git("fetch", "-q", "origin");
  branch("pm/broken", "pm/broken.md", plan(["programme: broken", "title: B", "goal: G", "state: paused"]));
  branch("pm/empty", "pm/other.md", "x\n");
  const read = await readPlans(root);
  assert.deepEqual(read.map((r: any) => [r.slug, r.branch, r.error]), [
    ["broken", "pm/broken", "line 5: state is running, held, done, stopped; got: paused"],
    ["empty", "pm/empty", "no pm/empty.md on pm/empty"],
    ["remote-only", "origin/pm/remote-only", null],
    ["working-product", "pm/working-product", null],
  ]);
  assert.equal(read[3].plan.limit, 5, "the local branch wins over origin's older copy");
  assert.equal(read[3].plan.rows.length, 3);
  assert.deepEqual(await readPlans(mkdtempSync(join(scratch, "nogit-"))), [], "no Git, no programmes");
  assert.match(planOf("x", "pm/x", plan(["programme: y", "title: T", "goal: G", "state: running"])).error, /programme is y, but the branch is pm\/x/);
});

// ---- The panel's sections and the stall

const card = (id: string, extra: object = {}): any => ({ id, title: `B ${id}`, lane: "In Progress", running: false, activity: null, pause: null, pm: null, need: null, pmAsk: null, strands: [], ...extra });
const t3 = (pm: string | null, extra: object = {}): any => ({ status: { state: "ok" }, threads: new Map(), states: new Map(pm === null ? [] : [[PM, pm]]), links: new Map([[PM, LINK]]), ...extra });
const gh = (): any => ({ status: { state: "ok" }, prs: new Map() });
const read = (lines: string[] = []): any => planOf("working-product", "pm/working-product", plan(["programme: working-product", "title: W", "goal: G", `thread: ${PM}`, ...(lines.some((l) => l.startsWith("state:")) ? [] : ["state: running"]), ...lines, "rows:", "  - P1 | 0001 | One | running", "  - P2 | 0002 | Two | running"]));

/** One programme read at `now` with a broke clock that starts from `seen`. */
function one(opts: { cards?: any[]; t3?: any; lines?: string[]; seen?: Record<string, string>; requests?: any[]; pauses?: Map<string, any>; ghOk?: boolean } = {}): { p: any; seen: Record<string, string> } {
  const clock = signals.brokeClock(opts.seen ?? {}, NOW);
  const sig = { now: NOW, requests: new Map(), programmes: opts.requests ?? [], pauses: opts.pauses ?? new Map(), alarm: clock.alarm, nudged: clock.nudged };
  const alarms: unknown[] = [];
  const [p] = programme.toProgrammes("agento", [read(opts.lines)], opts.cards ?? [card("0001"), card("0002")], opts.t3 ?? t3("idle"), sig, { status: { state: opts.ghOk === false ? "unavailable" : "ok" } }, alarms);
  clock.settle(alarms);
  return { p, seen: clock.seen() };
}
const KEY = "agento/working-product pm stalled";
const long = { [KEY]: ago(11) };
/** A stall that was nudged ten minutes ago: the stall shows now (0071/C). */
const afterNudge = (key: string = KEY): Record<string, string> => ({ [key]: ago(25), [`${key} nudged`]: ago(11) });

test("a programme is Working while its PM runs or one of its braids runs", () => {
  assert.equal(one({ t3: t3("running") }).p.section, "working", "a running PM with no braid running");
  assert.equal(one({ cards: [card("0001", { running: true }), card("0002")], seen: long }).p.section, "working", "an idle PM whose braid has an agent");
  assert.equal(one({ cards: [card("0001", { activity: "checks" }), card("0002")], seen: long }).p.section, "working", "a PR of it has checks pending");
  assert.equal(one({ t3: t3("idle", { coordinators: new Map([["0002", {}]]) }), seen: long }).p.section, "working", "a coordinator of it runs");
  assert.equal(one({ t3: t3("idle", { pmChecks: ["PR #12 of 0002, live"] }), seen: long }).p.section, "working", "the PM's checker runs");
  const working = one({ t3: t3("running"), cards: [card("0001", { running: true }), card("0002", { lane: "Done" })] }).p;
  assert.deepEqual([working.done, working.total, working.running, working.status], [1, 2, 1, "1 braid running"]);
});

test("a programme with neither its PM nor a braid running reads stalled after ten minutes, once, and clears when one runs", () => {
  const first = one();
  assert.equal(first.p.section, "working", "not yet: the clock starts");
  assert.equal(first.seen[KEY], NOW.toISOString());
  for (const pm of ["idle", "failed", "archived", null]) {
    const late = one({ t3: t3(pm), seen: afterNudge() });
    assert.equal(late.p.section, "needs", `PM ${pm}`);
    assert.equal(late.p.need.kind, "stalled");
    assert.equal(late.p.need.text, "Stalled after a nudge: the PM stopped and none of its braids is running");
    assert.equal(late.p.need.link, LINK);
    assert.equal(late.p.need.since, afterNudge()[KEY], "the push key keeps its first sighting: pushed once");
  }
  assert.match(one({ t3: t3(null), seen: afterNudge() }).p.seen, /^the PM thread is gone · no braid running/);
  const back = one({ t3: t3("running"), seen: long });
  assert.equal(back.p.section, "working");
  assert.equal(back.seen[KEY], undefined, "the clock clears");
  const unknown = one({ t3: { status: { state: "unavailable", reason: "down" }, threads: new Map() }, seen: long });
  assert.equal(unknown.p.need, null, "T3 unread shows nothing");
  assert.equal(unknown.seen[KEY], long[KEY], "and neither starts nor stops the clock");
  assert.equal(one({ ghOk: false, seen: long }).seen[KEY], long[KEY]);
});

test("a PM checker counts only for its own programme: by slug, by braid number, or as the project's only live programme", () => {
  assert.equal(programme.checkerOf(["PR #12 of 0002, live"], "a", ["0002"], false), true);
  assert.equal(programme.checkerOf(["working-product release"], "working-product", [], false), true);
  assert.equal(programme.checkerOf(["PR #12 of 0002, live"], "b", ["0020", "0102"], false), false, "0002 isn't 0020 or 0102");
  assert.equal(programme.checkerOf(["anything"], "b", [], true), true, "the only live programme");
  assert.equal(programme.checkerOf([], "b", [], true), false);
  // Two programmes: A's checker runs (it names 0001); B is idle with no braid running and stalls on its own clock.
  const planB = planOf("other", "pm/other", plan(["programme: other", "title: O", "goal: G", `thread: ${PM}`, "state: running", "rows:", "  - P1 | 0003 | Three | running"]));
  const clock = signals.brokeClock({ ...afterNudge("agento/other pm stalled"), [KEY]: ago(11) }, NOW);
  const sig = { now: NOW, requests: new Map(), programmes: [], pauses: new Map(), alarm: clock.alarm };
  const [a, b] = programme.toProgrammes("agento", [read(), planB], [card("0001"), card("0002"), card("0003")], t3("idle", { pmChecks: ["PR #4 of 0001, live"] }), sig, gh());
  assert.equal(a.section, "working");
  assert.equal(b.section, "needs", "another programme's checker doesn't keep B working");
  assert.equal(b.need.kind, "stalled");
});

test("done, stopped and held programmes never stall; an open PM request shows instead of the stall", () => {
  for (const state of ["done", "stopped"]) {
    const { p, seen } = one({ lines: [`state: ${state}`], seen: long });
    assert.equal(p.section, null, `${state} leaves the panel`);
    assert.equal(p.need, null);
    assert.equal(seen[KEY], undefined);
  }
  const held = one({ lines: ["state: held", "hold: 2026-11-22T11:00:00Z wait for the account"], seen: long }).p;
  assert.equal(held.section, "working");
  assert.equal(held.need, null);
  assert.match(held.status, /^On hold since \d\d:\d\d: “wait for the account”$/);
  const plainHeld = one({ lines: ["state: held", "hold:"], seen: long }).p;
  assert.deepEqual([plainHeld.section, plainHeld.need], ["working", null], "state: held with no words");
  const pause = { braid: "0001", reason: "limit", provider: "Claude", window: null, label: null, usedPercent: null, resetsAt: null, resumeAt: ago(-30), task: null, thread: PM, by: "pm", at: ago(5) };
  const paused = one({ cards: [card("0001", { pause: {} }), card("0002", { pause: {} })], pauses: new Map([["0001", pause], ["0002", { ...pause, braid: "0002" }]]), seen: long }).p;
  assert.equal(paused.section, "working", "every open braid paused counts as held");
  assert.equal(paused.paused, true);
  assert.equal(paused.need, null);
  const asking = one({ requests: [{ id: "pm/working-product", kind: "question", by: "pm", text: "A or B?", at: ago(2), thread: PM }], seen: long });
  assert.equal(asking.p.section, "needs");
  assert.equal(asking.p.need.text, "The PM asks you: A or B?");
  assert.equal(asking.seen[KEY], undefined, "no stall while a request is open");
});

test("an unreadable plan shows its line in the panel and the board still works", () => {
  const sig = { now: NOW, requests: new Map(), alarm: () => null, plans: [planOf("broken", "pm/broken", plan(["programme: broken", "title: B", "goal: G", "state: paused"]))] };
  const board = model.toBoard("agento", [], gh(), t3("idle"), sig);
  assert.equal(board.programmes[0].error, "plan unreadable: line 5: state is running, held, done, stopped; got: paused");
  assert.equal(board.programmes[0].section, "working");
  assert.deepEqual(board.braids, []);
});

test("a held plan holds its braids: they show paused (held by the PM), not stalled", () => {
  const plans = [planOf("ios-beta", "pm/ios-beta", plan(["programme: ios-beta", "title: I", "goal: G", "state: held", "hold: 2026-11-22T11:00:00Z wait for the account", "rows:", "  - P1 | 0001 | One | running", "  - P2 | 0002 | Two | done"]))];
  const pauses = programme.heldPauses(plans, new Map());
  assert.deepEqual([...pauses.keys()], ["0001"], "a done row isn't held");
  assert.equal(pauses.get("0001").reason, "hold");
  assert.equal(pauses.get("0001").words, "wait for the account");
  const braid = { number: "0001", folder: "braids/0001-a", brief: { id: "0001", title: "A", status: "In Progress", labels: [], dependencies: [] }, strands: [] };
  const sig = { now: NOW, requests: new Map(), alarm: signals.brokeClock({ "0001 stalled": ago(30) }, NOW).alarm, plans, pauses };
  const board = model.toBoard("agento", [braid], gh(), t3("idle"), sig);
  const c = board.braids[0];
  assert.equal(c.lane, "In Progress", "not stalled");
  assert.equal(c.pause.text, "Held: “wait for the account”");
  assert.equal(c.programme, "ios-beta", "the 🧭 tag");
  assert.equal(board.programmes[0].hold.words, "wait for the account");
  // `state: held` with an empty hold holds the braids too, and the card says so.
  const bare = [planOf("ios-beta", "pm/ios-beta", plan(["programme: ios-beta", "title: I", "goal: G", "state: held", "hold:", "rows:", "  - P1 | 0001 | One | running"]))];
  const barePauses = programme.heldPauses(bare, new Map(), NOW);
  assert.deepEqual([barePauses.get("0001").reason, barePauses.get("0001").words, barePauses.get("0001").at], ["hold", null, NOW.toISOString()]);
  const shown = model.toBoard("agento", [braid], gh(), t3("idle"), { ...sig, plans: bare, pauses: barePauses, alarm: signals.brokeClock({ "0001 stalled": ago(30) }, NOW).alarm });
  assert.equal(shown.braids[0].lane, "In Progress", "not stalled");
  assert.notEqual(shown.braids[0].pause, null, "paused");
  assert.equal(shown.programmes[0].status, "On hold: the plan says held");
});

test("two projects with one slug stay apart: keys, the filter and the pushes", () => {
  const board = (repo: string): any => model.toBoard(repo, [], gh(), t3("idle"), { now: NOW, requests: new Map(), alarm: signals.brokeClock(afterNudge(`${repo}/working-product pm stalled`), NOW).alarm, plans: [read()] });
  const held = (name: string) => ({ name, repo: name, board: board(name), readAt: NOW.getTime(), failure: null, problems: [] });
  const all = combine([held("app"), held("api")], false, [], NOW.getTime());
  assert.deepEqual(all.programmes.map((p: any) => p.key), ["app/working-product", "api/working-product"]);
  assert.equal(filter.parseProgramme("?projects=app,api&programme=api/working-product", ["app/working-product", "api/working-product"], ["app", "api"]), "api/working-product");
  assert.equal(filter.parseProgramme("?programme=api/working-product", ["api/working-product"], ["app"]), null, "its project isn't shown");
  assert.equal(filter.parseProgramme("?programme=working-product", ["app/working-product"], ["app"]), "app/working-product", "a slug on a one-project board");
  assert.equal(filter.parseProgramme("?programme=nothing/x", ["app/working-product"], ["app"]), null);
  const [a] = message.pushesOf(board("app"));
  const [b] = message.pushesOf(board("api"));
  assert.deepEqual([a.title, a.priority, a.tags, a.click], ["app working-product: Needs You", "high", ["hourglass"], "t3code://threads/env1/" + PM]);
  assert.notEqual(a.sequence, b.sequence);
});

test("the filter keeps ?projects= and the route opens a programme's details", () => {
  assert.equal(filter.programmeSearch("?projects=app,api", "app/working-product"), "?projects=app,api&programme=app/working-product");
  assert.equal(filter.programmeSearch("?projects=app,api&programme=app/working-product", null), "?projects=app,api");
  assert.equal(filter.programmeSearch("?programme=app/x", null), "");
  const r = route.parseHash("#/programme/app/working-product");
  assert.deepEqual([r.id, r.programme], [null, "app/working-product"]);
  assert.equal(route.programmeHash("app/working-product"), "#/programme/app/working-product");
  assert.equal(route.openMode("#/programme/app/x"), "replace", "inside open details, a move replaces");
});

test("a programme's request is pushed from the panel; a braid it runs sends no Done push", () => {
  const sig = { now: NOW, requests: new Map(), programmes: [{ id: "pm/working-product", kind: "action", by: "pm", text: "protect main", at: ago(1), thread: PM }], alarm: () => null, plans: [read()] };
  const braid = (n: string) => ({ number: n, folder: `braids/${n}-a`, brief: { id: n, title: `B${n}`, status: "Done", labels: [], dependencies: [] }, strands: [] });
  const board = model.toBoard("agento", [braid("0001"), braid("0009")], gh(), t3("idle"), sig);
  const pushes = message.pushesOf(board);
  const ask = pushes.find((p: any) => p.item === "pm/working-product#pm");
  assert.deepEqual([ask.title, ask.body, ask.priority], ["agento working-product: the PM asks", "do\nThe PM asks you to: protect main", "high"]);
  assert.equal(pushes.find((p: any) => p.item === "0001"), undefined, "run by the programme: the PM handles what follows");
  assert.equal(pushes.find((p: any) => p.item === "0009").priority, "default");
});

test("a PM ask next to a coordinator's handover: Needs You, with the review and Merge still there", () => {
  const braid = { number: "0001", folder: "braids/0001-a", brief: { id: "0001", title: "A", status: "In Progress", labels: [], dependencies: [] }, strands: [] };
  const head = "a".repeat(40);
  const github = { status: { state: "ok" }, prs: new Map([["0001", { number: 7, url: "u", state: "open", checks: "passing", base: "main", branch: "braid/0001-a", head }]]) };
  const review = { id: "0001", kind: "review", text: "review PR #7", at: ago(30), thread: "coord", pr: 7, head };
  const pmAsk = { id: "0001", kind: "action", by: "pm", text: "sign in to the test account", at: ago(5), thread: PM };
  const sig = { now: NOW, requests: new Map([["0001", review]]), asks: new Map([["0001", pmAsk]]), alarm: () => null };
  const c = model.toBoard("agento", [braid], github, t3("idle"), sig).braids[0];
  assert.equal(c.lane, "Waiting", "the PM's ask is the more urgent");
  assert.equal(c.need.text, "Merge PR #7", "the review stays the card's line");
  assert.equal(c.pmAsk.text, "The PM asks you to: sign in to the test account");
  assert.equal(c.merge?.reason, null, "Merge stays available");
});
