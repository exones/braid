// The board's view of the providers' usage limits (0064, docs/board.md "Provider limits"): per provider the reading of
// `braid limits` (src/braids/limits.ts, read from T3's caches), its chip state and the agents on it. Pure apart from `readLimitsView`,
// which reads BRAID.md and the cache files; the page uses the types. The board only shows this: acting on it is a later step.
import { join } from "node:path";
import { DEFAULT_LIMITS, LimitsError, NOT_MEASURED, readLimits, readModelLines, readProvider, t3Home, type Limits, type ModelLine, type ProviderReading, type WindowReading } from "../braids/limits.js";
import { reasonOf, type Pause, type Steering } from "../braids/pauses.js";
import type { T3 } from "./t3.js";
import type { ActingLine } from "./acting.js";

/** How close to its threshold (percentage points) a window is called near. */
export const NEAR_POINTS = 10;

/** ok: all under; near: within `NEAR_POINTS` of a threshold; over: past one; paused: a limit pause record names the provider; unknown: no usable reading; unmeasured: T3 can't read this provider (cursor). */
export type ChipState = "ok" | "near" | "over" | "paused" | "unknown" | "unmeasured";

/** An agent on a provider, as the limits panel lists it. */
export interface LimitAgent {
  /** The item (`0025/B`) or braid (`0025`) it works on. */
  readonly id: string;
  readonly role: "coordinator" | "worker" | "reviewer";
  /** `running` on it now, or `paused` by a pause record (the braid's agents stop with the record). */
  readonly state: "running" | "paused";
  /** The served project's name, set when several projects are combined; null for one. */
  readonly project: string | null;
}

export interface ProviderView {
  readonly instanceId: string;
  readonly state: ChipState;
  /** The `BRAID.md` models roles that use it (`coordinator`, `worker.story`); none for a provider only a running thread uses. */
  readonly roles: readonly string[];
  readonly models: readonly string[];
  /** Why the reading is unknown; null otherwise. */
  readonly reason: string | null;
  /** When T3 last checked this provider (ISO); null when never or unreadable. */
  readonly checkedAt: string | null;
  readonly windows: readonly WindowReading[];
  /** The session and weekly window the chip's meters show: the fullest of each kind. */
  readonly session: WindowReading | null;
  readonly weekly: WindowReading | null;
  /** While paused (or over): when the work resumes, as `braid limits` computes it; null otherwise. */
  readonly resumeAt: string | null;
  /** The window the pause waits for (`five_hour`), from the reading; null when under. */
  readonly pauseWindow: string | null;
  readonly agents: readonly LimitAgent[];
  /** The latest 🚦 steering thread of the board's pause on this provider and its outcome (0064); null when none. */
  readonly steering: Steering | null;
}

export interface LimitsView {
  /** The thresholds in force (BRAID.md `limits`). */
  readonly limits: Limits;
  /** When this was read (ISO). */
  readonly readAt: string;
  readonly providers: readonly ProviderView[];
  /** Why BRAID.md's `models` or `limits` could not be read (the providers are then only those running threads use); null when it read. */
  readonly note: string | null;
  /** Which board acts for the repository and for each provider account (0074/B); absent when this board pauses nothing. */
  readonly acting?: readonly ActingLine[];
}

const fullest = (windows: readonly WindowReading[], kind: WindowReading["kind"]): WindowReading | null =>
  windows.filter((w) => w.kind === kind).reduce<WindowReading | null>((a, w) => (a === null || w.usedPercent > a.usedPercent ? w : a), null);

/** The chip state of a reading, given whether a limit pause record names the provider. */
export function stateOf(reading: ProviderReading, paused: boolean): ChipState {
  // A pause record decides first: after a pause T3 may not refresh the cache for a while, and the braid is paused all the same.
  if (paused) {
    return "paused";
  }
  if (reading.verdict === "unknown") {
    return reading.reason?.startsWith(NOT_MEASURED) === true ? "unmeasured" : "unknown";
  }
  if (reading.verdict === "pause") {
    return "over";
  }
  return reading.windows.some((w) => w.usedPercent >= w.threshold - NEAR_POINTS) ? "near" : "ok";
}

/** Every agent the T3 snapshot places on a provider, running; the item keys of workers and reviewers, the braid number of a coordinator. */
function runningOn(t3: T3): Map<string, LimitAgent[]> {
  const by = new Map<string, LimitAgent[]>();
  const add = (provider: string | null | undefined, agent: LimitAgent): void => {
    if (provider !== null && provider !== undefined) {
      by.set(provider, [...(by.get(provider) ?? []), agent]);
    }
  };
  for (const [number, c] of t3.coordinators ?? []) {
    add(c.provider, { id: number, role: "coordinator", state: "running", project: null });
  }
  for (const [key, threads] of t3.threads) {
    for (const t of threads) {
      add(t.provider, { id: key, role: t.role, state: "running", project: null });
    }
  }
  return by;
}

/** The steering thread started last among these records; null when none has one. */
function latestSteering(records: readonly Pick<ProviderView, "steering">[] | readonly Pause[]): Steering | null {
  const all = (records as readonly { steering?: Steering | null }[]).flatMap((r) => (r.steering === undefined || r.steering === null ? [] : [r.steering]));
  return all.reduce<Steering | null>((a, s) => (a === null || s.started > a.started ? s : a), null);
}

/** The providers a running thread uses, in the order met. */
export function runningProviders(t3: T3): string[] {
  return [...runningOn(t3).keys()];
}

/**
 * The view from `readings` (one per provider), the T3 snapshot and the pause records. `paused` records of limits name a provider and
 * a braid: that provider reads `paused` and its paused braids are listed (their agents have stopped, so the running list doesn't repeat them).
 */
