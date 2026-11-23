// `braid board service` (0067/B, D93): the Task Scheduler definition, the schtasks calls (a fake runner: no real task
// is ever registered here), status, the Windows-only message, the service log and the stop with the console.
// Every test runs in a scratch home.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const load = (path: string) => import(pathToFileURL(fileURLToPath(new URL(path, import.meta.url))).href);
const svc = await load("../dist/commands/service.js");

const scratch = mkdtempSync(join(tmpdir(), "braid-service-"));
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 }));
const home = join(scratch, ".braid");
const TOKEN = "ab".repeat(24);

const spec = { port: 8765, folder: "C:\\Users\\Jane Doe\\code\\a & b", user: "PC\\Jane Doe", start: new Date(2026, 10, 23, 3, 4, 5) };

test("the task definition: logon and a 5-minute repetition, IgnoreNew, no time limit, InteractiveToken, and an action with no path or token", () => {
  const xml: string = svc.taskXml({ ...spec, host: "tailscale" });
  assert.match(xml, /<LogonTrigger>\s*<Enabled>true<\/Enabled>\s*<UserId>PC\\Jane Doe<\/UserId>/, "this user's logon only");
  assert.match(xml, /<TimeTrigger>[\s\S]*<StartBoundary>2026-11-23T03:04:05<\/StartBoundary>[\s\S]*<Interval>PT5M<\/Interval>[\s\S]*<\/TimeTrigger>/);
  assert.doesNotMatch(xml, /<Duration>/, "repeated with no end");
  assert.match(xml, /<MultipleInstancesPolicy>IgnoreNew<\/MultipleInstancesPolicy>/);
  assert.match(xml, /<ExecutionTimeLimit>PT0S<\/ExecutionTimeLimit>/);
  assert.match(xml, /<LogonType>InteractiveToken<\/LogonType>/);
  assert.match(xml, /<RunLevel>LeastPrivilege<\/RunLevel>/);
  assert.doesNotMatch(xml, /Password|S4U/);
  assert.match(xml, /<DisallowStartIfOnBatteries>false<\/DisallowStartIfOnBatteries>\s*<StopIfGoingOnBatteries>false<\/StopIfGoingOnBatteries>/);
  assert.match(xml, /<Command>conhost\.exe<\/Command>/);
  assert.match(xml, /<Arguments>--headless cmd\.exe \/d \/c braid board --service --no-open --port 8765 --host tailscale<\/Arguments>/);
  // braid is found on PATH at each start: nothing points into a versioned install (Volta's image, an npm cache, a node version).
  assert.doesNotMatch(xml, /Volta|packages|node_modules|cli\.js|node\.exe|\d+\.\d+\.\d+/);
  assert.doesNotMatch(xml, /#token|[0-9a-f]{32}/);
  // A folder with spaces and & stays one escaped element, and reads back the same.
  assert.match(xml, /<WorkingDirectory>C:\\Users\\Jane Doe\\code\\a &amp; b<\/WorkingDirectory>/);
  assert.deepEqual(svc.parseTask(xml), { port: 8765, host: "tailscale", folder: spec.folder });
  assert.deepEqual(svc.parseTask(svc.taskXml(spec)), { port: 8765, host: undefined, folder: spec.folder });
  assert.equal(svc.parseTask("<Task/>"), null);
});

interface Call {
  args: string[];
  file?: string;
}
/** A fake schtasks: `/query /xml` answers `installed` (null: no task), `/v` answers `csv`; `/create` keeps the definition file's text. */
function fakeSchtasks(o: { installed?: string | null; csv?: string; failCreate?: boolean } = {}) {
  const calls: Call[] = [];
  let installed = o.installed ?? null;
  const run = (args: string[]) => {
    const call: Call = { args: [...args] };
    calls.push(call);
    if (args[0] === "/query") {
      if (installed === null) {
        return { status: 1, stdout: "", stderr: "ERROR: The system cannot find the file specified." };
      }
      return args.includes("/xml") ? { status: 0, stdout: installed, stderr: "" } : { status: 0, stdout: `\r\n${o.csv ?? '"PC","\\braid board","N/A","Running","Interactive only","23/11/2026 03:00:00","267009","PC\\\\Jane Doe"'}\r\n`, stderr: "" };
    }
    if (args[0] === "/create") {
      const file = args[args.indexOf("/xml") + 1] ?? "";
      const bytes = readFileSync(file);
      assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xfe], "UTF-16 LE with a byte order mark");
      call.file = bytes.toString("utf16le").slice(1);
      if (o.failCreate === true) {
        return { status: 1, stdout: "", stderr: "ERROR: Access is denied." };
      }
      installed = call.file;
      return { status: 0, stdout: "SUCCESS", stderr: "" };
    }
    if (args[0] === "/delete") {
      installed = null;
    }
    return { status: 0, stdout: "SUCCESS", stderr: "" };
  };
  return { run, calls, verbs: () => calls.map((c) => c.args[0]) };
}

