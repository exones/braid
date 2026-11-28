import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, beforeEach } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

// Fixtures shared by start.test.ts and start-clean.test.ts. Each test file runs in its own process,
// so each gets its own scratch folder (removed after its tests).
export const scratch = mkdtempSync(join(tmpdir(), "braid-start-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));

export const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
export const { startCommand, worktreesDir } = (await load("../../dist/commands/start.js")) as {
  startCommand: (root: string, args: string[], src: object, env: Record<string, string>) => Promise<string>;
  worktreesDir: (env: Record<string, string>) => string;
};
export const { cleanCommand } = (await load("../../dist/commands/clean.js")) as {
  cleanCommand: (root: string, args: string[], src: object, env: Record<string, string>) => Promise<string>;
};
export const { resetGithubMemory } = (await load("../../dist/board/github.js")) as { resetGithubMemory: () => void };
beforeEach(() => {
  resetGithubMemory();
});

export const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};
export const ok = (data: unknown) => ({ status: 0, stdout: JSON.stringify(data), stderr: "" });
export const src = (prs: object[] = []) => ({
  gh: () => ok(prs),
  t3: (_r: string, args: readonly string[]) => Promise.resolve(args[1] === "list" ? ok([]) : ok({ thread: { branch: null, worktreePath: null, pendingRequestCount: 0 } })),
});

let n = 0;
/** A repository named `proj` with a bare local remote; braid 0001 has strands A (Done), B (ready), C (blocked by B) and a braid branch, else a story 0002. */
export function repo(withStrands = true): { root: string; env: Record<string, string>; wt: string } {
  const base = join(scratch, `t${++n}`);
  const root = join(base, "proj");
  const wt = join(base, "wt");
  const put = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  const brief = (id: string, status: string, deps = "", order = "") =>
    `---\nid: '${id}'\ntitle: "T ${id}"\nstatus: ${status}\nlabels: []\ndependencies: [${deps}]\n${order}---\n\n## Goal\n\nx\n`;
  put("BRAID.md", "---\nmain: main\nci: none\n---\n");
  if (withStrands) {
    put("braids/0001-alpha/brief.md", brief("0001", "In Progress"));
    put("braids/0001-alpha/A-first/brief.md", brief("0001/A", "Done", "", "order: 10\n"));
    put("braids/0001-alpha/B-second-one/brief.md", brief("0001/B", "To Do", "'0001/A'", "order: 20\n"));
    put("braids/0001-alpha/C-third/brief.md", brief("0001/C", "To Do", "'0001/B'", "order: 30\n"));
  } else {
    put("braids/0002-story/brief.md", brief("0002", "To Do"));
  }
  mkdirSync(base, { recursive: true });
  git(base, "init", "-q", "--bare", "remote.git");
  git(base, "init", "-q", "-b", "main", root);
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  git(root, "remote", "add", "origin", join(base, "remote.git"));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  git(root, "push", "-q", "origin", "main");
  if (withStrands) {
    git(root, "checkout", "-q", "-b", "braid/0001-alpha");
    git(root, "commit", "-q", "--allow-empty", "-m", "braid tip");
    git(root, "push", "-q", "origin", "braid/0001-alpha");
    git(root, "checkout", "-q", "main");
    git(root, "commit", "-q", "--allow-empty", "-m", "main moves on");
  }
  return { root, env: { BRAID_WORKTREES_DIR: wt }, wt };
}


export const gone = (root: string, branch: string) => git(root, "branch", "--list", branch) === "";

export const { agentsDir } = (await load("../../dist/braids/worktree-folders.js")) as { agentsDir: (root: string, env: Record<string, string>) => string };

let homes = 0;
/** Runs `body` with a project list in a scratch home (homedir() follows HOME and USERPROFILE). */
export async function listed<T>(projects: { name: string; path: string }[] | string, body: () => Promise<T> | T): Promise<T> {
  const home = join(scratch, `home${++homes}`);
  mkdirSync(join(home, ".braid"), { recursive: true });
  writeFileSync(join(home, ".braid", "projects.json"), typeof projects === "string" ? projects : JSON.stringify({ version: 1, projects }));
  const saved = { HOME: process.env["HOME"], USERPROFILE: process.env["USERPROFILE"] };
  process.env["HOME"] = home;
  process.env["USERPROFILE"] = home;
  try {
    return await body();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }
}
