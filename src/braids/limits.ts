// Provider usage limits: read T3's provider caches (`<T3CODE_HOME>/caches/<instanceId>.json`), apply the reading rules
// and say per provider whether an agent may be launched. Read-only: nothing is written and no service is called.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type Verdict = "ok" | "pause" | "unknown";

/** Thresholds (percent used) and times (minutes) from BRAID.md's `limits:` key. */
export interface Limits {
  readonly session: number;
  readonly weekly: number;
  readonly buffer: number;
  readonly stale: number;
}

export const DEFAULT_LIMITS: Limits = { session: 90, weekly: 95, buffer: 5, stale: 10 };

/**
 * Windows that count only for one model: window id -> a lowercase marker that the model slug must contain.
 * A new model-scoped window is one line here. Every window not listed applies to all models of the instance.
 */
export const SCOPED_WINDOWS: Readonly<Record<string, string>> = {
  seven_day_fable: "fable",
};

export class LimitsError extends Error {
  override name = "LimitsError";
}

/** One `models` line: `Claude_Everix / claude-opus-5-5 / effort=medium`, with the role it was found under (`worker.story`). */
export interface ModelLine {
  readonly role: string;
  readonly instanceId: string;
  readonly model: string | null;
}

function frontMatter(root: string): string {
  const file = join(root, "BRAID.md");
  if (!existsSync(file)) {
    return "";
  }
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8").replace(/^﻿/, ""))?.[1] ?? "";
}

/** The indented lines under a top-level `key:` of the front matter. */
function block(front: string, key: string): { inline: string; lines: string[] } | null {
  const lines = front.split(/\r?\n/);
  const start = lines.findIndex((l) => new RegExp(`^${key}:`).test(l));
  if (start === -1) {
    return null;
  }
  const inline = (/^[^:]*:[ \t]*(.*?)[ \t]*$/.exec(lines[start] ?? "")?.[1] ?? "").replace(/[ \t]+#.*$/, "");
  const rest: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) {
      break;
    }
    rest.push(line);
  }
  return { inline, lines: rest };
}

