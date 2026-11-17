import { type Github, type PullRequest } from "./github.js";
import { NO_T3, type T3, type T3Coordinator, type T3Thread } from "./t3.js";
import type { Status } from "../braids/brief.js";
import type { Braid, Item, Tree } from "../braids/store.js";
import { age, type Request } from "../braids/requests.js";

export const LANES = ["To Do", "In Progress", "In Review", "Waiting", "Done"] as const;
export type Lane = (typeof LANES)[number];

/** What an item shows as the reason it is on the user's side: a request's kind, or a broke alarm. */
export type Reason = "question" | "decision" | "plan" | "checks failed" | "stalled";
/** A broke alarm: shown only after its condition has held for ten minutes. */
export type BrokeReason = "checks failed" | "stalled";
/** What is going on in Working: a worker agent, a reviewer, or only CI. */
export type Activity = "agent" | "review" | "checks";

/** What the user is asked, in one line. */
export interface Need {
  readonly kind: "review" | Reason;
  readonly text: string;
  /** `asked` for a request, `for` for a broke alarm; the age reads "asked 35 min ago" or "for 14 min". */
  readonly verb: "asked" | "for";
  /** How long ago it was asked or began (`35m`, `2h`, `3d`); null when the time isn't known. */
  readonly age: string | null;
  /** The stop-case key of a decision. */
  readonly key: string | null;
  /** The PR of a review. */
  readonly pr: number | null;
  /** The strand it belongs to (on a braid card); null for the braid's own request or an item. */
  readonly who: string | null;
  /** On a braid card: how many other strands have a need too. */
  readonly more: number;
}

/** What Merge on request needs of an item with an open review request: what the confirmation shows, and why it can't be asked for yet. */
export interface MergeInfo {
  readonly pr: number;
  /** The head commit the request handed over (full sha); null when the request has none. */
  readonly head: string | null;
  /** The branch the PR merges into; null when GitHub wasn't read. */
  readonly target: string | null;
  readonly branch: string | null;
  readonly checks: PullRequest["checks"] | null;
  readonly runs: NonNullable<PullRequest["runs"]>;
  /** Why Merge is off (the tooltip reads `Merge: <reason>`); null when it can be asked for. */
  readonly reason: string | null;
}

/** What BRAID.md says about the coordinator and the main branch; the card's Start reads it. */
export interface StartContext {
  readonly main: string;
  /** The coordinator's provider instance and model from BRAID.md `models.coordinator`; null when it names none. */
  readonly expected: { readonly provider: string; readonly model: string } | null;
}

export const NO_START: StartContext = { main: "main", expected: null };

/** What Start on a braid needs: where the coordinator's worktree comes from, and why Start is off. */
export interface StartInfo {
  /** The branch the new worktree starts from, and the name of its branch. */
  readonly base: string;
  readonly branch: string;
  /** Whether the braid already has a braid branch; false: it is in braids/ on the main branch only, and the coordinator details or runs it from there. */
  readonly planned: boolean;
  /** `<provider> / <model>` from BRAID.md; null when BRAID.md names none. */
  readonly expected: string | null;
  /** Why Start is off (the tooltip reads `Start: <reason>`); null when it can be pressed. */
  readonly reason: string | null;
}

/** The running coordinator thread of a braid, and a warning when it runs on another provider or model than BRAID.md names. */
export interface CoordinatorInfo {
  readonly link: string | null;
  readonly warning: string | null;
}

export interface StrandCard {
  readonly id: string;
  readonly title: string;
  readonly status: Status;
  readonly lane: Lane;
  /** The branch the brief was read from; null for the working tree. */
  readonly branch: string | null;
  readonly pr: PullRequest | null;
  /** Why the item needs the user (null outside Waiting). */
  readonly reason: Reason | null;
  /** The request or alarm text with its age, for To Review and Waiting. */
  readonly need: Need | null;
  /** The key of an `ask:<key>` label (a decision expected at review); it never moves the lane. */
  readonly ask: string | null;
  /** Whether an agent of this strand runs (a worker or a reviewer). */
  readonly running: boolean;
  readonly activity: Activity | null;
  /** The T3 link of the agent thread (a worker's, else a reviewer's); null when none runs. */
  readonly thread: string | null;
  /** The open review request, when there is one. */
  readonly merge: MergeInfo | null;
}

