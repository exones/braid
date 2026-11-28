// The page's sends (src/board/sends.ts): one list for the Questions panel and the cards, kept in local storage so a reload
// in the middle of a send still shows it as sending.
import { useEffect, useState, useSyncExternalStore } from "react";
import { parseSends, refusal, sendKey, settle, stageOf, type Send } from "../../src/board/sends.ts";
import { answerRequest, closeRequest } from "./api.ts";

const KEY = "braid-sends";

function load(): Send[] {
  try {
    return parseSends(localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

let list: readonly Send[] = load();
/** The sends this page still waits a reply for. */
const alive = new Set<string>();
const listeners = new Set<() => void>();

function write(next: readonly Send[]): void {
  list = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // not remembered: still shown on this page
  }
  for (const l of listeners) {
    l();
  }
}

const keyed = (s: Send): string => sendKey(s.project, s.handle);
const put = (next: Send): void => write([...list.filter((s) => keyed(s) !== keyed(next)), next]);

const subscribe = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Every send, and a clock that runs while one is under way or about to leave. */
export function useSends(): { sends: readonly Send[]; now: number; stage: (s: Send) => ReturnType<typeof stageOf> } {
  const sends = useSyncExternalStore(subscribe, () => list);
  const [now, setNow] = useState(() => Date.now());
  const ticking = sends.some((s) => s.phase === "sending" || s.gone !== null);
  useEffect(() => {
    setNow(Date.now());
    if (!ticking) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [ticking, sends]);
  return { sends, now: Math.max(now, ...sends.map((s) => s.started)), stage: (s) => stageOf(s, Math.max(now, s.started), alive.has(keyed(s))) };
}

/** The open requests of the latest read: sends of requests no longer open are marked, and dropped later. */
export function useSettle(open: ReadonlySet<string> | null): void {
  const { sends, now } = useSends();
  useEffect(() => {
    if (open === null) {
      return;
    }
    const next = settle(sends, open, now);
    if (next.length !== sends.length || next.some((s, i) => s !== sends[i] && s.gone !== sends[i]?.gone)) {
      write(next);
    }
  }, [open, now, sends]);
}

export const dropSend = (s: Send): void => write(list.filter((x) => keyed(x) !== keyed(s)));

/**
 * Sends an answer, an acknowledgement or a dismissal and keeps what became of it; `refresh` reads the board again after.
 * A request already being sent from this page isn't sent again. Resolves true when it was recorded.
 */
export async function submit(project: string, handle: string, press: string, label: string, refresh: () => void, text?: string): Promise<boolean> {
  const key = sendKey(project, handle);
  if (alive.has(key)) {
    return false;
  }
  const base: Send = { project, handle, press, label, started: Date.now(), phase: "sending", note: null, gone: null };
  alive.add(key);
  put(base);
  try {
    const reply = press === "ack" || press === "dismiss" ? await closeRequest(project, handle, press) : await answerRequest(project, handle, text ?? press);
    const told = press !== "ack" && reply.woken === false ? `Recorded; the asking thread isn't ${press === "dismiss" ? "told" : "woken"} yet: ${reply.wake ?? "unknown"}` : null;
    const note = [told, reply.warning ?? null].filter((n) => n !== null).join(" ");
    alive.delete(key);
    put({ ...base, phase: "sent", note: note === "" ? null : note });
    return true;
  } catch (e) {
    alive.delete(key);
    const message = e instanceof Error ? e.message : String(e);
    // fetch rejects with a TypeError when no reply came (the connection dropped, the phone slept): the record may still be written.
    put({ ...base, ...(e instanceof TypeError ? { phase: "failed" as const, note: `no reply from the board (${message}). It may still be recorded: look under Decided before pressing again.` } : refusal(message)) });
    return false;
  } finally {
    refresh();
  }
}