const unquote = (v: string) => v.replace(/^(["'])(.*)\1$/, "$2");

/** The `limits:` key of BRAID.md; absent or partial keys use the defaults, an invalid value is an error naming the key. */
export function readLimits(root: string): Limits {
  const found = block(frontMatter(root), "limits");
  const result = { ...DEFAULT_LIMITS };
  if (found === null) {
    return result;
  }
  if (found.inline !== "") {
    throw new LimitsError(`BRAID.md: limits must be a nested key with session, weekly, buffer and stale; got: ${found.inline}`);
  }
  const rules: Record<keyof Limits, { min: number; max: number; what: string }> = {
    session: { min: 1, max: 100, what: "a percentage from 1 to 100" },
    weekly: { min: 1, max: 100, what: "a percentage from 1 to 100" },
    buffer: { min: 0, max: Infinity, what: "minutes, 0 or more" },
    stale: { min: 1, max: Infinity, what: "minutes, 1 or more" },
  };
  const mutable: Record<string, number> = result;
  for (const line of found.lines) {
    if (line.trim() === "" || /^\s*#/.test(line)) {
      continue;
    }
    const m = /^[ \t]+([A-Za-z_][\w-]*):[ \t]*(.*?)[ \t]*$/.exec(line);
    const key = m?.[1] ?? "";
    if (!Object.hasOwn(rules, key)) {
      throw new LimitsError(`BRAID.md: limits.${key === "" ? line.trim() : key} is not a limits key (session, weekly, buffer, stale)`);
    }
    const raw = unquote((m?.[2] ?? "").replace(/[ \t]+#.*$/, ""));
    const rule = rules[key as keyof Limits];
    const value = raw === "" ? Number.NaN : Number(raw);
    if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
      throw new LimitsError(`BRAID.md: limits.${key} must be ${rule.what}; got: ${raw === "" ? "nothing" : raw}`);
    }
    mutable[key] = value;
  }
  return result;
}

function parseModelLine(role: string, value: string): ModelLine | null {
  const parts = unquote(value.trim()).split("/").map((p) => p.trim());
  const instanceId = parts[0] ?? "";
  if (!/^[A-Za-z0-9_.-]+$/.test(instanceId)) {
    return null;
  }
  const model = (parts[1] ?? "").replace(/\s.*$/, "");
  return { role, instanceId, model: model === "" ? null : model };
}

/** Every line under BRAID.md's `models:`: roles with one line (`coordinator`) and roles keyed by tier or kind (`worker.story`). */
export function readModelLines(root: string): ModelLine[] {
  const found = block(frontMatter(root), "models");
  if (found === null) {
    throw new LimitsError("BRAID.md has no models key; limits are read per provider named there");
  }
  const lines: ModelLine[] = [];
  let parent: string | null = null;
  for (const line of found.lines) {
    const m = /^([ \t]+)([A-Za-z_][\w-]*):[ \t]*(.*?)[ \t]*$/.exec(line);
    if (m === null) {
      continue;
    }
    const nested = (m[1] ?? "").length > 2 && parent !== null;
    const key = m[2] ?? "";
    const value = m[3] ?? "";
    if (!nested) {
      parent = value === "" ? key : null;
    }
    if (value === "") {
      continue;
    }
    const parsed = parseModelLine(nested ? `${parent}.${key}` : key, value);
    if (parsed !== null) {
      lines.push(parsed);
    }
  }
  return lines;
}

/**
 * The model lines of one role, resolved as the braid skill does: `models.<role>.<tier>`, then `.<kind>`, then `models.<role>`.
 * Without a tier or kind, every line of the role.
 */
export function roleLines(lines: readonly ModelLine[], role: string, tier: string | null, kind: string | null): ModelLine[] {
  const own = lines.filter((l) => l.role === role || l.role.startsWith(`${role}.`));
  if (own.length === 0) {
    throw new LimitsError(`BRAID.md models has no role ${role} (roles here: ${[...new Set(lines.map((l) => l.role.split(".")[0]))].join(", ")})`);
  }
  if (tier === null && kind === null) {
    return own;
  }
  for (const key of [tier, kind]) {
    const hit = key === null ? undefined : own.find((l) => l.role === `${role}.${key}`);
    if (hit !== undefined) {
      return [hit];
    }
  }
  const plain = own.find((l) => l.role === role);
  if (plain !== undefined) {
    return [plain];
  }
  throw new LimitsError(`BRAID.md models.${role} has no entry for ${[tier === null ? null : `tier ${tier}`, kind === null ? null : `kind ${kind}`].filter((x) => x !== null).join(" or ")}`);
}

interface RawWindow {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly usedPercent: number;
  readonly resetsAt: string;
  readonly windowDurationMins?: number;
}

export interface WindowReading {
  readonly id: string;
  readonly kind: "session" | "weekly";
  readonly label: string;
  /** Usage after the reading rules: 0 once `resetsAt` is past. */
  readonly usedPercent: number;
  readonly threshold: number;
  readonly resetsAt: string;
  /** True when `resetsAt` is past, so the cached usage was replaced by 0. */
  readonly reset: boolean;
  readonly over: boolean;
}

export interface ProviderReading {
  readonly instanceId: string;
  /** The roles that use this provider, such as `coordinator` and `worker.story`. */
  readonly roles: readonly string[];
  readonly models: readonly string[];
  readonly verdict: Verdict;
  /** Why the verdict is `unknown`, or what `pause` waits for. `null` for `ok`. */
  readonly reason: string | null;
  readonly checkedAt: string | null;
  readonly windows: readonly WindowReading[];
  /** For `pause`: the window with the latest reset among those over their threshold. */
  readonly pauseWindow: string | null;
  /** For `pause`: that window's `resetsAt` plus the buffer, as ISO UTC. */
  readonly resumeAt: string | null;
}

export function t3Home(env: NodeJS.ProcessEnv = process.env): string {
  const home = env.T3CODE_HOME;
  return home !== undefined && home !== "" ? home : join(homedir(), ".t3");
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseWindows(raw: unknown): RawWindow[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const out: RawWindow[] = [];
  for (const w of raw) {
    if (!isRecord(w) || typeof w.id !== "string" || typeof w.usedPercent !== "number" || typeof w.resetsAt !== "string" || Number.isNaN(Date.parse(w.resetsAt))) {
      return null;
    }
    out.push({ id: w.id, kind: w.kind === "weekly" ? "weekly" : "session", label: typeof w.label === "string" ? w.label : w.id, usedPercent: w.usedPercent, resetsAt: w.resetsAt });
  }
  return out;
}

function unknownReading(instanceId: string, roles: string[], models: string[], reason: string, checkedAt: string | null = null): ProviderReading {
  return { instanceId, roles, models, verdict: "unknown", reason, checkedAt, windows: [], pauseWindow: null, resumeAt: null };
}

/** Whether a window counts for a model: unscoped windows always, a scoped one only when its marker is in a model slug. */
function appliesTo(windowId: string, models: readonly string[]): boolean {
  const marker = SCOPED_WINDOWS[windowId];
  return marker === undefined || models.some((m) => m.toLowerCase().includes(marker));
}

/** One provider's reading from its cache file (`caches` folder), for the model lines that use it. `now` is passed in so tests fix it. */
export function readProvider(caches: string, instanceId: string, lines: readonly ModelLine[], limits: Limits, now: Date): ProviderReading {
  const roles = [...new Set(lines.map((l) => l.role))];
  const models = [...new Set(lines.flatMap((l) => (l.model === null ? [] : [l.model])))];
  const file = join(caches, `${instanceId}.json`);
  if (!existsSync(file)) {
    return unknownReading(instanceId, roles, models, `no cache file ${file}; T3 has not checked this provider yet`);
  }
  let usage: unknown;
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
    usage = isRecord(parsed) ? parsed.usageLimits : undefined;
  } catch {
    return unknownReading(instanceId, roles, models, `cache file ${file} is not readable JSON`);
  }
  if (!isRecord(usage)) {
    return unknownReading(instanceId, roles, models, "the cache has no usageLimits (the provider is disabled or T3 has not checked it yet)");
  }
  const checkedAt = typeof usage.checkedAt === "string" && !Number.isNaN(Date.parse(usage.checkedAt)) ? usage.checkedAt : null;
  if (isRecord(usage.unavailable)) {
    const why = typeof usage.unavailable.reason === "string" ? usage.unavailable.reason : "unavailable";
    return unknownReading(instanceId, roles, models, `T3 cannot measure this provider (${why})`, checkedAt);
  }
  if (checkedAt === null) {
    return unknownReading(instanceId, roles, models, "usageLimits has no valid checkedAt");
  }
  const ageMinutes = (now.getTime() - Date.parse(checkedAt)) / 60000;
  if (ageMinutes > limits.stale) {
    return unknownReading(instanceId, roles, models, `the cache was checked ${Math.round(ageMinutes)} min ago (stale after ${limits.stale} min)`, checkedAt);
  }
  const raw = parseWindows(usage.windows);
  if (raw === null) {
    return unknownReading(instanceId, roles, models, "usageLimits.windows is not a list of windows", checkedAt);
  }
  const windows: WindowReading[] = raw
    .filter((w) => appliesTo(w.id, models))
    .map((w) => {
      const reset = Date.parse(w.resetsAt) <= now.getTime();
      const usedPercent = reset ? 0 : w.usedPercent;
      const kind = w.kind === "weekly" ? "weekly" : "session";
      const threshold = limits[kind];
      return { id: w.id, kind, label: w.label, usedPercent, threshold, resetsAt: new Date(w.resetsAt).toISOString(), reset, over: usedPercent >= threshold };
    });
  const over = windows.filter((w) => w.over);
  if (over.length === 0) {
    return { instanceId, roles, models, verdict: "ok", reason: null, checkedAt, windows, pauseWindow: null, resumeAt: null };
  }
  const latest = over.reduce((a, b) => (Date.parse(b.resetsAt) > Date.parse(a.resetsAt) ? b : a));
  const resumeAt = new Date(Date.parse(latest.resetsAt) + limits.buffer * 60000).toISOString();
  return {
    instanceId,
    roles,
    models,
    verdict: "pause",
    reason: `${latest.label} (${latest.id}) is at ${latest.usedPercent}%, threshold ${latest.threshold}%`,
    checkedAt,
    windows,
    pauseWindow: latest.id,
    resumeAt,
  };
}

/** Group model lines by provider, in the order BRAID.md names them, and read each. */
export function readProviders(caches: string, lines: readonly ModelLine[], limits: Limits, now: Date): ProviderReading[] {
  const ids = [...new Set(lines.map((l) => l.instanceId))];
  return ids.map((id) =>
    readProvider(
      caches,
      id,
      lines.filter((l) => l.instanceId === id),
      limits,
      now,
    ),
  );
}
