// `Decided:` lines: an ordinary log entry whose text starts with `Decided:`. Listed by `braid decisions`
// and carried into the recap draft; there is no file or command of their own.

export interface Decided {
  /** The entry's heading time, `YYYY-MM-DD HH:MM` (UTC). */
  readonly at: string;
  /** The entry text on one line, starting with `Decided:`. */
  readonly text: string;
}

const HEADING = /^## (\d{4}-\d{2}-\d{2} \d{2}:\d{2})Z(?: checkpoint)?[ \t]*$/m;

/** The `Decided:` entries of one log file's text, in file order. */
export function decidedEntries(log: string): Decided[] {
  const parts = log.replace(/\r\n?/g, "\n").split(new RegExp(HEADING.source, "gm"));
  const found: Decided[] = [];
  // split with a capture group: [before, at, body, at, body, ...]
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const text = (parts[i + 1] ?? "").trim();
    if (text.startsWith("Decided:")) {
      found.push({ at: parts[i] ?? "", text: text.replace(/\s+/g, " ") });
    }
  }
  return found;
}
