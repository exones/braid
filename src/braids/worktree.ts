// The board's read of the working tree (docs/board.md, "Refresh"): `braids/` and what `braid check` reads beside it,
// without a synchronous file-system call. Every read lists the folders and stats the files; a file's text is read
// again only when its stat changed, and a read that found nothing changed returns the same object as the one before,
// so its callers can keep what they made of it. The CLI commands keep `fsTree`.
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { BRAID_FOLDER, LOG_FILE, STRAND_FOLDER, type WorkingFiles } from "./store.js";

type Entry = { readonly name: string; readonly isDir: boolean };

/** Runs `work` over `items`, a few at a time. */
export async function limited<T>(items: readonly T[], work: (item: T) => Promise<void>, size = 8): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        await work(items[next++] as T);
      }
    }),
  );
}

/** The result of `read`, or null when the file or folder isn't there (also: gone since it was listed). */
async function present<T>(read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return null;
    }
    throw error;
  }
}

interface Snapshot {
  readonly tree: WorkingFiles;
  /** Every listing and stat of the read: equal means nothing changed. */
  readonly signature: string;
  readonly files: ReadonlyMap<string, { readonly stamp: string; readonly text: string }>;
}

const last = new Map<string, Snapshot>();

const itemFile = (name: string): boolean => name === "brief.md" || name === "report.md" || LOG_FILE.test(name);

async function snapshot(root: string, before: Snapshot | undefined): Promise<Snapshot> {
  const dirs = new Map<string, readonly Entry[]>();
  const wanted: string[] = [];
  const list = async (dir: string): Promise<void> => {
    const found = await present(readdir(join(root, dir), { withFileTypes: true }));
    if (found === null) {
      return;
    }
    const entries: Entry[] = [];
    for (const e of found) {
      // A link says what it points to only when asked.
      const isDir = e.isSymbolicLink() ? ((await present(stat(join(root, dir, e.name))))?.isDirectory() ?? false) : e.isDirectory();
      entries.push({ name: e.name, isDir });
    }
    dirs.set(dir, entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)));
  };
  const folders = (dir: string, shape: RegExp): string[] => (dirs.get(dir) ?? []).filter((e) => e.isDir && shape.test(e.name)).map((e) => `${dir}/${e.name}`);
  const want = (dir: string, match: (name: string) => boolean): void => {
    wanted.push(...(dirs.get(dir) ?? []).filter((e) => !e.isDir && match(e.name)).map((e) => `${dir}/${e.name}`));
  };

  await Promise.all([list("braids"), list("autonomy")]);
  const braids = folders("braids", BRAID_FOLDER);
  await limited(braids, list, 16);
  const strands = braids.flatMap((b) => folders(b, STRAND_FOLDER));
  await limited(strands, list, 16);
  for (const dir of [...braids, ...strands]) {
    want(dir, itemFile);
  }
  want("autonomy", (name) => name.endsWith(".md"));
  wanted.push("BRAID.md");
  wanted.sort();

  const stamps = new Map<string, string>();
  const existing = new Set<string>();
  await limited(
    ["braids", "backlog", ...wanted],
    async (path) => {
      const s = await present(stat(join(root, path)));
      if (s === null) {
        return;
      }
      existing.add(path);
      if (s.isFile()) {
        stamps.set(path, `${s.mtimeMs} ${s.ctimeMs} ${s.size} ${s.ino}`);
      }
    },
    16,
  );
  const signature = JSON.stringify([
    [...dirs].sort(([a], [b]) => (a < b ? -1 : 1)),
    wanted.map((p) => [p, stamps.get(p) ?? null]),
    existing.has("braids"),
    existing.has("backlog"),
  ]);
  if (before !== undefined && before.signature === signature) {
    return before;
  }

  const files = new Map<string, { stamp: string; text: string }>();
  await limited(
    [...stamps].filter(([path]) => path !== "braids" && path !== "backlog"),
    async ([path, stamp]) => {
      const had = before?.files.get(path);
      const text = had?.stamp === stamp ? had.text : await present(readFile(join(root, path), "utf8"));
      if (text !== null) {
        files.set(path, { stamp, text });
      }
    },
    16,
  );
  const tree: WorkingFiles = {
    source: null,
    list: (dir) => dirs.get(dir) ?? [],
    exists(path) {
      if (path !== "braids" && path !== "backlog" && path !== "BRAID.md") {
        throw new Error(`not in the board's read of the working tree: ${path}`);
      }
      return existing.has(path);
    },
    read(file) {
      const found = files.get(file);
      if (found !== undefined) {
        return found.text;
      }
      const cut = file.lastIndexOf("/");
      const name = file.slice(cut + 1);
      // A file that is there but that this read leaves out is a mistake of the caller, not a missing file.
      if (!wanted.includes(file) && dirs.get(file.slice(0, Math.max(cut, 0)))?.some((e) => e.name === name && !e.isDir) === true) {
        throw new Error(`not in the board's read of the working tree: ${file}`);
      }
      return null;
    },
  };
  return { tree, signature, files };
}

/** The working tree under `root` as it is now. The same object as the last call's when nothing in it changed. */
export async function readWorkingTree(root: string): Promise<WorkingFiles> {
  const key = resolve(root);
  const next = await snapshot(root, last.get(key));
  last.set(key, next);
  return next.tree;
}
