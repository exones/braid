import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const { SHIPPED_PRESETS } = await load("../dist/braids/presets.js");
const { parsePreset, delegatedGuarded } = await load("../dist/braids/autonomy.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-autonomy-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// Git and braid run with a home inside the scratch folder, so no real config is read or written.
const home = join(scratch, "home");
mkdirSync(home);
const env: NodeJS.ProcessEnv = {
  ...process.env,
  HOME: home,
  USERPROFILE: home,
  APPDATA: join(home, "AppData"),
  LOCALAPPDATA: join(home, "AppData", "Local"),
  XDG_CONFIG_HOME: join(home, ".config"),
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.invalid",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.invalid",
};

function braid(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd, env });
}

function ok(cwd: string, ...args: string[]): string {
  const r = braid(cwd, ...args);
  assert.equal(r.stderr, "", `braid ${args.join(" ")}`);
  assert.equal(r.status, 0, `braid ${args.join(" ")}`);
  return r.stdout;
}

let count = 0;
/** A Git repository with one commit on main and no remote. */
function repo(): string {
  const root = join(scratch, `repo-${++count}`);
  mkdirSync(root);
  for (const args of [["init", "-q", "-b", "main"], ["commit", "-q", "--allow-empty", "-m", "init"]]) {
    assert.equal(spawnSync("git", args, { cwd: root, env }).status, 0);
  }
  return root;
}

function put(root: string, path: string, text: string): void {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), text);
}

const preset = (name: string, rows: string, front = `name: ${name}\nmerge: strands\ncontinue: yes`) =>
  `---\n${front}\n---\n# ${name}: test\n\n| Case | Decide yourself when | Ask me when |\n| --- | --- | --- |\n${rows}\nFree line.\n`;
const ROWS = ["security", "dependency", "architecture", "data", "process", "outward", "scope", "quality"].map((key) => `| ${key} | never | always |`).join("\n");

test("the three shipped presets are in the built package and pass the preset rules", () => {
  assert.deepEqual([...SHIPPED_PRESETS.keys()], ["careful", "steady", "free"]);
  const parsed = new Map([...SHIPPED_PRESETS].map(([name, text]) => [name, parsePreset(text, name, name)]));
  assert.deepEqual([...parsed.values()].map((p) => [p.merge, p.continue]), [["none", "no"], ["strands", "yes"], ["all", "yes"]]);
  assert.deepEqual(delegatedGuarded(parsed.get("careful")), []);
  assert.deepEqual(delegatedGuarded(parsed.get("steady")), []);
  assert.deepEqual(delegatedGuarded(parsed.get("free")), ["security", "data", "outward"]);
  assert.match(SHIPPED_PRESETS.get("careful"), /^Tier L items: always ask\.$/m);
  assert.match(SHIPPED_PRESETS.get("steady"), /^\| security, data, outward \| never \| always \|$/m);
});

test("braid autonomy: the built-in default, the BRAID.md default, the brief's own and a project file", () => {
  const root = repo();
  ok(root, "new", "Alpha", "--no-fetch");
  let out = ok(root, "autonomy", "1");
  assert.match(out, /^Preset: careful\nName from: the built-in default \(neither the brief nor BRAID\.md names one\)\nText from: shipped with braid\n\n---\nname: careful\n/);
  assert.doesNotMatch(out, /This braid:/);

  put(root, "BRAID.md", "---\ngate: npm test\nautonomy: steady\n---\n# facts\n");
  out = ok(root, "autonomy", "0001");
  assert.match(out, /^Preset: steady\nName from: BRAID\.md \(the project default\)\nText from: shipped with braid\n/);
  assert.match(out, /^When unsure which column applies: ask\.\n$/m);

  ok(root, "edit", "1", "--autonomy", "free");
  ok(root, "brief", "1", "Autonomy", "--text", "architecture: ask for everything in 0001/B");
  out = ok(root, "autonomy", "1");
  assert.match(out, /^Preset: free\nName from: the brief of 0001\nText from: shipped with braid\n/);
  assert.match(out, /\nThis braid:\narchitecture: ask for everything in 0001\/B\n$/);
  assert.match(ok(root, "view", "1"), /^Autonomy: free$/m);

  put(root, "autonomy/free.md", preset("free", ROWS));
  put(root, "autonomy/team.md", preset("team", ROWS));
  out = ok(root, "autonomy", "1");
  assert.match(out, /^Preset: free\nName from: the brief of 0001\nText from: autonomy\/free\.md \(replaces the shipped one\)\n\n---\nname: free\nmerge: strands\n/);
  assert.equal(ok(root, "autonomy", "--list"), [
    "careful  shipped",
    "steady   shipped  (default here)",
    "free     autonomy/free.md (replaces the shipped one)",
    "team     autonomy/team.md",
    "",
  ].join("\n"));
  ok(root, "edit", "1", "--autonomy", "team");
  assert.match(ok(root, "autonomy", "1"), /^Preset: team\nName from: the brief of 0001\nText from: autonomy\/team\.md\n/);

  const strand = braid(root, "autonomy", "0001/A");
  assert.equal(strand.status, 1);
  assert.match(strand.stderr, /a preset belongs to a braid/);
});

