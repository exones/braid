// The combined board of several projects (docs/board.md, "Several projects"): each project's lanes are derived
// as for one project; combining only tags each card with its project and merges them in list order.
import type { Problem } from "../braids/readiness.js";
import type { Github } from "./github.js";
import type { InboxData } from "./inbox.js";
import { LANES, type BoardData, type BraidCard, type Lane } from "./model.js";
import type { T3 } from "./t3.js";
import type { Programme } from "./programme.js";
import { mergeLimits, type LimitsView } from "./limits.js";
import type { SignInView } from "../t3/words.js";

/** What the board knows about one served project, besides its cards. */
export interface ProjectInfo {
  /** The name in the project list (or the repository's name with no list). */
  readonly name: string;
  /** The repository name its cards and pushes show; two projects may share it. */
  readonly repo: string;
  /** Cards per lane (braids, not strands). */
  readonly counts: Readonly<Record<Lane, number>>;
  /** What stops the project from working as a braid project; empty when nothing does. */
  readonly problems: readonly Problem[];
  readonly github: Github["status"] | null;
  readonly t3: T3["status"] | null;
  /** When the snapshot shown was read (ISO time); null when no read succeeded yet. */
  readonly readAt: string | null;
  /** How old that snapshot is, in ms; null with no snapshot. */
  readonly ageMs: number | null;
  /** Why the latest read failed (the snapshot shown is then the older one); null when it succeeded. */
  readonly failure: string | null;
  /** The project's open inbox entries; null with no snapshot. */
  readonly inbox: InboxData | null;
  /** Why its `.braid/pauses.json` was read as no pauses; null when it read cleanly, is missing, or there is no snapshot. */
  readonly pausesNote: string | null;
}

/** A card of the combined board: the project's own card, tagged with the project's name. */
export type TaggedCard = BraidCard & { readonly project: string };

/** A programme of the combined board: keyed `<project>/<slug>`, so one slug in two projects stays two programmes. */
export type TaggedProgramme = Programme & { readonly project: string; readonly key: string };

/** The programmes of one project, tagged with its name and keyed. */
export const tagProgrammes = (project: string, programmes: readonly Programme[]): TaggedProgramme[] => programmes.map((p) => ({ ...p, project, key: `${project}/${p.slug}` }));

/** `GET /api/all`. */
export interface AllBoard {
  readonly lanes: readonly Lane[];
  readonly remote: boolean;
  readonly projects: readonly ProjectInfo[];
  /** Every card of the projects in `projects`, in list order, each project's cards in their own order. */
  readonly braids: readonly TaggedCard[];
  /** Every programme of those projects (done and stopped ones too), in list order, each project's in slug order. */
  readonly programmes: readonly TaggedProgramme[];
  /** Names asked for with `?projects=` that aren't served (a project removed from the list). */
  readonly missing: readonly string[];
  /** The providers' limits of those projects as one list (a provider spans projects); null when none was read. */
  readonly limits: LimitsView | null;
  /** The board's T3 sign-in (docs/board.md, "T3 sign-in"), added by the server; null or absent: the board has none. Never the token. */
  readonly t3SignIn?: SignInView | null;
}

/** One project as the server holds it: its name, its last good board (or none) and how its reads went. */
export interface Held {
  readonly name: string;
  readonly repo: string;
  readonly board: BoardData | undefined;
  readonly readAt: number | null;
  readonly failure: string | null;
  /** Problems to show when there is no board (readiness without GitHub). */
  readonly problems: readonly Problem[];
}

export function projectInfo(held: Held, now: number = Date.now()): ProjectInfo {
  const counts = Object.fromEntries(LANES.map((l) => [l, 0])) as Record<Lane, number>;
  for (const card of held.board?.braids ?? []) {
    counts[card.lane] += 1;
  }
  return {
    name: held.name,
    repo: held.board?.repo ?? held.repo,
    counts,
    problems: held.board?.problems ?? held.problems,
    github: held.board?.github ?? null,
    t3: held.board?.t3 ?? null,
    readAt: held.readAt === null ? null : new Date(held.readAt).toISOString(),
    ageMs: held.readAt === null ? null : Math.max(0, now - held.readAt),
    failure: held.failure,
    inbox: held.board?.inbox ?? null,
    pausesNote: held.board?.pausesNote ?? null,
  };
}

/** The combined board of `held` (already narrowed to the projects asked for). */
export function combine(held: readonly Held[], remote: boolean, missing: readonly string[] = [], now: number = Date.now()): AllBoard {
  return {
    lanes: LANES,
    remote,
    projects: held.map((h) => projectInfo(h, now)),
    braids: held.flatMap((h) => (h.board?.braids ?? []).map((card) => ({ ...card, project: h.name }))),
    programmes: held.flatMap((h) => tagProgrammes(h.name, h.board?.programmes ?? [])),
    missing,
    limits: mergeLimits(held.map((h) => ({ project: h.name, view: h.board?.limits ?? null }))),
  };
}

/** The names in `?projects=a,b`: trimmed, empty ones and repeats dropped; null when the parameter is absent. */
export function projectsParam(value: string | null): string[] | null {
  if (value === null) {
    return null;
  }
  return [...new Set(value.split(",").map((n) => n.trim()).filter((n) => n !== ""))];
}
