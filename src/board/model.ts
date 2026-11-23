import { type Github, type PullRequest } from "./github.js";
import type { Problem } from "../braids/readiness.js";
import { ideaPlanning, NO_T3, type T3, type T3Coordinator, type T3Thread } from "./t3.js";
import type { Status } from "../braids/brief.js";
import type { Braid, Item, Source, Tree } from "../braids/store.js";
import { NO_INBOX, type InboxData } from "./inbox.js";
import { age, type Request } from "../braids/requests.js";
import { requestsOf, rowOf, type RequestRow, type RequestsView } from "./record.js";
import type { Pause } from "../braids/pauses.js";
import { clock, limitNeed, pauseView, phaseOf, stalledSince, stalledText, type PauseView } from "./pause.js";
import { addresseeOf, braidOfId, missedEta } from "./waits.js";
import { forwardedLine, pmLine, routeOf, throughPm, viaNote, type PmLine, type Routed, type Via } from "./pm.js";
import type { PlanRead } from "./plans.js";
import { programmeOfBraid, toProgrammes, type Programme } from "./programme.js";
import type { LimitsView } from "./limits.js";
import { t3codeUrl } from "./marks.js";

/** Left to right, what needs the user most first. The board shows Waiting as Needs You, In Review as To Review, In Progress as Working. */
export const LANES = ["Waiting", "In Review", "In Progress", "To Do", "Done"] as const;
export type Lane = (typeof LANES)[number];

/** What an item shows as the reason it is on the user's side: a request's kind, or a broke alarm. */
export type Reason = "question" | "decision" | "plan" | "action" | "checks failed" | "stalled" | "limit";
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
  /** When it was asked or began (ISO): the request's time or the alarm's first sighting; null when not known (an agent's pending question, a Done waiting for its merge). Notifications key on it. */
  readonly since: string | null;
  /** The stop-case key of a decision. */
  readonly key: string | null;
  /** The PR of a review. */
  readonly pr: number | null;
  /** The strand it belongs to (on a braid card); null for the braid's own request or an item. */
  readonly who: string | null;
  /** On a braid card: how many other strands have a need too. */
  readonly more: number;
  /** A request that reached the user's side from the PM: after a timeout, a gone PM thread, or the PM's `braid forward`. */
  readonly via?: Via;
  /** `pm`: the programme manager asks the user itself (`braid ask … --by pm`, or a programme request). */
  readonly by?: "pm";
  /** The T3 link of the thread a push for this need opens: the PM's thread for a PM request or a forwarded one, else the asking thread; null when T3 doesn't list it. Set on a request's need and the PM's; absent on a broke alarm. */
  readonly link?: string | null;
  /** The request's code (`q-7f3k`), to name it in any thread; absent on a broke alarm. */
  readonly code?: string;
  /** The T3 link of the thread that asked (always the asker's, also when the PM forwarded it); null when T3 doesn't list it. Set with `code`. */
  readonly asking?: string | null;
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

