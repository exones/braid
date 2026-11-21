import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const fixtures = fileURLToPath(new URL("./fixtures/limits", import.meta.url));
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { DEFAULT_LIMITS, readLimits, readModelLines, readProvider, readProviders, roleLines } = await load("../dist/braids/limits.js");
const { limitsCommand } = await load("../dist/commands/limits.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-limits-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// Fixtures were checked at 18:00Z; their windows reset between 19:22Z and 26 Nov.
const NOW = new Date("2026-11-21T18:05:00.000Z");

function project(name: string, front: string): string {
  const root = join(scratch, name);
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, "BRAID.md"), `---\n${front}\n---\n\n# project\n`);
  return root;
}

const MODELS = [
  "models:",
  "  coordinator: claude_ok / claude-opus-5-5 / effort=medium",
  "  worker:",
  "    story: claude_ok / claude-sonnet-5-5 / effort=medium",
  "    spike: claude_ok / claude-fable-5-2 / effort=medium (follows a method)",
  "    L: codex_ok / gpt-5 / effort=high",
  "  reviewer: cursor_unsupported / grok-4.6 / effort=high, fastMode=false; skill braid-reviewer",
].join("\n");

const lines = (model: string | null, instanceId: string) => [{ role: "worker", instanceId, model }];
const read = (instanceId: string, model: string | null = "claude-opus-5-5", limits = DEFAULT_LIMITS) => readProvider(fixtures, instanceId, lines(model, instanceId), limits, NOW);

test("ok: a Claude and a Codex provider under their thresholds list every window", () => {
  const claude = read("claude_ok");
  assert.equal(claude.verdict, "ok");
  assert.equal(claude.reason, null);
  assert.deepEqual(claude.windows.map((w: { id: string }) => w.id), ["five_hour", "seven_day"]);
  assert.equal(claude.windows[0].usedPercent, 22);
  assert.equal(claude.windows[0].threshold, 90);
  assert.equal(claude.windows[1].threshold, 95);
  const codex = read("codex_ok", "gpt-5");
  assert.equal(codex.verdict, "ok");
  assert.deepEqual(codex.windows.map((w: { id: string }) => w.id), ["primary", "secondary"]);
});

test("pause on the session window, resume at resetsAt plus the buffer", () => {
  const r = read("claude_session_over");
  assert.equal(r.verdict, "pause");
  assert.equal(r.pauseWindow, "five_hour");
  assert.equal(r.resumeAt, "2026-11-21T21:55:00.000Z");
  assert.match(r.reason, /five_hour/);
});

test("pause is at or over the threshold: exactly 95% on a weekly window pauses, and the latest reset wins", () => {
  const r = read("claude_weekly_over");
  assert.equal(r.verdict, "pause");
  assert.equal(r.pauseWindow, "seven_day");
  assert.equal(r.resumeAt, "2026-11-26T06:05:00.000Z");
  const both = read("claude_session_over", "claude-opus-5-5", { ...DEFAULT_LIMITS, weekly: 29, buffer: 0 });
  assert.equal(both.pauseWindow, "seven_day", "the weekly window resets later than the session one");
  assert.equal(both.resumeAt, "2026-11-26T06:00:00.000Z");
});

test("a model-scoped weekly window pauses only a line whose model it belongs to", () => {
  const fable = read("claude_scoped_over", "claude-fable-5-2");
  assert.equal(fable.verdict, "pause");
  assert.equal(fable.pauseWindow, "seven_day_fable");
  const opus = read("claude_scoped_over", "claude-opus-5-5");
  assert.equal(opus.verdict, "ok", "an Opus line ignores the Fable window");
  assert.ok(!opus.windows.some((w: { id: string }) => w.id === "seven_day_fable"));
  const none = read("claude_scoped_over", null);
  assert.equal(none.verdict, "ok", "a line without a model gets only the unscoped windows");
});