/** The other seams: a board that answers on `port` once the task ran, at version `running`. */
function deps(fake: ReturnType<typeof fakeSchtasks>, o: { port?: number; running?: string | null; answers?: boolean; free?: boolean; platform?: string } = {}) {
  const port = o.port ?? 8765;
  return {
    platform: o.platform ?? "win32",
    schtasks: fake.run,
    home,
    cwd: scratch,
    user: "PC\\Jane Doe",
    now: () => spec.start,
    sleep: async () => {},
    waitMs: 1000,
    portFree: async () => o.free ?? true,
    live: async () => ((o.answers ?? true) && fake.verbs().includes("/run") ? [{ port, url: `http://127.0.0.1:${port}/#token=${TOKEN}` }] : []),
    runningVersion: async () => (o.running === undefined ? "0.2.0" : o.running),
    version: "0.2.0",
  };
}

test("install registers the definition from a UTF-16 file, removes the file, runs the task and waits for the board", async () => {
  const fake = fakeSchtasks();
  const out = await svc.serviceCommand(["install", "--port", "8765", "--host", "tailscale"], deps(fake));
  assert.equal(out.code, 0, out.stderr);
  assert.match(out.stdout, /installed the braid board task .* on port 8765 \(braid 0\.2\.0\)/);
  assert.deepEqual(fake.verbs(), ["/query", "/create", "/run"]);
  const create = fake.calls[1];
  assert.deepEqual(create?.args.filter((a) => !a.endsWith(".xml")), ["/create", "/tn", "braid board", "/xml", "/f"]);
  assert.match(create?.file ?? "", /--port 8765 --host tailscale/);
  assert.equal(existsSync(create?.args[4] ?? ""), false, "the definition file is removed");
  assert.deepEqual(fake.calls[2]?.args, ["/run", "/tn", "braid board"]);
});

test("install over an installed task (another port) ends its run first, and replaces it", async () => {
  const fake = fakeSchtasks({ installed: svc.taskXml({ ...spec, port: 9000 }) });
  const out = await svc.serviceCommand(["install"], deps(fake));
  assert.equal(out.code, 0, out.stderr);
  assert.deepEqual(fake.verbs(), ["/query", "/end", "/create", "/run"]);
  assert.match(fake.calls[2]?.file ?? "", /--port 8765<\/Arguments>/, "the default port");
});

