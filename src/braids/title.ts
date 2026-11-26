// The title of a braid thread: `<emoji> <repo> <id> <role>: <title>`. One builder, one parser.
import { originRepoName } from "./repo.js";

/** The GitHub repository's name from `origin`'s URL; the checkout's folder name when there is no `origin`; cached per root. */
export const titleRepoName = originRepoName;

import { ROLES, STEERING_EMOJI, type TitleRole } from "./roles.js";

export { ROLES, STEERING_EMOJI, type TitleRole };

export function threadTitle(repo: string, id: string, role: TitleRole, title: string): string {
  return `${ROLES[role]} ${repo} ${id} ${role}: ${title}`;
}

export interface ParsedTitle {
  readonly repo: string;
  /** `0009` or `0009/D`. */
  readonly id: string;
  readonly role: TitleRole;
  readonly title: string;
}

/** Reads a thread title, with or without the leading emoji (older threads have none); null for any other title. */
export function parseThreadTitle(text: string): ParsedTitle | null {
  const m = /^(?:[^\x00-\x7F]+\s+)?(\S+) (\d{4}(?:\/[A-Z])?) (coordinator|worker|review|research): (.*)$/.exec(text);
  return m === null ? null : { repo: m[1] ?? "", id: m[2] ?? "", role: m[3] as TitleRole, title: m[4] ?? "" };
}


/** An older board steering thread's title (`🚦 <repo> steering: <what>`, 0064; none starts since 0074/C) read back, so it is never taken for an item's agent; the 🚦 is required, so no other thread with a similar title is taken for it. Null for any other title. */
export function parseSteeringTitle(text: string): { readonly repo: string; readonly what: string } | null {
  const m = new RegExp(`^${STEERING_EMOJI}\\s+(\\S+) steering: (.*)$`).exec(text);
  return m === null ? null : { repo: m[1] ?? "", what: m[2] ?? "" };
}
