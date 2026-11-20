/**
 * Which projects the board shows: `?projects=a,b` in the page's address (`?project=a` is the older form and works
 * the same). No parameter, or none of its names served, means every project. Kept in the address so a bookmark or a
 * phone link opens the same view.
 */

/** The names the address asks for, in the order the projects are served (not the order of the address), unserved names dropped. */
export function parseFilter(search: string, served: readonly string[]): string[] {
  const params = new URLSearchParams(search);
  const raw = params.get("projects") ?? params.get("project");
  if (raw === null) {
    return [...served];
  }
  const asked = new Set(raw.split(",").map((n) => n.trim()).filter((n) => n !== ""));
  const chosen = served.filter((n) => asked.has(n));
  return chosen.length === 0 ? [...served] : chosen;
}

/** The query for `selected`: empty when every served project is selected, so the plain address stays plain. */
export function filterSearch(selected: readonly string[], served: readonly string[]): string {
  const chosen = served.filter((n) => selected.includes(n));
  return chosen.length === 0 || chosen.length === served.length ? "" : `?projects=${chosen.map(encodeURIComponent).join(",")}`;
}

/** `selected` with `name` ticked or unticked; the last shown project can't be unticked (the board never shows nothing). */
export function toggleProject(selected: readonly string[], name: string, served: readonly string[]): string[] {
  const next = selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name];
  return next.length === 0 ? [...selected] : served.filter((n) => next.includes(n));
}

/**
 * The project an item's address is in: the name in `#/p/<name>/...` when it is served, else the first project shown.
 * A name that isn't served is `unknown` (a project removed from the list, a mistyped link): the page says so and asks
 * the server nothing. `null` when no project is served yet.
 */
export function resolveProject(asked: string | null, selected: readonly string[], served: readonly string[]): { readonly name: string } | { readonly unknown: string } | null {
  if (asked !== null) {
    return served.includes(asked) ? { name: asked } : { unknown: asked };
  }
  const first = selected[0] ?? served[0];
  return first === undefined ? null : { name: first };
}