test("install on a port another process holds says so; a refused registration, a bad flag and a board that never answers fail", async () => {
  // A board started by hand holds the port and answers there: the task stays installed, isn't run, and install fails.
  const holder = fakeSchtasks();
  const held = await svc.serviceCommand(["install"], { ...deps(holder, { free: false }), live: async () => [{ port: 8765, url: `http://127.0.0.1:8765/#token=${TOKEN}` }] });
  assert.equal(held.code, 1);
  assert.equal(held.stdout, "", "no claim that the task's board runs");
  assert.match(held.stderr, /installed the braid board task, but its board didn't start: port 8765 is held by another process \(a board started by hand\?\)\. Stop that board, then run braid board service restart/);
  assert.deepEqual(holder.verbs(), ["/query", "/create"], "registered, never run onto the held port");
  const refused = await svc.serviceCommand(["install"], deps(fakeSchtasks({ failCreate: true })));
  assert.deepEqual([refused.code, refused.stderr], [1, "braid board service: schtasks couldn't register the task: ERROR: Access is denied.\n"]);
  const silent = await svc.serviceCommand(["install"], deps(fakeSchtasks(), { answers: false }));
  assert.equal(silent.code, 1);
  assert.match(silent.stderr, /no board answers on port 8765 yet; see .*board-8765\.log/);
  await assert.rejects(svc.serviceCommand(["install", "--host", "a b"], deps(fakeSchtasks())), /--host needs an address/);
  await assert.rejects(svc.serviceCommand(["install", "--host", "x&calc"], deps(fakeSchtasks())), /--host needs an address/);
  await assert.rejects(svc.serviceCommand(["install", "--port", "0"], deps(fakeSchtasks())), /--port needs a port number/);
  await assert.rejects(svc.serviceCommand(["install", "--token", "x"], deps(fakeSchtasks())), /takes only --port/);
  await assert.rejects(svc.serviceCommand(["start"], deps(fakeSchtasks())), /usage: braid board service install/);
});

test("no task: status and restart say how to install one; restart --if-installed is silent; remove deletes it", async () => {
  for (const sub of ["status", "restart", "remove"]) {
    const out = await svc.serviceCommand([sub], deps(fakeSchtasks()));
    assert.deepEqual([out.code, out.stderr], [1, "braid board service: no braid board task is installed; braid board service install sets it up\n"]);
  }
  const quiet = fakeSchtasks();
  assert.deepEqual(await svc.serviceCommand(["restart", "--if-installed"], deps(quiet)), { code: 0, stdout: "", stderr: "" });
  assert.deepEqual(quiet.verbs(), ["/query"]);
  const fake = fakeSchtasks({ installed: svc.taskXml(spec) });
  const out = await svc.serviceCommand(["remove"], deps(fake));
  assert.equal(out.code, 0);
  assert.deepEqual(fake.verbs(), ["/query", "/end", "/delete"]);
  assert.deepEqual(fake.calls[2]?.args, ["/delete", "/tn", "braid board", "/f"]);
});

test("restart ends the task, waits for the port, runs it and names the version now running; a held port stops it", async () => {
  const fake = fakeSchtasks({ installed: svc.taskXml(spec) });
  const out = await svc.serviceCommand(["restart", "--if-installed"], deps(fake));
  assert.equal(out.code, 0, out.stderr);
  assert.equal(out.stdout, "braid board service: restarted the board on port 8765 (braid 0.2.0); braid board --url prints its address\n");
  assert.deepEqual(fake.verbs(), ["/query", "/end", "/run"]);
  const held = fakeSchtasks({ installed: svc.taskXml(spec) });
  const refused = await svc.serviceCommand(["restart"], deps(held, { free: false }));
  assert.equal(refused.code, 1);
  assert.match(refused.stderr, /port 8765 is still held after the task stopped/);
  assert.deepEqual(held.verbs(), ["/query", "/end"], "never run onto a held port");
});

test("status: state and last result by column, port, folder, the live address, the versions and the log", async () => {
  const fake = fakeSchtasks({ installed: svc.taskXml({ ...spec, host: "tailscale" }) });
  fake.calls.push({ args: ["/run"] }); // the board answers
  const out = await svc.serviceCommand(["status"], deps(fake));
  assert.equal(out.code, 0);
  assert.equal(
    out.stdout,
    [
      "Task: braid board, Running, last result: running",
      "Port: 8765 (also on Tailscale: --host tailscale)",
      `Folder: ${spec.folder}`,
      `Address: http://127.0.0.1:8765/#token=${TOKEN}`,
      "Version: running 0.2.0, installed 0.2.0",
      `Log: ${join(home, "board-8765.log")}`,
      "",
    ].join("\n"),
  );
});

test("status shows a stale board after an install, and a task whose board isn't answering (a stale address file)", async () => {
  const stale = fakeSchtasks({ installed: svc.taskXml(spec) });
  stale.calls.push({ args: ["/run"] });
  const old = await svc.serviceCommand(["status"], deps(stale, { running: "0.1.9" }));
  assert.match(old.stdout, /Version: running 0\.1\.9, installed 0\.2\.0: the board runs older code; braid board service restart starts the installed one/);
  // The address file is left from a killed run: liveAddresses finds no board answering with its token.
  const dead = fakeSchtasks({ installed: svc.taskXml(spec), csv: '"PC","\\braid board","N/A","Ready","Interactive only","23/11/2026 03:00:00","1","PC\\\\Jane"' });
  const out = await svc.serviceCommand(["status"], deps(dead));
  assert.equal(out.code, 1);
  assert.match(out.stdout, /Task: braid board, Ready, last result: exited 1 \(0x1\)/);
  assert.match(out.stdout, /Address: no board answers on port 8765 \(the task's board isn't running; see the log\)/);
  assert.match(out.stdout, /Version: the running board's is unknown, installed 0\.2\.0/);
});

test("on another platform every subcommand is Windows-only and points to the systemd recipe; restart --if-installed is silent", async () => {
  for (const sub of ["install", "remove", "restart", "status"]) {
    const fake = fakeSchtasks();
    const out = await svc.serviceCommand([sub], deps(fake, { platform: "linux" }));
    assert.equal(out.code, 1);
    assert.match(out.stderr, /Windows-only .* systemd user service, as docs\/board\.md shows under "Run the board at login"/);
    assert.deepEqual(fake.calls, [], "schtasks is never run");
  }
  assert.deepEqual(await svc.serviceCommand(["restart", "--if-installed"], deps(fakeSchtasks(), { platform: "linux" })), { code: 0, stdout: "", stderr: "" });
});

test("the last result in words and the CSV fields", () => {
  assert.equal(svc.resultText("0"), "ended (the board's own exit code isn't kept; see the log)", "conhost exits 0 even for a killed board: never a clean exit");
  assert.equal(svc.resultText("267011"), "not run yet");
  assert.equal(svc.resultText("3221225786"), "stopped (its console closed)");
  assert.deepEqual(svc.csvFields('"a","b ""c""",,"d,e"'), ["a", 'b "c"', "", "d,e"]);
});

test("the service log is replaced at each start, keeps the board's output and never the token", () => {
  const logHome = join(scratch, "log-home");
  const before = process.stdout.write;
  const stop = svc.serviceLog(8765, "0.2.0", logHome, new Date("2026-11-23T03:00:00Z"));
  try {
    process.stdout.write(`braid board: http://127.0.0.1:8765/#token=${TOKEN}\n`);
    process.stderr.write("braid board: something failed\n");
  } finally {
    stop();
  }
  assert.equal(process.stdout.write, before, "restored");
  const shown = readFileSync(join(logHome, "board-8765.log"), "utf8");
  assert.match(shown, /^braid board 0\.2\.0 started 2026-11-23T03:00:00\.000Z \(pid \d+\)\n/);
  assert.match(shown, /braid board: http:\/\/127\.0\.0\.1:8765\/#token=\(hidden\)\n/);
  assert.match(shown, /braid board: something failed\n/);
  assert.doesNotMatch(shown, new RegExp(TOKEN));
  svc.serviceLog(8765, "0.2.1", logHome)();
  assert.match(readFileSync(join(logHome, "board-8765.log"), "utf8"), /^braid board 0\.2\.1 started [^\n]*\n$/, "replaced, not appended");
});

test("the board stops once when its console's input ends or breaks", async () => {
  for (const end of [(s: PassThrough) => s.end(), (s: PassThrough) => s.destroy(new Error("EPIPE"))]) {
    const input = new PassThrough();
    let stops = 0;
    svc.stopWithConsole(() => stops++, input);
    input.write("ignored\n");
    end(input);
    await new Promise((done) => setImmediate(done));
    await new Promise((done) => setImmediate(done));
    assert.equal(stops, 1);
  }
});

const freePort = (): Promise<number> =>
  new Promise((done) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const port = (s.address() as { port: number }).port;
      s.close(() => done(port));
    });
  });