/** The coordinator thread of a braid (running, else idle), and a warning when it runs on another provider or model than BRAID.md names. */
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
  /** The role of that thread, from its title; null when there is no thread. */
  readonly threadRole: ThreadRole | null;
  /** The open review request, when there is one. */
  readonly merge: MergeInfo | null;
  /** When it became Done (the commit that set its status Done, ISO); null when it isn't Done or the date isn't known. */
  readonly doneAt: string | null;
  /** Its braid's pause (`braid pause`); null when the braid isn't paused or this item is Done. */
  readonly pause: PauseView | null;
  /** The open request the PM is handling (`--to pm`); the lane comes from the item's other state. */
  readonly pm: PmLine | null;
  /** The PM's own open request on this item (`--by pm`), whatever the coordinator's request says; `need` shows it when nothing else is asked. */
  readonly pmAsk: Need | null;
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
  readonly threadRole: ThreadRole | null;
  /** The open review request of the braid itself (a story, or a goal's final PR). */
  readonly merge: MergeInfo | null;
  readonly start: StartInfo;
  /** The braid's coordinator thread, running or idle; null when it has none. */
  readonly coordinator: CoordinatorInfo | null;
  /** A Done card's idle coordinator thread link, kept for the Done push only (`coordinator` stays null there); absent otherwise. */
  readonly doneLink?: string;
  /** When it became Done: the commit that set its own brief Done, else its newest strand's (ISO); null when it isn't Done or the date isn't known. */
  readonly doneAt: string | null;
  /** The braid's pause (`braid pause`); null when it isn't paused or is Done. */
  readonly pause: PauseView | null;
  /** A request the PM is handling: the braid's own, else the first strand's. */
  readonly pm: PmLine | null;
  /** The PM's own open request on this item (`--by pm`), whatever the coordinator's request says; `need` shows it when nothing else is asked. */
  readonly pmAsk: Need | null;
  /** The slug of the programme whose plan lists this braid (the 🧭 tag); null for none. */
  readonly programme: string | null;
  /** Open requests this braid's coordinator (or a strand's) put to another braid; they don't ask the user. */
  readonly waits: readonly RequestRow[];
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
  /** The programmes of the project (its `pm/*` plans), done and stopped ones included; the panel shows the others. */
  readonly programmes: readonly Programme[];
  /** The open inbox entries: leftovers and ideas, read only. Not a lane. */
  readonly inbox: InboxData;
  /** True when this answer goes to the Tailscale listener (the phone): there the server refuses `open`. The server sets it per listener; `toBoard` says false. */
  readonly remote: boolean;
  /** What stops this folder from working as a braid project (docs/board.md, "Not ready"); empty when nothing does. The board is served anyway. */
  readonly problems: readonly Problem[];
  /** Why `.braid/pauses.json` was read as no pauses (or some left out); null when it read cleanly or is missing. */
  readonly pausesNote: string | null;
  /** Each provider's reading and chip state against its threshold (docs/board.md, "Provider limits"); null when not read. */
  readonly limits: LimitsView | null;
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
  readonly threadRole: ThreadRole | null;
  readonly merge: MergeInfo | null;
  readonly pause: PauseView | null;
  readonly pm: PmLine | null;
  /** The PM's own open request on this item (`--by pm`), whatever the coordinator's request says; `need` shows it when nothing else is asked. */
  readonly pmAsk: Need | null;
  readonly brief: string;
  readonly report: string | null;
  readonly logs: readonly { readonly name: string; readonly text: string }[];
  /** The item's requests: open, waiting on another braid, and closed (newest first); a braid's include its strands'. */
  readonly requests: RequestsView;
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
  /** The PM's own open requests on an item (`by: pm`), by item id. Absent: none. */
  readonly asks?: ReadonlyMap<string, Request>;
  /** The open requests addressed to another braid's coordinator, which aren't the user's: the asking braid's card shows them. Absent: none. */
  readonly waits?: readonly Request[];
  /** The closed requests (answered, withdrawn, met), the ones whose PR just merged or closed included; the details panel's Requests tab lists them. Absent: none. */
  readonly closed?: readonly Request[];
  /** The open programme requests (`pm/<slug>`). Absent: none. */
  readonly programmes?: readonly Request[];
  /**
   * Notes whether a broke condition holds for an item now (`null`: it can't be told) and returns when it
   * began (ISO) once it has held for ten minutes, else null. Called for every item, so a condition that
   * stopped holding starts again from zero.
   */
  readonly alarm: (id: string, reason: BrokeReason, holds: boolean | null) => string | null;
  /** When the item whose brief is in `folder` became Done (ISO; the commit that set `status: Done`), or null when it isn't known. Absent: no dates. */
  readonly doneAt?: (folder: string, source: Source | null) => string | null;
  /** The paused braids by number (`.braid/pauses.json`). Absent: none. */
  readonly pauses?: ReadonlyMap<string, Pause>;
  /** Why the pauses file was read as no pauses; null or absent when it read cleanly. */
  readonly pausesNote?: string | null;
  /** The plans of the project's programmes (`pm/*` branches). Absent: none. */
  readonly plans?: readonly PlanRead[];
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
  readonly pause: PauseView | null;
  readonly pm: PmLine | null;
  /** The PM's own open request on this item (`--by pm`), whatever the coordinator's request says; `need` shows it when nothing else is asked. */
  readonly pmAsk: Need | null;
}

const plain = { key: null, pr: null, who: null, more: 0 } as const;

/**
 * The T3 link of a thread: T3's own when it lists the thread, else built from the thread id with the environment
 * of another listed thread (a link is `<base>/<env>/<thread>`); null when neither can be done.
 */
