// `braid limits [<instanceId>] [--role <role> [--tier <T>] [--kind <kind>]] [--json]`: may an agent be launched on a provider?
// Reads T3's provider caches only. Exit 0 for ok and unknown, PAUSE_EXIT when any listed provider says pause.
import { join } from "node:path";
import { LimitsError, readLimits, readModelLines, readProviders, roleLines, t3Home, type ModelLine, type ProviderReading, type WindowReading } from "../braids/limits.js";
import { parse, str } from "./edit.js";
import { UsageError } from "./braids.js";

export const PAUSE_EXIT = 3;

const USAGE = "usage: braid limits [<instanceId>] [--role <role> [--tier <S|M|L>] [--kind <kind>]] [--json]";

const pad = (n: number) => String(n).padStart(2, "0");

/** Local time as `2026-11-21 21:50`, for human output. */
export function localTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function windowLine(w: WindowReading): string {
  const used = `${w.usedPercent}%${w.reset ? " (reset)" : ""}`;
  return `  ${w.label} (${w.id})`.padEnd(34) + `${used.padStart(12)} of ${String(w.threshold).padStart(3)}%   ${w.resetsAt === null ? "no reset shown" : `resets ${localTime(w.resetsAt)}`}${w.over ? "   OVER" : ""}`;
}

function block(r: ProviderReading): string {
  const models = r.models.length === 0 ? "" : `  models: ${r.models.join(", ")}`;
  const lines = [`${r.instanceId}  roles: ${r.roles.join(", ")}${models}`];
  if (r.checkedAt !== null) {
    lines.push(`  checked ${localTime(r.checkedAt)}`);
  }
  lines.push(...r.windows.map(windowLine));
  if (r.verdict === "pause") {
    lines.push(`  verdict: pause: ${r.reason ?? ""}; resume at ${localTime(r.resumeAt ?? "")}`);
  } else if (r.verdict === "unknown") {
    lines.push(`  verdict: unknown (launch as usual): ${r.reason ?? ""}`);
  } else {
    lines.push("  verdict: ok");
  }
  return lines.join("\n");
}

export interface LimitsOptions {
  /** The caches folder; defaults to `$T3CODE_HOME/caches`, else `~/.t3/caches`. */
  readonly caches?: string;
  readonly now?: Date;
}

export function limitsCommand(root: string, args: readonly string[], options: LimitsOptions = {}): { stdout: string; stderr: string; code: number } {
  const { positionals, values } = parse("braid limits", args, {
    role: { type: "string" },
    tier: { type: "string" },
    kind: { type: "string" },
    json: { type: "boolean" },
  });
  const role = str(values, "role") ?? null;
  const tier = str(values, "tier") ?? null;
  const kind = str(values, "kind") ?? null;
  if (positionals.length > 1 || ((tier !== null || kind !== null) && role === null) || (positionals.length === 1 && role !== null)) {
    throw new UsageError(USAGE);
  }
  try {
    const limits = readLimits(root);
    let lines: ModelLine[] = readModelLines(root);
    const instance = positionals[0];
    if (role !== null) {
      lines = roleLines(lines, role, tier, kind);
    } else if (instance !== undefined) {
      lines = lines.filter((l) => l.instanceId === instance);
      if (lines.length === 0) {
        throw new LimitsError(`BRAID.md models names no provider ${instance}`);
      }
    }
    const readings = readProviders(options.caches ?? join(t3Home(), "caches"), lines, limits, options.now ?? new Date());
    const pausing = readings.some((r) => r.verdict === "pause");
    const stdout = values.json === true ? `${JSON.stringify({ limits, providers: readings }, null, 2)}\n` : `${readings.map(block).join("\n\n")}\n`;
    return { stdout, stderr: "", code: pausing ? PAUSE_EXIT : 0 };
  } catch (error) {
    if (error instanceof LimitsError) {
      throw new UsageError(error.message);
    }
    throw error;
  }
}
