// The projects one board serves: one per-machine file, `~/.braid/projects.json`. Nothing about it goes
// into a repository. Writes hold a lock next to the file, re-read it, then write a temporary file and
// rename it, so two `braid projects add` runs at once both keep their entry. A file braid can't read is
// reported and never rewritten.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";
import { locked } from "../braids/requests.js";
import { braidHome } from "../notify/config.js";

export const PROJECTS_VERSION = 1;

export interface Project {
  /** Unique in the list: letters, digits, `.`, `_` and `-`. */
  readonly name: string;
  /** The main checkout's absolute path. */
  readonly path: string;
  /** A fixed port for this project's board, if set. */
  readonly port?: number;
}

/** The list can't be read: corrupt JSON, an unknown version or a bad entry. Nothing writes over such a file. */
export class ProjectsFileError extends Error {}

export function projectsFile(home: string = braidHome()): string {
  return join(home, "projects.json");
}

const NAME = /^[A-Za-z0-9._-]{1,64}$/;

export function validName(name: string): boolean {
  return NAME.test(name) && name !== "." && name !== "..";
}

export function validPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/** Two paths name the same folder (Windows paths ignore case). */
export function samePath(a: string, b: string): boolean {
  const norm = (p: string): string => (process.platform === "win32" ? resolve(p).toLowerCase() : resolve(p));
  return norm(a) === norm(b);
}

/** The folder name a project's worktrees go under (`~/braid-worktrees/<folder>/`), compared like a path. */
export function folderKey(path: string): string {
  const name = basename(resolve(path));
  return process.platform === "win32" ? name.toLowerCase() : name;
}

function entry(raw: unknown, at: number, file: string): Project {
  const bad = (why: string): ProjectsFileError => new ProjectsFileError(`${file}: project ${at + 1} ${why}; fix or remove the file by hand`);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw bad("is not an object");
  }
  const { name, path, port } = raw as Record<string, unknown>;
  if (typeof name !== "string" || !validName(name)) {
    throw bad("has no valid name");
  }
  if (typeof path !== "string" || !isAbsolute(path)) {
    throw bad("has no absolute path");
  }
  if (port !== undefined && (typeof port !== "number" || !validPort(port))) {
    throw bad("has a port that is not 1 to 65535");
  }
  return port === undefined ? { name, path } : { name, path, port };
}

/** The list; empty when the file is missing. Throws `ProjectsFileError` when it can't be read. */
export function readProjects(home: string = braidHome()): Project[] {
  const file = projectsFile(home);
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw new ProjectsFileError(`${file} can't be read (${error instanceof Error ? error.message : String(error)})`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    throw new ProjectsFileError(`${file} is not valid JSON; fix or remove the file by hand`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ProjectsFileError(`${file} is not a JSON object; fix or remove the file by hand`);
  }
  const { version, projects } = parsed as Record<string, unknown>;
  if (version !== PROJECTS_VERSION) {
    throw new ProjectsFileError(`${file} has version ${JSON.stringify(version) ?? "none"}; this braid reads version ${PROJECTS_VERSION} (update braid, or fix the file by hand)`);
  }
  if (!Array.isArray(projects)) {
    throw new ProjectsFileError(`${file} has no projects list; fix or remove the file by hand`);
  }
  const list = projects.map((p, i) => entry(p, i, file));
  for (const [i, p] of list.entries()) {
    const twin = list.slice(0, i).find((q) => q.name === p.name || samePath(q.path, p.path));
    if (twin !== undefined) {
      throw new ProjectsFileError(`${file} lists ${twin.name === p.name ? `the name ${p.name}` : `the path ${p.path}`} twice; fix the file by hand`);
    }
  }
  return list;
}

function writeProjects(file: string, list: readonly Project[]): void {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify({ version: PROJECTS_VERSION, projects: list }, null, 2)}\n`);
  renameSync(tmp, file);
}

/**
 * A locked read-modify-write: `change` gets the list as it is now and returns the new one, or null to
 * leave the file alone. A file that can't be read throws before `change` runs, so it is never rewritten.
 */
export function updateProjects<T>(change: (list: Project[]) => { list: Project[] | null; result: T }, home: string = braidHome()): T {
  const file = projectsFile(home);
  return locked(
    file,
    () => {
      const { list, result } = change(readProjects(home));
      if (list !== null) {
        writeProjects(file, list);
      }
      return result;
    },
    "the project list",
    (dir) => mkdirSync(dir, { recursive: true }),
  );
}