export interface BraidCard {
  readonly id: string;
  readonly title: string;
  readonly status: Status;
  readonly lane: Lane;
  readonly labels: readonly string[];
  /** The branch the braid's own brief was read from; null for the working tree. */
  readonly branch: string | null;
  readonly pr: PullRequest | null;
  readonly reason: Reason | null;
  /** The most urgent need of the braid and its strands. */
  readonly need: Need | null;
  readonly ask: string | null;
  /** Whether an agent of any strand runs; a coordinator on the braid branch never counts. */
  readonly running: boolean;
  readonly activity: Activity | null;
  readonly done: number;
  readonly total: number;
  readonly strands: readonly StrandCard[];
  /** The T3 link of the thread of a braid without strands; null for a braid with strands. */
  readonly thread: string | null;
  /** The open review request of the braid itself (a story, or a goal's final PR). */
  readonly merge: MergeInfo | null;
  readonly start: StartInfo;
  /** The braid's running coordinator thread; null when none runs. */
  readonly coordinator: CoordinatorInfo | null;
}

export interface BoardData {
  /** The repository folder name, shown in the header. */
  readonly repo: string;
  readonly lanes: readonly Lane[];
  /** Whether GitHub could be read; when not, lanes come from the stored states. */
  readonly github: Github["status"];
  /** Whether T3 could be read; when not, no agent states show. */
  readonly t3: T3["status"];
  readonly braids: readonly BraidCard[];
}

export interface ItemDetail {
  readonly id: string;
  readonly title: string;
  readonly status: Status;
  readonly lane: Lane;
  readonly labels: readonly string[];
  readonly dependencies: readonly string[];
  readonly order: number | null;
  readonly delivery: string | null;
  readonly folder: string;
  /** The branch the brief, report and logs were read from; null for the working tree. */
  readonly branch: string | null;
  readonly pr: PullRequest | null;
  readonly reason: Reason | null;
  readonly need: Need | null;
  readonly ask: string | null;
  readonly running: boolean;
  readonly activity: Activity | null;
  readonly thread: string | null;
  readonly merge: MergeInfo | null;
  readonly brief: string;
  readonly report: string | null;
  readonly logs: readonly { readonly name: string; readonly text: string }[];
  /** The braid the item belongs to (the item itself for a braid). */
  readonly braid: BraidCard;
}

/** The lane a stored status shows in. Outline shows in To Do. */
export function laneOfStatus(status: Status): Lane {
  return status === "Outline" || status === "To Do" ? "To Do" : status;
}

/** How long a broke condition must have held before it shows. */
export const BROKE_MS = 10 * 60_000;

/** What derive needs besides the item itself: the open requests, the clock and the alarm clock. */
export interface Signals {
  readonly now: Date;
  /** The open (live) requests by item id. */
  readonly requests: ReadonlyMap<string, Request>;
  /**
   * Notes whether a broke condition holds for an item now (`null`: it can't be told) and returns when it
   * began (ISO) once it has held for ten minutes, else null. Called for every item, so a condition that
   * stopped holding starts again from zero.
   */
  readonly alarm: (id: string, reason: BrokeReason, holds: boolean | null) => string | null;
}

export function noSignals(): Signals {
  return { now: new Date(), requests: new Map(), alarm: () => null };
}

export interface Derived {
  readonly lane: Lane;
  readonly pr: PullRequest | null;
  readonly reason: Reason | null;
  readonly need: Need | null;
  readonly ask: string | null;
  /** The agents of the item that run now. */
  readonly agents: readonly T3Thread[];
  readonly activity: Activity | null;
}

const plain = { key: null, pr: null, who: null, more: 0 } as const;

function needOfRequest(r: Request, now: Date): Need {
  const text = r.kind === "review" && r.pr !== undefined ? `Merge PR #${r.pr}` : r.text;
  return { kind: r.kind, text, verb: "asked", age: age(r.at, now), key: r.key ?? null, pr: r.pr ?? null, who: null, more: 0 };
}

function activityOf(agents: readonly T3Thread[], pr: PullRequest | null): Activity | null {
  if (agents.some((t) => t.role === "worker")) {
    return "agent";
  }
  return agents.length > 0 ? "review" : pr?.state === "open" && pr.checks === "pending" ? "checks" : null;
}

/** An item's open request as a lane: a review is To Review, any other request Needs You. */
function requestLane(r: Request, now: Date): { lane: Lane; reason: Reason | null; need: Need } {
  const need = needOfRequest(r, now);
  return r.kind === "review" ? { lane: "In Review", reason: null, need } : { lane: "Waiting", reason: r.kind, need };
}

