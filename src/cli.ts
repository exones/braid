#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function readVersion(): string {
  const path = fileURLToPath(new URL("../package.json", import.meta.url));
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    typeof parsed.version !== "string"
  ) {
    throw new Error("package.json version is missing");
  }
  return parsed.version;
}

export function helpText(version: string): string {
  return [
    `braid ${version}`,
    "",
    "Usage: braid <command>",
    "",
    "Commands:",
    "  help       Show this help",
    "",
    "Options:",
    "  --version  Print the version",
    "  --help     Show this help",
    "",
  ].join("\n");
}

export interface Output {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export function run(argv: readonly string[]): Output {
  const [first] = argv;
  if (first === "--version") {
    return { code: 0, stdout: `braid ${readVersion()}\n`, stderr: "" };
  }
  if (first === undefined || first === "help" || first === "--help") {
    return { code: 0, stdout: helpText(readVersion()), stderr: "" };
  }
  return { code: 1, stdout: "", stderr: `error: unknown command: ${first}\nRun braid help.\n` };
}

try {
  const out = run(process.argv.slice(2));
  process.stdout.write(out.stdout);
  process.stderr.write(out.stderr);
  process.exitCode = out.code;
} catch {
  process.stderr.write("error: unexpected failure\n");
  process.exitCode = 5;
}
