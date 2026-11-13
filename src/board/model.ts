import { type Github, type PullRequest } from "./github.js";
import { treeOf } from "../braids/branches.js";
import type { Status } from "../braids/brief.js";
import type { Braid, Item } from "../braids/store.js";

export const LANES = ["To Do", "In Progress", "In Review", "Waiting", "Done"] as const;
export type Lane = (typeof LANES)[number];

export interface StrandCard {
  readonly id: string;
  readonly title: string;
  readonly status: Status;
  readonly lane: Lane;
  /** The branch the brief was read from; null for the working tree. */
  readonly branch: string | null;
  readonly pr: PullRequest | null;
  /** Why the item waits (`checks failed` or an ask key); null outside Waiting. */
  readonly reason: string | null;
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
  readonly reason: string | null;
  readonly done: number;
  readonly total: number;
  readonly strands: readonly StrandCard[];
}

export interface BoardData {
  /** The repository folder name, shown in the header. */
  readonly repo: string;
  readonly lanes: readonly Lane[];
  /** Whether GitHub could be read; when not, lanes come from the stored states. */
  readonly github: Github["status"];
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
  readonly reason: string | null;
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

export interface Derived {
  readonly lane: Lane;
  readonly pr: PullRequest | null;
  readonly reason: string | null;
}

/**
 * An item's lane from its stored status, its labels and its PR. Done stays Done; an `ask:<key>`
 * label waits with that key; a merged PR is Done; an open PR is In Review, or Waiting when its
 * checks fail (until T3 threads say an agent is on it); otherwise the stored status decides.
 */
export function derive(status: Status, labels: readonly string[], key: string, gh: Github): Derived {
  const pr = gh.prs.get(key) ?? null;
  if (status === "Done") {
    return { lane: "Done", pr, reason: null };
  }
  const ask = labels.find((l) => l.startsWith("ask:") && l.length > 4);
  if (ask !== undefined && pr?.state !== "merged") {
    return { lane: "Waiting", pr, reason: ask.slice(4) };
  }
  if (pr?.state === "merged") {
    return { lane: "Done", pr, reason: null };
  }
  if (pr?.state === "open") {
    return pr.checks === "failing"
      ? { lane: "Waiting", pr, reason: "checks failed" }
      : { lane: "In Review", pr, reason: null };
  }
  return { lane: laneOfStatus(status), pr, reason: null };
}

/** Most urgent first. */
const URGENCY: readonly Lane[] = ["Waiting", "In Review", "In Progress", "To Do", "Done"];

/** A braid with strands sits in its most urgent strand's lane, in Done when all are done. */
export function laneOfLanes(lanes: readonly Lane[]): Lane {
  return URGENCY.find((lane) => lanes.includes(lane)) ?? "To Do";
}

export function toCard(braid: Braid, gh: Github): BraidCard {
  const own = derive(braid.brief.status, braid.brief.labels, braid.number, gh);
  const strands: StrandCard[] = braid.strands.map((s) => {
    const d = derive(s.brief.status, s.brief.labels, `${braid.number}/${s.letter}`, gh);
    return {
      id: s.brief.id,
      title: s.brief.title,
      status: s.brief.status,
      lane: d.lane,
      branch: s.source?.branch ?? null,
      pr: d.pr,
      reason: d.reason,
    };
  });
  // A braid with strands sits in its most urgent strand's lane; with none, its own state decides.
  const lane = strands.length === 0 ? own.lane : laneOfLanes(strands.map((s) => s.lane));
  const waiting = strands.find((s) => s.lane === "Waiting");
  return {
    id: braid.brief.id,
    title: braid.brief.title,
    status: braid.brief.status,
    lane,
    labels: braid.brief.labels,
    branch: braid.source?.branch ?? null,
    pr: own.pr,
    reason: strands.length === 0 ? own.reason : (waiting?.reason ?? null),
    done: strands.filter((s) => s.lane === "Done").length,
    total: strands.length,
    strands,
  };
}

export function toBoard(repo: string, braids: readonly Braid[], gh: Github): BoardData {
  return { repo, lanes: LANES, github: gh.status, braids: braids.map((b) => toCard(b, gh)) };
}

export function toDetail(root: string, braid: Braid, item: Item, gh: Github): ItemDetail {
  const card = toCard(braid, gh);
  const own = item === braid ? card : card.strands.find((s) => s.id === item.brief.id);
  const tree = treeOf(root, item);
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
    brief: item.brief.body.trim(),
    report: item.hasReport ? tree.read(`${item.folder}/report.md`) : null,
    logs: item.logs.map((name) => ({ name, text: tree.read(`${item.folder}/${name}`) ?? "" })),
    braid: card,
  };
}