export function linkOfThread(t3: T3, thread: string | null | undefined): string | null {
  if (thread === null || thread === undefined || thread === "") {
    return null;
  }
  const known = t3.links?.get(thread);
  if (known !== undefined) {
    return known;
  }
  const other = [...(t3.links?.values() ?? [])].find((l) => t3codeUrl(l) !== null);
  return other === undefined ? null : other.replace(/[^/]+\/?$/, encodeURIComponent(thread));
}

function needOfRequest(r: Request, now: Date, routed: Routed, t3: T3): Need {
  const text = r.kind === "review" && r.pr !== undefined ? `Merge PR #${r.pr}` : r.text;
  if ("via" in routed) {
    const link = linkOfThread(t3, routed.via === "forwarded" ? r.pm : r.thread);
    return { kind: r.kind, text: `${routed.words} ${text}${viaNote(routed.via, r, now)}`, verb: "asked", age: age(r.at, now), since: routed.since, key: r.key ?? null, pr: r.pr ?? null, who: null, more: 0, via: routed.via, link, code: r.code, asking: linkOfThread(t3, r.thread) };
  }
  return { kind: r.kind, text, verb: "asked", age: age(r.at, now), since: r.at, key: r.key ?? null, pr: r.pr ?? null, who: null, more: 0, link: linkOfThread(t3, r.thread), code: r.code, asking: linkOfThread(t3, r.thread) };
}

/** A forwarded request as the programmes panel shows it: the PM asking the user, opening the PM's thread. */
export function needOfForward(r: Request, now: Date, t3: T3): Need {
  const text = r.kind === "review" && r.pr !== undefined ? `${askWords(r.kind)} merge PR #${r.pr}` : `${askWords(r.kind)} ${r.text}`;
  return { kind: r.kind, text: `${text}${viaNote("forwarded", r, now)}`, verb: "asked", age: age(r.forwarded ?? r.at, now), since: r.forwarded ?? r.at, key: r.key ?? null, pr: r.pr ?? null, who: null, more: 0, via: "forwarded", link: linkOfThread(t3, r.pm), code: r.code, asking: linkOfThread(t3, r.thread) };
}

/** "The PM asks you: …", or "The PM asks you to: …" for something only the user can do. */
export const askWords = (kind: Request["kind"]): string => (kind === "action" ? "The PM asks you to:" : "The PM asks you:");

/** The PM's own request as a need: always on the user's side, pushed at once. */
export function needOfAsk(r: Request, now: Date, t3: T3, who: string | null = null): Need {
  return { kind: r.kind === "review" ? "question" : r.kind, text: `${askWords(r.kind)} ${r.text}`, verb: "asked", age: age(r.at, now), since: r.at, key: r.key ?? null, pr: null, who, more: 0, by: "pm", link: linkOfThread(t3, r.thread), code: r.code, asking: linkOfThread(t3, r.thread) };
}

/** Whether the braid of this item is paused or held (either reason). */
const pausedBraid = (key: string, sig: Signals): boolean => sig.pauses?.has(key.slice(0, 4)) === true;

function activityOf(agents: readonly T3Thread[], pr: PullRequest | null): Activity | null {
  if (agents.some((t) => t.role === "worker")) {
    return "agent";
  }
  return agents.length > 0 ? "review" : pr?.state === "open" && pr.checks === "pending" ? "checks" : null;
}

