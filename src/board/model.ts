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
}

export interface BraidCard {
  readonly id: string;
  readonly title: string;
  readonly status: Status;
  readonly lane: Lane;
  readonly labels: readonly string[];
  /** The branch the braid's own brief was read from; null for the working tree. */
  readonly branch: string | null;
  readonly done: number;
  readonly total: number;
  readonly strands: readonly StrandCard[];
}

export interface BoardData {
  /** The repository folder name, shown in the header. */
  readonly repo: string;
  readonly lanes: readonly Lane[];
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

/** Most urgent first. */
const URGENCY: readonly Lane[] = ["Waiting", "In Review", "In Progress", "To Do", "Done"];

/** A braid with strands sits in its most urgent strand's lane, in Done when all are done. */
export function laneOfBraid(braid: Braid): Lane {
  if (braid.strands.length === 0) {
    return laneOfStatus(braid.brief.status);
  }
  const lanes = braid.strands.map((s) => laneOfStatus(s.brief.status));
  return URGENCY.find((lane) => lanes.includes(lane)) ?? "To Do";
}

export function toCard(braid: Braid): BraidCard {
  const strands = braid.strands.map((s) => ({
    id: s.brief.id,
    title: s.brief.title,
    status: s.brief.status,
    lane: laneOfStatus(s.brief.status),
    branch: s.source?.branch ?? null,
  }));
  return {
    id: braid.brief.id,
    title: braid.brief.title,
    status: braid.brief.status,
    lane: laneOfBraid(braid),
    labels: braid.brief.labels,
    branch: braid.source?.branch ?? null,
    done: strands.filter((s) => s.status === "Done").length,
    total: strands.length,
    strands,
  };
}

export function toBoard(repo: string, braids: readonly Braid[]): BoardData {
  return { repo, lanes: LANES, braids: braids.map(toCard) };
}

export function toDetail(root: string, braid: Braid, item: Item): ItemDetail {
  const card = toCard(braid);
  const tree = treeOf(root, item);
  return {
    id: item.brief.id,
    title: item.brief.title,
    status: item.brief.status,
    lane: item === braid ? card.lane : laneOfStatus(item.brief.status),
    labels: item.brief.labels,
    dependencies: item.brief.dependencies,
    order: item.brief.order,
    delivery: item.brief.delivery,
    folder: item.folder,
    branch: item.source?.branch ?? null,
    brief: item.brief.body.trim(),
    report: item.hasReport ? tree.read(`${item.folder}/report.md`) : null,
    logs: item.logs.map((name) => ({ name, text: tree.read(`${item.folder}/${name}`) ?? "" })),
    braid: card,
  };
}
