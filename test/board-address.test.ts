// The board's address file (0067/A, D94): `~/.braid/board-<port>.url`, written owner-only by a real
// `braid board` run, removed when it stops, and read by `braid board --url`. Every test runs in a scratch home.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const realBraid = join(homedir(), ".braid");
const addressFiles = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).filter((n) => /^board-\d+\.url/.test(n)).sort() : []);
const realBefore = addressFiles(realBraid);

const scratch = mkdtempSync(join(tmpdir(), "braid-address-"));
const saved = { HOME: process.env["HOME"], USERPROFILE: process.env["USERPROFILE"] };
process.env["HOME"] = scratch;
process.env["USERPROFILE"] = scratch;
const home = join(scratch, ".braid");
after(() => {
  process.env["HOME"] = saved.HOME;
  process.env["USERPROFILE"] = saved.USERPROFILE;
  if (saved.HOME === undefined) delete process.env["HOME"];
  if (saved.USERPROFILE === undefined) delete process.env["USERPROFILE"];
  rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
});

const web = join(scratch, "web");
mkdirSync(web);
writeFileSync(join(web, "index.html"), "<p>board</p>");
const root = join(scratch, "project");
mkdirSync(join(root, "braids"), { recursive: true });

interface Started {
  server: Server;
  url: string;
  token: string;
  close(): Promise<void>;
}
interface Out {
  code: number;
  stdout: string;
  stderr: string;
}
const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const board = (await load("../dist/commands/board.js")) as {
  demoSources(): unknown;
  startBoardWith(served: unknown, web: string, refreshMs?: number, token?: string, tailnet?: undefined, port?: number): Promise<Started>;
  runBoard(root: string, args: readonly string[], tailscale: undefined, run: { gh?: unknown; t3?: unknown; projects?: () => unknown[]; notifier?: unknown }): Promise<Started>;
  keepAddress(started: Started, url: string, home?: string, raise?: (signal: string) => void): Started;
  boardUrl(args: readonly string[], home?: string): Promise<Out>;
};
const address = (await load("../dist/board/address.js")) as {
  addressFile(port: number, home?: string): string;
  writeAddress(port: number, url: string, home?: string, ownerOnly?: ((file: string) => void) | null): string;
  removeAddress(port: number, url: string, home?: string): void;
  readAddresses(home?: string): { port: number; url: string }[];
};

