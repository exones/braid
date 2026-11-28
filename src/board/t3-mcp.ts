// The board's signed-in read of T3 (0080/F, docs/board.md "Signed in: the read over MCP"): the same snapshot the CLI read builds
// (`snapshotOf`), over the one MCP session instead of a `t3` process per thread (0083). Per refresh: one live-only
// `t3_thread_list` for every project (shared with the stop step), and a `t3_thread_read {limit: 1}` only for threads whose
// worktree, branch or pending count isn't cached. The full list (idle threads, titles) every 5 minutes or after a `braids/`
// change. T3's events (hints, never state) mark what to read again and refresh a project within seconds. Signed out, refused
// or unanswered, a read is the CLI's, as before. Nothing here runs on the request path: the feed calls it.
import { loadReviews } from "../braids/reviews.js";
import { agentsDirs } from "../braids/worktree-folders.js";
import { normPath } from "../braids/worktrees.js";
import { McpError, type McpClient } from "../t3mcp/client.js";
import { eventsReader, type EventsReader, type T3Event } from "../t3mcp/events.js";
import { mainCheckout, pool, snapshotOf, statusOf, working, type Json, type T3, type Where } from "./t3.js";

/** T3's live statuses: a list filtered to these costs by the live threads only (0083). */
export const LIVE_STATUSES = ["queued", "preparing", "starting", "running", "waiting"] as const;
/** The full list (idle threads, idle coordinators, titles) is read again after this, and after a `braids/` change. */
export const FULL_EVERY_MS = 5 * 60_000;
/** The longest wait between event polls; T3's `nextPollMs` when shorter. A poll reads memory only in T3. */
export const EVENT_POLL_MS = 5_000;
/** After a failed event poll. */
const EVENT_RETRY_MS = 30_000;
export const EVENT_TYPES = ["thread.run_settled", "thread.needs_input", "pr.watch_wake"] as const;
/** The projects of one refresh ask for the live list at the same moment: one call serves them. */
const LIVE_SHARE_MS = 2_000;
/** Events that arrive together make one refresh. */
const DEBOUNCE_MS = 200;
const PAGE = 100;
/** A page cursor that never ends stops here. */
const MAX_PAGES = 100;
/** The newest activity items of a failed run read for its error: the error closes the run. */
const ERROR_ITEMS = 20;

const obj = (v: unknown): Json | null => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const idOf = (t: Json): string | null => str(t["threadId"]);

/** Every page of a list tool; `field` names the array. */
async function pages(client: McpClient, tool: string, field: string, args: Readonly<Record<string, unknown>>): Promise<Json[]> {
  const out: Json[] = [];
  let cursor: unknown;
  for (let n = 0; n < MAX_PAGES; n++) {
    const page = obj(await client.callTool(tool, { ...args, limit: PAGE, ...(cursor === undefined ? {} : { cursor }) }));
    const rows = page?.[field];
    if (!Array.isArray(rows)) {
      throw new McpError("error", `T3 MCP tool ${tool}: no ${field}`);
    }
    out.push(...(rows as unknown[]).map(obj).filter((r): r is Json => r !== null));
    cursor = page?.["nextCursor"];
    if (cursor === null || cursor === undefined) {
      break;
    }
  }
  return out;
}

/** The live threads of every project, subagents included. */
export const listLive = (client: McpClient): Promise<Json[]> => pages(client, "t3_thread_list", "threads", { allProjects: true, includeSubagents: true, statuses: [...LIVE_STATUSES] });

/** What one read of a thread said, and what the list said of it then. */
interface Info {
  readonly detail: Json;
  /** The status and latest run the read was made for: when they move, the thread is read again. */
  readonly key: string;
  readonly at: number;
}

const keyOf = (t: Json): string => `${str(t["status"]) ?? ""}|${str(t["latestRunId"]) ?? ""}`;

export interface HubProject {
  /** The snapshot: over MCP while signed in, else (or when T3 doesn't take it) from `cli`. */
  read(cli: () => Promise<T3>): Promise<T3>;
  /** A failed thread's latest error by MCP; `cli`: read it as signed out does; null: not known now, ask again later. */
  errorOf(thread: string): Promise<{ readonly error: string | null } | "cli" | null>;
  /** Something under `braids/` changed: the next read takes the full list again. */
  stale(): void;
  /** `refresh` is called when T3's events say this project changed; returns how to stop. */
  subscribe(refresh: () => void): () => void;
}

