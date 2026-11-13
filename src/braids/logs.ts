// Per-thread log files and report.md. A log file is
// `log-<YYYY-MM-DD>-<thread>.md`; each entry is a `## <time>` heading plus its text.
import { appendFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LOG_FILE } from "./store.js";

/** The first 8 letters or digits of a thread id; `user` when there is no thread. */
export function threadShort(thread: string | undefined): string | null {
  if (thread === undefined) {
    return "user";
  }
  const short = thread.replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
  return short.length === 8 ? short : null;
}

/** BRAID_NOW (an ISO time) fixes the clock for tests. */
export function now(): Date {
  const fixed = process.env["BRAID_NOW"];
  const date = fixed === undefined ? new Date() : new Date(fixed);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function logHeading(at: Date, checkpoint: boolean): string {
  const stamp = at.toISOString().slice(0, 16).replace("T", " ");
  return `## ${stamp}Z${checkpoint ? " checkpoint" : ""}`;
}

/** Appends an entry to the thread's log in `dir`, creating it on first use; returns the file name. */
export function appendLog(dir: string, short: string, text: string, checkpoint: boolean, at: Date): string {
  const existing = readdirSync(dir)
    .filter((name) => LOG_FILE.exec(name)?.[2] === short)
    .sort()[0];
  const name = existing ?? `log-${at.toISOString().slice(0, 10)}-${short}.md`;
  const path = join(dir, name);
  const entry = `${logHeading(at, checkpoint)}\n\n${text}\n`;
  if (existing === undefined && !existsSync(path)) {
    writeFileSync(path, entry);
  } else {
    appendFileSync(path, `\n${entry}`);
  }
  return name;
}

/** Writes report.md, or appends `text` after a blank line; returns what was done. */
export function writeReport(dir: string, text: string, append: boolean): "wrote" | "appended" {
  const path = join(dir, "report.md");
  if (append && existsSync(path)) {
    appendFileSync(path, `\n${text}\n`);
    return "appended";
  }
  writeFileSync(path, `${text}\n`);
  return "wrote";
}
