import { useEffect, useState } from "react";
import type { BoardData, ItemDetail } from "../../src/board/model.ts";

export type { BoardData, BraidCard, ItemDetail, Lane } from "../../src/board/model.ts";

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

function useLoad<T>(url: string): Loaded<T> {
  const [result, setResult] = useState<{ url: string; value: Loaded<T> } | null>(null);
  useEffect(() => {
    let live = true;
    get<T>(url).then(
      (data) => live && setResult({ url, value: { state: "ready", data } }),
      (error: unknown) =>
        live && setResult({ url, value: { state: "error", message: error instanceof Error ? error.message : String(error) } }),
    );
    return () => {
      live = false;
    };
  }, [url]);
  return result !== null && result.url === url ? result.value : { state: "loading" };
}

export const useBoard = (): Loaded<BoardData> => useLoad<BoardData>("/api/board");
export const useItem = (id: string): Loaded<ItemDetail> => useLoad<ItemDetail>(`/api/item?id=${encodeURIComponent(id)}`);