/** An item's open request as a lane: a review is To Review, any other request Needs You. */
function requestLane(r: Request, now: Date, routed: Routed, t3: T3): { lane: Lane; reason: Reason | null; need: Need } {
  const need = needOfRequest(r, now, routed, t3);
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
  // A review request still open on a stored Done whose PR the lookup didn't find isn't dropped: the merge is the user's one task (0068).
  const heldReview = stored === "Done" && pr === null && sig.requests.get(key)?.kind === "review";
  if (pr?.state === "merged" || (stored === "Done" && pr?.state !== "open" && !heldReview)) {
    sig.alarm(key, "checks failed", false);
    sig.alarm(key, "stalled", false);
    if (!key.includes("/")) {
      sig.alarm(`${key} wait`, "stalled", false);
    }
    return { lane: "Done", pr, reason: null, need: null, ask: null, agents, activity: null, pause: null, pm: null, pmAsk: null };
  }
  const label = labels.find((l) => l.startsWith("ask:") && l.length > 4);
  const ask = label === undefined ? null : label.slice(4);
  // A request to the PM leaves the lane alone until it reaches the user's side; meanwhile something is asked, so nothing reads stalled.
  const asked = sig.requests.get(key);
  const routed = asked === undefined ? undefined : routeOf(asked, sig.now, t3, pausedBraid(key, sig));
  // A forwarded request of a braid a programme runs is the PM asking the user: the programmes panel shows it, the card keeps its lane and says so quietly.
  const away = asked !== undefined && routed !== undefined && throughPm(asked, routed, sig.plans);
  const req = away ? undefined : routed !== undefined && "via" in routed ? asked : routed?.to === "pm" ? undefined : asked;
  const pm = asked !== undefined && away ? forwardedLine(asked, sig.now) : asked !== undefined && routed?.to === "pm" && !("via" in routed) ? pmLine(asked, sig.now) : null;
  const pmAskOf = sig.asks?.get(key);
  const pmAsk = pmAskOf === undefined ? null : needOfAsk(pmAskOf, sig.now, t3);
  const question = agents.some((t) => t.pending > 0);
  const waiting = asked !== undefined || pmAsk !== null || question || stored === "Done";
  // The alarms: the condition, only while nothing else already has the user's attention.
  const known = gh.status.state === "ok" && t3.status.state === "ok";
  const failing = pr?.state === "open" && pr.checks === "failing";
  const checking = pr?.state === "open" && (pr.checks === "pending" || pr.checks === "failing");
  const failed = sig.alarm(key, "checks failed", waiting ? false : known ? failing && agents.length === 0 : null);
  // An open wait of the braid on another braid is the coordinator waiting on purpose: no item of it reads stalled; a broken one does, on the braid.
  const stallHolds = waiting || waits(key.slice(0, 4), sig).length > 0 || stored !== "In Progress" ? false : known ? agents.length === 0 && !checking : null;
  const broken = key.includes("/") ? null : waitStall(key, sig, t3);
  // A paused braid's items aren't stalled while the pause lasts; once its resume is 25 min overdue they are, at once, naming the pause.
  const paused = sig.pauses?.get(key.slice(0, 4)) ?? null;
  const stalled = sig.alarm(key, "stalled", paused === null ? stallHolds : false);
  const pausedStall = paused !== null && stallHolds === true && phaseOf(paused, sig.now) === "over" ? stalledSince(paused) : null;
  const pause = paused === null ? null : pauseView(paused, sig.now);
  // The PM's own request puts the item in Needs You and is its need when nothing else is asked; the coordinator's request stays what it was.
  const out = (lane: Lane, reason: Reason | null, need: Need | null): Derived =>
    pmAsk === null ? { lane, pr, reason, need, ask, agents, activity, pause, pm, pmAsk } : { lane: "Waiting", pr, reason: lane === "Waiting" && reason !== null ? reason : pmAsk.kind as Reason, need: need ?? pmAsk, ask, agents, activity, pause, pm, pmAsk };
  if (req !== undefined && routed !== undefined) {
    const r = requestLane(req, sig.now, routed, t3);
    return out(r.lane, r.reason, r.need);
  }
  if (question) {
    return out("Waiting", "question", { ...plain, kind: "question", text: "An agent asked a question: answer it in its thread", verb: "asked", age: null, since: null });
  }
  if (stored === "Done" && pr !== null) {
    return out("In Review", null, { ...plain, kind: "review", text: `Merge PR #${pr.number}`, verb: "asked", age: null, since: null, pr: pr.number });
  }
  if (failed !== null) {
    const names = pr?.failed ?? [];
    return out("Waiting", "checks failed", { ...plain, kind: "checks failed", text: `Checks failed${names.length > 0 ? `: ${names.join(", ")}` : ""}; fix or retry`, verb: "for", age: age(failed, sig.now), since: failed });
  }
  if (stalled !== null) {
    return out("Waiting", "stalled", { ...plain, kind: "stalled", text: "Stalled: nobody is working and nothing was asked", verb: "for", age: age(stalled, sig.now), since: stalled });
  }
  if (broken !== null) {
    return out("Waiting", "stalled", broken);
  }
  if (paused !== null && pausedStall !== null) {
    return out("Waiting", "stalled", { ...plain, kind: "stalled", text: stalledText(paused, sig.now), verb: "for", age: age(pausedStall, sig.now), since: pausedStall });
  }
  // A board pause that needs the user (a weekly window, a failed pause) is the braid's own: a strand doesn't repeat it.
  const limit = paused === null || key.includes("/") ? null : limitNeed(paused, sig.now);
  if (limit !== null) {
    return out("Waiting", "limit", { ...plain, kind: "limit", text: limit.text, verb: "for", age: age(limit.since, sig.now), since: limit.since });
  }
  const started = stored === "In Progress" || agents.length > 0 || pr?.state === "open";
  // A stored Done whose review request is still open (the PR lookup missed) isn't Done: it reads To Do, with the PM line while the PM checks it.
  return out(started ? "In Progress" : heldReview ? "To Do" : laneOfStatus(stored), null, null);
}

