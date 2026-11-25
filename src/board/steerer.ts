// The board's pause for provider limits (0064, 0074/C, docs/board.md "Provider limits"): the one exception to the board's click-only
// rule. Every served project's feed hands its good snapshot to one board-wide steerer, which runs a tick at a time:
//   1. count: for 10 minutes after a pause's sends, read each target's thread for its `Paused:` line, then settle the record;
//   2. resume (0074/D, src/board/resume.ts): a record whose resume time has passed is re-checked; one whose fresh reading is under
//      the threshold (or no longer has its window) resumes early; one asked for (Resume now) or pending (a failed send) is tried
//      again. A braid without a PM: each thread its resume text by code; a PM-run braid: one message to the PM;
//   3. pause: per provider over its threshold, claim a record per braid with a working agent under the lock, then send each target
//      its text by code (`t3 thread send`, ids from T3's own output) and each PM one summary;
//   4. wake: each project's open requests whose "done when" holds are closed and their askers woken (src/board/wake.ts).
// No LLM sits in the path and no thread is started (0074/C). With several boards on one machine, a tick acts only for the keys whose
// lease this board holds (src/board/acting.ts, 0074/B): steps 1-3 per provider account, step 4 and the pending limit pushes per
// repository. A board that holds none still reads and shows. Only `.braid/pauses.json`, `notified.json` and (the wake)
// `braid-requests` are written, and only `t3 thread send` and `t3 thread show` are called.
import { join } from "node:path";
import { providerKey, repoLease, type ActingBoard } from "./acting.js";
import { LimitsError, readLimits, readModelLines, readProvider, t3Home, type ModelLine, type ProviderReading } from "../braids/limits.js";
import { claimPauses, loadPauses, patchPauses, reasonOf, type NoAnswer, type Pause, type Replies } from "../braids/pauses.js";
import type { Good } from "./feed.js";
import { clock } from "./pause.js";
import { resumePauses } from "./resume.js";
import { coordinatorPause, escalation, limitPush, overWindow, pausedLine, pmsOf, pmSummary, targetsOf, weeklyPause, workerPause, type LimitEvent, type LimitPush, type PmThread } from "./steer.js";
import { working, type T3Runner } from "./t3.js";
import type { Waker } from "./wake.js";

/** How long the board counts the replies after its sends; a target without its `Paused:` line by then is no answer. */
export const COUNT_MS = 10 * 60_000;
/** A resume this late is reported as missed ("was due …"): no board ran at the time. */
export const MISSED_MS = 5 * 60_000;
/** A pause text is sent at most this many times to one thread in one refresh; failing them all is a failed send (0074/C). */
export const PAUSE_TRIES = 2;

/** One served project as the steerer sees it. */
export interface SteerProject {
  readonly name: string;
  /** The repository folder (`.braid/` and BRAID.md are read from its main checkout). */
  readonly root: string;
  /** The repository name for titles. */
  readonly repo: string;
  /** T3's project folder (the main checkout). */
  readonly folder: () => string;
}

export interface SteererOptions {
  readonly t3: T3Runner;
  readonly now?: () => Date;
  /** T3's caches folder; `$T3CODE_HOME/caches` unless given. */
  readonly caches?: string;
  /** Sends a limit push once per key, through a project's `notified.json`; absent: none. */
  readonly push?: (root: string, push: LimitPush) => void;
  /** Sends again the limit pushes of a project (its `notified.json`'s pending) whose send failed; called at the start of each tick for each project this board acts for. */
  readonly retry?: (root: string) => void;
  /** Where the steerer reports what it couldn't do: the board's standard error. */
  readonly warn?: (line: string) => void;
  /** The wake step, run for each project after the pause steps; absent: nothing is woken. */
  readonly wake?: Waker;
  /** The leases of this board (0074/B); absent: it acts for every key (a single board, tests). */
  readonly acting?: ActingBoard;
}

