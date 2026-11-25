import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const scratch = mkdtempSync(join(tmpdir(), "braid-gitcache-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
const home = join(scratch, "home");
mkdirSync(home);
for (const key of ["HOME", "USERPROFILE", "XDG_CONFIG_HOME"]) {
  process.env[key] = home;
}
process.env["GIT_CONFIG_NOSYSTEM"] = "1";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const gitio: any = await load("../dist/braids/gitio.js");
const repo: any = await load("../dist/braids/repo.js");
const title: any = await load("../dist/braids/title.js");
const t3: any = await load("../dist/board/t3.js");

const sh = (cwd: string, ...args: string[]) => {
  const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
};

function setup() {
  const main = join(scratch, "main");
  mkdirSync(main);
  sh(main, "init", "-q", "-b", "main");
  sh(main, "commit", "-q", "--allow-empty", "-m", "x");
  sh(main, "remote", "add", "origin", "https://example.com/owner/the-repo.git");
  const wt = join(scratch, "wt");
  sh(main, "worktree", "add", "-q", wt, "-b", "side");
  return { main, wt };
}

test("a root's main checkout and repository name are read from Git once, however many refreshes ask", async () => {
  const { main, wt } = setup();
  const seen: string[][] = [];
  gitio.spyOnGit((args: string[]) => seen.push(args));
  repo.resetRepoCache();
  const refresh = async () => {
    const out = [t3.mainCheckout(wt), repo.mainCheckout(wt), repo.mainCheckoutOf(wt), repo.repoNameOf(wt), title.titleRepoName(wt), await repo.mainCheckoutAsync(wt), await repo.originRepoNameAsync(wt)];
    return out;
  };
  const first = await refresh();
  const afterFirst = seen.length;
  const second = await refresh();
  gitio.spyOnGit(undefined);
  assert.deepEqual(second, first);
  assert.equal(seen.length, afterFirst, "the second refresh started no git process");
  assert.equal(afterFirst, 2, `one rev-parse and one remote get-url, saw ${JSON.stringify(seen)}`);
  assert.equal(repo.repoNameOf(wt), "main");
  assert.equal(title.titleRepoName(wt), "the-repo");
  assert.equal(repo.mainCheckout(wt).toLowerCase(), main.toLowerCase());
});

test("a folder that is not a repository is not cached, and reset forgets a cached root", () => {
  const plain = join(scratch, "plain");
  mkdirSync(plain);
  repo.resetRepoCache();
  assert.equal(repo.mainCheckoutOf(plain), null);
  assert.throws(() => repo.mainCheckout(plain), /can't read the repository/);
  assert.equal(t3.mainCheckout(plain), plain);
  sh(plain, "init", "-q");
  assert.ok(repo.mainCheckoutOf(plain) !== null);
});
