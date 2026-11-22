import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const fixtures = fileURLToPath(new URL("./fixtures/limits", import.meta.url));
const { readLimitsView, mergeLimits, buildView } = await load("../dist/board/limits.js");
const { chipNote, agentsText } = await load("../dist/board/limits-view.js");
const { DEFAULT_LIMITS } = await load("../dist/braids/limits.js");
const { readT3, resetT3Memory } = await load("../dist/board/t3.js");
const { parseSteeringTitle, parseThreadTitle, steeringTitle } = await load("../dist/braids/title.js");
const { demoLimits, demoT3, demoPauses } = await load("../dist/board/demo.js");
const { toBoard } = await load("../dist/board/model.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-board-limits-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
beforeEach(() => resetT3Memory());

// The fixtures were checked at 18:00Z; their windows reset between 19:22Z and 26 Nov.
const NOW = new Date("2026-11-21T18:05:00.000Z");
const NO_THREADS = { status: { state: "ok" }, threads: new Map() };

function project(front: string): string {
  const root = mkdtempSync(join(scratch, "p-"));
  writeFileSync(join(root, "BRAID.md"), `---\n${front}\n---\n\n# project\n`);
  return root;
}
const MODELS = ["models:", "  coordinator: claude_ok / claude-opus-5-5 / effort=medium", "  worker: codex_ok / gpt-5 / effort=high", "  reviewer: cursor_unsupported / grok-4.6 / effort=high"].join("\n");
const states = (view: any) => Object.fromEntries(view.providers.map((p: any) => [p.instanceId, p.state]));

test("the view has one provider per BRAID.md models instance, each with its chip state", () => {
  const view = readLimitsView(project(MODELS), NO_THREADS, new Map(), NOW, fixtures);
  assert.deepEqual(states(view), { claude_ok: "ok", codex_ok: "ok", cursor_unsupported: "unmeasured" });
  const claude = view.providers[0];
  assert.deepEqual([claude.session.usedPercent, claude.session.threshold, claude.weekly.usedPercent, claude.weekly.threshold], [22, 97, 29, 95]);
  assert.deepEqual(claude.roles, ["coordinator"]);
  assert.equal(view.note, null);
});

test("near is within ten points of a threshold, over is past it, a stale cache is unknown", () => {
  const near = readLimitsView(project(`${MODELS}\nlimits:\n  session: 30`), NO_THREADS, new Map(), NOW, fixtures);
  assert.equal(states(near).claude_ok, "near"); // 22% of 30%
  const front = (id: string) => `models:\n  coordinator: ${id} / claude-opus-5-5 / effort=medium`;
  assert.equal(states(readLimitsView(project(front("claude_session_over")), NO_THREADS, new Map(), NOW, fixtures)).claude_session_over, "over");
  const later = new Date("2026-11-21T18:30:00.000Z");
  const stale = readLimitsView(project(front("claude_stale")), NO_THREADS, new Map(), later, fixtures);
  assert.equal(states(stale).claude_stale, "unknown");
  assert.match(chipNote(stale.providers[0], later), /^no reading for \d+ (min|h)$/);
});

test("a limit pause record makes its provider paused, lists the paused braid and shows the resume time", () => {
  const root = project("models:\n  coordinator: claude_session_over / claude-opus-5-5 / effort=medium");
  const pause: Record<string, unknown> = { braid: "0025", provider: "claude_session_over", window: "five_hour", label: "Session", usedPercent: 98, resetsAt: null, resumeAt: "2026-11-21T19:00:00.000Z", task: null, thread: "t", by: "coordinator", at: NOW.toISOString() };
  const hold: Record<string, unknown> = { braid: "0026", reason: "hold", provider: null, window: null, label: null, usedPercent: null, resetsAt: null, resumeAt: null, task: null, thread: "t", by: "pm", at: NOW.toISOString() };
  const view = readLimitsView(root, NO_THREADS, new Map([["0025", pause], ["0026", hold]]), NOW, fixtures);
  const p = view.providers[0];
  assert.equal(p.state, "paused");
  assert.deepEqual(p.agents.map((a: any) => [a.id, a.state]), [["0025", "paused"]]); // a hold names no provider
  assert.match(chipNote(p, NOW), /^paused · resumes /);
  assert.equal(agentsText(p).paused, "0025");
});

test("a provider only a running thread uses is added; BRAID.md without models gives a note, not an error", () => {
  const t3 = { status: { state: "ok" }, threads: new Map([["0001/A", [{ id: "w", role: "worker", pending: 0, link: null, provider: "codex_ok" }]]]) };
  const view = readLimitsView(project("main: main"), t3, new Map(), NOW, fixtures);
  assert.deepEqual(states(view), { codex_ok: "ok" });
  assert.deepEqual(view.providers[0].roles, []);
  assert.deepEqual(view.providers[0].agents.map((a: any) => [a.id, a.role, a.state]), [["0001/A", "worker", "running"]]);
  assert.match(view.note, /no models key/);
});

test("projects merge by provider, and a project with no reading adds nothing", () => {
  const empty = buildView([], DEFAULT_LIMITS, NO_THREADS, new Map(), NOW);
  assert.equal(mergeLimits([{ project: "x", view: null }]), null);
  const one = readLimitsView(project(MODELS), NO_THREADS, new Map(), NOW, fixtures);
  const merged = mergeLimits([{ project: "a", view: one }, { project: "b", view: one }, { project: "c", view: empty }]);
  assert.deepEqual(merged.providers.map((p: any) => p.instanceId), ["claude_ok", "codex_ok", "cursor_unsupported"]);
});

function stub(list: unknown[], shown: Record<string, unknown>) {
  return (_root: string, args: readonly string[]) => Promise.resolve({ status: 0, stdout: JSON.stringify(args[1] === "list" ? list : { thread: shown[args[2] ?? ""] ?? {} }), stderr: "" });
}

test("worker and reviewer threads carry their provider, as coordinators do; a steering thread is no agent", async () => {
  const agents = join(scratch, "wt");
  mkdirSync(agents, { recursive: true });
  const list = [
    { threadId: "w1", status: "running", title: "x", providerInstanceId: "codex", link: "l1" },
    { threadId: "r1", status: "running", title: "y", link: "l2" },
    { threadId: "s1", status: "running", title: "🚦 repo steering: pause codex Session 97%", providerInstanceId: "Claude_Everix", link: "l3" },
    { threadId: "c1", status: "running", title: `🧠 ${basename(scratch)} 0001 coordinator: t`, providerInstanceId: "Claude_Everix", link: "l4" },
  ];
  const shown = {
    w1: { status: "running", worktreePath: join(agents, "0001-A"), providerInstanceId: "codex" },
    r1: { status: "running", providerInstanceId: "cursor" },
    // placed inside an item's worktree, but by its title a steering thread
    s1: { status: "running", worktreePath: join(agents, "0001-B"), providerInstanceId: "Claude_Everix" },
  };
  const t3 = await readT3(scratch, { run: stub(list, shown), agents, project: scratch, reviews: [{ id: "0001/C", thread: "r1" }], ttlMs: 0 });
  assert.equal(t3.threads.get("0001/A")?.[0]?.provider, "codex");
  assert.equal(t3.threads.get("0001/C")?.[0]?.provider, "cursor");
  assert.equal(t3.threads.has("0001/B"), false);
  assert.equal(t3.coordinators.get("0001")?.provider, "Claude_Everix");
});

test("the steering title has no item id, and nothing but a steering title reads as one", () => {
  const title = steeringTitle("braid", "pause Claude_Everix Session 97%");
  assert.equal(title, "🚦 braid steering: pause Claude_Everix Session 97%");
  assert.deepEqual(parseSteeringTitle(title), { repo: "braid", what: "pause Claude_Everix Session 97%" });
  assert.equal(parseThreadTitle(title), null);
  assert.equal(parseSteeringTitle("🧠 braid 0064 coordinator: x"), null);
});

test("the demo shows Claude_Everix paused, codex ok and cursor not measured, and the board data carries it", () => {
  const t3 = demoT3();
  const pauses = new Map(demoPauses(new Date()).map((p: any) => [p.braid, p]));
  const view = demoLimits(t3, pauses);
  assert.deepEqual(states(view), { Claude_Everix: "paused", codex: "ok", cursor: "unmeasured" });
  assert.deepEqual(view.providers[0].agents.filter((a: any) => a.state === "paused").map((a: any) => a.id), ["0025", "0026", "0027"]);
  const data = toBoard("demo", [], { status: { state: "ok" } }, t3, undefined, undefined, undefined, [], view);
  assert.equal(data.limits.providers.length, 3);
  assert.equal(toBoard("demo", [], { status: { state: "ok" } }, t3).limits, null);
});
