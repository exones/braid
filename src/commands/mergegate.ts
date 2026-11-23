// The merge gate (decision D-merge-gate, 0073/B): one command named by BRAID.md `merge-gate:` that
// `braid accept --merge` runs before the merges it makes. Its exit code is the whole contract.
import { spawn, spawnSync } from "node:child_process";
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

/** Ends the gate's process and everything it started: a taskkill of the tree on Windows, a signal to the process group elsewhere. */
function killTree(pid: number): void {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/T", "/F", "/PID", String(pid)], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    // already gone
  }
}

interface GateResult {
  readonly status: number | null;
  readonly signal: string | null;
  readonly output: string;
  readonly timedOut: boolean;
  readonly error: Error | null;
}

function execGate(command: string, cwd: string, limitMs: number): Promise<GateResult> {
  return new Promise((resolve) => {
    let output = "";
    let done = false;
    const finish = (r: Omit<GateResult, "output">) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ ...r, output });
      }
    };
    // A POSIX child gets its own process group, so the timeout can end it and its descendants together.
    const child = spawn(command, { cwd, shell: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    const keep = (d: Buffer) => {
      output = (output + d.toString("utf8")).slice(-64 * 1024);
    };
    child.stdout.on("data", keep);
    child.stderr.on("data", keep);
    child.on("error", (error) => finish({ status: null, signal: null, timedOut: false, error }));
    child.on("close", (status, signal) => finish({ status, signal, timedOut: false, error: null }));
    const timer = setTimeout(() => {
      if (child.pid !== undefined) {
        killTree(child.pid);
      }
      finish({ status: null, signal: null, timedOut: true, error: null });
    }, limitMs);
  });
}

/** Runs the gate for a merge of PR `pr` at `sha` (the reviewed head), when it names this kind of merge; refuses (throws) unless it exits 0. */
export async function runMergeGate(root: string, scope: GateScope, pr: number, sha: string, limitMs: number = GATE_MS): Promise<void> {
  const gate = readMergeGate(root);
  if (gate === null || !gate.on.includes(scope)) {
    return;
  }
  const command = gate.command.replaceAll("<pr>", String(pr)).replaceAll("<sha>", sha);
  const r = await execGate(command, root, limitMs);
  if (!r.timedOut && r.error === null && r.status === 0) {
    return;
  }
  const tail = r.output.trimEnd().split(/\r?\n/).slice(-40).join("\n");
  const shown = `gate: ${command}${tail === "" ? "" : `\n${tail}`}`;
  if (r.timedOut) {
    throw new UsageError(`PR #${pr} not merged: the merge gate didn't finish in ${Math.round(limitMs / 60_000)} minutes (it was stopped); run braid accept again\n${shown}`);
  }
  const how = r.error !== null ? `could not run (${r.error.message})` : `exit code ${r.status ?? `signal ${r.signal ?? "?"}`}`;
  throw new UsageError(`PR #${pr} not merged: the merge gate failed (${how}); nothing merged\n${shown}`);
}