/** The file's ACL as icacls lists it: its entries, and whether any is inherited. */
function aclOf(file: string): { entries: string[]; inherited: boolean } {
  const out = execFileSync("icacls", [file], { encoding: "utf8" });
  const entries = out
    .split(/\r?\n/)
    .map((l, i) => (i === 0 ? l.slice(file.length) : l).trim())
    .filter((l) => /:\(/.test(l));
  return { entries: entries.map((e) => e.toLowerCase()), inherited: entries.some((e) => e.includes("(I)")) };
}
const whoami = (): string => execFileSync("whoami", { encoding: "utf8" }).trim().toLowerCase();

const ok = () => Promise.resolve({ status: 0, stdout: "[]", stderr: "" });
const run = { gh: ok, t3: ok, projects: () => [], notifier: () => () => {} };
const portOf = (s: Started): number => Number(new URL(s.url).port);
const tokened = (s: Started): string => `${s.url}#token=${s.token}`;

/** Runs `body` with standard output captured, so the board's start lines stay out of the test report. */
async function quiet<T>(body: () => Promise<T>): Promise<T> {
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = (() => true) as typeof process.stdout.write;
  try {
    return await body();
  } finally {
    process.stdout.write = write;
  }
}

test("a real braid board run writes its tokened address owner-only, --url prints it, and stopping removes it", async () => {
  const started = await quiet(() => board.runBoard(root, ["--no-open", "--no-pause"], undefined, run));
  const file = address.addressFile(portOf(started), home);
  try {
    assert.equal(file, join(scratch, ".braid", `board-${portOf(started)}.url`));
    assert.equal(readFileSync(file, "utf8"), `${tokened(started)}\n`);
    if (process.platform !== "win32") {
      assert.equal(statSync(file).mode & 0o777, 0o600, "owner-only on POSIX");
    } else {
      assert.deepEqual(aclOf(file), { entries: [`${whoami()}:(f)`], inherited: false }, "owner-only on Windows: only the current user, inheritance off");
    }
    assert.deepEqual(readdirSync(home).filter((n) => n.endsWith(".tmp")), [], "no temporary file left");
    // The address works: the session check accepts its token and refuses another.
    const session = await fetch(`${started.url}api/session`, { headers: { "x-braid-token": started.token } });
    assert.equal(session.status, 204);
    // The 204 names the version the board started from (braid board service status, 0067/B).
    assert.equal(session.headers.get("x-braid-version"), JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8")).version);
    assert.equal((await fetch(`${started.url}api/session`, { headers: { "x-braid-token": "0".repeat(48) } })).headers.get("x-braid-version"), null, "not without the token");
    assert.equal((await fetch(`${started.url}api/session`, { headers: { "x-braid-token": "0".repeat(48) } })).status, 403);
    assert.equal((await fetch(`${started.url}api/session`)).status, 403);
    assert.deepEqual(await board.boardUrl(["--url"]), { code: 0, stdout: `${tokened(started)}\n`, stderr: "" });
    assert.equal((await board.boardUrl(["--url", "--port", String(portOf(started))])).code, 0);
    assert.equal((await board.boardUrl(["--url", "--port", String(portOf(started) === 65535 ? 1 : portOf(started) + 1)])).code, 1);
    await assert.rejects(board.boardUrl(["--url", "--port"]), /--url takes only --port <n>/);
  } finally {
    await started.close();
  }
  assert.equal(existsSync(file), false, "removed on stop");
  const none = await board.boardUrl(["--url"]);
  assert.equal(none.code, 1);
  assert.equal(none.stdout, "");
  assert.match(none.stderr, /^no braid board is running for this user/);
});

test("the ACL is set on the empty file before the token is written; a failed ACL leaves no file and no token", () => {
  const seen: string[] = [];
  const url = "http://127.0.0.1:4100/#token=abc";
  const file = address.writeAddress(4100, url, home, (temp) => {
    seen.push(readFileSync(temp, "utf8"));
  });
  assert.deepEqual(seen, [""], "empty when its ACL is set");
  assert.equal(readFileSync(file, "utf8"), `${url}\n`);
  rmSync(file);
  assert.throws(
    () =>
      address.writeAddress(4101, "http://127.0.0.1:4101/#token=abc", home, () => {
        throw new Error("icacls couldn't make it owner-only: denied");
      }),
    /icacls couldn't make it owner-only/,
  );
  assert.deepEqual(readdirSync(home).filter((n) => n.startsWith("board-4101")), [], "no file, no temporary file");
});

test("--demo and boards started without runBoard write no address file", async () => {
  const before = addressFiles(home);
  const demo = await quiet(() => board.runBoard(scratch, ["--no-open", "--demo"], undefined, {}));
  const direct = await board.startBoardWith(board.demoSources(), web, 60_000);
  try {
    assert.deepEqual(addressFiles(home), before);
  } finally {
    await Promise.all([demo.close(), direct.close()]);
  }
});

test("a stale file whose port answers nothing, or answers with another token, is no running board", async () => {
  const gone = await board.startBoardWith(board.demoSources(), web, 60_000);
  const port = portOf(gone);
  await gone.close();
  address.writeAddress(port, `http://127.0.0.1:${port}/#token=${"a".repeat(48)}`, home);
  // A board now on another port, its file holding the wrong token (a demo or an older file on that port).
  const other = await board.startBoardWith(board.demoSources(), web, 60_000);
  address.writeAddress(portOf(other), `http://127.0.0.1:${portOf(other)}/#token=${"b".repeat(48)}`, home);
  try {
    assert.equal(address.readAddresses(home).length >= 2, true);
    const out = await board.boardUrl(["--url"]);
    assert.equal(out.code, 1, out.stdout);
    assert.match(out.stderr, /no braid board is running/);
  } finally {
    await other.close();
    rmSync(address.addressFile(port, home), { force: true });
    rmSync(address.addressFile(portOf(other), home), { force: true });
  }
});

test("a newer run on the same port replaces the file, and the older run's stop leaves the newer address", async () => {
  const first = await board.startBoardWith(board.demoSources(), web, 60_000);
  const port = portOf(first);
  await first.close();
  const old = `http://127.0.0.1:${port}/#token=${"c".repeat(48)}`;
  address.writeAddress(port, old, home);
  const again = await board.startBoardWith(board.demoSources(), web, 60_000, undefined, undefined, port);
  const next = board.keepAddress(again, tokened(again), home);
  try {
    const url = readFileSync(address.addressFile(port, home), "utf8").trim();
    assert.equal(url, tokened(again));
    address.removeAddress(port, old, home);
    assert.equal(readFileSync(address.addressFile(port, home), "utf8").trim(), url, "the older run's removal keeps the newer address");
  } finally {
    await next.close();
  }
  assert.equal(existsSync(address.addressFile(port, home)), false);
});

test("two boards on different ports keep their own files; stopping one removes only its own", async () => {
  const keep = async (): Promise<Started> => {
    const s = await board.startBoardWith(board.demoSources(), web, 60_000);
    return board.keepAddress(s, tokened(s), home);
  };
  const a = await keep();
  const b = await keep();
  try {
    assert.notEqual(portOf(a), portOf(b));
    assert.equal((await board.boardUrl(["--url"])).stdout.split("\n").filter(Boolean).length, 2);
    await a.close();
    assert.equal(existsSync(address.addressFile(portOf(a), home)), false);
    assert.equal(readFileSync(address.addressFile(portOf(b), home), "utf8"), `${tokened(b)}\n`);
    assert.deepEqual(await board.boardUrl(["--url"]), { code: 0, stdout: `${tokened(b)}\n`, stderr: "" });
  } finally {
    await Promise.all([a.close(), b.close()]);
  }
});

test("a stop signal removes the file, then raises the signal again", async () => {
  const s = await board.startBoardWith(board.demoSources(), web, 60_000);
  const before = process.listeners("SIGTERM");
  const raised: string[] = [];
  const kept = board.keepAddress(s, tokened(s), home, (signal) => void raised.push(signal));
  try {
    const ours = process.listeners("SIGTERM").filter((l) => !before.includes(l));
    assert.equal(ours.length, 1);
    (ours[0] as (signal: string) => void)("SIGTERM");
    assert.deepEqual(raised, ["SIGTERM"]);
    assert.equal(existsSync(address.addressFile(portOf(s), home)), false);
    assert.equal(process.listeners("SIGTERM").length, before.length, "the handlers are gone with the file");
  } finally {
    await kept.close();
  }
});

test("the real ~/.braid is untouched by these tests", () => {
  assert.deepEqual(addressFiles(realBraid), realBefore);
});
