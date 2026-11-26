// The one resume path of a limit pause (0074/D, docs/board.md "Provider limits"): the board's timer, early resume, the Resume now
// buttons and `braid resume --limit` all call `resumePauses`. A braid without a PM: each paused agent gets its resume text by code
// and the record is cleared once every send went through. A PM-run braid: the PM gets one message and resumes it with
// `braid resume <number> --limit`, in its order. A send that fails stays pending on the record (`resuming.failedSince`), and the
// acting board retries it at each refresh until it is delivered: there is no give-up. A hold is never touched.
import { clearPause, patchPause, reasonOf, type Pause, type PauseTarget } from "../braids/pauses.js";
import { resumeAsk, resumeMessage } from "./steer.js";
import type { T3Runner } from "./t3.js";

/** A record and the repository whose `.braid/pauses.json` holds it. */
export interface ResumeItem {
  readonly root: string;
  readonly pause: Pause;
}

export interface ResumeOptions {
  readonly t3: T3Runner;
  readonly now: Date;
  /** Why (`Resuming.why`): `timer`, `early`, `gone`, `now`, `cli`. A resume already under way keeps its first reason. */
  readonly why: string;
  /** True: send each agent its text (`braid resume <number> --limit`). False: ask. Absent: as the record's resume under way, else by its mode. */
  readonly direct?: boolean;
  /** Whether T3 lists a thread as archived: it is skipped (counts as reached). */
  readonly archived?: (thread: string) => boolean;
  /** The window's usage now, for the ask (`Session 61%`). */
  readonly usage?: (p: Pause) => string | null;
  readonly warn?: (line: string) => void;
}

export interface ResumeOutcome {
  /** Records cleared: every agent got its text. */
  readonly cleared: readonly ResumeItem[];
  /** Records whose PM (or pausing thread) got the ask. */
  readonly asked: readonly ResumeItem[];
  /** Records with a send still pending, retried at the next refresh. */
  readonly pending: readonly ResumeItem[];
  /** Per braid, the agents (`0074/D (mcp:7c1e09d2)`) that got their text in this call. */
  readonly sent: ReadonlyMap<string, readonly string[]>;
}

const firstLine = (r: { stderr: string; error?: Error | undefined }): string => (r.stderr.trim().split("\n")[0] ?? "") || r.error?.message || "t3 failed";

/** The threads an ask goes to: a board record's PM threads (not archived), or the coordinator or PM that ran `braid pause`. */
function askTo(p: Pause, archived: (thread: string) => boolean): string[] {
  if (p.by !== "board") {
    return p.thread === "" ? [] : [p.thread];
  }
  return [...new Set((p.targets ?? []).filter((t) => t.kind === "pm" && !archived(t.thread)).map((t) => t.thread))];
}

export async function resumePauses(items: readonly ResumeItem[], o: ResumeOptions): Promise<ResumeOutcome> {
  const now = o.now.toISOString();
  const archived = o.archived ?? (() => false);
  const warned = new Set<string>();
  const warn = (line: string): void => {
    if (!warned.has(line)) {
      warned.add(line);
      o.warn?.(line);
    }
  };
  const send = async (root: string, args: readonly string[], input?: string): Promise<string | null> => {
    try {
      const r = await o.t3(root, args, input);
      return r.error === undefined && r.status === 0 ? null : firstLine(r);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  };
  // Holds are never resumed here; a record without an agent to send to and nobody to ask is resumed directly (cleared).
  const live = items.filter((i) => reasonOf(i.pause) === "limit");
  const direct = (p: Pause): boolean => askTo(p, archived).length === 0 || (o.direct ?? p.resuming?.direct ?? false);
  const cleared: ResumeItem[] = [];
  const asked: ResumeItem[] = [];
  const pending: ResumeItem[] = [];
  const sent = new Map<string, string[]>();
  const mark = (i: ResumeItem, change: (p: Pause) => Pause): void => void patchPause(i.root, i.pause.braid, (p) => (p.by === i.pause.by ? change(p) : p));
  const under = (p: Pause, d: boolean, ok: boolean, error: string | null, extra: Partial<Pause> = {}): Pause => ({
    ...p,
    ...extra,
    resuming: {
      why: p.resuming?.why ?? o.why,
      at: p.resuming?.at ?? now,
      direct: d,
      askedAt: !d && ok ? now : (p.resuming?.askedAt ?? null),
      failedSince: ok ? null : (p.resuming?.failedSince ?? now),
      lastTry: now,
      error,
    },
  });

  // The ask: one message per thread (a PM over several braids gets one), listing the braids it resumes.
  const asks = new Map<string, { root: string; items: ResumeItem[] }>();
  for (const i of live.filter((x) => !direct(x.pause))) {
    for (const thread of askTo(i.pause, archived)) {
      const e = asks.get(thread) ?? { root: i.root, items: [] };
      e.items.push(i);
      asks.set(thread, e);
    }
  }
  const askFailed = new Map<string, string>();
  for (const [thread, e] of asks) {
    const first = e.items[0]?.pause as Pause;
    const text = resumeAsk(
      e.items.map((i) => i.pause.braid),
      first.provider ?? "the provider",
      first.resuming?.why ?? o.why,
      o.usage?.(first) ?? null,
      first.by !== "board",
    );
    const error = await send(e.root, ["thread", "send", thread, "-"], text);
    if (error !== null) {
      warn(`the resume ask to ${thread.slice(0, 8)} failed (${error}); retrying at each refresh`);
      for (const i of e.items) {
        askFailed.set(i.pause.braid, error);
      }
    }
  }
  for (const i of live.filter((x) => !direct(x.pause))) {
    const error = askFailed.get(i.pause.braid) ?? null;
    mark(i, (p) => under(p, false, error === null, error));
    (error === null ? asked : pending).push(i);
  }

  // Direct: each agent its resume text, once per thread in this call; the PM threads are not sent (the PM asked for it, or is gone).
  const reached = new Set<string>();
  const failed = new Map<string, string>();
  for (const i of live.filter((x) => direct(x.pause))) {
    const p = i.pause;
    const agents = (p.targets ?? []).filter((t: PauseTarget) => t.kind !== "pm");
    const got: string[] = [];
    let error: string | null = null;
    for (const t of agents) {
      if ((p.resumed ?? []).includes(t.thread) || archived(t.thread) || reached.has(t.thread)) {
        got.push(t.thread);
        continue;
      }
      const why = failed.get(t.thread) ?? (await send(i.root, ["thread", "send", t.thread, resumeMessage(t, p.provider ?? "the provider")]));
      if (why === null) {
        reached.add(t.thread);
        got.push(t.thread);
        sent.set(p.braid, [...(sent.get(p.braid) ?? []), `${t.item} ${t.kind} (${t.thread})`]);
      } else {
        failed.set(t.thread, why);
        error = why;
        warn(`a resume send to ${t.item} (thread ${t.thread.slice(0, 8)}) failed (${why}); retrying at each refresh`);
      }
    }
    if (error === null) {
      // Only the same pauser's limit record: a hold (or another pauser's record) that took its place is never cleared here.
      const c = clearPause(i.root, p.braid, (q) => q.by === p.by && reasonOf(q) === "limit");
      if (c !== null) {
        cleared.push({ root: i.root, pause: c });
      }
    } else {
      mark(i, (q) => under(q, true, false, error, { resumed: [...new Set([...(q.resumed ?? []), ...got])] }));
      pending.push(i);
    }
  }
  return { cleared, asked, pending, sent };
}
