// The board page's live updates (0078/O, src/board/live.ts) with a fake event stream and clock.
import assert from "node:assert/strict";
import { test } from "node:test";
import { isStale, keepLive, type LiveEnv, type StreamHandlers } from "../src/board/live.ts";
import { failedRead, readUrl, type Shown } from "../src/board/reply.ts";

function page() {
  let now = 0;
  let timers: { at: number; run: () => void }[] = [];
  let resume = () => {};
  let listening = false;
  const streams: { on: StreamHandlers; state: "open" | "closed" | "dead" }[] = [];
  const refreshes: boolean[] = [];
  const state = { visible: true };
  const env: LiveEnv = {
    openStream: (on) => {
      const stream: (typeof streams)[number] = { on, state: "open" };
      streams.push(stream);
      return { closed: () => stream.state === "dead", close: () => void (stream.state = "closed") };
    },
    now: () => now,
    visible: () => state.visible,
    onResume: (run) => {
      resume = run;
      listening = true;
      return () => void (listening = false);
    },
    setTimeout: (run, ms) => {
      const timer = { at: now + ms, run };
      timers.push(timer);
      return timer;
    },
    clearTimeout: (timer) => void (timers = timers.filter((t) => t !== timer)),
  };
  const stop = keepLive(env, (fresh) => refreshes.push(fresh));
  const advance = (ms: number): void => {
    const end = now + ms;
    for (;;) {
      const next = timers.filter((t) => t.at <= end).sort((a, b) => a.at - b.at)[0];
      if (next === undefined) break;
      timers = timers.filter((t) => t !== next);
      now = next.at;
      next.run();
    }
    now = end;
  };
  const last = () => streams[streams.length - 1]!;
  return { streams, refreshes, state, advance, last, stop, resume: () => resume(), pending: () => timers.length, listening: () => listening };
}

test("each event refreshes, and a healthy stream stays the one stream with no poll", () => {
  const p = page();
  p.last().on.open();
  for (let i = 0; i < 10; i++) {
    p.advance(30_000);
    p.last().on.message();
  }
  assert.equal(p.streams.length, 1);
  assert.deepEqual(p.refreshes, Array(10).fill(false));
});

test("a failed stream is reopened with backoff of 1 s doubling to 30 s, reset once one opens", () => {
  const p = page();
  const waits = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000];
  for (const [i, wait] of waits.entries()) {
    p.last().on.error();
    assert.equal(p.streams[i]!.state, "closed");
    p.advance(wait - 1);
    assert.equal(p.streams.length, i + 1, `reopened before ${wait} ms`);
    p.advance(1);
    assert.equal(p.streams.length, i + 2, `not reopened after ${wait} ms`);
  }
  p.refreshes.length = 0;
  p.last().on.open();
  assert.deepEqual(p.refreshes, [false], "back up: read what changed meanwhile");
  p.last().on.error();
  p.advance(1_000);
  assert.equal(p.streams.length, waits.length + 2);
  p.streams[0]!.on.message();
  p.streams[0]!.on.error();
  assert.deepEqual(p.refreshes, [false], "a dropped stream's late events do nothing");
});

test("a stream that closed without an error event is reopened", () => {
  const p = page();
  p.last().on.open();
  p.last().state = "dead";
  p.advance(6_000);
  assert.equal(p.streams.length, 2);
});

test("the poll runs about every 60 s, only while visible with the stream down", () => {
  const p = page();
  const failFor = (ms: number): void => {
    for (let t = 0; t < ms; t += 1_000) {
      if (p.last().state === "open") p.last().on.error();
      p.advance(1_000);
    }
  };
  failFor(190_000);
  assert.deepEqual(p.refreshes, [false, false, false]);
  p.state.visible = false;
  p.refreshes.length = 0;
  failFor(200_000);
  assert.deepEqual(p.refreshes, []);
});

test("an open but silent stream is reopened after 90 s, only while visible", () => {
  const p = page();
  p.last().on.open();
  p.state.visible = false;
  p.advance(200_000);
  assert.equal(p.streams.length, 1);
  p.state.visible = true;
  p.advance(5_000);
  assert.equal(p.streams.length, 2);
  assert.equal(p.streams[0]!.state, "closed");
});

test("a silent stream is reopened once per 90 s of silence, not at every check", () => {
  const p = page();
  p.last().on.open();
  p.advance(95_000);
  assert.equal(p.streams.length, 2);
  p.advance(90_000);
  assert.equal(p.streams.length, 2, "the new stream has its own 90 s");
  p.advance(5_000);
  assert.equal(p.streams.length, 3);
});

test("resumes more than a second apart make at most one fresh read per 30 s", () => {
  const p = page();
  p.last().on.open();
  for (let i = 0; i < 15; i++) {
    p.resume();
    p.advance(2_000);
  }
  assert.deepEqual(p.refreshes, [true, ...Array(14).fill(false)]);
  p.refreshes.length = 0;
  p.resume();
  assert.deepEqual(p.refreshes, [true], "30 s after the last fresh one");
});

test("a read with no reply keeps the board, stale after 90 s, until the next good read", async () => {
  const reply = (status: number, body: string) => () => Promise.resolve(new Response(body, { status }));
  const offline = () => Promise.reject(new TypeError("Failed to fetch"));
  let shown: Shown<{ n: number }> | null = null;
  const read = async (now: number, request: Parameters<typeof readUrl>[1]): Promise<void> => {
    try {
      shown = { url: "/api/all", value: { state: "ready", data: await readUrl<{ n: number }>("/api/all", request), at: now } };
    } catch (error) {
      shown = failedRead(shown, "/api/all", error);
    }
  };
  const marked = (now: number): boolean => shown?.value.state === "ready" && isStale(shown.value.at, now);

  await read(0, reply(200, '{"n":1}'));
  const good = shown;
  await read(60_000, offline);
  assert.equal(shown, good, "the board stays");
  assert.equal(marked(90_000), false);
  assert.equal(marked(90_001), true);
  await read(120_000, reply(200, '{"n":2}'));
  assert.equal(marked(120_000), false);

  await read(130_000, reply(500, '{"error":"read failed"}'));
  assert.equal((shown as Shown<{ n: number }> | null)?.value.state, "error", "the board's own error shows");
});

test("a resume refreshes once for a burst of events and reopens a stream that is down or silent", () => {
  const p = page();
  p.last().on.open();
  p.resume();
  p.resume();
  assert.deepEqual(p.refreshes, [true]);
  assert.equal(p.streams.length, 1, "a live stream is left alone");

  p.last().on.error();
  p.advance(500);
  p.resume();
  assert.equal(p.streams.length, 2, "reopened at once, not after the backoff");
  p.advance(60_000);
  assert.equal(p.streams.length, 2, "the pending retry was cancelled");

  p.last().on.open();
  p.state.visible = false;
  p.advance(120_000);
  p.refreshes.length = 0;
  p.state.visible = true;
  p.resume();
  assert.equal(p.streams.length, 3);
  assert.deepEqual(p.refreshes, [true]);
});

test("stopping closes the stream and leaves no timer or listener", () => {
  const p = page();
  p.last().on.error();
  p.stop();
  assert.equal(p.pending(), 0);
  assert.equal(p.listening(), false);
  assert.equal(p.last().state, "closed");
});