/** Most urgent first. */
const URGENCY: readonly Lane[] = ["Waiting", "In Review", "In Progress", "To Do", "Done"];

/** A braid with strands sits in its most urgent strand's lane, in Done when all are done. */
export function laneOfLanes(lanes: readonly Lane[]): Lane {
  return URGENCY.find((lane) => lanes.includes(lane)) ?? "To Do";
}

/** The thread to open for an item: a running worker's; a subagent reviewer has no link of its own (it shows inside its coordinator's thread). */
export function threadLink(agents: readonly T3Thread[]): string | null {
  return pickThread(agents)?.link ?? null;
}

function pickThread(agents: readonly T3Thread[]): T3Thread | undefined {
  return agents.find((t) => t.role === "worker") ?? agents[0];
}

export type ThreadRole = T3Thread["role"];

/** The role (read from the thread's title) of the thread `openThread` picks; the Open thread button shows its emoji. */
export function openThreadRole(key: string, agents: readonly T3Thread[], t3: T3, lane: Lane): ThreadRole | null {
  return (pickThread(agents) ?? (lane === "Done" ? undefined : pickThread(t3.idle?.get(key) ?? [])))?.role ?? null;
}

/** The thread to open for an item: a running agent's, else the newest idle (not running, not archived) thread of the item; an idle one never for a Done item (its old threads outlive `braid clean`). */
export function openThread(key: string, agents: readonly T3Thread[], t3: T3, lane: Lane): string | null {
  return threadLink(agents) ?? (lane === "Done" ? null : threadLink(t3.idle?.get(key) ?? []));
}

/**
 * The open review request of an item as Merge on request needs it, or null when there is none. The
 * reason is the first thing that stops the board from asking the coordinator: no coordinator thread on
 * the request, no PR read, or checks that aren't green.
 */