export interface Steerer {
  /** Hands a project's good snapshot over and queues a tick; returns at once. */
  observe(project: SteerProject, good: Good): void;
  /** Queues a tick on the snapshots it has (the Resume now button: a resume asked for goes out now, not at the next refresh). */
  poke(): void;
  /** Resolves when no tick runs or is queued. */
  idle(): Promise<void>;
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const jsonOf = (text: string): Json | null => {
  try {
    return obj(JSON.parse(text));
  } catch {
    return null;
  }
};
const firstLine = (r: { stderr: string; error?: Error | undefined }): string => (r.stderr.trim().split("\n")[0] ?? "") || r.error?.message || "t3 failed";

interface Seen {
  readonly project: SteerProject;
  readonly good: Good;
}

/** A record and the project whose `pauses.json` holds it. */
interface Held {
  readonly at: Seen;
  readonly pause: Pause;
}

/**
 * Why a board pause resumes before its resume time (0074/D), from a reading checked after the pause began: `gone` when its window is no
 * longer in the reading (gone from the cache, or no longer applying to the provider's models), `early` when it is under its threshold
 * and nothing else is over. Null otherwise (no fresh reading, still over, or the provider over on another window).
 */
export function earlyWhy(p: Pause, reading: ProviderReading | null): "early" | "gone" | null {
  if (reading === null || reading.checkedAt === null || reading.verdict === "unknown" || Date.parse(reading.checkedAt) <= Date.parse(p.at) || p.window === null) {
    return null;
  }
  const w = reading.windows.find((x) => x.id === p.window);
  if (w === undefined) {
    return reading.verdict === "pause" ? null : "gone";
  }
  return reading.verdict === "ok" && !w.over ? "early" : null;
}

export function steerer(opts: SteererOptions): Steerer {
  const now = opts.now ?? (() => new Date());
  const caches = opts.caches ?? join(t3Home(), "caches");
  const warned = new Set<string>();
  const warn = (line: string, once = line): void => {
    if (!warned.has(once)) {
      warned.add(once);
      (opts.warn ?? ((l: string) => void process.stderr.write(`${l}\n`)))(`braid board: ${line}`);
    }
  };
  const push = (root: string, event: LimitEvent, records: readonly Pause[], at: Date, extra: Parameters<typeof limitPush>[3] = {}): void => {
    const p = limitPush(event, records, at, extra);
    if (p !== null && opts.push !== undefined) {
      try {
        opts.push(root, p);
      } catch {
        // a push never stops the pause
      }
    }
  };
  const latest = new Map<string, Seen>();
  let running: Promise<void> = Promise.resolve();
  let pending = false;

  const linesOf = (root: string): { lines: ModelLine[]; limits: ReturnType<typeof readLimits> } | null => {
    try {
      return { lines: readModelLines(root), limits: readLimits(root) };
    } catch (error) {
      if (error instanceof LimitsError) {
        return null;
      }
      throw error;
    }
  };
  const readingOf = (root: string, provider: string, at: Date): ProviderReading | null => {
    const read = linesOf(root);
    return read === null ? null : readProvider(caches, provider, read.lines.filter((l) => l.instanceId === provider), read.limits, at);
  };
  const boardRecords = (seen: readonly Seen[]): Held[] => seen.flatMap((s) => loadPauses(s.project.root).pauses.filter((p) => p.by === "board").map((pause) => ({ at: s, pause })));
  /** Applies `change` to these records, each in its own project's file. */
  const patch = (held: readonly Held[], change: (p: Pause) => Pause): Pause[] => {
    const byRoot = new Map<string, { root: string; braids: string[] }>();
    for (const h of held) {
      const e = byRoot.get(h.at.project.root) ?? { root: h.at.project.root, braids: [] };
      e.braids.push(h.pause.braid);
      byRoot.set(h.at.project.root, e);
    }
    return [...byRoot.values()].flatMap((e) => patchPauses(e.root, e.braids, change));
  };

  /** Sends `text` to a thread by code (on standard input: no shell quoting), up to PAUSE_TRIES times; whether it went through. */
  const send = async (root: string, thread: string, text: string): Promise<boolean> => {
    for (let i = 0; i < PAUSE_TRIES; i++) {
      try {
        const r = await opts.t3(root, ["thread", "send", thread, "-"], text);
        if (r.error === undefined && r.status === 0) {
          return true;
        }
        warn(`a pause send to ${thread.slice(0, 8)} failed (${firstLine(r)})`, `pause send ${thread} ${i}`);
      } catch (error) {
        warn(`a pause send to ${thread.slice(0, 8)} failed (${error instanceof Error ? error.message : String(error)})`, `pause send ${thread} ${i}`);
      }
    }
    return false;
  };

  /** One target's thread as the count reads it: answered (stopped, with its `Paused:` line after the board's text), still working, stopped without the line, or unread. */
  const replyOf = async (root: string, thread: string): Promise<NoAnswer["why"] | "answered"> => {
    const shown = await opts.t3(root, ["thread", "show", thread, "--messages", "10", "--json"]);
    const out = shown.error === undefined && shown.status === 0 ? jsonOf(shown.stdout) : null;
    if (out === null) {
      return "unread";
    }
    const t = obj(out["thread"]) ?? {};
    if (working(t)) {
      return "working";
    }
    const messages = (Array.isArray(out["messages"]) ? (out["messages"] as unknown[]) : []).map(obj).filter((m): m is Json => m !== null);
    // Only what came after the board's text counts: an older `Paused:` line (an earlier pause) is no answer to this one.
    const sentAt = messages.findLastIndex((m) => m["role"] === "user" && /^\s*Pause for /.test(str(m["text"]) ?? ""));
    const last = messages.slice(sentAt + 1).filter((m) => m["role"] !== "user").at(-1);
    return last !== undefined && pausedLine(str(last["text"]) ?? "") ? "answered" : "no line";
  };

  /** Settles these records (one pause of one provider): the push, and for a partial or failed one the PM's (else the coordinator's) message. */
  const settle = async (held: readonly Held[], at: Date, why: Map<string, NoAnswer["why"]>, reason: string | null): Promise<void> => {
    const moved = new Set<string>();
    const done = held.flatMap((h) =>
      patch([h], (p) => {
        const r = p.replies;
        if (r === undefined || r.outcome !== "pausing") {
          return p; // settled already (another tick): nothing twice
        }
        moved.add(p.braid);
        const counted = (p.targets ?? []).filter((x) => x.kind !== "pm");
        const noAnswer = counted.filter((x) => !r.got.includes(x.thread)).map((x): NoAnswer => ({ item: x.item, thread: x.thread, link: x.link ?? null, why: r.failed.includes(x.thread) ? "send failed" : (why.get(x.thread) ?? "working") }));
        const outcome: Replies["outcome"] = noAnswer.length === 0 ? "paused" : r.got.length === 0 && r.failed.length === counted.length ? "failed" : "partial";
        return { ...p, replies: { ...r, outcome, answered: counted.length - noAnswer.length, total: counted.length, noAnswer, reason: outcome === "failed" ? (reason ?? "every send failed") : null } };
      }),
    );
    const settled = done.filter((p) => moved.has(p.braid));
    if (settled.length === 0) {
      return;
    }
    const host = held[0]?.at.project.root ?? "";
    const bad = settled.filter((p) => p.replies?.outcome !== "paused");
    push(host, bad.length === 0 ? "paused" : "failed", bad.length === 0 ? settled : bad, at);
    // The safety net: one message per PM thread (a braid without a PM: its coordinator) with the braids that didn't pause fully.
    const to = new Map<string, { root: string; braids: string[]; records: Pause[] }>();
    for (const p of bad) {
      const h = held.find((x) => x.pause.braid === p.braid);
      const pms = (p.targets ?? []).filter((x) => x.kind === "pm");
      const coordinator = (p.targets ?? []).find((x) => x.kind === "coordinator");
      for (const x of pms.length > 0 ? pms : coordinator === undefined ? [] : [coordinator]) {
        const e = to.get(x.thread) ?? { root: h?.at.project.root ?? host, braids: [], records: [] };
        e.braids.push(p.braid);
        e.records.push(p);
        to.set(x.thread, e);
      }
    }
    for (const [thread, e] of to) {
      const all = e.records.flatMap((p) => (p.replies === undefined ? [] : [p.replies]));
      const merged: Replies | undefined = all.reduce<Replies | undefined>((a, r) => (a === undefined ? r : { ...a, outcome: a.outcome === "failed" && r.outcome === "failed" ? "failed" : "partial", answered: a.answered + r.answered, total: a.total + r.total, noAnswer: [...a.noAnswer, ...r.noAnswer] }), undefined);
      if (merged !== undefined && !(await send(e.root, thread, escalation(e.braids, e.records[0]?.provider ?? "", merged)))) {
        warn(`the pause's escalation to ${thread.slice(0, 8)} could not be sent`, `escalate ${thread} ${at.toISOString()}`);
      }
    }
  };

  /** 1. Pauses still counting: read each target that hasn't answered; settle when all answered or failed, or at 10 minutes. */
  const count = async (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean): Promise<void> => {
    const groups = new Map<string, Held[]>();
    for (const h of boardRecords(seen).filter((x) => acts(x.pause.provider ?? null) && x.pause.replies?.outcome === "pausing")) {
      const key = `${h.pause.provider ?? ""} ${h.pause.replies?.sent ?? ""}`;
      groups.set(key, [...(groups.get(key) ?? []), h]);
    }
    for (const held of groups.values()) {
      const sent = held[0]?.pause.replies?.sent ?? at.toISOString();
      const over = at.getTime() - Date.parse(sent) >= COUNT_MS;
      const why = new Map<string, NoAnswer["why"]>();
      let open = 0;
      for (const h of held) {
        const r = h.pause.replies as Replies;
        const got: string[] = [];
        for (const x of (h.pause.targets ?? []).filter((y) => y.kind !== "pm" && !r.got.includes(y.thread) && !r.failed.includes(y.thread))) {
          const reply = await replyOf(h.at.project.root, x.thread);
          if (reply === "answered") {
            got.push(x.thread);
          } else {
            why.set(x.thread, reply);
            open++;
          }
        }
        if (got.length > 0) {
          patch([h], (p) => (p.replies === undefined || p.replies.outcome !== "pausing" ? p : { ...p, replies: { ...p.replies, got: [...new Set([...p.replies.got, ...got])] } }));
        }
      }
      if (open === 0 || over) {
        const now = held.map((h) => ({ at: h.at, pause: loadPauses(h.at.project.root).pauses.find((p) => p.braid === h.pause.braid && p.by === "board") ?? h.pause }));
        await settle(now, at, why, null);
      }
    }
  };

  /**
   * 2. The resumes (0074/D), all through `resumePauses`: a record whose resume time has passed is re-checked (still over: kept with the
   * new time); one whose fresh reading (checked after the pause began) shows its window under the threshold, or no longer has it,
   * resumes early; one with a resume asked for (Resume now) or pending (a send failed) is tried again. Holds are never resumed.
   */
  const resume = async (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean): Promise<void> => {
    const readings = new Map<string, ProviderReading | null>();
    const readingAt = (root: string, provider: string): ProviderReading | null => {
      const key = `${root}
${provider}`;
      if (!readings.has(key)) {
        readings.set(key, readingOf(root, provider, at));
      }
      return readings.get(key) ?? null;
    };
    const all = seen.flatMap((s) => loadPauses(s.project.root).pauses.filter((p) => reasonOf(p) === "limit" && p.provider !== null && acts(p.provider)).map((pause) => ({ at: s, pause })));
    const go: { held: Held; why: string }[] = [];
    const over: Held[] = [];
    for (const h of all) {
      const p = h.pause;
      if (p.resuming !== undefined) {
        // Asked for and not tried, or a send pending: try (again) now. A PM that got its ask resumes it; nothing more here.
        if (p.resuming.lastTry === null || p.resuming.failedSince !== null) {
          go.push({ held: h, why: p.resuming.why });
        }
        continue;
      }
      if (p.by !== "board" || p.replies?.outcome === "pausing") {
        continue;
      }
      const reading = readingAt(h.at.project.root, p.provider ?? "");
      if (p.resumeAt !== null && Date.parse(p.resumeAt) <= at.getTime()) {
        if (reading?.verdict === "pause") {
          over.push(h);
        } else {
          go.push({ held: h, why: "timer" });
        }
        continue;
      }
      const early = earlyWhy(p, reading);
      if (early !== null) {
        go.push({ held: h, why: early });
      }
    }
    // Still over at the resume time: each project keeps its records with the new time (0074/B: each against its own BRAID.md).
    const byKey = new Map<string, Held[]>();
    for (const h of over) {
      const key = `${h.at.project.root}
${h.pause.provider ?? ""}`;
      byKey.set(key, [...(byKey.get(key) ?? []), h]);
    }
    for (const hs of byKey.values()) {
      const first = hs[0] as Held;
      const reading = readingAt(first.at.project.root, first.pause.provider ?? "") as ProviderReading;
      const w = overWindow(reading);
      const kept = patch(hs, (p) => ({ ...p, window: w?.id ?? p.window, label: w?.label ?? p.label, usedPercent: w?.usedPercent ?? p.usedPercent, resetsAt: w?.resetsAt ?? p.resetsAt, resumeAt: reading.resumeAt ?? p.resumeAt }));
      if (kept.length > 0) {
        push(first.at.project.root, "extended", kept, at);
      }
    }
    if (go.length === 0) {
      return;
    }
    const archived = (thread: string): boolean => seen.some((s) => s.good.t3.states?.get(thread) === "archived");
    const usageOf = (p: Pause, root: string): string | null => {
      const w = readingAt(root, p.provider ?? "")?.windows.find((x) => x.id === p.window);
      return w === undefined ? null : `${w.label} ${w.usedPercent}%`;
    };
    // One call per reason, so the ask names it; within it one message per thread.
    const whys = [...new Set(go.map((g) => g.why))];
    for (const why of whys) {
      const batch = go.filter((g) => g.why === why);
      const out = await resumePauses(
        batch.map((g) => ({ root: g.held.at.project.root, pause: g.held.pause })),
        { t3: opts.t3, now: at, why, archived, usage: (p) => usageOf(p, batch.find((g) => g.held.pause.braid === p.braid)?.held.at.project.root ?? ""), warn: (l) => warn(l, l) },
      );
      // The resumed push, per project and provider: late ones say when they were due.
      const groups = new Map<string, { root: string; records: Pause[] }>();
      for (const c of out.cleared) {
        const key = `${c.root}
${c.pause.provider ?? ""}`;
        const e = groups.get(key) ?? { root: c.root, records: [] };
        e.records.push(c.pause);
        groups.set(key, e);
      }
      for (const e of groups.values()) {
        const first = e.records[0] as Pause;
        const late = first.resumeAt === null ? 0 : at.getTime() - Date.parse(first.resumeAt);
        const w = readingAt(e.root, first.provider ?? "")?.windows.find((x) => x.id === first.window);
        push(e.root, "resumed", e.records, at, { due: why === "timer" && late >= MISSED_MS && first.resumeAt !== null ? clock(first.resumeAt, at) : null, usage: w === undefined ? null : `${w.label} at ${w.usedPercent}%` });
      }
    }
  };

  /** 3. Providers over their threshold: a record per braid with a working agent on it and no record yet, then the texts, sent by code. */
  const pause = async (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean): Promise<void> => {
    const over = new Set(seen.flatMap((s) => (s.good.board.limits?.providers ?? []).filter((p) => p.windows.some((w) => w.over) && acts(p.instanceId)).map((p) => p.instanceId)));
    for (const provider of over) {
      const wanted: { at: Seen; records: Pause[]; reading: ProviderReading }[] = [];
      for (const s of seen) {
        const reading = readingOf(s.project.root, provider, at);
        if (reading?.verdict !== "pause") {
          continue;
        }
        const held = new Set(loadPauses(s.project.root).pauses.map((p) => p.braid));
        const pms: PmThread[] = s.good.board.programmes.flatMap((p) => (p.thread === null || p.section === null ? [] : [{ thread: p.thread, braids: p.braids }]));
        const w = overWindow(reading);
        const records = s.good.braids
          // Done as the board reads it (a merged PR too), not only a stored Done.
          .filter((b) => s.good.board.braids.find((c) => c.id === b.number)?.status !== "Done" && b.brief.status !== "Done" && !held.has(b.number))
          .flatMap((b): Pause[] => {
            const targets = targetsOf(b.number, provider, s.good.t3, s.project.folder());
            if (targets.length === 0) {
              return [];
            }
            const all = [...targets, ...pmsOf(b.number, s.good.t3, pms, s.project.folder())];
            const replies: Replies = { sent: at.toISOString(), outcome: "pausing", answered: 0, total: targets.length, got: [], failed: [], noAnswer: [], reason: null };
            return [{ braid: b.number, reason: "limit", provider, window: w?.id ?? reading.pauseWindow, label: w?.label ?? null, usedPercent: w?.usedPercent ?? null, resetsAt: w?.resetsAt ?? null, resumeAt: reading.resumeAt ?? at.toISOString(), task: null, thread: "", by: "board", at: at.toISOString(), targets: all, replies }];
          });
        if (records.length > 0) {
          wanted.push({ at: s, records, reading });
        }
      }
      const claimed: Held[] = wanted.flatMap((x) => claimPauses(x.at.project.root, x.records).map((pause) => ({ at: x.at, pause })));
      const first = wanted.find((x) => claimed.some((h) => h.at === x.at));
      if (first === undefined || claimed.length === 0) {
        continue; // another board (or a race) holds them all
      }
      // From here on every way out leaves the claimed records counting: a send that fails is recorded, and anything that throws is
      // warned; the count settles them within 10 minutes either way.
      try {
        const w = overWindow(first.reading);
        const window = w?.label ?? first.reading.pauseWindow ?? "window";
        const resume = clock(first.reading.resumeAt ?? at.toISOString(), at);
        const failed: string[] = [];
        const done = new Set<string>();
        for (const h of claimed) {
          for (const x of (h.pause.targets ?? []).filter((y) => y.kind !== "pm")) {
            if (done.has(x.thread)) {
              continue;
            }
            done.add(x.thread);
            const text = x.kind === "coordinator" ? coordinatorPause(x.item, provider, window, resume) : workerPause(provider, window, resume);
            if (!(await send(h.at.project.root, x.thread, text))) {
              failed.push(x.thread);
            }
          }
        }
        // Direct pause, tell the PM: one summary per PM thread with the braids it runs; it needs no reply.
        const pms = new Map<string, { root: string; braids: string[] }>();
        for (const h of claimed) {
          for (const x of (h.pause.targets ?? []).filter((y) => y.kind === "pm")) {
            const e = pms.get(x.thread) ?? { root: h.at.project.root, braids: [] };
            e.braids.push(h.pause.braid);
            pms.set(x.thread, e);
          }
        }
        for (const [thread, e] of pms) {
          if (!(await send(e.root, thread, pmSummary(e.braids, provider, window, resume)))) {
            warn(`the pause summary to the PM thread ${thread.slice(0, 8)} could not be sent`, `pm ${thread} ${at.toISOString()}`);
          }
        }
        if (failed.length > 0) {
          patch(claimed, (p) => (p.replies === undefined ? p : { ...p, replies: { ...p.replies, failed: (p.targets ?? []).filter((x) => failed.includes(x.thread)).map((x) => x.thread) } }));
        }
        const records = claimed.map((h) => h.pause);
        if (records.some(weeklyPause)) {
          push(first.at.project.root, "weekly", records, at, { roles: [...new Set(first.reading.roles.map((r) => r.split(".")[0] ?? r))].filter((r) => r !== "steering") });
        }
        // Every send failed: nothing to count, so it settles now (loudly).
        if (failed.length > 0 && claimed.every((h) => (h.pause.targets ?? []).filter((x) => x.kind !== "pm").every((x) => failed.includes(x.thread)))) {
          await settle(
            claimed.map((h) => ({ at: h.at, pause: loadPauses(h.at.project.root).pauses.find((p) => p.braid === h.pause.braid && p.by === "board") ?? h.pause })),
            at,
            new Map(),
            "every send failed",
          );
        }
      } catch (error) {
        warn(`the pause of ${provider} failed after its records were written (${error instanceof Error ? error.message : String(error)}); the count settles them`, `claimed ${provider} ${at.toISOString()}`);
      }
    }
  };

  /** Takes or renews this board's leases: the repositories it acts for, and a test of the provider accounts it acts for. */
  const leases = (seen: readonly Seen[]): { repos: Set<string>; acts: (provider: string | null) => boolean } => {
    const acting = opts.acting;
    if (acting === undefined) {
      return { repos: new Set(seen.map((s) => s.project.root)), acts: () => true };
    }
    const repos = new Set(
      seen
        .filter((s) => {
          const l = repoLease(s.project.root);
          return acting.hold(l.key, l.label);
        })
        .map((s) => s.project.root),
    );
    let records: Held[] = [];
    try {
      records = boardRecords(seen);
    } catch {
      // a pauses file that can't be read: its providers are taken when it reads again
    }
    const ids = new Set([...seen.flatMap((s) => (s.good.board.limits?.providers ?? []).map((p) => p.instanceId)), ...records.flatMap((h) => (h.pause.provider == null ? [] : [h.pause.provider]))]);
    const mine = new Set([...ids].filter((id) => acting.hold(providerKey(id), id)));
    return { repos, acts: (provider) => provider !== null && mine.has(provider) };
  };

  const tick = async (): Promise<void> => {
    pending = false;
    const seen = [...latest.values()];
    const { repos, acts } = leases(seen);
    for (const root of repos) {
      try {
        opts.retry?.(root);
      } catch {
        // a push never stops the pause
      }
    }
    const at = now();
    try {
      await count(seen, at, acts);
      await resume(seen, at, acts);
      await pause(seen, at, acts);
    } catch (error) {
      warn(`the limits pause failed this refresh (${error instanceof Error ? error.message : String(error)})`, "tick");
    }
    for (const s of opts.wake === undefined ? [] : seen.filter((x) => repos.has(x.project.root))) {
      try {
        // Read the clock again: the steps above may have taken a while.
        await opts.wake?.({ root: s.project.root, good: s.good }, now(), warn);
      } catch (error) {
        warn(`the wake of ${s.project.name} failed this refresh (${error instanceof Error ? error.message : String(error)})`, `wake ${s.project.name}`);
      }
    }
  };
  return {
    observe(project, good) {
      latest.set(project.name, { project, good });
      if (!pending) {
        pending = true;
        running = running.then(tick);
      }
    },
    poke() {
      if (!pending && latest.size > 0) {
        pending = true;
        running = running.then(tick);
      }
    },
    async idle() {
      let last: Promise<void> | undefined;
      while (last !== running) {
        last = running;
        await running;
      }
    },
  };
}
