import { useEffect, useState } from "react";
import type { ItemDetail } from "../../src/board/model.ts";
import { readReply } from "../../src/board/reply.ts";
import type { AllBoard } from "../../src/board/combined.ts";

export type { InboxData, InboxEntry } from "../../src/board/inbox.ts";
export type { BoardData, BraidCard, ItemDetail, Lane, CoordinatorInfo, MergeInfo, Need, StartInfo, StrandCard, ThreadRole } from "../../src/board/model.ts";
export type { PullRequest } from "../../src/board/github.ts";
export type { LimitsView, ProviderView } from "../../src/board/limits.ts";
export type { WindowReading } from "../../src/braids/limits.ts";
export type { AllBoard, ProjectInfo, TaggedCard, TaggedProgramme } from "../../src/board/combined.ts";

export type Loaded<T> = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: T };

async function get<T>(url: string): Promise<T> {
  return readReply<T>(await fetch(url));
}

const TOKEN_KEY = "braid-token";

/** The session token: taken once from the `#token=` fragment of the opened URL, then kept in session storage. */
function sessionToken(): string | null {
  const fromUrl = /^#token=([0-9a-f]+)$/.exec(location.hash)?.[1];
  if (fromUrl !== undefined) {
    sessionStorage.setItem(TOKEN_KEY, fromUrl);
    history.replaceState(null, "", location.pathname + location.search);
  }
  return sessionStorage.getItem(TOKEN_KEY);
}
sessionToken();

/** Runs the board action `name` on the server with the session token; the reply is the action's result. The body carries the `project` the action is for (docs/board.md, "Several projects"). */
export async function postAction<T = unknown>(name: string, body: object = {}): Promise<T> {
  const response = await fetch(`/api/action/${encodeURIComponent(name)}`, {
    method: "POST",
    // x-braid-request: a header a cross-site page can't send without a CORS preflight; the Tailscale listener requires it (D60).
    headers: { "content-type": "application/json", "x-braid-token": sessionToken() ?? "", "x-braid-request": "1" },
    body: JSON.stringify(body),
  });
  return readReply<T>(response);
}

/** What the board's `answer` action replies (0082/D): the recorded answer, and whether the asking thread was woken (`wake`: why not). */
export interface Answered {
  readonly ok: true;
  readonly handle: string;
  readonly id: string;
  readonly answer: string;
  readonly woken: boolean;
  readonly wake: string | null;
  readonly warning: string | null;
}

/** The longest answer the board takes: one line (src/commands/requests.ts `BOARD_ANSWER_MAX`). */
export const ANSWER_MAX = 500;

/**
 * Answers an open request of `project` from the board (0082/D): `text` is an option letter (`A`) or one line of free text, sent at
 * once with no confirmation (D118). A request answered, withdrawn or met meanwhile is refused: the promise rejects with the
 * board's reason, which the page shows. Text that isn't one line, or is longer than `ANSWER_MAX`, is refused here without a call.
 */
export async function answerRequest(project: string, handle: string, text: string): Promise<Answered> {
  const answer = text.trim();
  if (answer === "" || /[\r\n]/.test(answer) || answer.length > ANSWER_MAX) {
    throw new Error(`An answer is an option letter or one line of text, at most ${ANSWER_MAX} characters`);
  }
  return postAction<Answered>("answer", { project, handle, text: answer });
}

/** A reload request: `n` changes on every one; `fresh` skips the server's short-lived reads. */
export interface Tick {
  readonly n: number;
  readonly fresh: boolean;
}

/** Loads `url` and again on each tick; a null `url` fetches nothing and stays loading. */
function useLoad<T>(url: string | null, tick: Tick): Loaded<T> {
  const [result, setResult] = useState<{ url: string; value: Loaded<T> } | null>(null);
  useEffect(() => {
    if (url === null) {
      return;
    }
    let live = true;
    get<T>(tick.fresh ? `${url}${url.includes("?") ? "&" : "?"}fresh=1` : url).then(
      (data) => live && setResult({ url, value: { state: "ready", data } }),
      (error: unknown) =>
        live && setResult({ url, value: { state: "error", message: error instanceof Error ? error.message : String(error) } }),
    );
    return () => {
      live = false;
    };
  }, [url, tick]);
  return result !== null && result.url === url ? result.value : { state: "loading" };
}

/** The combined board of every project served; the page filters it by the address's `?projects=`. */
export const useAll = (tick: Tick): Loaded<AllBoard> => useLoad<AllBoard>("/api/all", tick);
/** One item; with no `project` (an address naming a project that isn't served) nothing is fetched. */
export const useItem = (id: string, project: string | null, tick: Tick): Loaded<ItemDetail> =>
  useLoad<ItemDetail>(project === null ? null : `/api/item?project=${encodeURIComponent(project)}&id=${encodeURIComponent(id)}`, tick);

/** The reload requests: the server pushes one every 30 s and when a braid file changes; `refresh` is the button. */
export function useTick(): { tick: Tick; refresh: () => void } {
  const [tick, setTick] = useState<Tick>({ n: 0, fresh: false });
  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = () => setTick((t) => ({ n: t.n + 1, fresh: false }));
    return () => events.close();
  }, []);
  return { tick, refresh: () => setTick((t) => ({ n: t.n + 1, fresh: true })) };
}
