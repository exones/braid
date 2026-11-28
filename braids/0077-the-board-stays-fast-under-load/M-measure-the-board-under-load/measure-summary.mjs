// Sums one run of the 0077/M measurement up as Markdown: `node measure-summary.mjs <run folder> [from ISO] [to ISO]`.
// The run folder holds sample.jsonl, process.jsonl and board.err (BRAID_BOARD_TIMINGS=1 lines, each with its time).
import { readFileSync } from "node:fs";
import { join } from "node:path";

const [dir, from = "", to = "9"] = process.argv.slice(2);
const read = (name) => readFileSync(join(dir, name), "utf8").split("\n").filter(Boolean);
const inside = (at) => at >= from && at <= to;
const sample = read("sample.jsonl").map((l) => JSON.parse(l)).filter((r) => inside(r.at));
const proc = read("process.jsonl").map((l) => JSON.parse(l)).filter((r) => inside(r.at));
const q = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
const s = (ms) => (ms / 1000).toFixed(1);

console.log(`window: ${sample[0]?.at} to ${sample.at(-1)?.at}\n`);
console.log("| request | n | median ms | p95 ms | p99 ms | max ms | over 1 s | failed |\n| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const kind of ["session", "page", "all", "projects"]) {
  const rows = sample.filter((r) => r.kind === kind);
  const ms = rows.map((r) => r.ms).sort((a, b) => a - b);
  const bad = rows.filter((r) => r.error !== undefined || r.status !== (kind === "session" ? 204 : 200));
  console.log(`| ${kind} | ${ms.length} | ${q(ms, 0.5)} | ${q(ms, 0.95)} | ${q(ms, 0.99)} | ${ms.at(-1)} | ${ms.filter((v) => v > 1000).length} | ${bad.length} |`);
}
for (const r of sample.filter((r) => (r.kind === "session" || r.kind === "page") && r.ms > 1000)) console.log(`over 1 s: ${r.kind} ${r.at} ${r.ms} ms`);

// A read's whole time: GitHub and T3 run side by side, the other sources one after the other.
const reads = {};
for (const line of read("board.err")) {
  const m = /^(\S+) board read \((.+?)\): (.*)$/.exec(line.trim());
  if (m === null) continue;
  const [, at, repo, marks] = m;
  const parts = Object.fromEntries(marks.split(", ").map((p) => /^(.*) (\d+) ms$/.exec(p).slice(1)).map(([k, v]) => [k, Number(v)]));
  const total = Math.max(parts.github ?? 0, parts.t3 ?? 0) + Object.entries(parts).filter(([k]) => k !== "github" && k !== "t3" && k !== "requests fetch").reduce((a, [, v]) => a + v, 0);
  (reads[repo] ??= []).push({ at, total, parts });
}
const names = ["github", "t3", "braids", "plans", "signals", "done dates", "inbox", "readiness", "board"];
console.log(`\nWhole reads (seconds):\n\n| project | reads | median | p95 | max | over 60 s |\n| --- | --- | --- | --- | --- | --- |`);
for (const [repo, all] of Object.entries(reads)) {
  const t = all.filter((r) => inside(r.at)).map((r) => r.total).sort((a, b) => a - b);
  console.log(`| ${repo} | ${t.length} | ${s(q(t, 0.5))} | ${s(q(t, 0.95))} | ${s(t.at(-1))} | ${t.filter((v) => v > 60_000).length} |`);
}
console.log(`\nPer source, seconds, median / max:\n\n| project | ${names.join(" | ")} |\n| --- |${names.map(() => " --- |").join("")}`);
for (const [repo, all] of Object.entries(reads)) {
  const win = all.filter((r) => inside(r.at));
  console.log(`| ${repo} | ${names.map((n) => { const v = win.map((r) => r.parts[n] ?? 0).sort((a, b) => a - b); return `${s(q(v, 0.5))} / ${s(v.at(-1))}`; }).join(" | ")} |`);
}
console.log(`\nFirst three reads of this board (seconds):\n\n| project | read | ended | total | ${names.join(" | ")} |\n| --- | --- | --- | --- |${names.map(() => " --- |").join("")}`);
for (const [repo, all] of Object.entries(reads)) {
  all.slice(0, 3).forEach((r, i) => console.log(`| ${repo} | ${i + 1} | ${r.at.slice(11, 19)} | ${s(r.total)} | ${names.map((n) => s(r.parts[n] ?? 0)).join(" | ")} |`));
}

