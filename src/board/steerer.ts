// The board's pause for provider limits (0064, docs/board.md "Provider limits"): the one exception to the board's click-only
// rule. Every served project's feed hands its good snapshot to one board-wide steerer, which runs a tick at a time:
//   1. follow: read each 🚦 steering thread that is still pausing (its `Steering:` line, a failed run, the 15-minute limit);
//   2. resume: each `by: board` record whose resume time has passed is re-checked, then its threads get `t3 thread send`;
//   3. pause: per provider over its threshold, claim a record per braid under the lock, then start one steering thread;
//   4. wake: each project's open requests whose "done when" holds are closed and their askers woken (src/board/wake.ts).
// With several boards on one machine, a tick acts only for the keys whose lease this board holds (src/board/acting.ts, 0074/B):
// steps 1-3 per provider account, step 4 and the pending limit pushes per repository. A board that holds none still reads and shows.
// Only `.braid/pauses.json`, `notified.json` and (the wake) `braid-requests` are written, and only `t3 thread start` and
// `t3 thread send` are called.
import { join } from "node:path";
import { providerKey, repoLease, type ActingBoard } from "./acting.js";
import { LimitsError, readLimits, readModelLines, readProvider, t3Home, type ModelLine, type ProviderReading } from "../braids/limits.js";
import { claimPauses, clearPause, loadPauses, patchPauses, reasonOf, type Pause, type PauseTarget, type Steering } from "../braids/pauses.js";
import { steeringTitle } from "../braids/title.js";
import type { Good } from "./feed.js";
import { clock } from "./pause.js";
import { limitPush, overWindow, parseSteeringLine, pickSteering, resumeMessage, steeringLines, steeringMessage, targetsOf, weeklyPause, type LimitEvent, type LimitPush, type PmThread } from "./steer.js";
import type { T3Runner } from "./t3.js";
import type { Waker } from "./wake.js";