test("a past resetsAt counts as 0%", () => {
  const r = read("claude_past_reset");
  assert.equal(r.verdict, "ok");
  assert.equal(r.windows[0].usedPercent, 0);
  assert.equal(r.windows[0].reset, true);
});

test("unknown, never pause: stale, disabled, unsupported and a missing cache say why", () => {
  const stale = read("claude_stale");
  assert.equal(stale.verdict, "unknown");
  assert.match(stale.reason, /stale after 10 min/);
  assert.equal(read("claude_stale", "claude-opus-5-5", { ...DEFAULT_LIMITS, stale: 30 }).verdict, "ok");
  const disabled = read("disabled");
  assert.equal(disabled.verdict, "unknown");
  assert.match(disabled.reason, /no usageLimits/);
  const unsupported = read("cursor_unsupported", "grok-4.6");
  assert.equal(unsupported.verdict, "unknown");
  assert.match(unsupported.reason, /unsupported/);
  const missing = read("not_there");
  assert.equal(missing.verdict, "unknown");
  assert.match(missing.reason, /no cache file/);
});

test("limits: in BRAID.md overrides the defaults, absent keys keep them, a bad value names its key", () => {
  assert.deepEqual(readLimits(project("none", MODELS)), DEFAULT_LIMITS);
  assert.deepEqual(readLimits(project("partial", `${MODELS}\nlimits:\n  session: 80\n  buffer: 2`)), { ...DEFAULT_LIMITS, session: 80, buffer: 2 });
  assert.deepEqual(readLimits(project("full", `limits:\n  session: 70\n  weekly: 60 # lower\n  buffer: 0\n  stale: 3\n${MODELS}`)), { session: 70, weekly: 60, buffer: 0, stale: 3 });
  assert.throws(() => readLimits(project("bad-weekly", "limits:\n  weekly: lots")), /limits\.weekly must be a percentage.*lots/);
  assert.throws(() => readLimits(project("bad-session", "limits:\n  session: 101")), /limits\.session/);
  assert.throws(() => readLimits(project("bad-buffer", "limits:\n  buffer: -1")), /limits\.buffer/);
  assert.throws(() => readLimits(project("bad-stale", "limits:\n  stale: 0")), /limits\.stale/);
  assert.throws(() => readLimits(project("bad-key", "limits:\n  daily: 80")), /limits\.daily is not a limits key/);
});

test("models lines map to roles; tier, then kind, then the plain role", () => {
  const all = readModelLines(project("models", MODELS));
  assert.deepEqual(
    all.map((l: { role: string; instanceId: string; model: string }) => `${l.role}=${l.instanceId}/${l.model}`),
    ["coordinator=claude_ok/claude-opus-5-5", "worker.story=claude_ok/claude-sonnet-5-5", "worker.spike=claude_ok/claude-fable-5-2", "worker.L=codex_ok/gpt-5", "reviewer=cursor_unsupported/grok-4.6"],
  );
  assert.deepEqual(roleLines(all, "worker", "L", "story").map((l: { instanceId: string }) => l.instanceId), ["codex_ok"], "the tier wins over the kind");
  assert.deepEqual(roleLines(all, "worker", "M", "story").map((l: { role: string }) => l.role), ["worker.story"]);
  assert.equal(roleLines(all, "worker", null, null).length, 3);
  assert.deepEqual(roleLines(all, "reviewer", "M", null).map((l: { role: string }) => l.role), ["reviewer"]);
  assert.throws(() => roleLines(all, "worker", "M", "task"), /no entry for tier M or kind task/);
  assert.throws(() => roleLines(all, "judge", null, null), /no role judge/);
});