const failures = new Map();
for (const r of sample.filter((r) => r.kind === "state")) {
  for (const p of r.projects) {
    if (p.failure !== null) failures.set(`${p.name}: ${p.failure}`, [...(failures.get(`${p.name}: ${p.failure}`) ?? []), r.at.slice(11, 19)]);
    for (const k of ["github", "t3"]) if (p[k] !== null && p[k] !== "ok") failures.set(`${p.name}: ${k} ${JSON.stringify(p[k])}`, [...(failures.get(`${p.name}: ${k} ${JSON.stringify(p[k])}`) ?? []), r.at.slice(11, 19)]);
  }
}
console.log(`\nFailures seen in /api/projects: ${failures.size === 0 ? "none" : ""}`);
for (const [k, v] of failures) console.log(`- ${k} (${v.length} samples, ${v[0]} to ${v.at(-1)})`);
console.log(`Problems: ${JSON.stringify([...new Set(sample.filter((r) => r.kind === "state").flatMap((r) => r.projects.flatMap((p) => (p.problems ?? []).map((k) => `${p.name}:${k}`))))])}`);

const loop = proc.filter((r) => r.kind === "loop");
const sum = (k) => loop.reduce((a, r) => a + r[k], 0);
const loops = loop.map((r) => r.maxMs).sort((a, b) => a - b);
console.log(`\nBoard event loop: delay max per 5 s: median ${q(loops, 0.5)} ms, p95 ${q(loops, 0.95)} ms, max ${loops.at(-1)} ms.`);
console.log(`Process starts: ${sum("starts")} (${(sum("starts") / ((loop.length * 5) / 60)).toFixed(0)} a minute), main thread blocked in them ${s(sum("startBlockedMs"))} s of ${loop.length * 5} s (${(sum("startBlockedMs") / (loop.length * 50)).toFixed(1)} %), worst one ${Math.max(...loop.map((r) => r.startWorstMs))} ms.`);
const slow = {};
for (const r of proc.filter((r) => r.kind === "slow-start")) {
  const k = r.command === "cmd.exe" ? `cmd.exe ${/t3 (\S+ \S+)/.exec(r.args.at(-1))?.[1] ?? ""}` : r.command;
  (slow[k] ??= []).push(r.ms);
}
console.log(`Starts over 200 ms: ${Object.entries(slow).map(([k, v]) => `${k}: ${v.length} (max ${Math.max(...v)} ms)`).join("; ") || "none"}`);
const writes = {};
for (const r of proc.filter((r) => r.kind.startsWith("re"))) writes[`${r.kind} ${r.path ?? `${r.command} ${r.args.join(" ")}`}`] = (writes[`${r.kind} ${r.path ?? `${r.command} ${r.args.join(" ")}`}`] ?? 0) + 1;
console.log(`\nWrites caught:\n${Object.entries(writes).map(([k, v]) => `- ${k} (${v})`).join("\n") || "none"}`);

const machine = sample.filter((r) => r.kind === "machine");
const cpu = machine.map((r) => r.cpuPercent).sort((a, b) => a - b);
console.log(`\nMachine: CPU median ${q(cpu, 0.5)} %, p95 ${q(cpu, 0.95)} %, max ${cpu.at(-1)} %; free memory min ${Math.min(...machine.map((r) => r.freeGb))} GB; sampler's own timer lag max ${Math.max(...machine.map((r) => r.samplerLagMs))} ms.`);
