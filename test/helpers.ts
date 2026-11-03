import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
export const cliPath = join(repoRoot, "dist", "cli.js");

export interface RunResult {
  readonly code: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

export interface FaultIo {
  writeTempFile?(tempPath: string, contents: string): Promise<void>;
  replaceTemp?(tempPath: string, statePath: string): Promise<void>;
  appendEventLine?(eventsPath: string, line: string): Promise<void>;
  createEmptyEvents?(eventsPath: string): Promise<void>;
}

interface MainModule {
  run(
    argv: readonly string[],
    options?: {
      cwd?: string;
      stdout?: (chunk: string) => void;
      stderr?: (chunk: string) => void;
      io?: FaultIo;
    },
  ): Promise<number>;
  createDefaultLedgerIo(): {
    writeTempFile(tempPath: string, contents: string): Promise<void>;
    replaceTemp(tempPath: string, statePath: string): Promise<void>;
    appendEventLine(eventsPath: string, line: string): Promise<void>;
    createEmptyEvents(eventsPath: string): Promise<void>;
  };
}

export interface LedgerSnapshot {
  readonly state: Buffer | null;
  readonly events: Buffer | null;
}

let mainModule: Promise<MainModule> | undefined;

export function loadMain(): Promise<MainModule> {
  if (mainModule === undefined) {
    const specifier = "../dist/main.js";
    mainModule = import(specifier) as Promise<MainModule>;
  }
  return mainModule;
}

export function runCli(args: readonly string[], cwd: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const output = child.stdout;
    const errors = child.stderr;
    if (output === null || errors === null) {
      reject(new Error("CLI stdio pipes were not created"));
      return;
    }
    output.on("data", (chunk: Buffer) => {
      stdout.push(chunk);
    });
    errors.on("data", (chunk: Buffer) => {
      stderr.push(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

export async function runInProcess(
  args: readonly string[],
  cwd: string,
  io?: FaultIo,
): Promise<RunResult> {
  const main = await loadMain();
  let stdout = "";
  let stderr = "";
  const options: {
    cwd: string;
    stdout: (chunk: string) => void;
    stderr: (chunk: string) => void;
    io?: FaultIo;
  } = {
    cwd,
    stdout: (chunk: string) => {
      stdout += chunk;
    },
    stderr: (chunk: string) => {
      stderr += chunk;
    },
  };
  if (io !== undefined) {
    options.io = io;
  }
  const code = await main.run(args, options);
  return { code, stdout, stderr };
}

export async function withRoot(check: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "braid c "));
  assert.match(root, / /u);
  try {
    await check(root);
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
}

async function readOptional(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function snapshotLedger(root: string): Promise<LedgerSnapshot> {
  return {
    state: await readOptional(join(root, ".braid", "state.json")),
    events: await readOptional(join(root, ".braid", "events.jsonl")),
  };
}

export function assertSameBytes(before: LedgerSnapshot, after: LedgerSnapshot): void {
  assert.deepEqual(after.state, before.state);
  assert.deepEqual(after.events, before.events);
}

export async function expectOk(cwd: string, args: readonly string[], stdout: string): Promise<RunResult> {
  const result = await runCli(args, cwd);
  assert.equal(result.code, 0, `${args.join(" ")} stderr=${result.stderr}`);
  assert.equal(result.stderr, "", args.join(" "));
  assert.equal(result.stdout, stdout, args.join(" "));
  return result;
}

export function expectErr(result: RunResult, code: number, stderr: string): void {
  assert.equal(result.code, code, result.stderr);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, stderr);
  assert.equal(result.stderr.includes("\n    at "), false);
}

export function unknown(words: string): string {
  return `error: unknown command: ${words}\nRun braid --help.\n`;
}