test("a provider with several lines reads the union of their windows", () => {
  const all = readModelLines(project("union", MODELS));
  const [claude, codex, cursor] = readProviders(fixtures, all, DEFAULT_LIMITS, NOW);
  assert.deepEqual([claude.instanceId, codex.instanceId, cursor.instanceId], ["claude_ok", "codex_ok", "cursor_unsupported"]);
  assert.deepEqual(claude.roles, ["coordinator", "worker.story", "worker.spike"]);
  assert.ok(claude.windows.some((w: { id: string }) => w.id === "seven_day_fable"), "the Fable spike line brings its window in");
});

test("braid limits: human output, narrowing, and exit 3 only on pause", () => {
  const root = project("cmd", MODELS);
  const ok = limitsCommand(root, [], { caches: fixtures, now: NOW });
  assert.equal(ok.code, 0);
  assert.match(ok.stdout, /^claude_ok {2}roles: coordinator, worker\.story, worker\.spike/m);
  assert.match(ok.stdout, /five_hour\)\s+22% of {2}90%/);
  assert.match(ok.stdout, /verdict: ok/);
  assert.match(ok.stdout, /verdict: unknown \(launch as usual\): T3 cannot measure this provider \(unsupported\)/);
  const one = limitsCommand(root, ["codex_ok"], { caches: fixtures, now: NOW });
  assert.doesNotMatch(one.stdout, /claude_ok/);
  const role = limitsCommand(root, ["--role", "worker", "--tier", "L"], { caches: fixtures, now: NOW });
  assert.match(role.stdout, /^codex_ok/);
  assert.doesNotMatch(role.stdout, /claude_ok/);
  assert.throws(() => limitsCommand(root, ["nobody"], { caches: fixtures, now: NOW }), /names no provider nobody/);
  assert.throws(() => limitsCommand(root, ["--tier", "M"], { caches: fixtures, now: NOW }), /usage: braid limits/);

  const paused = project("cmd-pause", MODELS.replace("claude_ok / claude-opus-5-5", "claude_session_over / claude-opus-5-5"));
  const p = limitsCommand(paused, ["claude_session_over"], { caches: fixtures, now: NOW });
  assert.equal(p.code, 3);
  assert.match(p.stdout, /verdict: pause: Session \(five_hour\) is at 91%, threshold 90%; resume at \d{4}-\d\d-\d\d \d\d:\d\d/);
  assert.match(p.stdout, /OVER/);
});

test("braid limits --json gives the same data with ISO times; the CLI reads $T3CODE_HOME/caches and exits 3 on pause", () => {
  const home = join(scratch, "t3home");
  mkdirSync(join(home, "caches"), { recursive: true });
  // The real clock is used here, so the cache is the fixture with times relative to now.
  const cache = JSON.parse(readFileSync(join(fixtures, "claude_session_over.json"), "utf8"));
  const reset = new Date(Date.now() + 3 * 3600_000);
  cache.usageLimits.checkedAt = new Date().toISOString();
  cache.usageLimits.windows[0].resetsAt = reset.toISOString();
  writeFileSync(join(home, "caches", "claude_session_over.json"), JSON.stringify(cache));
  const root = project("cli", "models:\n  coordinator: claude_session_over / claude-opus-5-5 / effort=medium");
  const r = spawnSync(process.execPath, [cli, "limits", "--json"], { encoding: "utf8", cwd: root, env: { ...process.env, T3CODE_HOME: home } });
  assert.equal(r.stderr, "");
  assert.equal(r.status, 3);
  const json = JSON.parse(r.stdout);
  assert.equal(json.limits.stale, 10);
  assert.equal(json.providers.length, 1);
  assert.equal(json.providers[0].verdict, "pause");
  assert.equal(json.providers[0].resumeAt, new Date(reset.getTime() + 5 * 60000).toISOString());
  assert.equal(json.providers[0].windows[0].resetsAt, reset.toISOString());
  const bad = spawnSync(process.execPath, [cli, "limits"], { encoding: "utf8", cwd: project("cli-bad", "models:\n  coordinator: a / b\nlimits:\n  weekly: x"), env: { ...process.env, T3CODE_HOME: home } });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /limits\.weekly/);
});