export function mergeOf(key: string, gh: Github, sig: Signals, t3: T3 = NO_T3): MergeInfo | null {
  const req = sig.requests.get(key);
  if (req === undefined || req.kind !== "review" || req.pr === undefined) {
    return null;
  }
  // A handover the PM is still checking isn't the user's to merge yet.
  if ((req.to === "pm" || req.forwarded !== undefined) && !("via" in routeOf(req, sig.now, t3, pausedBraid(key, sig)))) {
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
  const reason = t3.coordinators?.has(braid.number) === true ? "a coordinator for this braid is running" : lane !== "To Do" ? "the braid isn't To Do" : t3.status.state !== "ok" ? "T3 isn't reachable" : null;
  return {
    base: `origin/${planned ? (source ?? "").replace(/^origin\//, "") : ctx.main}`,
    branch: `coordinator/${braid.number}-${slug}`,
    planned,
    expected: ctx.expected === null ? null : `${ctx.expected.provider} / ${ctx.expected.model}`,
    reason,
  };
}

/** The idle coordinator's link of a Done card, for its push only (0069/F). */
function doneLinkOf(number: string, t3: T3, lane: Lane): { readonly doneLink?: string } {
  const c = lane === "Done" && t3.coordinators?.get(number) === undefined ? t3.idleCoordinators?.get(number) : undefined;
  return c?.link == null ? {} : { doneLink: c.link };
}

function coordinatorOf(number: string, t3: T3, ctx: StartContext, lane: Lane): CoordinatorInfo | null {
  const c = t3.coordinators?.get(number) ?? (lane === "Done" ? undefined : t3.idleCoordinators?.get(number));
  return c === undefined ? null : { link: c.link, warning: coordinatorWarning(c, ctx) };
}

/**
 * A braid that would read To Do is Working while it is being planned: a coordinator thread of it runs, or a planning PR
 * into its braid branch is open (checks activity while that PR's checks run). Only To Do is lifted; the coordinator is still no agent.
 */
function planned(number: string, lane: Lane, gh: Github, t3: T3): { readonly lane: Lane; readonly activity: Activity | null } | null {
  const plan = gh.planning?.get(number);
  if (lane !== "To Do" || (plan === undefined && t3.coordinators?.has(number) !== true)) {
    return null;
  }
  return { lane: "In Progress", activity: plan?.checks === "pending" ? "checks" : null };
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
      thread: openThread(`${braid.number}/${s.letter}`, d.agents, t3, d.lane),
      threadRole: openThreadRole(`${braid.number}/${s.letter}`, d.agents, t3, d.lane),
      merge: mergeOf(`${braid.number}/${s.letter}`, gh, sig, t3),
      doneAt: d.lane === "Done" && s.brief.status === "Done" ? (sig.doneAt?.(s.folder, s.source) ?? null) : null,
      pause: d.pause,
      pm: d.pm,
      pmAsk: d.pmAsk,
    };
  });
  if (strands.length === 0) {
    const derived = derive(braid.brief.status, braid.brief.labels, braid.number, gh, t3, sig);
    const lift = planned(braid.number, derived.lane, gh, t3);
    const own = lift === null ? derived : { ...derived, ...lift };
    return { id: braid.brief.id, title: braid.brief.title, status: braid.brief.status, lane: own.lane, labels: braid.brief.labels, branch: braid.source?.branch ?? null, pr: own.pr, reason: own.reason, need: own.need, ask: own.ask, running: own.agents.length > 0, activity: own.activity, done: 0, total: 0, strands, thread: openThread(braid.number, own.agents, t3, own.lane), threadRole: openThreadRole(braid.number, own.agents, t3, own.lane), merge: mergeOf(braid.number, gh, sig, t3), start: startOf(braid, own.lane, t3, ctx), coordinator: coordinatorOf(braid.number, t3, ctx, own.lane), ...doneLinkOf(braid.number, t3, own.lane), doneAt: own.lane === "Done" && braid.brief.status === "Done" ? (sig.doneAt?.(braid.folder, braid.source) ?? null) : null, pause: own.lane === "Done" ? null : derived.pause, pm: own.lane === "Done" ? null : derived.pm, pmAsk: own.lane === "Done" ? null : derived.pmAsk, programme: null, waits: waitsOf(braid.number, sig, t3) };
  }
  // A braid with strands is never worked on by a thread of its own (a thread on its branch is the coordinator),
  // so its own derive sees no agents. It counts when it has a request, or when its final PR is open with every
  // strand Done; before that the strands decide. The one alarm it has is the braid-level `stalled`: In Progress, nothing asked,
  // no strand Working, Needs You or To Review, no pending checks, and no coordinator thread running.
  const pr = gh.prs.get(braid.number) ?? null;
  const asked0 = sig.requests.get(braid.number);
  const routed = asked0 === undefined ? undefined : routeOf(asked0, sig.now, t3, sig.pauses?.has(braid.number) === true);
  const toPm = routed?.to === "pm" && !("via" in routed);
  const away = asked0 !== undefined && routed !== undefined && throughPm(asked0, routed, sig.plans);
  const req = toPm || away ? undefined : asked0;
  const pm = asked0 !== undefined && away ? forwardedLine(asked0, sig.now) : asked0 !== undefined && toPm ? pmLine(asked0, sig.now) : (strands.find((s) => s.pm !== null)?.pm ?? null);
  const askOf = pr?.state === "merged" ? undefined : sig.asks?.get(braid.number);
  const pmNeed = askOf === undefined ? null : needOfAsk(askOf, sig.now, t3);
  const finalPr = pr?.state === "open" && strands.every((s) => s.lane === "Done");
  // The braid-level stall clock is settled first, so wrap-up's derive keeps its own clock on the braid's number, so this one has its own key and is cleared in wrap-up:
  // a final PR open or merged, an open request or any other condition failing clears it.
  const quiet = strands.every((s) => s.lane === "To Do" || s.lane === "Done");
  const known = gh.status.state === "ok" && t3.status.state === "ok";
  const asked = (asked0 !== undefined && pr?.state !== "merged") || pmNeed !== null;
  const holds = finalPr || asked || waits(braid.number, sig).length > 0 || pr?.state === "merged" || braid.brief.status !== "In Progress" || !quiet || (pr?.state === "open" && pr.checks === "pending") || t3.coordinators?.has(braid.number) === true ? false : known ? true : null;
  const paused = sig.pauses?.get(braid.number) ?? null;
  const stalled = sig.alarm(`${braid.number} coordinator`, "stalled", paused === null ? holds : false);
  const broken = waitStall(braid.number, sig, t3);
  const pausedStall = paused !== null && holds === true && phaseOf(paused, sig.now) === "over" ? stalledSince(paused) : null;
  let own: { lane: Lane; reason: Reason | null; need: Need | null; agents?: readonly T3Thread[]; activity?: Activity | null } | null = null;
  if (finalPr) {
    // The braid's recorded reviewers (`braid review <n>`) are its agents in wrap-up; the coordinator never counts.
    const reviewers = (t3.threads.get(braid.number) ?? []).filter((t) => t.role === "reviewer");
    own = derive(braid.brief.status, braid.brief.labels, braid.number, gh, { ...t3, threads: new Map(reviewers.length > 0 ? [[braid.number, reviewers]] : []) }, sig);
  } else if (req !== undefined && routed !== undefined && pr?.state !== "merged") {
    own = requestLane(req, sig.now, routed, t3);
  }
  if (stalled !== null) {
    own = { lane: "Waiting", reason: "stalled", need: { ...plain, kind: "stalled", text: "Stalled: the coordinator stopped and nothing was asked", verb: "for", age: age(stalled, sig.now), since: stalled } };
  } else if (paused !== null && pausedStall !== null) {
    own = { lane: "Waiting", reason: "stalled", need: { ...plain, kind: "stalled", text: stalledText(paused, sig.now), verb: "for", age: age(pausedStall, sig.now), since: pausedStall } };
  } else if (broken !== null && own === null) {
    own = { lane: "Waiting", reason: "stalled", need: broken };
  }
  const limit = paused === null || own?.lane === "Waiting" ? null : limitNeed(paused, sig.now);
  if (limit !== null) {
    own = { lane: "Waiting", reason: "limit", need: { ...plain, kind: "limit", text: limit.text, verb: "for", age: age(limit.since, sig.now), since: limit.since } };
  }
  const candidates = [
    ...(own?.need == null ? [] : [{ lane: own.lane, reason: own.reason, need: own.need, who: null as string | null }]),
    ...(pmNeed === null ? [] : [{ lane: "Waiting" as Lane, reason: pmNeed.kind as Reason, need: pmNeed, who: null as string | null }]),
    ...strands.flatMap((s) => (s.need === null ? [] : [{ lane: s.lane, reason: s.reason, need: s.need, who: s.id as string | null }])),
  ];
  const top = [...candidates].sort((a, b) => URGENCY.indexOf(a.lane) - URGENCY.indexOf(b.lane))[0];
  const base = braidLane(braid.brief.status, strands, pmNeed === null ? own : { lane: "Waiting" });
  const lift = planned(braid.number, base, gh, t3);
  const lane = lift?.lane ?? base;
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
    activity: ACTIVITY.find((a) => strands.some((s) => s.activity === a) || own?.activity === a || lift?.activity === a) ?? null,
    done: strands.filter((s) => s.lane === "Done").length,
    total: strands.length,
    strands,
    thread: openThread(braid.number, own?.agents ?? [], t3, lane),
    threadRole: openThreadRole(braid.number, own?.agents ?? [], t3, lane),
    merge: own === null || pr?.state === "merged" ? null : mergeOf(braid.number, gh, sig, t3),
    start: startOf(braid, lane, t3, ctx),
    coordinator: coordinatorOf(braid.number, t3, ctx, lane),
    ...doneLinkOf(braid.number, t3, lane),
    doneAt: lane === "Done" ? ((braid.brief.status === "Done" ? sig.doneAt?.(braid.folder, braid.source) : null) ?? strands.map((s) => s.doneAt).filter((d) => d !== null).sort().pop() ?? null) : null,
    pause: paused === null || lane === "Done" ? null : pauseView(paused, sig.now),
    pm: lane === "Done" ? null : pm,
    pmAsk: lane === "Done" ? null : (pmNeed ?? ((s) => (s?.pmAsk == null ? null : { ...s.pmAsk, who: s.id }))(strands.find((x) => x.pmAsk !== null))),
    programme: null,
    waits: waitsOf(braid.number, sig, t3),
  };
}

