// The merge gate (decision D-merge-gate, 0073/B): one command named by BRAID.md `merge-gate:` that
// `braid accept --merge` runs before the merges it makes. Its exit code is the whole contract.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { UsageError } from "./braids.js";

export type GateScope = "strand" | "main";

export interface MergeGate {
  readonly command: string;
  readonly on: readonly GateScope[];
}

/** How long the gate may run: under an agent's 10-minute command limit, so `braid accept --merge` stays one foreground call. */
export const GATE_MS = 9 * 60_000;

/** `merge-gate` and `merge-gate-on` from BRAID.md's front matter; null when there is no gate. */
export function readMergeGate(root: string): MergeGate | null {
  const file = join(root, "BRAID.md");
  if (!existsSync(file)) {
    return null;
  }
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"))?.[1] ?? "";
  const raw = /^merge-gate:[ \t]*(.*?)[ \t]*$/m.exec(front)?.[1] ?? "";
  const command = raw.replace(/^(["'])(.*)\1$/, "$2");
  if (command === "") {
    return null;
  }
  const list = /^merge-gate-on:[ \t]*\[(.*)\][ \t]*$/m.exec(front)?.[1];
  if (list === undefined) {
    return { command, on: ["strand", "main"] };
  }
  const on = list.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter((s) => s !== "");
  const bad = on.filter((s) => s !== "strand" && s !== "main");
  if (bad.length > 0 || on.length === 0) {
    throw new UsageError(`BRAID.md merge-gate-on must list strand and/or main (got: ${list.trim() === "" ? "nothing" : list.trim()})`);
  }
  return { command, on: on as GateScope[] };
}

/** Runs the gate for a merge of PR `pr` at `sha`, when it names this kind of merge; refuses (throws) unless it exits 0. */
export function runMergeGate(root: string, scope: GateScope, pr: number, sha: string, limitMs: number = GATE_MS): void {
  const gate = readMergeGate(root);
  if (gate === null || !gate.on.includes(scope)) {
    return;
  }
  const command = gate.command.replaceAll("<pr>", String(pr)).replaceAll("<sha>", sha);
  const r = spawnSync(command, { cwd: root, shell: true, encoding: "utf8", timeout: limitMs, maxBuffer: 64 * 1024 * 1024 });
  const timedOut = (r.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT";
  if (!timedOut && r.error === undefined && r.status === 0) {
    return;
  }
  const tail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trimEnd().split(/\r?\n/).slice(-40).join("\n");
  if (timedOut) {
    throw new UsageError(`PR #${pr} not merged: the merge gate didn't finish in ${Math.round(limitMs / 60_000)} minutes; run braid accept again\ngate: ${command}${tail === "" ? "" : `\n${tail}`}`);
  }
  const how = r.error !== undefined ? `could not run (${r.error.message})` : `exit code ${r.status ?? `signal ${r.signal ?? "?"}`}`;
  throw new UsageError(`PR #${pr} not merged: the merge gate failed (${how}); nothing merged\ngate: ${command}${tail === "" ? "" : `\n${tail}`}`);
}