test("braid new and braid edit set and clear autonomy; a brief without it keeps its exact text", () => {
  const root = repo();
  ok(root, "new", "Alpha", "--no-fetch");
  const folder = join(root, "braids/0001-alpha");
  const before = readFileSync(join(folder, "brief.md"), "utf8");
  assert.equal(before, "---\nid: '0001'\ntitle: \"Alpha\"\nstatus: To Do\nlabels: []\ndependencies: []\ndelivery: epic\n---\n");

  ok(root, "edit", "1", "--autonomy", "steady");
  assert.equal(readFileSync(join(folder, "brief.md"), "utf8"), before.replace("delivery: epic\n", "delivery: epic\nautonomy: steady\n"));
  ok(root, "edit", "1", "--autonomy", "none");
  assert.equal(readFileSync(join(folder, "brief.md"), "utf8"), before);

  ok(root, "new", "Beta", "--no-fetch", "--autonomy", "careful");
  assert.match(readFileSync(join(root, "braids/0002-beta/brief.md"), "utf8"), /^delivery: epic\nautonomy: careful\n---\n$/m);

  const missing = braid(root, "edit", "1", "--autonomy", "bold");
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /no autonomy preset bold; available here: careful, steady, free/);
  ok(root, "strand", "new", "1", "One", "--no-fetch");
  const strand = braid(root, "edit", "1/A", "--autonomy", "steady");
  assert.equal(strand.status, 1);
  assert.match(strand.stderr, /autonomy is set per braid, not per strand/);
});

test("braid check: preset file errors, missing presets, and a warning for delegated security, data or outward", () => {
  const root = repo();
  ok(root, "new", "Alpha", "--no-fetch");
  assert.equal(ok(root, "check"), "braids OK: 1 braids, 0 strands\n");

  put(root, "autonomy/extra-key.md", preset("extra-key", ROWS, "name: extra-key\nmerge: strands\ncontinue: yes\nplan: no"));
  put(root, "autonomy/bad-merge.md", preset("bad-merge", ROWS, "name: bad-merge\nmerge: some\ncontinue: yes"));
  put(root, "autonomy/short.md", preset("short", ROWS.replace("| quality | never | always |", "")));
  put(root, "autonomy/twice.md", preset("twice", `${ROWS}\n| scope, data | never | always |`));
  put(root, "autonomy/odd.md", preset("odd", ROWS.replace("| outward |", "| elsewhere |")));
  put(root, "BRAID.md", "---\nautonomy: bold\n---\n");
  const brief = join(root, "braids/0001-alpha/brief.md");
  writeFileSync(brief, readFileSync(brief, "utf8").replace("delivery: epic\n", "delivery: epic\nautonomy: daring\n"));
  const failed = braid(root, "check");
  assert.equal(failed.status, 2);
  const lines = failed.stderr.trim().split("\n");
  assert.deepEqual(lines, [
    "autonomy/bad-merge.md: line 3: merge must be one of none, strands, all; got: some",
    "autonomy/extra-key.md: line 5: unknown key: plan",
    "autonomy/odd.md: line 15: unknown case: elsewhere (the cases are security, dependency, architecture, data, process, outward, scope, quality)",
    "autonomy/short.md: missing case: quality",
    "autonomy/twice.md: line 18: case scope is repeated (also on line 16)",
    "BRAID.md: autonomy preset bold does not exist (no autonomy/bold.md and no shipped preset bold; shipped: careful, steady, free)",
    "braids/0001-alpha/brief.md: autonomy preset daring does not exist (no autonomy/daring.md and no shipped preset daring; shipped: careful, steady, free)",
    "7 errors",
  ]);

  for (const name of ["bad-merge", "extra-key", "odd", "short", "twice"]) {
    rmSync(join(root, "autonomy", `${name}.md`));
  }
  put(root, "BRAID.md", "---\nautonomy: free\n---\n");
  put(root, "autonomy/daring.md", preset("daring", ROWS.replace("| data | never |", "| data | a test fixture |")));
  const warned = braid(root, "check");
  assert.equal(warned.status, 0);
  assert.equal(warned.stdout, "braids OK: 1 braids, 0 strands\n");
  assert.equal(
    warned.stderr,
    [
      "warning: autonomy/daring.md: preset daring lets the agents decide data (allowed; make sure it is meant)",
      "warning: shipped preset free: preset free lets the agents decide security, data, outward (allowed; make sure it is meant)",
      "",
    ].join("\n"),
  );
});

test("braid check: docs.update must be a known value, docs.public and docs.internal lists; no docs is valid", () => {
  const root = repo();
  ok(root, "new", "Alpha", "--no-fetch");
  const check = (front: string) => {
    put(root, "BRAID.md", `---\n${front}---\n`);
    const r = braid(root, "check");
    return [r.status, r.stderr.trim().split("\n").filter((l) => l !== "")];
  };
  assert.deepEqual(check("gate: x\n"), [0, []]);
  assert.deepEqual(check("docs:\n  update: both\n  public:\n    - README.md\n  internal: [a.md]\n"), [0, []]);
  assert.deepEqual(check("docs:\n  update: strands\n"), [2, ["BRAID.md: docs.update must be one of strand, braid, both, on-demand; got: strands", "1 error"]]);
  assert.deepEqual(check("docs:\n  public: README.md\n  internal:\n"), [
    2,
    ["BRAID.md: docs.public must be a list of files or folders; got: README.md", "BRAID.md: docs.internal must be a list of files or folders", "2 errors"],
  ]);
});