/**
 * An item's lane, first match winning: a merged PR, or a stored Done with no open PR, is Done; an open
 * `review` request is To Review; another open request is Needs You with its text; an agent's pending
 * question is Needs You `question`; a stored Done next to an open PR (stamped before the merge) waits
 * for the merge, To Review; a broke alarm (`checks failed`, `stalled`, after ten minutes) is Needs You
 * with its reason; started (stored In Progress, an agent running, or an open PR) is Working; else To Do.
 * A PR closed without merging never makes Done (a stored Done next to one reads To Do). An `ask:<key>`
 * label never sets the lane; it comes back as `ask` (none once the PR is merged) for the flag.
 */
export function derive(status: Status, labels: readonly string[], key: string, gh: Github, t3: T3 = NO_T3, sig: Signals = noSignals()): Derived {
  const pr = gh.prs.get(key) ?? null;
  const stored = status === "Done" && pr?.state === "closed" ? "To Do" : status;
  const agents = t3.threads.get(key) ?? [];
  const activity = activityOf(agents, pr);
  if (pr?.state === "merged" || (stored === "Done" && pr?.state !== "open")) {
    sig.alarm(key, "checks failed", false);
    sig.alarm(key, "stalled", false);
    return { lane: "Done", pr, reason: null, need: null, ask: null, agents, activity: null };
  }
  const label = labels.find((l) => l.startsWith("ask:") && l.length > 4);
  const ask = label === undefined ? null : label.slice(4);
  const req = sig.requests.get(key);
  const question = agents.some((t) => t.pending > 0);
  const waiting = req !== undefined || question || stored === "Done";
  // The alarms: the condition, only while nothing else already has the user's attention.
  const known = gh.status.state === "ok" && t3.status.state === "ok";
  const failing = pr?.state === "open" && pr.checks === "failing";
  const checking = pr?.state === "open" && (pr.checks === "pending" || pr.checks === "failing");
  const failed = sig.alarm(key, "checks failed", waiting ? false : known ? failing && agents.length === 0 : null);
  const stalled = sig.alarm(key, "stalled", waiting || stored !== "In Progress" ? false : known ? agents.length === 0 && !checking : null);
  const out = (lane: Lane, reason: Reason | null, need: Need | null): Derived => ({ lane, pr, reason, need, ask, agents, activity });
  if (req !== undefined) {
    const r = requestLane(req, sig.now);
    return out(r.lane, r.reason, r.need);
  }
  if (question) {
    return out("Waiting", "question", { ...plain, kind: "question", text: "An agent asked a question: answer it in its thread", verb: "asked", age: null });
  }
  if (stored === "Done" && pr !== null) {
    return out("In Review", null, { ...plain, kind: "review", text: `Merge PR #${pr.number}`, verb: "asked", age: null, pr: pr.number });
  }
  if (failed !== null) {
    const names = pr?.failed ?? [];
    return out("Waiting", "checks failed", { ...plain, kind: "checks failed", text: `Checks failed${names.length > 0 ? `: ${names.join(", ")}` : ""}; fix or retry`, verb: "for", age: age(failed, sig.now) });
  }
  if (stalled !== null) {
    return out("Waiting", "stalled", { ...plain, kind: "stalled", text: "Stalled: nobody is working and nothing was asked", verb: "for", age: age(stalled, sig.now) });
  }
  const started = stored === "In Progress" || agents.length > 0 || pr?.state === "open";
  return out(started ? "In Progress" : laneOfStatus(stored), null, null);
}

/** Most urgent first. */
const URGENCY: readonly Lane[] = ["Waiting", "In Review", "In Progress", "To Do", "Done"];

/** A braid with strands sits in its most urgent strand's lane, in Done when all are done. */
export function laneOfLanes(lanes: readonly Lane[]): Lane {
  return URGENCY.find((lane) => lanes.includes(lane)) ?? "To Do";
}

/** The thread to open for an item: a worker's, else a reviewer's. */
export function threadLink(agents: readonly T3Thread[]): string | null {
  return (agents.find((t) => t.role === "worker") ?? agents[0])?.link ?? null;
}

/**
 * The open review request of an item as Merge on request needs it, or null when there is none. The
 * reason is the first thing that stops the board from asking the coordinator: no coordinator thread on
 * the request, no PR read, or checks that aren't green.
 */
export function mergeOf(key: string, gh: Github, sig: Signals): MergeInfo | null {
  const req = sig.requests.get(key);
  if (req === undefined || req.kind !== "review" || req.pr === undefined) {
    return null;
  }
  const pr = [...gh.prs.values()].find((p) => p.number === req.pr);
  const names = pr?.failed ?? [];
  const reason =
    req.thread === null
      ? "no coordinator thread on the review request"
      : pr === undefined || pr.state !== "open"
        ? "the PR isn't open (or GitHub can't be read)"
        : pr.checks === "failing"
          ? `Checks failed${names.length > 0 ? `: ${names.join(", ")}` : ""}`
          : pr.checks === "pending"
            ? "Checks are still running."
            : pr.checks === "none"
              ? "the PR has no checks"
              : null;
  return { pr: req.pr, head: req.head ?? pr?.head ?? null, target: pr?.base ?? null, branch: pr?.branch ?? null, checks: pr?.checks ?? null, runs: pr?.runs ?? [], reason };
}