export interface T3Hub {
  project(root: string): HubProject;
  /** The live threads of every project (one call shared by everything that asks within `maxAgeMs`); rejects when signed out or T3 doesn't give it. */
  live(maxAgeMs: number): Promise<readonly Json[]>;
  /** Reads each event type once, from where it was; resolves to the milliseconds until the next poll. The hub's own loop calls it. */
  pollEvents(): Promise<number>;
}

export interface T3HubOptions {
  /** `BoardSignIn.client()`: null while signed out or `access: cli`. */
  readonly client: () => McpClient | null;
  /** Resolves once the sign-in has read the secret store, so the first read doesn't go by the CLI for want of it. */
  readonly ready?: () => Promise<void>;
  readonly now?: () => number;
  /** Reports, once per line, why a read went by the CLI. */
  readonly warn?: (line: string) => void;
}

interface Listener {
  readonly projectId: () => string | null;
  event(thread: string | null): void;
  reread(): void;
}

export function boardT3(options: T3HubOptions): T3Hub {
  const now = options.now ?? Date.now;
  const warned = new Set<string>();
  const warn = (line: string): void => {
    if (!warned.has(line)) {
      warned.add(line);
      (options.warn ?? ((l: string) => void process.stderr.write(`braid board: ${l}\n`)))(line);
    }
  };
  /** The client of the moment, counting calls into `count` when given. */
  const signedIn = (count?: { calls: number }): McpClient => {
    const c = options.client();
    if (c === null) {
      throw new McpError("unauthorized", "T3 MCP: signed out");
    }
    return {
      call: (m, p) => c.call(m, p),
      callTool: (n, a) => {
        if (count !== undefined) {
          count.calls++;
        }
        return c.callTool(n, a);
      },
    };
  };

  let shared: { readonly at: number; readonly list: Promise<Json[]> } | null = null;
  const live = (maxAgeMs: number, count?: { calls: number }): Promise<Json[]> => {
    if (shared !== null && now() - shared.at <= maxAgeMs && options.client() !== null) {
      return shared.list;
    }
    const entry = { at: now(), list: Promise.resolve().then(() => listLive(signedIn(count))) };
    shared = entry;
    entry.list.catch(() => {
      if (shared === entry) {
        shared = null;
      }
    });
    return entry.list;
  };

  // Events: one reader per type on the one session, polled while any project listens.
  const listeners = new Set<Listener>();
  /** Since when the events cover every change; null while they don't (not started, signed out, the last poll failed). */
  let coveredSince: number | null = null;
  const onEvent = (event: T3Event): void => {
    shared = null; // the live list from before the event is old
    for (const l of listeners) {
      if (event.projectId !== null && l.projectId() === event.projectId) {
        l.event(event.threadId);
      }
    }
  };
  const onReread = (): void => {
    shared = null;
    for (const l of listeners) {
      l.reread();
    }
  };
  const session: McpClient = { call: async (m, p) => signedIn().call(m, p), callTool: async (n, a) => signedIn().callTool(n, a) };
  const readers: EventsReader[] = EVENT_TYPES.map((type) => eventsReader(session, type, { includeSubagentChildren: true }, { onEvent, onReread }));
  let polling: Promise<number> | null = null;
  const pollOnce = async (): Promise<number> => {
    if (options.client() === null) {
      coveredSince = null;
      return EVENT_POLL_MS; // signed out: nothing is asked of T3
    }
    const began = now();
    try {
      const waits = await Promise.all(readers.map((r) => r.pollOnce()));
      coveredSince ??= began;
      return Math.min(EVENT_POLL_MS, ...waits);
    } catch (error) {
      coveredSince = null;
      warn(`T3's events can't be read (${error instanceof Error ? error.message : String(error)}); the board keeps its 30 s refresh`);
      return EVENT_RETRY_MS;
    }
  };
  const pollEvents = (): Promise<number> => (polling ??= pollOnce().finally(() => (polling = null)));
  let timer: NodeJS.Timeout | undefined;
  let looping = false;
  const loop = (): void => {
    void pollEvents().then((wait) => {
      if (listeners.size === 0) {
        looping = false;
        return;
      }
      timer = setTimeout(loop, wait);
      timer.unref();
    });
  };

  const project = (root: string): HubProject => {
    let projectId: string | null = null;
    /** The project's threads as `thread list` gives them (top-level, not archived), by id. */
    const items = new Map<string, Json>();
    const infos = new Map<string, Info>();
    /** Threads to read at the next refresh: named by an event, or gone from a list. */
    let dirty = new Set<string>();
    /** The threads that worked at the last refresh. */
    let worked = new Set<string>();
    let fullAt = -Infinity;
    /** Whether the settled threads were listed once; they change rarely and a thread that leaves the unsettled list is read. */
    let settledListed = false;
    let queue: Promise<unknown> = Promise.resolve();

    const resolveId = async (client: McpClient): Promise<string> => {
      if (projectId === null) {
        const folder = normPath(mainCheckout(root));
        const found = (await pages(client, "t3_project_list", "projects", {})).find((p) => normPath(str(p["workspaceRoot"]) ?? "") === folder);
        projectId = str(found?.["id"]);
        if (projectId === null) {
          throw new McpError("error", `T3 has no project at ${mainCheckout(root)}`);
        }
      }
      return projectId;
    };

    const fullList = async (client: McpClient, id: string): Promise<void> => {
      if (now() - fullAt < FULL_EVERY_MS) {
        return;
      }
      const began = now();
      fullAt = began; // a `braids/` change while it is read asks for another one
      const list = (settled: boolean) => pages(client, "t3_thread_list", "threads", { projectId: id, includeSubagents: false, settled });
      const unsettled = await list(false);
      const settled = settledListed ? null : await list(true);
      if (settled !== null) {
        items.clear();
      } else {
        const listed = new Set(unsettled.map(idOf));
        for (const [thread, item] of items) {
          if (item["settled"] !== true && !listed.has(thread)) {
            dirty.add(thread); // settled, archived or deleted since: one read says which
          }
        }
      }
      for (const t of [...(settled ?? []), ...unsettled]) {
        const thread = idOf(t);
        if (thread !== null && t["relationshipToParent"] !== "subagent") {
          items.set(thread, t);
        }
      }
      settledListed = true;
    };

    /** Reads one thread; one T3 doesn't know leaves the snapshot. */
    const readThread = async (client: McpClient, thread: string, key: string | null, projectOf: string): Promise<void> => {
      const at = now();
      let detail: Json | null;
      try {
        detail = obj(obj(await client.callTool("t3_thread_read", { threadId: thread, limit: 1, runLimit: 1, maxCharsPerItem: 1 }))?.["thread"]);
      } catch (error) {
        if (error instanceof McpError && error.kind === "error") {
          items.delete(thread);
          infos.delete(thread);
          return;
        }
        throw error;
      }
      if (detail === null) {
        throw new McpError("error", "T3 MCP tool t3_thread_read: no thread");
      }
      infos.set(thread, { detail, key: key ?? keyOf(detail), at });
      if (detail["archived"] === true) {
        items.delete(thread);
      } else if (detail["relationshipToParent"] !== "subagent" && detail["projectId"] === projectOf) {
        items.set(thread, { ...items.get(thread), ...detail });
      }
    };

    const mcpRead = async (count: { calls: number }): Promise<T3> => {
      const client = signedIn(count);
      const id = await resolveId(client);
      const all = new Map((await live(LIVE_SHARE_MS, count)).flatMap((t) => (idOf(t) === null ? [] : [[idOf(t) as string, t] as const])));
      const asked = dirty;
      dirty = new Set(); // what an event names while this read runs is read by the next one
      try {
        await fullList(client, id);
        // What the full list wants verified, and events that came meanwhile, are read now.
        for (const thread of dirty) {
          asked.add(thread);
        }
        dirty.clear();
        const reviews = loadReviews(root);
        const recorded = new Set(reviews.map((r) => r.thread));
        const mine = [...all].filter(([, t]) => t["projectId"] === id && t["relationshipToParent"] !== "subagent");
        for (const [thread, t] of mine) {
          items.set(thread, t);
        }
        // The threads that work, so need their worktree, branch and pending count: the project's own and the recorded ones.
        const busy = [...mine.map(([thread]) => thread), ...[...recorded].filter((t) => all.has(t))].filter((t) => working(all.get(t) as Json));
        // A thread that worked and is no longer listed as working has ended, or works in the background: one read says which.
        for (const thread of [...worked, ...items.keys()]) {
          const item = items.get(thread);
          if (!all.has(thread) && (worked.has(thread) || (item !== undefined && working(item)))) {
            asked.add(thread);
          }
        }
        const stale = busy.filter((thread) => {
          const had = infos.get(thread);
          // A pending question is read again until it is answered, and always while the events don't cover the time since the read.
          return had === undefined || had.key !== keyOf(all.get(thread) as Json) || had.detail["pendingRequestCount"] !== 0 || coveredSince === null || had.at < coveredSince;
        });
        await pool([...new Set([...stale, ...asked])], (thread) => readThread(client, thread, all.has(thread) ? keyOf(all.get(thread) as Json) : null, id));
        // The live list is the newest word on the threads it names.
        for (const [thread, t] of mine) {
          items.set(thread, { ...items.get(thread), ...t });
        }
        const stateOf = (thread: string): Json | undefined => all.get(thread) ?? infos.get(thread)?.detail ?? items.get(thread);
        worked = new Set([...busy, ...[...asked].filter((t) => working(stateOf(t) ?? {}))]);
        const newest = (t: Json): string => `${str(t["updatedAt"]) ?? ""} ${idOf(t) ?? ""}`;
        const named = [...items.values()].sort((a, b) => (newest(a) < newest(b) ? 1 : newest(a) > newest(b) ? -1 : 0));
        return await snapshotOf({
          root,
          named,
          show: async (thread): Promise<Where> => {
            const state = stateOf(thread);
            const detail = infos.get(thread)?.detail;
            const pending = detail?.["pendingRequestCount"];
            return {
              // A recorded thread T3 doesn't list as live and that was never read isn't running.
              status: state === undefined ? "idle" : statusOf(state),
              worktreePath: str(detail?.["worktreePath"]),
              branch: str(detail?.["branch"]),
              pending: typeof pending === "number" ? pending : 0,
              relationshipToParent: str(detail?.["relationshipToParent"]),
              parent: str(detail?.["parentThreadId"]),
              provider: str(state?.["providerInstanceId"]),
              link: str(state?.["link"]) ?? str(detail?.["link"]),
              error: null,
            };
          },
          ask: (records) => records,
          seen: () => {},
          agents: agentsDirs(root),
          reviews,
          now: new Date(now()),
        });
      } catch (error) {
        for (const thread of asked) {
          dirty.add(thread);
        }
        throw error;
      }
    };

    const forget = (): void => {
      infos.clear();
      fullAt = -Infinity;
    };

    const read = async (cli: () => Promise<T3>): Promise<T3> => {
      await options.ready?.().catch(() => {});
      const began = performance.now();
      const count = { calls: 0 };
      let how = "cli";
      try {
        if (options.client() !== null) {
          try {
            const out = await mcpRead(count);
            how = "mcp";
            return out;
          } catch (error) {
            forget();
            const why = error instanceof Error ? error.message : String(error);
            warn(`T3 over MCP can't be read (${why}); reading it by the t3 command line`);
          }
        }
        return await cli();
      } finally {
        if (process.env["BRAID_BOARD_TIMINGS"] === "1") {
          process.stderr.write(`board t3 (${root}): ${how} ${Math.round(performance.now() - began)} ms${how === "mcp" ? `, ${count.calls} calls` : ""}\n`);
        }
      }
    };

    return {
      read(cli) {
        // One at a time: an action's read waits for the feed's, which shares the caches.
        const next = queue.then(() => read(cli));
        queue = next.catch(() => {});
        return next;
      },
      async errorOf(thread) {
        if (options.client() === null) {
          return "cli";
        }
        try {
          const out = obj(await signedIn().callTool("t3_thread_read", { threadId: thread, view: "activity", limit: ERROR_ITEMS, runLimit: 1, maxCharsPerItem: 4_000 }));
          const run = obj(out?.["thread"])?.["latestRunId"];
          const found = (Array.isArray(out?.["items"]) ? (out["items"] as unknown[]) : [])
            .map(obj)
            .filter((i): i is Json => i !== null && i["type"] === "error" && i["runId"] === run)
            .sort((a, b) => Number(a["position"]) - Number(b["position"]));
          return { error: str(found.at(-1)?.["text"]) };
        } catch (error) {
          return error instanceof McpError && error.kind !== "error" ? "cli" : null;
        }
      },
      stale() {
        fullAt = -Infinity;
      },
      subscribe(refresh) {
        let debounce: NodeJS.Timeout | undefined;
        const soon = (): void => {
          clearTimeout(debounce);
          debounce = setTimeout(refresh, DEBOUNCE_MS);
          debounce.unref();
        };
        const listener: Listener = {
          projectId: () => projectId,
          event(thread) {
            if (thread !== null) {
              dirty.add(thread);
            }
            soon();
          },
          reread() {
            forget();
            settledListed = false;
            soon();
          },
        };
        listeners.add(listener);
        if (!looping) {
          looping = true;
          loop();
        }
        return () => {
          clearTimeout(debounce);
          listeners.delete(listener);
          if (listeners.size === 0) {
            clearTimeout(timer);
            looping = false;
          }
        };
      },
    };
  };

  return { project, live: (maxAgeMs) => live(maxAgeMs), pollEvents };
}
