// The one input of the lanes (docs/board.md, "Lanes"): the board, `braid status`, Start, Open thread and the Merge action all read it here, so they
// give the same lane for the same braid. It is the braids, GitHub, T3, the signals (requests, lifecycle, pauses, the plans of the programmes and
// the pauses their holds put on the braids) and the start context. Reading it writes nothing; the step after a derivation (`sig.commit(alarms)`) does.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Braid } from "../braids/store.js";
import type { Failure } from "./failure.js";
import type { Github } from "./github.js";
import type { StartContext } from "./model.js";
import type { PlanRead } from "./plans.js";
import { heldPauses } from "./programme.js";
import type { ReadSignals } from "./signals.js";
import type { T3 } from "./t3.js";

/** What the lanes are read from: the pieces of `Sources` (the board's) that `braid status` fills from its own runners. */
export interface InputSources {
  braids(): Braid[] | Promise<Braid[]>;
  github(fresh: boolean): Github | Promise<Github>;
  t3(fresh: boolean): Promise<T3>;
  signals(github: Github): ReadSignals;
  /** Why idle threads of open items failed, by thread id; absent: none. A failed read gives none. */
  failures?(t3: T3, braids: readonly Braid[]): Promise<ReadonlyMap<string, Failure>>;
  /** Fetches `braid-requests` from origin; called only on a fresh read (the Refresh button), alongside GitHub and T3. Absent: never. */
  fetchRequests?(): Promise<unknown>;
  /** The plans of the project's programmes (`pm/*` branches); absent: none. A failed read gives none. */
  plans?(): Promise<PlanRead[]>;
  start(): StartContext;
  /** What stops the folder from working as a braid project; a braid that can't be read then gives none instead of an error. */
  readiness?(github: Github | null): readonly { readonly key: string }[];
}

export interface LaneInputs {
  readonly braids: Braid[];
  readonly github: Github;
  readonly t3: T3;
  readonly sig: ReadSignals;
  readonly start: StartContext;
}

/**
 * Reads every input of the lanes once; every source call it starts settles before it returns. `fetch` also fetches the requests record
 * (the Refresh button); `timed` wraps each read (the board's timings).
 */
export async function readInputs(src: InputSources, fetch = false, timed: <T>(name: string, read: () => T | Promise<T>) => Promise<T> = (_name, read) => Promise.resolve().then(read)): Promise<LaneInputs> {
  const github = timed("github", () => src.github(true));
  const t3 = timed("t3", () => src.t3(true));
  const requests = fetch && src.fetchRequests !== undefined ? timed("requests fetch", () => src.fetchRequests?.()).catch(() => {}) : Promise.resolve();
  github.catch(() => {}); // their failure is reported when they are awaited below
  t3.catch(() => {});
  try {
    const [gh, threads] = [await github, await t3];
    // Briefs the loader can't read (a malformed brief.md, a bad folder name) are readiness problems, and the board is served without them.
    const braids = await timed("braids", async () => {
      try {
        return await src.braids();
      } catch (error) {
        if (src.readiness?.(gh).some((p) => p.key === "check") === true) {
          return [];
        }
        throw error;
      }
    });
    const failures = await timed("failures", async () => {
      try {
        return (await src.failures?.(threads, braids)) ?? new Map<string, Failure>();
      } catch {
        return new Map<string, Failure>(); // the cards then say only that they stalled
      }
    });
    const plans = await timed("plans", async () => {
      try {
        return (await src.plans?.()) ?? [];
      } catch {
        return []; // the programmes are left out, never the lanes
      }
    });
    await requests;
    const read = await timed("signals", () => src.signals(gh));
    // A held plan holds its braids too: those without a pause record of their own read as held by the PM.
    const held: ReadSignals = plans.length === 0 ? read : { ...read, plans, pauses: heldPauses(plans, read.pauses ?? new Map(), read.now) };
    const sig: ReadSignals = failures.size === 0 ? held : { ...held, failures };
    await timed("done dates", () => sig.prepare?.(braids));
    return { braids, github: gh, t3: threads, sig, start: src.start() };
  } finally {
    await Promise.allSettled([github, t3, requests]);
  }
}

/** What BRAID.md says about the main branch and the coordinator (`models.coordinator: <provider> / <model> / effort=…`). */
export function readStartContext(root: string): StartContext {
  const text = existsSync(join(root, "BRAID.md")) ? readFileSync(join(root, "BRAID.md"), "utf8") : "";
  const model = /^\s+coordinator:\s*([^\s/]+)\s*\/\s*([^\s/]+)\s*\//m.exec(text);
  return { main: /^main:\s*([\w./-]+)\s*$/m.exec(text)?.[1] ?? "main", expected: model === null ? null : { provider: model[1] ?? "", model: model[2] ?? "" } };
}

