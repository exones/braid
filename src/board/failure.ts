// Why a braid's thread failed (docs/board.md, "Why a thread failed"): T3 gives the latest run's error text in `thread show --json`, and no
// error class, so the kind is read from the text. `failureReader` is the board's one extra read: once per newly failed idle thread
// of an open item, over MCP while signed in (0080/F) and by `thread show` else. Nothing here acts on a reason.
import type { Braid } from "../braids/store.js";
import type { HubProject } from "./t3-mcp.js";
import { pool, showThread, type T3, type T3Runner } from "./t3.js";

export type FailureKind = "limit" | "provider" | "stopped" | "other";

export interface Failure {
  readonly kind: FailureKind;
  /** The few words a card shows. */
  readonly short: string;
  /** T3's whole error text, for the tooltip. */
  readonly full: string;
}

const STOPPED = new Set(["interrupted", "cancelled"]);
const SHORT_MAX = 48;

// The account's own limit. A temporary 429 ("not your usage limit") is the provider's, so it doesn't count (0080/E reads `limit` as paused).
const LIMIT = /hit your (?:[\w-]+ )?limit|(?:usage|session|weekly|monthly|5-hour) limit reached|usage_limit|hit your spend cap|out of credits/i;

/** When the limit lifts, if the text says: `resets 3:45pm`. */
function resets(text: string): string {
  const m = /(?:\bresets(?: at)?|\btry again at)\s+([^(·∙|\n]+?)\s*(?:\(|\.(?:\s|$)|[·∙|]|$)/i.exec(text);
  const when = m?.[1] ?? "";
  return when === "" || when.length > 28 ? "" : ` · resets ${when}`;
}

/** T3's own text as a card shows it: its first sentence or clause, cut. */
function cut(text: string): string {
  const line = text.split("\n")[0] ?? "";
  const clause = /^(.{12,}?)(?:[.:]\s|\.$)/.exec(line)?.[1] ?? line;
  return clause.length <= SHORT_MAX ? clause : `${clause.slice(0, SHORT_MAX - 1).trimEnd()}…`;
}

function provider(text: string): string | null {
  if (/rate.?limit|temporarily limiting requests|\b429\b/i.test(text)) {
    return "Provider rate limit";
  }
  if (/overloaded|\b529\b|at capacity|high load|high demand/i.test(text)) {
    return "Provider overloaded";
  }
  const code = /(?:API Error:|status(?: code)?|HTTP)\s*(5\d\d)\b/i.exec(text)?.[1];
  if (code !== undefined || /internal server error|bad gateway|service unavailable|server error/i.test(text)) {
    return code === undefined ? "Provider error" : `Provider error (${code})`;
  }
  if (/connection|socket|stream (?:disconnected|idle)|timed? ?out|\bE(?:CONN\w+|NOTFOUND|TIMEDOUT|AI_AGAIN)\b|fetch failed|no response from api|unable to connect|network|mid-response|never arrived|stopped arriving|stalled before|stream was malformed/i.test(text)) {
    return "Network error";
  }
  return null;
}

/**
 * Why a thread's last run ended without completing; null for a thread that didn't (no error text and not failed or stopped).
 * `thread.status` is T3's: it alone says a run was stopped when T3 gives no text.
 */
export function failureOf(error: string | null, thread: { readonly status: string | null }): Failure | null {
  const status = thread.status?.toLowerCase() ?? "";
  const full = error?.trim() ?? "";
  if (full === "") {
    if (STOPPED.has(status)) {
      return { kind: "stopped", short: "Run stopped", full: "The last run was stopped before it completed." };
    }
    return status === "failed" ? { kind: "other", short: "Run failed", full: "The last run failed; T3 gives no error text." } : null;
  }
  if (LIMIT.test(full)) {
    return { kind: "limit", short: `Usage limit${resets(full)}`, full };
  }
  if (STOPPED.has(status)) {
    return { kind: "stopped", short: "Run stopped", full };
  }
  const words = provider(full);
  if (words !== null) {
    return { kind: "provider", short: words, full };
  }
  if (/^interrupted\b|turn aborted|was interrupted|request interrupted/i.test(full)) {
    return { kind: "stopped", short: "Run stopped", full };
  }
  return /^API Error\b/i.test(full) ? { kind: "provider", short: "Provider error", full } : { kind: "other", short: cut(full), full };
}

/** How many errors are read at once: many threads can fail together (a provider's limit). */
const AT_ONCE = 4;

/** The list statuses that are worth a read for the error. */
const FAILED = new Set(["failed", "interrupted"]);

/** The idle threads a stalled card of an open item can name: each item's newest worker thread, and each braid's coordinator while none of its runs. */
function candidates(t3: T3, braids: readonly Braid[]): string[] {
  const ids: string[] = [];
  const add = (id: string | undefined) => {
    if (id !== undefined && FAILED.has(t3.states?.get(id) ?? "")) {
      ids.push(id);
    }
  };
  for (const braid of braids) {
    if (braid.brief.status === "Done") {
      continue;
    }
    const keys = [braid.number, ...braid.strands.filter((s) => s.brief.status !== "Done").map((s) => `${braid.number}/${s.letter}`)];
    for (const key of keys) {
      add(t3.idle?.get(key)?.[0]?.id);
    }
    if (t3.coordinators?.has(braid.number) !== true) {
      add(t3.idleCoordinators?.get(braid.number)?.id);
    }
  }
  return [...new Set(ids)];
}

/**
 * The failures of the idle threads of open items, by thread id. A thread is read once and remembered until the list gives it another
 * status; a read that fails is tried again at the next read. `mcp`: the signed-in read of a thread's error, which says "cli" when the
 * read goes by `thread show`.
 */
export function failureReader(run: T3Runner, root: string, mcp?: HubProject["errorOf"]): (t3: T3, braids: readonly Braid[]) => Promise<ReadonlyMap<string, Failure>> {
  let known = new Map<string, { status: string; failure: Failure | null }>();
  return async (t3, braids) => {
    const next = new Map<string, { status: string; failure: Failure | null }>();
    await pool(
      candidates(t3, braids),
      async (id) => {
        const status = t3.states?.get(id) ?? "";
        const had = known.get(id);
        if (had?.status === status) {
          next.set(id, had);
          return;
        }
        const said = mcp === undefined ? "cli" : await mcp(id);
        const read = said === "cli" ? await showThread(run, root, id) : said;
        if (read !== null) {
          next.set(id, { status, failure: failureOf(read.error, { status }) });
        }
      },
      AT_ONCE,
    );
    // A T3 that couldn't be read forgets nothing.
    if (t3.status.state === "ok") {
      known = next;
    }
    return new Map([...next].flatMap(([id, v]) => (v.failure === null ? [] : [[id, v.failure] as const])));
  };
}
