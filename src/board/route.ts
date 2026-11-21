/**
 * The board's hash route. `#/` is the board alone, `#/0003` and `#/0003/A` the board with that
 * item's details open over it (`?tab=report` picks a tab), and `#/inbox` the Inbox page. The
 * board is always the base view, so an item id never replaces it. With several projects the
 * item's project is in the path: `#/p/<project>/0003`; without it the item is in the first
 * project shown. Which projects the board shows is not in the hash but in the address's
 * `?projects=` (`filter.ts`).
 */
export interface Route {
  /** The item whose details are open, or null; `inbox` is not an item. */
  readonly id: string | null;
  readonly inbox: boolean;
  readonly tab: string;
  /** The project named in `#/p/<project>/...`, or null (the first one shown). */
  readonly project: string | null;
}

function decodeProject(name: string): string {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

export function parseHash(hash: string): Route {
  const [full = "", query = ""] = hash.replace(/^#\/?/, "").split("?");
  const scoped = /^p\/([^/]+)\/(.*)$/.exec(full);
  const path = scoped === null ? full : (scoped[2] ?? "");
  return {
    id: path === "" || path === "inbox" ? null : path,
    inbox: path === "inbox",
    tab: new URLSearchParams(query).get("tab") ?? "brief",
    project: scoped === null ? null : decodeProject(scoped[1] ?? ""),
  };
}

/** The hash that opens an item's details (or the bare board for null); `project` puts the item's project in the path. */
export function hashFor(id: string | null, tab = "brief", project: string | null = null): string {
  if (id === null) {
    return "#/";
  }
  const base = project === null ? "#/" : `#/p/${encodeURIComponent(project)}/`;
  return `${base}${id}${tab === "brief" ? "" : `?tab=${tab}`}`;
}

/** Opening details from the bare board adds a history entry (one Back closes them); inside open details it replaces, so moving between items and tabs adds none. */
export function openMode(currentHash: string): "push" | "replace" {
  return parseHash(currentHash).id === null ? "push" : "replace";
}

/** Closing goes Back when this page pushed the entry; for details that arrived with the page (a shared link) Back would leave the site, so it replaces with the board. */
export function closeMode(pushedOpen: boolean): "back" | "replace" {
  return pushedOpen ? "back" : "replace";
}

/** Whether the open details count as pushed after the route changed: reaching the bare board forgets it, so a later link opened on the board starts fresh. */
export function pushedAfter(pushedOpen: boolean, next: Route): boolean {
  return next.id === null ? false : pushedOpen;
}
