// `braid board service install | remove | restart | status` (0067/B, D95): the board as a Task Scheduler task of the
// logged-in user on Windows. The task runs `conhost.exe --headless cmd.exe /d /c braid board --service ...`: no window,
// `braid` found on PATH at each start (so a reinstall's new code is what starts), and stopping the task ends the board,
// whose `--service` mode stops when its headless console goes away. Nothing is kept beyond the task itself, the address
// file (D94) and a log that each start replaces.
import { spawnSync } from "node:child_process";
import { closeSync, mkdirSync, openSync, rmSync, writeFileSync, writeSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { liveAddresses, SESSION_PATH, type Address } from "../board/address.js";
import { mainCheckout } from "../board/t3.js";
import { findRoot } from "../braids/store.js";
import { braidHome } from "../notify/config.js";
import { readVersion } from "../version.js";
import { UsageError } from "./braids.js";

export const TASK_NAME = "braid board";
export const DEFAULT_PORT = 8765;
/** How often the task is started again: with `IgnoreNew` a running board ignores it, a crashed one comes back. */
export const REPEAT = "PT5M";
/** The header of `/api/session`'s 204: the version the running board started from. */
export const VERSION_HEADER = "x-braid-version";

export interface Ran {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}
/** Runs `schtasks` with these arguments (a test seam). */
export type Schtasks = (args: readonly string[]) => Ran;
export const runSchtasks: Schtasks = (args) => {
  const r = spawnSync("schtasks.exe", args, { encoding: "utf8", windowsHide: true });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? (r.error?.message ?? "") };
};

export interface ServiceDeps {
  readonly platform?: NodeJS.Platform;
  readonly schtasks?: Schtasks;
  /** `~/.braid`: the address files and the logs. */
  readonly home?: string;
  readonly cwd?: string;
  readonly user?: string;
  readonly now?: () => Date;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly live?: (home: string) => Promise<Address[]>;
  /** The version the board answering at this tokened address started from, or null. */
  readonly runningVersion?: (url: string) => Promise<string | null>;
  readonly portFree?: (port: number) => Promise<boolean>;
  /** This braid's version: the installed one, when the installed `braid` runs the command. */
  readonly version?: string;
  /** Milliseconds to wait for a stopped board's port, and for a started board to answer. */
  readonly waitMs?: number;
}