/** The open waits of braid `number` and its strands on another braid. */
const waits = (number: string, sig: Signals): Request[] => (sig.waits ?? []).filter((r) => braidOfId(r.id) === number);

/**
 * What a broken wait of braid `number` reads as: the stall, with its reason. Past its estimate at once; a gone addressee
 * (no coordinator thread, and no PM to remind instead) after ten minutes, on the alarm clock as `<number> wait`. Nothing
 * while the braid, or the braid it waits on, is held or paused.
 */
function waitStall(number: string, sig: Signals, t3: T3): Need | null {
  const live = sig.pauses?.has(number) === true ? [] : waits(number, sig).filter((r) => sig.pauses?.has(r.to ?? "") !== true);
  const gone = live.find((r) => addresseeOf(r, t3, sig.plans)?.to === "gone");
  const since = sig.alarm(`${number} wait`, "stalled", live.length === 0 ? false : t3.status.state !== "ok" ? null : gone !== undefined);
  for (const r of live) {
    const missed = missedEta(r, sig.now);
    if (missed !== null) {
      return { ...plain, kind: "stalled", text: `Stalled: waiting on braid ${r.to ?? ""} past its estimate ${clock(missed, sig.now)}`, verb: "for", age: age(missed, sig.now), since: missed };
    }
  }
  return since === null || gone === undefined ? null : { ...plain, kind: "stalled", text: `Stalled: waiting on braid ${gone.to ?? ""}, whose coordinator is gone`, verb: "for", age: age(since, sig.now), since };
}

