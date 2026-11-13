// braid log and braid report: record a strand's life. `braid log` stages its file
// with git add and never commits.
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { appendLog, now, threadShort, writeReport } from "../braids/logs.js";
import { GitError } from "../braids/numbers.js";
import { loadBraids } from "../braids/store.js";
import { UsageError } from "./braids.js";
import { find, parse, readText, str } from "./edit.js";

/** The text from `--file`, `--text` or, for braid log, the one positional. */
function input(command: string, values: Parameters<typeof readText>[0], cwd: string, positional: string | undefined): string {
  const file = str(values, "file");
  const text = positional === undefined ? values : { ...values, text: positional };
  const given = file === undefined || file === "-" ? text : { ...text, file: resolve(cwd, file) };
  let result: string;
  try {
    result = readText(given);
  } catch (error) {
    if (error instanceof UsageError && error.message.startsWith("braid brief")) {
      throw new UsageError(error.message.replace("braid brief", command));
    }
    throw error;
  }
  if (result === "") {
    throw new UsageError(`${command} text must not be empty`);
  }
  return result;
}

export function logEntry(root: string, cwd: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid log", args, {
    thread: { type: "string" },
    checkpoint: { type: "boolean" },
    file: { type: "string" },
    text: { type: "string" },
  });
  if (positionals.length > 2) {
    throw new UsageError("braid log takes an id and one text (quote it)");
  }
  const thread = str(values, "thread");
  const short = threadShort(thread);
  if (short === null) {
    throw new UsageError(`--thread needs an id with at least 8 letters or digits; got: ${thread ?? ""}`);
  }
  const { item } = find(loadBraids(root), positionals[0], "braid log");
  const text = input("braid log", values, cwd, positionals[1]);
  const name = appendLog(join(root, item.folder), short, text, values["checkpoint"] === true, now());
  const path = `${item.folder}/${name}`;
  const add = spawnSync("git", ["add", "--", path], { cwd: root, encoding: "utf8" });
  if (add.status !== 0) {
    throw new GitError(`wrote ${path} but git add failed: ${(add.stderr || String(add.error ?? "")).trim()}`);
  }
  return `Logged ${item.brief.id}: ${path}\n`;
}

export function reportItem(root: string, cwd: string, args: readonly string[]): string {
  const { positionals, values } = parse("braid report", args, {
    file: { type: "string" },
    text: { type: "string" },
    append: { type: "boolean" },
  });
  if (positionals.length !== 1) {
    throw new UsageError("braid report takes one id, like: braid report 0002/A --file report.md [--append]");
  }
  const { item } = find(loadBraids(root), positionals[0], "braid report");
  const text = input("braid report", values, cwd, undefined);
  const done = writeReport(join(root, item.folder), text, values["append"] === true);
  return `Report ${done}: ${item.folder}/report.md\n`;
}
