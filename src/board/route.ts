/**
 * The board's hash route. `#/` is the board alone, `#/0003` and `#/0003/A` the board with that
 * item's details open over it (`?tab=report` picks a tab), and `#/inbox` the Inbox page. The
 * board is always the base view, so an item id never replaces it.
 */
export interface Route {
  /** The item whose details are open, or null; `inbox` is not an item. */
  readonly id: string | null;
  readonly inbox: boolean;
  readonly tab: string;
}

export function parseHash(hash: string): Route {
  const [path = "", query = ""] = hash.replace(/^#\/?/, "").split("?");
  return {
    id: path === "" || path === "inbox" ? null : path,
    inbox: path === "inbox",
    tab: new URLSearchParams(query).get("tab") ?? "brief",
  };
}

/** The hash that opens an item's details (or the bare board for null). */
export function hashFor(id: string | null, tab = "brief"): string {
  return id === null ? "#/" : `#/${id}${tab === "brief" ? "" : `?tab=${tab}`}`;
}
