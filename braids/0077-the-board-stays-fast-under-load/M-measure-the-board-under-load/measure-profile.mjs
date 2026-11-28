// Reads the board's CPU profile of a 0077/M run: `node measure-profile.mjs <file.cpuprofile>`.
// Prints the self time by function, and the long stretches in which the main thread never idled, with what ran in them.
import { readFileSync } from "node:fs";

const p = JSON.parse(readFileSync(process.argv[2], "utf8"));
const nodes = new Map(p.nodes.map((n) => [n.id, n]));
const parent = new Map();
for (const n of p.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
const label = (n) => `${n.callFrame.functionName || "(anonymous)"} ${n.callFrame.url.replace(/^.*\/(dist\/|M-measure[^/]*\/)/, "")}${n.callFrame.url === "" ? "" : `:${n.callFrame.lineNumber + 1}`}`;
// The nearest frame in braid's own code, for a sample taken inside Node.
const own = (id) => {
  for (let at = id; at !== undefined; at = parent.get(at)) if (nodes.get(at).callFrame.url.includes("/dist/")) return label(nodes.get(at));
  return "(no braid frame)";
};
const add = (map, k, v) => map.set(k, (map.get(k) ?? 0) + v);
const top = (map, n) => [...map].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `  ${(v / 1e6).toFixed(1)} s  ${k}`).join("\n");

const self = new Map();
const via = new Map();
const stretches = [];
let t = 0;
let run = null;
p.samples.forEach((id, i) => {
  const dt = p.timeDeltas[i + 1] ?? 10_000;
  t += dt;
  const name = nodes.get(id).callFrame.functionName;
  if (name === "(idle)") {
    if (run !== null && run.us > 1_000_000) stretches.push(run);
    run = null;
    return;
  }
  add(self, label(nodes.get(id)), dt);
  add(via, `${label(nodes.get(id))}  <-  ${own(id)}`, dt);
  run ??= { at: t, us: 0, what: new Map() };
  run.us += dt;
  add(run.what, `${label(nodes.get(id))}  <-  ${own(id)}`, dt);
});
if (run !== null && run.us > 1_000_000) stretches.push(run);

console.log(`profile: ${((p.endTime - p.startTime) / 1e6).toFixed(0)} s, started ${p.startTime}`);
console.log(`self time:\n${top(self, 14)}`);
console.log(`by braid caller:\n${top(via, 20)}`);
console.log(`busy stretches over 1 s: ${stretches.length}`);
for (const s of stretches.sort((a, b) => b.us - a.us).slice(0, 6)) console.log(`- at +${(s.at / 1e6).toFixed(0)} s for ${(s.us / 1e6).toFixed(1)} s\n${top(s.what, 5)}`);