test("braid board --service writes its log, needs --port, and exits when its standard input closes (the task stopped)", async () => {
  const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
  const runHome = join(scratch, "run-home");
  mkdirSync(runHome, { recursive: true });
  const env = { ...process.env, HOME: runHome, USERPROFILE: runHome };
  const port = await freePort();
  const child = spawn(process.execPath, [cli, "board", "--service", "--no-open", "--port", String(port), "--demo"], { cwd: scratch, env, stdio: ["pipe", "pipe", "pipe"] });
  let out = "";
  child.stdout.on("data", (d: Buffer) => (out += d.toString()));
  const exited = new Promise<number | null>((done) => child.on("exit", (code) => done(code)));
  const log = join(runHome, ".braid", `board-${port}.log`);
  for (let i = 0; i < 200 && !/Press Ctrl\+C/.test(out); i++) {
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.match(out, /Press Ctrl\+C to stop/);
  assert.match(readFileSync(log, "utf8"), /braid board \(demo: sample data; nothing is read or written\): http:\/\/127\.0\.0\.1:\d+\/#token=\(hidden\)/);
  child.stdin.end();
  assert.equal(await exited, 0);
  assert.deepEqual(readdirSync(join(runHome, ".braid")).filter((n) => n.endsWith(".url")), []);
  const noPort = spawn(process.execPath, [cli, "board", "--service", "--no-open", "--demo"], { cwd: scratch, env, stdio: ["ignore", "pipe", "pipe"] });
  let err = "";
  noPort.stderr.on("data", (d: Buffer) => (err += d.toString()));
  assert.equal(await new Promise((done) => noPort.on("exit", done)), 1);
  assert.match(err, /--service needs --port <n>/);
});
