// The board's stop through T3's MCP (0080/E, docs/board.md "Stop before the words"): signed in, the board interrupts a braid's working
// top-level threads with `stop: true` before it sends a pause or hold text, so the text doesn't wait behind a busy turn and the
// delegated children stop with their parent. Light on T3 (0083): one live-only `t3_thread_list` per tick, shared by every braid, and
// one interrupt per working top-level thread. A 401 signs the board out (src/t3/signin.ts) and the tick goes on by the CLI.
import type { PauseTarget, StopThread } from "../braids/pauses.js";
import { McpError, type McpClient } from "../t3mcp/client.js";
import { stopItem } from "./pause.js";
import { LIMIT_KEY, type LimitPush } from "./steer.js";

/** T3's live statuses: a list filtered to these costs by the live threads only (0083). */
export const LIVE_STATUSES = ["queued", "preparing", "starting", "running", "waiting"] as const;
/** After a stop, threads of the braid still running this long are pushed once. */
export const STILL_PUSH_MS = 2 * 60_000;
/** One page; braid's live threads are far fewer. */
const LIST_LIMIT = 100;

/** A live thread as the list gives it. */
export interface LiveThread {
  readonly id: string;
  /** The parent of a delegated child; null for a top-level thread. */
  readonly parent: string | null;
}

/** One tick's MCP use: the sign-in's client until it is refused, then the CLI path for the rest of the tick. */
export interface TickMcp {
  /** Whether the tick still has a client. */
  signedIn(): boolean;
  /** The live threads, from the tick's one list; null when not known (signed out, or the list failed). */
  live(): Promise<ReadonlyMap<string, LiveThread> | null>;
  /** Interrupts a thread with `stop: true`: null when there is no client (any more), else whether T3 took it and why not. */
  stop(thread: string, reason: string): Promise<{ readonly ok: true } | { readonly ok: false; readonly why: string } | null>;
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);

/** Why a stop was refused, in the card's words. */
export function refusedWhy(error: unknown): string {
  if (error instanceof McpError && error.code === "runtime_mode_escalation_denied") {
    return "thread runs above the board's level";
  }
  if (error instanceof McpError && error.kind === "unreachable") {
    return "T3 didn't answer";
  }
  const text = error instanceof Error ? error.message.replace(/^T3 MCP (?:tool )?\S+: /, "") : String(error);
  return text.length <= 60 ? text : `${text.slice(0, 59).trimEnd()}…`;
}

export function tickMcp(client: McpClient | null, warn: (line: string, once?: string) => void): TickMcp {
  let c = client;
  let listed: Promise<ReadonlyMap<string, LiveThread> | null> | undefined;
  /** A 401: signed out (the client told the sign-in); nothing more by MCP this tick. */
  const refused = (error: unknown): boolean => {
    if (error instanceof McpError && error.kind === "unauthorized") {
      c = null;
      warn("T3 refused the board's sign-in; the board goes on by the t3 command line", "mcp unauthorized");
      return true;
    }
    return false;
  };
  const list = async (): Promise<ReadonlyMap<string, LiveThread> | null> => {
    if (c === null) {
      return null;
    }
    try {
      const out = obj(await c.callTool("t3_thread_list", { allProjects: true, includeSubagents: true, statuses: [...LIVE_STATUSES], limit: LIST_LIMIT }));
      const threads = Array.isArray(out?.["threads"]) ? (out["threads"] as unknown[]) : [];
      const live = new Map<string, LiveThread>();
      for (const t of threads.map(obj)) {
        const id = str(t?.["threadId"]);
        if (id !== null) {
          live.set(id, { id, parent: str(t?.["parentThreadId"]) });
        }
      }
      return live;
    } catch (error) {
      if (!refused(error)) {
        warn(`T3's live thread list failed (${refusedWhy(error)}); nothing is stopped this refresh`, "mcp list");
      }
      return null;
    }
  };
  return {
    signedIn: () => c !== null,
    live() {
      listed ??= list();
      return listed;
    },
    async stop(thread, reason) {
      if (c === null) {
        return null;
      }
      try {
        await c.callTool("t3_thread_interrupt", { threadId: thread, stop: true, reason });
        return { ok: true };
      } catch (error) {
        return refused(error) ? null : { ok: false, why: refusedWhy(error) };
      }
    },
  };
}

/**
 * Stops the working top-level targets with `stop: true`: a target not in the live list is idle (it gets only the text), and a delegated
 * child is left to its parent's stop. Null when the live threads aren't known (nothing stopped: the texts go as today).
 */
export async function stopTargets(mcp: TickMcp, targets: readonly PauseTarget[], reason: string): Promise<{ stopped: string[]; refused: StopThread[] } | null> {
  const live = await mcp.live();
  if (live === null) {
    return null;
  }
  const stopped: string[] = [];
  const refused: StopThread[] = [];
  for (const t of targets) {
    const l = live.get(t.thread);
    if (l === undefined || l.parent !== null || stopped.includes(t.thread)) {
      continue;
    }
    const r = await mcp.stop(t.thread, reason);
    if (r === null) {
      break; // signed out mid-tick: the rest go by the CLI, text only
    }
    if (r.ok) {
      stopped.push(t.thread);
    } else {
      refused.push({ item: t.item, thread: t.thread, why: r.why });
    }
  }
  return { stopped, refused };
}

/** The braid's threads still running: targets that haven't answered, and every live child of a target (under its parent's item). */
export function stillWorking(live: ReadonlyMap<string, LiveThread>, targets: readonly PauseTarget[], answered: readonly string[]): StopThread[] {
  const items = new Map(targets.map((t) => [t.thread, t.item]));
  for (let grew = true; grew; ) {
    grew = false;
    for (const l of live.values()) {
      const parentItem = l.parent === null ? undefined : items.get(l.parent);
      if (!items.has(l.id) && parentItem !== undefined) {
        items.set(l.id, parentItem);
        grew = true;
      }
    }
  }
  return [...items].filter(([id]) => live.has(id) && !answered.includes(id)).map(([thread, item]) => ({ item, thread }));
}


/** The one push when threads of a stopped braid still work 2 minutes after the stop. */
export function stillPush(braid: string, hold: boolean, still: readonly StopThread[], targets: readonly PauseTarget[], at: string): LimitPush {
  const n = still.length;
  return {
    key: `${LIMIT_KEY}still:${braid}:${at}`,
    title: `${braid}: ${n} thread${n === 1 ? "" : "s"} still working after the ${hold ? "hold" : "pause"}`,
    body: `Still working: ${still.map((s) => stopItem(s, targets)).join(", ")}. Open their threads and stop them by hand if needed.`,
    tags: ["warning"],
    priority: "high",
    click: null,
  };
}
