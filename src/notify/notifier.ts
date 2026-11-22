// The board's notifier: after each refresh that read GitHub and T3, it compares the snapshot's pushes with
// the keys already sent, kept in `.braid/notified.json` of the main checkout (written like `broke.json`: a
// temp file, then a rename), and sends the new ones without waiting for them. A key is stored only once its
// send succeeded, so a failed send is retried at the next refresh; keys whose need is gone are dropped, so a
// need that comes back is sent again.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { BoardData } from "../board/model.js";
import { ensureStateDir } from "../braids/requests.js";
import { readConfig, tokenOf, type NotifyConfig } from "./config.js";
import { pushesOf, sequenceOf, type Push } from "./message.js";
import { ntfyClearer, ntfySender, SEND_TIMEOUT_MS, type Clearer, type Sender } from "./sender.js";

export interface SentState {
  /** The sent keys and the item each is about. */
  readonly keys: Record<string, string>;
  /** True when there was no readable file: this is the first run, and Done braids are recorded without a push. */
  readonly fresh: boolean;
}

export function readSent(file: string): SentState {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    const keys = typeof parsed === "object" && parsed !== null ? (parsed as { keys?: unknown }).keys : undefined;
    if (typeof keys !== "object" || keys === null || Array.isArray(keys)) {
      return { keys: {}, fresh: true };
    }
    return { keys: Object.fromEntries(Object.entries(keys).filter((e): e is [string, string] => typeof e[1] === "string")), fresh: false };
  } catch {
    return { keys: {}, fresh: true };
  }
}

function writeSent(file: string, keys: Readonly<Record<string, string>>): void {
  ensureStateDir(dirname(file));
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify({ keys }, null, 2)}\n`);
  renameSync(tmp, file);
}

export interface NotifierOptions {
  /** `.braid/notified.json` of the main checkout. */
  readonly file: string;
  /** The settings, read at each refresh so `braid notify off` takes effect without a restart. */
  readonly config?: () => NotifyConfig | null;
  readonly send?: Sender;
  /** Clears a push whose need is gone; replaced in tests. */
  readonly clear?: Clearer;
  readonly token?: () => string | null;
  /** Where a failed send is reported: the board's standard error. */
  readonly warn?: (line: string) => void;
  /** A send that hasn't settled by then counts as failed (the sender has its own 10 s timeout too). */
  readonly timeoutMs?: number;
}

export interface Notifier {
  /** Hands a snapshot to the notifier; returns at once, the sends run on their own. */
  (board: BoardData): void;
  /** Resolves when every send started so far has settled (tests). */
  idle(): Promise<void>;
}

export function notifier(opts: NotifierOptions): Notifier {
  const config = opts.config ?? (() => readConfig());
  const send = opts.send ?? ntfySender();
  const clear = opts.clear ?? ntfyClearer();
  const token = opts.token ?? (() => tokenOf());
  const warn = opts.warn ?? ((line: string) => void process.stderr.write(`${line}\n`));
  const timeoutMs = opts.timeoutMs ?? SEND_TIMEOUT_MS + 1_000;
  const flying = new Map<string, Promise<void>>();
  /** The keys the latest snapshot calls for; a stored key outside them is dropped on the next write. */
  let current = new Set<string>();
  let failing = false;

  /** Re-reads the file before writing, so a second board on the same repository loses nothing. */
  const update = (add: Readonly<Record<string, string>>): void => {
    try {
      // Only keys the latest snapshot still calls for: a send that succeeds after its need left is not recorded, so the need's return is sent again.
      const keys = Object.fromEntries(Object.entries({ ...readSent(opts.file).keys, ...add }).filter(([k]) => current.has(k)));
      writeSent(opts.file, keys);
    } catch (e) {
      warn(`braid notify: can't write ${opts.file} (${e instanceof Error ? e.message : "failed"})`);
    }
  };

  const start = (cfg: NotifyConfig, push: Push): void => {
    let timer: NodeJS.Timeout | undefined;
    const late = new Promise<never>((_, fail) => {
      timer = setTimeout(() => fail(new Error(`${new URL(cfg.server).host} did not answer in time`)), timeoutMs);
      timer.unref();
    });
    const run = Promise.race([Promise.resolve().then(() => send(cfg, { title: push.title, body: push.body, tags: push.tags, priority: push.priority, click: push.click, sequence: push.sequence }, token())), late])
      .then(
        () => {
          if (failing) {
            failing = false;
            warn("braid notify: sending again");
          }
          update({ [push.key]: push.item });
        },
        (e: unknown) => {
          if (!failing) {
            failing = true;
            warn(`braid notify: a push failed (${e instanceof Error ? e.message : "failed"}); retrying at each refresh`);
          }
        },
      )
      .finally(() => {
        clearTimeout(timer);
        flying.delete(push.key);
      });
    flying.set(push.key, run);
  };

  const notify = ((board: BoardData): void => {
    // A source that couldn't be read can make a lane look changed: no push, and the sent keys stay as they are.
    if (board.github.state !== "ok" || board.t3.state !== "ok") {
      return;
    }
    const cfg = config();
    if (cfg === null || !cfg.enabled) {
      return;
    }
    const pushes = pushesOf(board);
    current = new Set(pushes.map((p) => p.key));
    const stored = readSent(opts.file);
    const quiet: Record<string, string> = {};
    for (const push of pushes) {
      if (push.key in stored.keys || flying.has(push.key)) {
        continue;
      }
      if (push.kind === "done" && stored.fresh) {
        quiet[push.key] = push.item; // history, not news: the first run records Done braids without a push
        continue;
      }
      start(cfg, push);
    }
    // A need that is gone (its request answered or closed) takes its push off the phone: clear it by its sequence ID,
    // unless a push now carries that same sequence ID (it replaced the old one). Another push of the item (a Done push has
    // no sequence ID) doesn't hold it back. A failed clear is reported, not retried.
    const live = new Set(pushes.flatMap((p) => (p.sequence === null ? [] : [p.sequence])));
    const gone = new Set(
      Object.entries(stored.keys)
        .filter(([k, item]) => !current.has(k) && !k.endsWith("|done") && !live.has(sequenceOf(board.repo, item)))
        .map(([, item]) => item),
    );
    for (const item of gone) {
      const name = `clear ${item}`;
      if (!flying.has(name)) {
        flying.set(
          name,
          Promise.resolve()
            .then(() => clear(cfg, sequenceOf(board.repo, item), token()))
            .catch((e: unknown) => warn(`braid notify: can't clear the push of ${item} (${e instanceof Error ? e.message : "failed"})`))
            .finally(() => flying.delete(name)),
        );
      }
    }
    const dropped = Object.keys(stored.keys).some((k) => !current.has(k));
    if (stored.fresh || dropped || Object.keys(quiet).length > 0) {
      update(quiet);
    }
  }) as Notifier;
  notify.idle = async () => {
    while (flying.size > 0) {
      await Promise.allSettled([...flying.values()]);
    }
  };
  return notify;
}
