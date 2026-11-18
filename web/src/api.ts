import { useEffect, useState } from "react";
import type { BoardData, ItemDetail } from "../../src/board/model.ts";

export type { InboxData, InboxEntry } from "../../src/board/inbox.ts";
export type { BoardData, BraidCard, ItemDetail, Lane, CoordinatorInfo, MergeInfo, Need, StartInfo, StrandCard } from "../../src/board/model.ts";
export type { PullRequest } from "../../src/board/github.ts";

export type Loaded<T> = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: T };

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body ? String(body.error) : response.statusText;
    throw new Error(message);
  }
  return body as T;
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

/** Runs the board action `name` on the server with the session token; the reply is the action's result. */
export async function postAction<T = unknown>(name: string, body: unknown = {}): Promise<T> {
  const response = await fetch(`/api/action/${encodeURIComponent(name)}`, {
    method: "POST",
    // x-braid-request: a header a cross-site page can't send without a CORS preflight; the Tailscale listener requires it (D60).
    headers: { "content-type": "application/json", "x-braid-token": sessionToken() ?? "", "x-braid-request": "1" },
    body: JSON.stringify(body),
  });
  const reply: unknown = await response.json();
  if (!response.ok) {
    throw new Error(typeof reply === "object" && reply !== null && "error" in reply ? String(reply.error) : response.statusText);
  }
  return reply as T;
}

/** A reload request: `n` changes on every one; `fresh` skips the server's short-lived reads. */
export interface Tick {
  readonly n: number;
  readonly fresh: boolean;
}

function useLoad<T>(url: string, tick: Tick): Loaded<T> {
  const [result, setResult] = useState<{ url: string; value: Loaded<T> } | null>(null);
  useEffect(() => {
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

export const useBoard = (tick: Tick): Loaded<BoardData> => useLoad<BoardData>("/api/board", tick);
export const useItem = (id: string, tick: Tick): Loaded<ItemDetail> => useLoad<ItemDetail>(`/api/item?id=${encodeURIComponent(id)}`, tick);

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