/**
 * A braid with strands: the lane of its most urgent strand or own request. When that comes out To Do but
 * the braid has started (stored In Progress, or a strand is Done), it is Working: the work is between strands.
 */
export function braidLane(status: Status, strands: readonly { readonly lane: Lane }[], own: { readonly lane: Lane } | null): Lane {
  const lane = laneOfLanes([...strands.map((s) => s.lane), ...(own === null ? [] : [own.lane])]);
  return lane === "To Do" && (status === "In Progress" || strands.some((s) => s.lane === "Done")) ? "In Progress" : lane;
}

const ACTIVITY: readonly Activity[] = ["agent", "review", "checks"];

/** `board` from `braids/0009-board/…`: the slug of a braid folder; null when it has none. */
const slugOf = (folder: string): string | null => /^braids\/\d{4}-([a-z0-9][a-z0-9-]*)$/.exec(folder)?.[1] ?? null;

/** The warning for a coordinator thread that runs on a provider or model other than BRAID.md's; null when they match or BRAID.md names none. */
export function coordinatorWarning(thread: Pick<T3Coordinator, "provider" | "model">, ctx: StartContext): string | null {
  const want = ctx.expected;
  if (want === null || (thread.provider === want.provider && thread.model === want.model)) {
    return null;
  }
  return `The coordinator runs on ${thread.provider ?? "an unknown provider"} / ${thread.model ?? "an unknown model"}; BRAID.md names ${want.provider} / ${want.model}.`;
}

/**
 * Start on a braid. Every braid on the board is in braids/, so the coordinator's branch is always
 * `coordinator/<number>-<slug>` (the braid branch itself is held by no one, and Git allows a branch in one
 * worktree only; the coordinator switches to it). It starts from the braid branch when the brief was read
 * from one, else from the main branch, where the item exists without a branch. Both bases are remote
 * branches (`origin/…`): the local ones go stale. Off when the braid isn't To Do, a coordinator runs, or T3 can't be read.
 */
export function startOf(braid: Braid, lane: Lane, t3: T3, ctx: StartContext): StartInfo {
  const slug = slugOf(braid.folder) ?? "braid";
  const source = braid.source?.branch ?? null;
  const planned = source !== null && /(^|\/)braid\/\d{4}-/.test(source);
  const reason = lane !== "To Do" ? "the braid isn't To Do" : t3.coordinators?.has(braid.number) === true ? "a coordinator for this braid is running" : t3.status.state !== "ok" ? "T3 isn't reachable" : null;
  return {
    base: `origin/${planned ? (source ?? "").replace(/^origin\//, "") : ctx.main}`,
    branch: `coordinator/${braid.number}-${slug}`,
    planned,
    expected: ctx.expected === null ? null : `${ctx.expected.provider} / ${ctx.expected.model}`,
    reason,
  };
}

function coordinatorOf(number: string, t3: T3, ctx: StartContext): CoordinatorInfo | null {
  const c = t3.coordinators?.get(number);
  return c === undefined ? null : { link: c.link, warning: coordinatorWarning(c, ctx) };
}