export interface Out {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export const WINDOWS_ONLY =
  "braid board service is Windows-only (a Task Scheduler task at logon); on Linux run the board as a systemd user service, as docs/board.md shows under \"Run the board at login\"\n";

const xmlText = (s: string): string => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const unXml = (s: string): string => s.replaceAll("&quot;", '"').replaceAll("&gt;", ">").replaceAll("&lt;", "<").replaceAll("&amp;", "&");
/** Local time as Task Scheduler's StartBoundary wants it: `2026-11-23T03:00:00`, no zone. */
const localIso = (d: Date): string => {
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export interface TaskSpec {
  readonly port: number;
  readonly host?: string | undefined;
  /** The folder the board starts in: the main checkout. */
  readonly folder: string;
  /** `DOMAIN\user`, the account it runs as and whose logon starts it. */
  readonly user: string;
  readonly start: Date;
}

/** The board's arguments in the task: only flags and the port, never a path or a token, so there is nothing to quote. */
export function boardArgs(port: number, host?: string): string[] {
  return ["board", "--service", "--no-open", "--port", String(port), ...(host === undefined ? [] : ["--host", host])];
}

/** The task definition (Task Scheduler 1.2 XML). */
export function taskXml(spec: TaskSpec): string {
  const user = xmlText(spec.user);
  const args = ["--headless", "cmd.exe", "/d", "/c", "braid", ...boardArgs(spec.port, spec.host)].join(" ");
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>braid board on port ${spec.port}, installed by braid board service install. Remove it with braid board service remove.</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <UserId>${user}</UserId>
    </LogonTrigger>
    <TimeTrigger>
      <Enabled>true</Enabled>
      <StartBoundary>${localIso(spec.start)}</StartBoundary>
      <Repetition>
        <Interval>${REPEAT}</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
    </TimeTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>${user}</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>5</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>conhost.exe</Command>
      <Arguments>${xmlText(args)}</Arguments>
      <WorkingDirectory>${xmlText(spec.folder)}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
`;
}

/** What an installed task's XML says: the port, the host and the folder of its board. */
export interface Installed {
  readonly port: number;
  readonly host: string | undefined;
  readonly folder: string | undefined;
}
export function parseTask(xml: string): Installed | null {
  const args = /<Arguments>([^<]*)<\/Arguments>/.exec(xml)?.[1];
  if (args === undefined) {
    return null;
  }
  const words = unXml(args).trim().split(/\s+/);
  const port = Number(words[words.indexOf("--port") + 1]);
  if (!words.includes("--port") || !Number.isInteger(port)) {
    return null;
  }
  const h = words.indexOf("--host");
  const folder = /<WorkingDirectory>([^<]*)<\/WorkingDirectory>/.exec(xml)?.[1];
  return { port, host: h === -1 ? undefined : words[h + 1], folder: folder === undefined ? undefined : unXml(folder) };
}

/** The fields of one CSV line (`schtasks /fo csv`): quoted, `""` inside a quote. */
export function csvFields(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/**
 * A task's last result (`schtasks` prints it in decimal) in words. The task's process is `conhost --headless`, which
 * exits 0 however its board ended (checked 0067/C: a killed board and one that exited 3 both leave 0), so 0 says only
 * that the run ended; the address line and the log say whether the board is up and why it stopped.
 */
export function resultText(code: string): string {
  const n = Number(code);
  const known: Record<number, string> = {
    0: "ended (the board's own exit code isn't kept; see the log)",
    267009: "running",
    267011: "not run yet",
    267014: "stopped",
    3221225786: "stopped (its console closed)",
  };
  return Number.isFinite(n) ? (known[n] ?? `exited ${n} (0x${(n >>> 0).toString(16)})`) : code;
}

/** The task's status and last result: columns 4 and 7 of `schtasks /query /v /fo csv /nh`, by position (the headers are localised). */
function taskState(run: Schtasks): { status: string; result: string } | null {
  const r = run(["/query", "/tn", TASK_NAME, "/v", "/fo", "csv", "/nh"]);
  const line = r.status === 0 ? r.stdout.split(/\r?\n/).find((l) => l.trim() !== "") : undefined;
  if (line === undefined) {
    return null;
  }
  const f = csvFields(line.trim());
  return { status: f[3] ?? "", result: f[6] ?? "" };
}

function readTask(run: Schtasks): Installed | null {
  const r = run(["/query", "/tn", TASK_NAME, "/xml"]);
  return r.status === 0 ? parseTask(r.stdout) : null;
}

const portFreeOn = (port: number): Promise<boolean> =>
  new Promise((done) => {
    const s = createServer();
    s.once("error", () => done(false));
    s.listen(port, "127.0.0.1", () => s.close(() => done(true)));
  });

const versionAt = async (url: string): Promise<string | null> => {
  const at = url.indexOf("#token=");
  try {
    const response = await fetch(`${url.slice(0, at).replace(/\/$/, "")}${SESSION_PATH}`, {
      headers: { "x-braid-token": url.slice(at + "#token=".length) },
      signal: AbortSignal.timeout(2000),
    });
    return response.status === 204 ? response.headers.get(VERSION_HEADER) : null;
  } catch {
    return null;
  }
};

export function logFile(port: number, home: string = braidHome()): string {
  return join(home, `board-${port}.log`);
}

interface Ctx {
  readonly run: Schtasks;
  readonly home: string;
  readonly sleep: (ms: number) => Promise<void>;
  readonly live: (home: string) => Promise<Address[]>;
  readonly portFree: (port: number) => Promise<boolean>;
  readonly runningVersion: (url: string) => Promise<string | null>;
  readonly waitMs: number;
}

async function until(ctx: Ctx, check: () => Promise<boolean>): Promise<boolean> {
  for (let waited = 0; ; waited += 250) {
    if (await check()) {
      return true;
    }
    if (waited >= ctx.waitMs) {
      return false;
    }
    await ctx.sleep(250);
  }
}

const answering = async (ctx: Ctx, port: number): Promise<Address | undefined> => (await ctx.live(ctx.home)).find((a) => a.port === port);

/** Ends the task's run and waits until its port is free; false when something else still holds it. */
async function stopTask(ctx: Ctx, port: number): Promise<boolean> {
  ctx.run(["/end", "/tn", TASK_NAME]);
  return until(ctx, () => ctx.portFree(port));
}

/** Runs the task and waits for its board to answer: the line to print, and whether it answered. */
async function startTask(ctx: Ctx, port: number, done: string): Promise<Out> {
  const r = ctx.run(["/run", "/tn", TASK_NAME]);
  if (r.status !== 0) {
    return { code: 1, stdout: "", stderr: `braid board service: schtasks couldn't run the task: ${(r.stderr || r.stdout).trim()}\n` };
  }
  let found: Address | undefined;
  await until(ctx, async () => (found = await answering(ctx, port)) !== undefined);
  if (found === undefined) {
    return { code: 1, stdout: "", stderr: `braid board service: the task started, but no board answers on port ${port} yet; see ${logFile(port, ctx.home)} and braid board service status\n` };
  }
  const v = await ctx.runningVersion(found.url);
  return { code: 0, stdout: `braid board service: ${done} on port ${port}${v === null ? "" : ` (braid ${v})`}; braid board --url prints its address\n`, stderr: "" };
}

function portFlag(args: readonly string[]): { port: number; rest: string[] } {
  const at = args.indexOf("--port");
  if (at === -1) {
    return { port: DEFAULT_PORT, rest: [...args] };
  }
  const v = args[at + 1] ?? "";
  if (!/^\d+$/.test(v) || Number(v) < 1 || Number(v) > 65535) {
    throw new UsageError("--port needs a port number from 1 to 65535");
  }
  return { port: Number(v), rest: [...args.slice(0, at), ...args.slice(at + 2)] };
}

const USAGE = "braid board service install [--port <n>] [--host <address>] | remove | restart [--if-installed] | status";

/** `braid board service <sub> ...`. */
export async function serviceCommand(args: readonly string[], deps: ServiceDeps = {}): Promise<Out> {
  const [sub, ...rest] = args;
  const platform = deps.platform ?? process.platform;
  if (sub === "restart" && rest.includes("--if-installed") && platform !== "win32") {
    return { code: 0, stdout: "", stderr: "" };
  }
  if (sub === undefined || !["install", "remove", "restart", "status"].includes(sub)) {
    throw new UsageError(`usage: ${USAGE}`);
  }
  if (platform !== "win32") {
    return { code: 1, stdout: "", stderr: WINDOWS_ONLY };
  }
  const ctx: Ctx = {
    run: deps.schtasks ?? runSchtasks,
    home: deps.home ?? braidHome(),
    sleep: deps.sleep ?? ((ms) => new Promise((done) => setTimeout(done, ms))),
    live: deps.live ?? ((home) => liveAddresses(home)),
    portFree: deps.portFree ?? portFreeOn,
    runningVersion: deps.runningVersion ?? versionAt,
    waitMs: deps.waitMs ?? 30_000,
  };
  const version = deps.version ?? readVersion();
  const missing = `braid board service: no ${TASK_NAME} task is installed; braid board service install sets it up\n`;

  if (sub === "install") {
    const { port, rest: afterPort } = portFlag(rest);
    const h = afterPort.indexOf("--host");
    const host = h === -1 ? undefined : afterPort[h + 1];
    if (h !== -1 && (host === undefined || !/^[A-Za-z0-9.:-]+$/.test(host))) {
      throw new UsageError("--host needs an address: tailscale, this machine's Tailscale IP or its MagicDNS name");
    }
    const unknown = h === -1 ? afterPort : [...afterPort.slice(0, h), ...afterPort.slice(h + 2)];
    if (unknown.length > 0) {
      throw new UsageError(`braid board service install takes only --port <n> and --host <address>; got: ${unknown.join(" ")}`);
    }
    const before = readTask(ctx.run);
    if (before !== null) {
      await stopTask(ctx, before.port);
    }
    const free = await until(ctx, () => ctx.portFree(port));
    const user = deps.user ?? `${process.env["USERDOMAIN"] ?? ""}${process.env["USERDOMAIN"] ? "\\" : ""}${process.env["USERNAME"] ?? ""}`;
    const folder = resolve(mainCheckout(findRoot(deps.cwd ?? process.cwd())));
    const xml = taskXml({ port, host, folder, user, start: (deps.now ?? (() => new Date()))() });
    // schtasks reads the definition from a file; UTF-16 with a byte order mark, as its XML declaration says. It holds no token.
    mkdirSync(tmpdir(), { recursive: true });
    const file = join(tmpdir(), `braid-board-task-${process.pid}-${Date.now()}.xml`);
    writeFileSync(file, `﻿${xml}`, "utf16le");
    let r: Ran;
    try {
      r = ctx.run(["/create", "/tn", TASK_NAME, "/xml", file, "/f"]);
    } finally {
      rmSync(file, { force: true });
    }
    if (r.status !== 0) {
      return { code: 1, stdout: "", stderr: `braid board service: schtasks couldn't register the task: ${(r.stderr || r.stdout).trim()}\n` };
    }
    if (!free) {
      // Not run onto a held port: its board would fail to listen, and the board answering there is the other one.
      return {
        code: 1,
        stdout: "",
        stderr: `braid board service: installed the ${TASK_NAME} task, but its board didn't start: port ${port} is held by another process (a board started by hand?). Stop that board, then run braid board service restart; the task also tries again every 5 minutes\n`,
      };
    }
    return startTask(ctx, port, `installed the ${TASK_NAME} task (at logon, again every 5 minutes if it stopped), running`);
  }

  const task = readTask(ctx.run);
  if (task === null) {
    return rest.includes("--if-installed") ? { code: 0, stdout: "", stderr: "" } : { code: 1, stdout: "", stderr: missing };
  }

  if (sub === "remove") {
    await stopTask(ctx, task.port);
    const r = ctx.run(["/delete", "/tn", TASK_NAME, "/f"]);
    if (r.status !== 0) {
      return { code: 1, stdout: "", stderr: `braid board service: schtasks couldn't remove the task: ${(r.stderr || r.stdout).trim()}\n` };
    }
    return { code: 0, stdout: `braid board service: stopped the board on port ${task.port} and removed the ${TASK_NAME} task\n`, stderr: "" };
  }

  if (sub === "restart") {
    const free = await stopTask(ctx, task.port);
    if (!free) {
      return { code: 1, stdout: "", stderr: `braid board service: port ${task.port} is still held after the task stopped (a board started by hand?); stop it, then braid board service restart\n` };
    }
    return startTask(ctx, task.port, "restarted the board");
  }

  // status
  const state = taskState(ctx.run);
  const address = await answering(ctx, task.port);
  const running = address === undefined ? null : await ctx.runningVersion(address.url);
  const lines = [
    `Task: ${TASK_NAME}, ${state === null ? "state unknown" : `${state.status}, last result: ${resultText(state.result)}`}`,
    `Port: ${task.port}${task.host === undefined ? "" : ` (also on Tailscale: --host ${task.host})`}`,
    `Folder: ${task.folder ?? "unknown"}`,
    `Address: ${address === undefined ? `no board answers on port ${task.port}${state !== null && Number(state.result) !== 267009 ? " (the task's board isn't running; see the log)" : ""}` : address.url}`,
    `Version: ${running === null ? "the running board's is unknown" : `running ${running}`}, installed ${version}${running !== null && running !== version ? ": the board runs older code; braid board service restart starts the installed one" : ""}`,
    `Log: ${logFile(task.port, ctx.home)}`,
  ];
  return { code: address === undefined ? 1 : 0, stdout: `${lines.join("\n")}\n`, stderr: "" };
}

/** The board's output also goes to its log (`--service`): replaced at each start, owner-only, with `#token=` redacted. */
export function serviceLog(port: number, version: string, home: string = braidHome(), now: Date = new Date()): () => void {
  mkdirSync(home, { recursive: true });
  const fd = openSync(logFile(port, home), "w", 0o600);
  const put = (text: string): void => {
    try {
      writeSync(fd, text.replace(/#token=[0-9A-Za-z]+/g, "#token=(hidden)"));
    } catch {
      // a full disk never stops the board
    }
  };
  put(`braid board ${version} started ${now.toISOString()} (pid ${process.pid})\n`);
  const tee = (stream: NodeJS.WriteStream): (() => void) => {
    const original = stream.write;
    const write = original.bind(stream);
    stream.write = ((chunk: string | Uint8Array, ...more: unknown[]) => {
      put(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
      return (write as (...a: unknown[]) => boolean)(chunk, ...more);
    }) as typeof stream.write;
    return () => {
      stream.write = original;
    };
  };
  const undo = [tee(process.stdout), tee(process.stderr)];
  const crash = (error: Error): void => put(`braid board crashed: ${error.stack ?? String(error)}\n`);
  process.on("uncaughtExceptionMonitor", crash);
  return () => {
    process.off("uncaughtExceptionMonitor", crash);
    for (const u of undo) {
      u();
    }
    closeSync(fd);
  };
}

/** Calls `stop` once when `input` ends or breaks: under the task, its headless console going away when the task is stopped. */
export function stopWithConsole(stop: () => void, input: NodeJS.ReadableStream = process.stdin): void {
  let done = false;
  const once = (): void => {
    if (!done) {
      done = true;
      stop();
    }
  };
  input.on("end", once);
  input.on("close", once);
  input.on("error", once);
  input.resume();
}
