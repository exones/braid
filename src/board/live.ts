// Keeps the board page's live updates going (0078/O): the page hears of changes only through `/api/events`, and a phone
// browser that froze a backgrounded tab, went offline or lost the board service can leave that stream closed for good, or
// open but silent. No DOM types here: the page passes its environment in (web/src/api.ts).

export const RECONNECT_FIRST_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;
/** The fallback poll, while the page is visible and the stream is down. */
export const POLL_MS = 60_000;
/** The server sends an event every 30 s: this long without one and the stream, or the board shown, counts as stale. */
export const STALE_MS = 90_000;
const CHECK_MS = 5_000;
/** `visibilitychange`, `online` and `pageshow` often come together: one refresh for the burst. */
const RESUME_GAP_MS = 1_000;
/** A fresh read asks GitHub and fetches: resumes make at most one in this long, the others a plain read. */
export const FRESH_GAP_MS = 30_000;

/** Whether a board read at `at` is old enough for the stale marker. */
export const isStale = (at: number, now: number): boolean => now - at > STALE_MS;

export interface LiveStream {
  /** Whether it gave up for good (`EventSource.CLOSED`). */
  closed(): boolean;
  close(): void;
}

export interface StreamHandlers {
  readonly open: () => void;
  readonly message: () => void;
  readonly error: () => void;
}

export interface LiveEnv {
  openStream(on: StreamHandlers): LiveStream;
  now(): number;
  visible(): boolean;
  /** Calls `resume` when the page becomes visible, goes back online or is shown again; returns the unsubscribe. */
  onResume(resume: () => void): () => void;
  setTimeout(run: () => void, ms: number): unknown;
  clearTimeout(timer: unknown): void;
}

/**
 * Opens the event stream and calls `refresh` when the page should read the board again: on each event, and once when
 * the page resumes (`fresh` at most every 30 s). A stream that errors or closes is reopened with backoff, one silent for
 * 90 s at once; while it is down a visible page polls. Returns the stop.
 */
export function keepLive(env: LiveEnv, refresh: (fresh: boolean) => void): () => void {
  let stream: LiveStream | null = null;
  let heard = 0;
  let down = false;
  let polled = 0;
  let resumed = -Infinity;
  let freshAt = -Infinity;
  let delay = RECONNECT_FIRST_MS;
  let retry: unknown;
  let check: unknown;

  const drop = (): void => {
    stream?.close();
    stream = null;
  };
  const connect = (): void => {
    env.clearTimeout(retry);
    drop();
    heard = env.now();
    // A dropped stream's late events are ignored.
    let mine: LiveStream | null = null;
    const current = (): boolean => mine !== null && stream === mine;
    mine = env.openStream({
      open: () => {
        if (!current()) return;
        heard = env.now();
        delay = RECONNECT_FIRST_MS;
        if (down) {
          down = false;
          refresh(false); // what changed while it was down
        }
      },
      message: () => {
        if (!current()) return;
        heard = env.now();
        refresh(false);
      },
      error: () => {
        if (current()) lost();
      },
    });
    stream = mine;
  };
  const goDown = (): void => {
    if (!down) {
      down = true;
      polled = env.now();
    }
  };
  const lost = (): void => {
    goDown();
    drop();
    retry = env.setTimeout(connect, delay);
    delay = Math.min(delay * 2, RECONNECT_MAX_MS);
  };
  const tick = (): void => {
    check = env.setTimeout(tick, CHECK_MS);
    if (stream?.closed() === true) {
      lost();
    }
    if (!env.visible()) {
      return;
    }
    if (stream !== null && env.now() - heard > STALE_MS) {
      goDown();
      connect();
    }
    if (down && env.now() - polled >= POLL_MS) {
      polled = env.now();
      refresh(false);
    }
  };
  const off = env.onResume(() => {
    if (stream === null || stream.closed() || env.now() - heard > STALE_MS) {
      goDown();
      delay = RECONNECT_FIRST_MS;
      connect();
    }
    if (env.now() - resumed >= RESUME_GAP_MS) {
      resumed = env.now();
      const fresh = resumed - freshAt >= FRESH_GAP_MS;
      if (fresh) freshAt = resumed;
      refresh(fresh);
    }
  });

  connect();
  check = env.setTimeout(tick, CHECK_MS);
  return () => {
    off();
    env.clearTimeout(retry);
    env.clearTimeout(check);
    drop();
  };
}
