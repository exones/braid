// A poll consumer of one T3 event type. Events are hints that something changed, kept by T3 in memory only, so a
// lost or repeated one must never break the caller: nothing is acknowledged or stored, and after a gap the caller
// reads what it cares about again.
import { McpError, type McpClient } from "./client.js";

/** What narrows a thread event type; subagent threads are left out unless asked for. */
export interface EventArguments {
  readonly projectIds?: readonly string[];
  readonly threadIds?: readonly string[];
  readonly includeSubagentChildren?: boolean;
}

/** The fields every T3 milestone carries; each type adds its own. */
export interface T3Event {
  readonly id: string;
  readonly type: string;
  readonly projectId: string | null;
  readonly threadId: string | null;
  readonly [field: string]: unknown;
}

export interface EventHandlers {
  onEvent(event: T3Event): void | Promise<void>;
  /** Something may be missing (the reader fell behind, or T3 restarted): read everything again. */
  onReread(): void | Promise<void>;
}

export interface EventsReader {
  /** Where the next poll reads on; null until the first one, which starts from now. */
  readonly cursor: string | null;
  /**
   * Reads every page there is and returns the milliseconds T3 asks to wait before the next poll. One at a time.
   * On a failure the cursor stays after the last page handled, so the next poll reads the rest.
   */
  pollOnce(): Promise<number>;
}

const DEFAULT_NEXT_POLL_MS = 30_000;

export function eventsReader(
  client: McpClient,
  name: string,
  args: EventArguments,
  handlers: EventHandlers,
  options: { readonly maxEvents?: number } = {},
): EventsReader {
  let cursor: string | null = null;
  return {
    get cursor() {
      return cursor;
    },
    async pollOnce() {
      for (;;) {
        const page = (await client.call("events/poll", { name, arguments: args, cursor, ...options })) as {
          events?: { data: T3Event }[];
          cursor?: unknown;
          truncated?: boolean;
          hasMore?: boolean;
          nextPollMs?: unknown;
        };
        if (!Array.isArray(page?.events) || typeof page.cursor !== "string") {
          throw new McpError("error", `T3 MCP events/poll ${name}: unexpected page`);
        }
        // Re-read first, then apply what came after.
        if (page.truncated === true) {
          await handlers.onReread();
        }
        for (const event of page.events) {
          await handlers.onEvent(event.data);
        }
        const moved = page.cursor !== cursor;
        cursor = page.cursor;
        // A page that doesn't move the cursor would repeat for ever.
        if (page.hasMore !== true || !moved) {
          return typeof page.nextPollMs === "number" ? page.nextPollMs : DEFAULT_NEXT_POLL_MS;
        }
      }
    },
  };
}