/** The open requests of a braid and its strands that wait on another braid. */
const waitsOf = (number: string, sig: Signals, t3: T3): RequestRow[] =>
  (sig.waits ?? []).filter((r) => r.id === number || r.id.startsWith(`${number}/`)).map((r) => rowOf(r, sig.now, t3));

/** How many Done braids show at first, and how many more each press of Show more adds. */
export const DONE_PAGE = 10;

/** The Done braids newest first by the date they became Done; those without a date come last, highest number first. */
export function doneNewestFirst<T extends { readonly id: string; readonly doneAt: string | null }>(cards: readonly T[]): T[] {
  return [...cards].sort((a, b) => (a.doneAt === b.doneAt ? 0 : a.doneAt === null ? 1 : b.doneAt === null ? -1 : a.doneAt < b.doneAt ? 1 : -1) || (a.id < b.id ? 1 : -1));
}

export function toBoard(repo: string, braids: readonly Braid[], gh: Github, t3: T3 = NO_T3, sig: Signals = noSignals(), ctx: StartContext = NO_START, inbox: InboxData = NO_INBOX, problems: readonly Problem[] = [], limits: LimitsView | null = null): BoardData {
  const ideas = inbox.ideas.map((i) => {
    const c = ideaPlanning(t3, i.id);
    return c === null ? i : { ...i, planning: { link: c.link } };
  });
  const cards = braids.map((b) => toCard(b, gh, t3, sig, ctx));
  const programmes = toProgrammes(repo, sig.plans ?? [], cards, t3, sig, gh);
  const tags = programmeOfBraid(programmes);
  return { repo, lanes: LANES, github: gh.status, t3: t3.status, braids: cards.map((c) => ({ ...c, programme: tags.get(c.id) ?? null })), programmes, inbox: { ...inbox, ideas, base: `origin/${ctx.main}`, expected: ctx.expected === null ? null : `${ctx.expected.provider} / ${ctx.expected.model}` }, remote: false, problems, pausesNote: sig.pausesNote ?? null, limits };
}

export function toDetail(tree: Tree, braid: Braid, item: Item, gh: Github, t3: T3 = NO_T3, sig: Signals = noSignals(), ctx: StartContext = NO_START): ItemDetail {
  const tag = (sig.plans ?? []).find((p) => p.plan?.rows.some((r) => r.braid === braid.number) === true)?.slug ?? null;
  const card = { ...toCard(braid, gh, t3, sig, ctx), programme: tag };
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
    threadRole: own?.threadRole ?? null,
    merge: own?.merge ?? null,
    pause: own?.pause ?? null,
    pm: own?.pm ?? null,
    pmAsk: own?.pmAsk ?? null,
    requests: requestsOf(item === braid ? (id) => id === braid.number || id.startsWith(`${braid.number}/`) : (id) => id === item.brief.id, sig, t3),
    brief: item.brief.body.trim(),
    report: item.hasReport ? tree.read(`${item.folder}/report.md`) : null,
    logs: item.logs.map((name) => ({ name, text: tree.read(`${item.folder}/${name}`) ?? "" })),
    braid: card,
  };
}