/** How long a steering thread may take to give its `Steering:` line before the pause counts as failed. */
export const STEER_LIMIT_MS = 15 * 60_000;
/** A pause that hasn't completed by then is pushed as "pausing"; a normal one is not. */
export const PAUSING_PUSH_MS = 60_000;
/** A resume this late is reported as missed ("was due …"): no board ran at the time. */
export const MISSED_MS = 5 * 60_000;
/** After this many failed sends to one thread, its resume is given up (reported once) so the others' record can clear. */
export const SEND_TRIES = 5;

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
  const failures = new Map<string, number>();
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

  /** 1. A steering thread that is still pausing: its line, a failed run, or the time limit. */
  const follow = async (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean): Promise<void> => {
    const groups = new Map<string, Held[]>();
    const orphans: Held[] = [];
    for (const h of boardRecords(seen).filter((x) => acts(x.pause.provider ?? null))) {
      const s = h.pause.steering;
      if (s?.outcome === "pausing" && s.thread !== null) {
        groups.set(s.thread, [...(groups.get(s.thread) ?? []), h]);
      } else if (s?.outcome === "pausing" && at.getTime() - Date.parse(s.started) >= STEER_LIMIT_MS) {
        orphans.push(h); // claimed, but no steering thread was ever recorded (a board that stopped mid-start)
      }
    }
    if (orphans.length > 0) {
      const done = patch(orphans, (p) => ({ ...p, steering: { ...(p.steering as Steering), outcome: "failed", reason: "never started: no steering thread was recorded" } }));
      push(orphans[0]?.at.project.root ?? "", "failed", done, at);
    }
    for (const [thread, held] of groups) {
      const host = held[0]?.at.project;
      const steering = held[0]?.pause.steering;
      if (host === undefined || steering === undefined) {
        continue;
      }
      const age = at.getTime() - Date.parse(steering.started);
      const shown = await opts.t3(host.root, ["thread", "show", thread, "--messages", "3", "--json"]);
      const out = shown.error === undefined && shown.status === 0 ? jsonOf(shown.stdout) : null;
      const status = str(obj(out?.["thread"])?.["status"])?.toLowerCase() ?? null;
      const texts = (Array.isArray(out?.["messages"]) ? (out["messages"] as unknown[]) : []).map(obj).filter((m): m is Json => m !== null && m["role"] !== "user").map((m) => str(m["text"]) ?? "");
      const line = texts.map(parseSteeringLine).filter((l) => l !== null).at(-1) ?? null;
      const fail = (reason: string): void => {
        const done = patch(held, (p) => ({ ...p, steering: { ...(p.steering as Steering), outcome: "failed", reason } }));
        push(host.root, "failed", done, at, { click: steering.link });
      };
      if (line !== null) {
        // A child is resumed through one record: its project's and its braid's (0074/B). Its project is the one whose T3 list knows
        // the thread, else the first that has its braid paused; one whose item names no paused braid goes with the first record.
        const owner = new Map<Held, PauseTarget[]>();
        for (const c of line.children) {
          const braid = c.item?.slice(0, 4) ?? null;
          const same = held.filter((h) => h.pause.braid === braid);
          const known = (same.length > 0 ? same : held).filter((h) => h.at.good.t3.states?.has(c.thread) === true);
          const h = known[0] ?? same[0] ?? held[0];
          if (h !== undefined) {
            const item = c.item !== null && h.pause.braid === braid ? c.item : h.pause.braid;
            owner.set(h, [...(owner.get(h) ?? []), { thread: c.thread, kind: "child", item, project: h.at.project.folder() }]);
          }
        }
        const children = line.children.map((c) => c.thread);
        const done = held.flatMap((h) =>
          patch([h], (p) => ({
            ...p,
            targets: [...(p.targets ?? []), ...(owner.get(h) ?? []).filter((c) => !(p.targets ?? []).some((t) => t.thread === c.thread))],
            steering: { ...(p.steering as Steering), outcome: line.noAnswer.length > 0 ? "partial" : "paused", answered: line.answered, total: line.total, children, noAnswer: line.noAnswer },
          })),
        );
        push(host.root, "paused", done, at, { click: steering.link });
      } else if (status === "failed" || status === "interrupted") {
        fail(`stopped (${status}) before every agent answered`);
      } else if (age >= STEER_LIMIT_MS) {
        fail(`gave no Steering line in ${STEER_LIMIT_MS / 60_000} min`);
      } else if (age >= PAUSING_PUSH_MS) {
        push(host.root, "pausing", held.map((h) => h.pause), at, { click: steering.link });
      }
    }
  };

  /** 2. Records whose resume time has passed: re-check, then resume (or keep with the new time). */
  const resume = async (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean): Promise<void> => {
    const due = boardRecords(seen).filter((h) => acts(h.pause.provider ?? null) && h.pause.resumeAt !== null && Date.parse(h.pause.resumeAt) <= at.getTime() && h.pause.steering?.outcome !== "pausing");
    const byProvider = new Map<string, Held[]>();
    for (const h of due) {
      byProvider.set(h.pause.provider ?? "", [...(byProvider.get(h.pause.provider ?? "") ?? []), h]);
    }
    for (const [provider, all] of byProvider) {
      // Each record is re-checked against its own project's BRAID.md and limits (0074/B): one project may still be over its threshold.
      const readings = new Map<string, ProviderReading | null>();
      const readingAt = (root: string): ProviderReading | null => {
        if (!readings.has(root)) {
          readings.set(root, readingOf(root, provider, at));
        }
        return readings.get(root) ?? null;
      };
      const over = all.filter((h) => readingAt(h.at.project.root)?.verdict === "pause");
      const byRoot = new Map<string, Held[]>();
      for (const h of over) {
        byRoot.set(h.at.project.root, [...(byRoot.get(h.at.project.root) ?? []), h]);
      }
      const kept = [...byRoot].flatMap(([root, hs]) => {
        const reading = readingAt(root) as ProviderReading;
        const w = overWindow(reading);
        return patch(hs, (p) => ({ ...p, window: w?.id ?? p.window, label: w?.label ?? p.label, usedPercent: w?.usedPercent ?? p.usedPercent, resetsAt: w?.resetsAt ?? p.resetsAt, resumeAt: reading.resumeAt ?? p.resumeAt }));
      });
      if (kept.length > 0) {
        push(over[0]?.at.project.root ?? "", "extended", kept, at);
      }
      const held = all.filter((h) => !over.includes(h));
      const host = held[0]?.at;
      if (host === undefined) {
        continue;
      }
      const reading = readingAt(host.project.root);
      // One message per thread, even when several braids' records name it (a PM, a steering child).
      const sends = new Map<string, { target: PauseTarget; root: string; archived: boolean }>();
      for (const h of held) {
        for (const t of h.pause.targets ?? []) {
          if (!(h.pause.resumed ?? []).includes(t.thread) && !sends.has(t.thread)) {
            sends.set(t.thread, { target: t, root: h.at.project.root, archived: h.at.good.t3.states?.get(t.thread) === "archived" });
          }
        }
      }
      const sent: string[] = [];
      for (const [thread, s] of sends) {
        if (s.archived) {
          sent.push(thread);
          continue;
        }
        const r = await opts.t3(s.root, ["thread", "send", thread, resumeMessage(s.target, provider)]);
        if (r.error === undefined && r.status === 0) {
          sent.push(thread);
          failures.delete(thread);
          continue;
        }
        const tries = (failures.get(thread) ?? 0) + 1;
        failures.set(thread, tries);
        if (tries >= SEND_TRIES) {
          warn(`the resume of ${s.target.item} (thread ${thread.slice(0, 8)}) failed ${tries} times (${firstLine(r)}); given up, resume it by hand`);
          sent.push(thread);
        } else {
          warn(`a resume send failed (${firstLine(r)}); retrying at each refresh`, "resume send");
        }
      }
      const left = [...sends.keys()].filter((t) => !sent.includes(t));
      if (left.length > 0) {
        patch(held, (p) => ({ ...p, resumed: [...new Set([...(p.resumed ?? []), ...sent])] }));
        continue;
      }
      const cleared = held.flatMap((h) => {
        // Only the board's own limit record: a hold (or another pauser's record) that took its place is never cleared here.
        const c = clearPause(h.at.project.root, h.pause.braid, (p) => p.by === "board" && reasonOf(p) === "limit");
        return c === null ? [] : [c];
      });
      const first = held[0]?.pause;
      const late = first?.resumeAt === null || first === undefined ? 0 : at.getTime() - Date.parse(first.resumeAt);
      const w = reading?.windows.find((x) => x.id === first?.window);
      push(host.project.root, "resumed", cleared, at, { due: late >= MISSED_MS && first?.resumeAt != null ? clock(first.resumeAt, at) : null, usage: w === undefined ? null : `${w.label} at ${w.usedPercent}%` });
    }
  };

  /** 3. Providers over their threshold: a record per braid with agents on it and no record yet, then one steering thread. */
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
            const targets = targetsOf(b.number, provider, s.good.t3, pms, s.project.folder());
            return targets.length === 0
              ? []
              : [{ braid: b.number, reason: "limit", provider, window: w?.id ?? reading.pauseWindow, label: w?.label ?? null, usedPercent: w?.usedPercent ?? null, resetsAt: w?.resetsAt ?? null, resumeAt: reading.resumeAt ?? at.toISOString(), task: null, thread: "", by: "board", at: at.toISOString(), targets }];
          });
        if (records.length > 0) {
          wanted.push({ at: s, records, reading });
        }
      }
      // The steering thread starts in the first project whose BRAID.md has a steering role; without one anywhere, nothing pauses.
      const host = wanted.find((x) => steeringLines(linesOf(x.at.project.root)?.lines ?? []) !== null);
      if (host === undefined) {
        if (wanted.length > 0) {
          warn(`${provider} is over its threshold, but BRAID.md has no models.steering: nothing is paused`, `nosteer ${provider}`);
        }
        continue;
      }
      const lines = steeringLines(linesOf(host.at.project.root)?.lines ?? []) ?? [];
      const pick = pickSteering(lines, (id) => id === provider || readingOf(host.at.project.root, id, at)?.verdict === "pause");
      if (pick === null) {
        continue;
      }
      const base: Steering = { thread: null, link: null, provider: pick.line.instanceId, model: pick.line.model, started: at.toISOString(), outcome: "pausing", answered: null, total: 0, children: [], noAnswer: [], reason: null, self: pick.self };
      const claimed = wanted.flatMap((x) => claimPauses(x.at.project.root, x.records.map((r) => ({ ...r, steering: base }))).map((pause) => ({ at: x.at, pause })));
      if (claimed.length === 0) {
        continue; // another board (or a race) holds them all
      }
      // From here on every way out leaves the claimed records settled: a start that fails, gives no thread id or throws is a failed start
      // (the fallback line is tried once), and anything else that throws marks the pause failed, so no record stays pausing with no thread.
      const failStart = (why: string): void => {
        const done = patch(claimed, (p) => ({ ...p, steering: { ...(p.steering as Steering), outcome: "failed", reason: `could not start (${why})` } }));
        push(host.at.project.root, "failed", done, at);
      };
      let used = pick.line;
      let thread: string | null = null;
      let link: string | null = null;
      try {
        const targets = [...new Map(claimed.flatMap((h) => h.pause.targets ?? []).map((t) => [t.thread, t])).values()];
        const w = overWindow(host.reading);
        const message = steeringMessage({ provider, window: w?.label ?? host.reading.pauseWindow ?? "window", usedPercent: w?.usedPercent ?? null, threshold: w?.threshold ?? null, resumeAt: host.reading.resumeAt ?? at.toISOString(), targets, now: at });
        // The title goes through cmd.exe on Windows: no quote or shell character may reach it.
        const title = steeringTitle(host.at.project.repo, `pause ${provider} ${w?.label ?? ""} ${w?.usedPercent ?? ""}%`).replace(/["%^&|<>!\s]+/g, " ").trim();
        /** One start: the new thread's id and link, or why there is none. */
        const start = async (line: ModelLine): Promise<{ thread: string; link: string | null } | { why: string }> => {
          try {
            const r = await opts.t3(host.at.project.root, ["thread", "start", host.at.project.folder(), "-", "--provider", line.instanceId, ...(line.model === null ? [] : ["--model", line.model]), "--title", title, "--json"], message);
            if (r.error !== undefined || r.status !== 0) {
              return { why: firstLine(r) };
            }
            const out = jsonOf(r.stdout);
            const id = str(out?.["threadId"]) ?? str(out?.["id"]) ?? str(obj(out?.["thread"])?.["threadId"]);
            return id === null ? { why: "t3 thread start gave no thread id" } : { thread: id, link: str(out?.["link"]) ?? str(obj(out?.["thread"])?.["link"]) };
          } catch (error) {
            return { why: error instanceof Error ? error.message : String(error) };
          }
        };
        let started = await start(used);
        const fallback = lines.find((l) => l !== used);
        if ("why" in started && fallback !== undefined) {
          warn(`the steering thread on ${used.instanceId} didn't start (${started.why}); trying ${fallback.instanceId}`, `start ${provider} ${at.toISOString()}`);
          used = fallback;
          started = await start(used);
        }
        if ("why" in started) {
          failStart(started.why);
          continue;
        }
        thread = started.thread;
        link = started.link;
        const id = thread;
        const shown = link;
        const self = used.instanceId === provider;
        const steeredBy = used;
        const done = patch(claimed, (p) => ({ ...p, thread: id, steering: { ...(p.steering as Steering), thread: id, link: shown, provider: steeredBy.instanceId, model: steeredBy.model, self, total: targets.length } }));
        if (self) {
          push(host.at.project.root, "nosteer", done, at, { click: shown });
        }
        if (done.some(weeklyPause)) {
          push(host.at.project.root, "weekly", done, at, { roles: [...new Set(host.reading.roles.map((r) => r.split(".")[0] ?? r))].filter((r) => r !== "steering") });
        }
      } catch (error) {
        const why = error instanceof Error ? error.message : String(error);
        warn(`the pause of ${provider} failed after its records were written (${why})`, `claimed ${provider} ${at.toISOString()}`);
        // A thread that did start is followed as usual once its id is on the records; otherwise the pause failed.
        if (thread === null) {
          failStart(why);
        }
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
      await follow(seen, at, acts);
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
    async idle() {
      let last: Promise<void> | undefined;
      while (last !== running) {
        last = running;
        await running;
      }
    },
  };
}