export function buildView(readings: readonly ProviderReading[], limits: Limits, t3: T3, pauses: ReadonlyMap<string, Pause>, now: Date, note: string | null = null): LimitsView {
  const running = runningOn(t3);
  const records = [...pauses.values()].filter((p) => reasonOf(p) === "limit" && p.provider !== null);
  const providers = readings.map((r): ProviderView => {
    const mine = records.filter((p) => p.provider === r.instanceId);
    const state = stateOf(r, mine.length > 0);
    const stopped: LimitAgent[] = mine.map((p) => ({ id: p.braid, role: "coordinator", state: "paused", project: null }));
    const resumes = mine.map((p) => p.resumeAt).filter((t): t is string => t !== null).sort();
    return {
      instanceId: r.instanceId,
      state,
      roles: r.roles,
      models: r.models,
      reason: r.verdict === "unknown" ? r.reason : null,
      checkedAt: r.checkedAt,
      windows: r.windows,
      session: fullest(r.windows, "session"),
      weekly: fullest(r.windows, "weekly"),
      resumeAt: state === "paused" ? (resumes[0] ?? r.resumeAt) : r.resumeAt,
      pauseWindow: mine.find((p) => p.window !== null)?.window ?? r.pauseWindow,
      agents: [...stopped, ...(running.get(r.instanceId) ?? [])],
      steering: latestSteering(mine),
    };
  });
  return { limits, readAt: now.toISOString(), providers, note };
}

/**
 * Reads the view of one project: the providers of BRAID.md `models`, then any provider a running thread uses, each from T3's cache
 * file (`caches`, `$T3CODE_HOME/caches` unless given). Nothing is called and nothing is written. An unreadable BRAID.md gives the
 * running providers only, with the reason in `note`.
 */
export function readLimitsView(root: string, t3: T3, pauses: ReadonlyMap<string, Pause>, now: Date = new Date(), caches: string = join(t3Home(), "caches")): LimitsView {
  let limits: Limits | null = null;
  let lines: ModelLine[] = [];
  let note: string | null = null;
  try {
    limits = readLimits(root);
    lines = readModelLines(root);
  } catch (error) {
    if (!(error instanceof LimitsError)) {
      throw error;
    }
    note = error.message;
  }
  const effective = limits ?? DEFAULT_LIMITS;
  const named = [...new Set(lines.map((l) => l.instanceId))];
  const extra = runningProviders(t3).filter((id) => !named.includes(id));
  const readings = [...named, ...extra].map((id) => readProvider(caches, id, lines.filter((l) => l.instanceId === id), effective, now));
  return buildView(readings, effective, t3, pauses, now, note);
}

/**
 * The providers of several projects as one list (the combined board): by instance, the latest reading wins, the roles and
 * models join, the agents of each project are tagged with its name. Null with no project read.
 */
export function mergeLimits(views: readonly { readonly project: string; readonly view: LimitsView | null }[]): LimitsView | null {
  const present = views.flatMap((v) => (v.view === null ? [] : [{ project: v.project, view: v.view }]));
  if (present.length === 0) {
    return null;
  }
  const order: string[] = [];
  const byId = new Map<string, ProviderView[]>();
  for (const { project, view } of present) {
    for (const p of view.providers) {
      if (!byId.has(p.instanceId)) {
        order.push(p.instanceId);
      }
      byId.set(p.instanceId, [...(byId.get(p.instanceId) ?? []), { ...p, agents: p.agents.map((a) => ({ ...a, project })) }]);
    }
  }
  const rank: Record<ChipState, number> = { unmeasured: 0, unknown: 1, ok: 2, near: 3, over: 4, paused: 5 };
  const providers = order.map((id): ProviderView => {
    const all = byId.get(id) ?? [];
    // The reading read last wins; the state shown is the most pressing one any project saw.
    const latest = all.reduce((a, b) => (Date.parse(b.checkedAt ?? "") > Date.parse(a.checkedAt ?? "") || a.checkedAt === null ? b : a));
    const state = all.reduce<ChipState>((s, p) => (rank[p.state] > rank[s] ? p.state : s), latest.state);
    // A project's pause record wins over another project's unknown or unmeasured reading; the resume time is the earliest of the records.
    const paused = all.filter((p) => p.state === "paused");
    const resumes = paused.map((p) => p.resumeAt).filter((r): r is string => r !== null).sort();
    return {
      ...latest,
      state: latest.state === "unknown" || latest.state === "unmeasured" ? (paused.length > 0 ? "paused" : latest.state) : state,
      ...(paused.length > 0 ? { resumeAt: resumes[0] ?? latest.resumeAt, pauseWindow: paused.find((p) => p.pauseWindow !== null)?.pauseWindow ?? latest.pauseWindow } : {}),
      roles: [...new Set(all.flatMap((p) => p.roles))],
      models: [...new Set(all.flatMap((p) => p.models))],
      agents: all.flatMap((p) => p.agents),
      steering: latestSteering(all),
    };
  });
  const first = present[0];
  const acting = [...new Map(present.flatMap((p) => p.view.acting ?? []).map((a) => [a.key, a])).values()];
  return {
    limits: first?.view.limits ?? DEFAULT_LIMITS,
    readAt: present.map((p) => p.view.readAt).sort().at(-1) ?? "",
    providers,
    note: present.flatMap((p) => (p.view.note === null ? [] : [p.view.note]))[0] ?? null,
    ...(present.some((p) => p.view.acting !== undefined) ? { acting } : {}),
  };
}
