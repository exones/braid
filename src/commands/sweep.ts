// The sweep commands: `braid inbox take|pass|drop|reopen` change entries on `braid-inbox`, each as one
// commit through writeInbox. Every entry is validated before anything is written, so a typo changes nothing.
// See docs/braids-format.md, "The inbox".
import { writeInbox, INBOX_BRANCH, REMOTE, type InboxView } from "../inbox/branch.js";
import { ENTRY_ID, entryPath, formatEntry, isProblem, KINDS, parseEntry, type Entry, type EntryFields } from "../inbox/entries.js";
import { UsageError } from "./braids.js";
import { parse } from "./edit.js";
import type { Said } from "./inbox.js";

export const SWEEP_VERBS = ["take", "pass", "drop", "reopen"] as const;
type Verb = (typeof SWEEP_VERBS)[number];

/** A leftover is dropped when this many sweeps passed it over. */
export const PASS_LIMIT = 2;

const BRAID_ID = /^\d{4}$/;

function load(current: InboxView, id: string): Entry {
  for (const kind of KINDS) {
    const path = entryPath(kind, id);
    const content = current.read(path);
    if (content !== null) {
      const parsed = parseEntry(path, content, null);
      if (isProblem(parsed)) {
        throw new UsageError(`${parsed.file} is malformed: ${parsed.field}: ${parsed.message}`);
      }
      return parsed;
    }
  }
  throw new UsageError(`no inbox entry ${id} in ${INBOX_BRANCH}`);
}

function save(entry: Entry, change: Partial<EntryFields>): string {
  return formatEntry(entry.kind, { ...entry, ...change }, entry.text);
}

function words(command: string, args: readonly string[], verb: Verb): { ids: string[]; into: string[]; why: string } {
  const { positionals, values } = parse(`braid inbox ${verb}`, args, { into: { type: "string", multiple: true }, why: { type: "string" } });
  const ids = positionals;
  if (ids.length === 0) {
    throw new UsageError(`usage: ${command}`);
  }
  const bad = ids.find((id) => !ENTRY_ID.test(id));
  if (bad !== undefined) {
    throw new UsageError(`an inbox entry id looks like 2026-11-18-k3f9; got: ${bad}`);
  }
  if (new Set(ids).size !== ids.length) {
    throw new UsageError("an entry is named twice");
  }
  const into = (Array.isArray(values["into"]) ? values["into"] : []).flatMap((v) => String(v).split(",")).map((v) => v.trim()).filter((v) => v !== "");
  const why = typeof values["why"] === "string" ? values["why"].replace(/\s+/g, " ").trim() : "";
  if (verb !== "take" && into.length > 0) {
    throw new UsageError(`braid inbox ${verb} doesn't take --into`);
  }
  if (verb !== "drop" && values["why"] !== undefined) {
    throw new UsageError(`braid inbox ${verb} doesn't take --why`);
  }
  return { ids, into, why };
}

export function sweepCommand(root: string, verb: Verb, args: readonly string[]): Said {
  const usage = {
    take: "braid inbox take <entry>... --into <braid id>[,<braid id>...]",
    pass: "braid inbox pass <leftover>...",
    drop: 'braid inbox drop <entry>... --why "<reason>"',
    reopen: "braid inbox reopen <entry>",
  }[verb];
  const { ids, into, why } = words(usage, args, verb);
  if (verb === "take" && into.length === 0) {
    throw new UsageError(`usage: ${usage}`);
  }
  const badBraid = into.find((b) => !BRAID_ID.test(b));
  if (badBraid !== undefined) {
    throw new UsageError(`--into takes braid ids like 0020; got: ${badBraid}`);
  }
  if (verb === "drop" && why === "") {
    throw new UsageError(`usage: ${usage}`);
  }
  if (verb === "reopen" && ids.length !== 1) {
    throw new UsageError(`usage: ${usage}`);
  }

  const counts = { taken: 0, passed: 0, dropped: 0, reopened: 0 };
  const result = writeInbox(root, (current) => {
    counts.taken = counts.passed = counts.dropped = counts.reopened = 0;
    const files = new Map<string, string>();
    const entries = ids.map((id) => load(current, id));
    // Validate every entry first; the write below runs only when all of them pass.
    for (const e of entries) {
      if (verb === "reopen" ? e.status === "open" : e.status !== "open") {
        throw new UsageError(`${e.id} is ${e.status}${verb === "reopen" ? ", not dropped or taken" : ""}; ${verb === "reopen" ? "only a dropped or taken entry can be reopened" : "reopen it first to change it"}`);
      }
      if (verb === "pass" && e.kind === "idea") {
        throw new UsageError(`${e.id} is an idea; ideas are never passed over (take it, drop it with --why, or leave it)`);
      }
    }
    for (const e of entries) {
      if (verb === "take") {
        files.set(e.file, save(e, { status: "taken", into }));
        counts.taken++;
      } else if (verb === "drop") {
        files.set(e.file, save(e, { status: "dropped", why }));
        counts.dropped++;
      } else if (verb === "reopen") {
        files.set(e.file, save(e, { status: "open", why: null, passed: e.kind === "leftover" ? 0 : null }));
        counts.reopened++;
      } else {
        const passed = (e.passed ?? 0) + 1;
        counts.passed++;
        if (passed >= PASS_LIMIT) {
          files.set(e.file, save(e, { passed, status: "dropped", why: `passed over in ${PASS_LIMIT} sweeps` }));
          counts.dropped++;
        } else {
          files.set(e.file, save(e, { passed }));
        }
      }
    }
    const parts = [
      counts.taken > 0 ? `take ${counts.taken}` : "",
      counts.passed > 0 ? `pass ${counts.passed}` : "",
      counts.dropped > 0 ? `drop ${counts.dropped}` : "",
      counts.reopened > 0 ? `reopen ${counts.reopened}` : "",
    ].filter((p) => p !== "");
    return { files, message: verb === "reopen" ? `docs(inbox): reopen ${ids[0] ?? ""}` : `docs(inbox): sweep: ${parts.join(", ")}` };
  });
  const summary = [
    counts.taken > 0 ? `took ${counts.taken} into ${into.join(", ")}` : "",
    counts.passed > 0 ? `passed over ${counts.passed}${counts.dropped > 0 ? `, ${counts.dropped} of them dropped (passed over in ${PASS_LIMIT} sweeps)` : ""}` : "",
    verb === "drop" ? `dropped ${counts.dropped}` : "",
    counts.reopened > 0 ? `reopened ${ids[0] ?? ""}` : "",
  ].filter((p) => p !== "");
  const where = result.pushed ? `pushed to ${REMOTE}/${INBOX_BRANCH}` : `kept on the local ${INBOX_BRANCH}`;
  return {
    stdout: `${summary.join("; ")} (${where}, ${result.commit.slice(0, 7)})\n`,
    stderr: result.warning === null ? "" : `warning: ${result.warning}\n`,
  };
}