export function toCard(braid: Braid, gh: Github, t3: T3 = NO_T3, sig: Signals = noSignals(), ctx: StartContext = NO_START): BraidCard {
  const strands: StrandCard[] = braid.strands.map((s) => {
    const d = derive(s.brief.status, s.brief.labels, `${braid.number}/${s.letter}`, gh, t3, sig);
    return {
      id: s.brief.id,
      title: s.brief.title,
      status: s.brief.status,
      lane: d.lane,
      branch: s.source?.branch ?? null,
      pr: d.pr,
      reason: d.reason,
      need: d.need,
      ask: d.ask,
      running: d.agents.length > 0,
      activity: d.activity,
      thread: threadLink(d.agents),
      merge: mergeOf(`${braid.number}/${s.letter}`, gh, sig),
    };
  });
  if (strands.length === 0) {
    const own = derive(braid.brief.status, braid.brief.labels, braid.number, gh, t3, sig);
    return { id: braid.brief.id, title: braid.brief.title, status: braid.brief.status, lane: own.lane, labels: braid.brief.labels, branch: braid.source?.branch ?? null, pr: own.pr, reason: own.reason, need: own.need, ask: own.ask, running: own.agents.length > 0, activity: own.activity, done: 0, total: 0, strands, thread: threadLink(own.agents), merge: mergeOf(braid.number, gh, sig), start: startOf(braid, own.lane, t3, ctx), coordinator: coordinatorOf(braid.number, t3, ctx) };
  }
  // A braid with strands is never worked on by a thread of its own (a thread on its branch is the coordinator),
  // so its own derive sees no agents. It counts when it has a request, or when its final PR is open with every
  // strand Done; before that the strands decide, and a braid with strands is never "stalled".
  const pr = gh.prs.get(braid.number) ?? null;
  const req = sig.requests.get(braid.number);
  const finalPr = pr?.state === "open" && strands.every((s) => s.lane === "Done");
  let own: { lane: Lane; reason: Reason | null; need: Need | null; agents?: readonly T3Thread[]; activity?: Activity | null } | null = null;
  if (finalPr) {
    // The braid's reviewers (`<n>-review`) are its agents in wrap-up; the coordinator never counts.
    const reviewers = (t3.threads.get(braid.number) ?? []).filter((t) => t.role === "reviewer");
    own = derive(braid.brief.status, braid.brief.labels, braid.number, gh, { status: t3.status, threads: new Map(reviewers.length > 0 ? [[braid.number, reviewers]] : []) }, sig);
  } else if (req !== undefined && pr?.state !== "merged") {
    own = requestLane(req, sig.now);
  }
  const candidates = [
    ...(own?.need == null ? [] : [{ lane: own.lane, reason: own.reason, need: own.need, who: null as string | null }]),
    ...strands.flatMap((s) => (s.need === null ? [] : [{ lane: s.lane, reason: s.reason, need: s.need, who: s.id as string | null }])),
  ];
  const top = [...candidates].sort((a, b) => URGENCY.indexOf(a.lane) - URGENCY.indexOf(b.lane))[0];
  const lane = braidLane(braid.brief.status, strands, own);
  return {
    id: braid.brief.id,
    title: braid.brief.title,
    status: braid.brief.status,
    lane,
    labels: braid.brief.labels,
    branch: braid.source?.branch ?? null,
    pr,
    reason: top !== undefined && top.lane === "Waiting" ? top.reason : null,
    need: top === undefined ? null : { ...top.need, who: top.who, more: candidates.length - 1 },
    ask: null,
    running: strands.some((s) => s.running) || (own?.agents?.length ?? 0) > 0,
    activity: ACTIVITY.find((a) => strands.some((s) => s.activity === a) || own?.activity === a) ?? null,
    done: strands.filter((s) => s.lane === "Done").length,
    total: strands.length,
    strands,
    thread: threadLink(own?.agents ?? []),
    merge: own === null || pr?.state === "merged" ? null : mergeOf(braid.number, gh, sig),
    start: startOf(braid, lane, t3, ctx),
    coordinator: coordinatorOf(braid.number, t3, ctx),
  };
}

export function toBoard(repo: string, braids: readonly Braid[], gh: Github, t3: T3 = NO_T3, sig: Signals = noSignals(), ctx: StartContext = NO_START): BoardData {
  return { repo, lanes: LANES, github: gh.status, t3: t3.status, braids: braids.map((b) => toCard(b, gh, t3, sig, ctx)) };
}

export function toDetail(tree: Tree, braid: Braid, item: Item, gh: Github, t3: T3 = NO_T3, sig: Signals = noSignals(), ctx: StartContext = NO_START): ItemDetail {
  const card = toCard(braid, gh, t3, sig, ctx);
  const own = item === braid ? card : card.strands.find((s) => s.id === item.brief.id);
  return {
    id: item.brief.id,
    title: item.brief.title,
    status: item.brief.status,
    lane: own?.lane ?? laneOfStatus(item.brief.status),
    labels: item.brief.labels,
    dependencies: item.brief.dependencies,
    order: item.brief.order,
    delivery: item.brief.delivery,
    folder: item.folder,
    branch: item.source?.branch ?? null,
    pr: own?.pr ?? null,
    reason: own?.reason ?? null,
    need: own?.need ?? null,
    ask: own?.ask ?? null,
    running: own?.running ?? false,
    activity: own?.activity ?? null,
    thread: own?.thread ?? null,
    merge: own?.merge ?? null,
    brief: item.brief.body.trim(),
    report: item.hasReport ? tree.read(`${item.folder}/report.md`) : null,
    logs: item.logs.map((name) => ({ name, text: tree.read(`${item.folder}/${name}`) ?? "" })),
    braid: card,
  };
}
