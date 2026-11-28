// The user's two T3 settings: one machine-level file, `~/.braid/t3.json` (the board serves several projects, so not
// BRAID.md). It holds no secret: the sign-in itself lives only in the OS secret store (src/t3/secret.ts).
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { braidHome } from "../notify/config.js";

export interface T3Settings {
  /** `auto`: the signed-in MCP access when signed in, else the `t3` command line; `cli`: always the command line. */
  readonly access: "auto" | "cli";
  /** True: only a local T3 address (`localhost`, `127.0.0.1`); false: also a non-local one, over `https` only. */
  readonly localOnly: boolean;
}

export const DEFAULT_SETTINGS: T3Settings = { access: "auto", localOnly: true };

export function settingsFile(home: string = braidHome()): string {
  return join(home, "t3.json");
}

/** The settings; a missing or unreadable file, or a value braid doesn't know, gives the default for it. */
export function readSettings(home: string = braidHome()): T3Settings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(settingsFile(home), "utf8"));
  } catch {
    return DEFAULT_SETTINGS;
  }
  const o = typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  return {
    access: o["access"] === "cli" ? "cli" : "auto",
    localOnly: o["localOnly"] !== false,
  };
}

/** Writes the settings: a temp file, then a rename. */
export function writeSettings(settings: T3Settings, home: string = braidHome()): void {
  mkdirSync(home, { recursive: true });
  const file = settingsFile(home);
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify({ access: settings.access, localOnly: settings.localOnly }, null, 2)}\n`);
  renameSync(tmp, file);
}

/** `access auto (the board uses the sign-in), local only on`: the settings as `braid t3 status` prints them. */
export function settingsLine(s: T3Settings): string {
  return `access ${s.access} (${s.access === "auto" ? "the board uses the sign-in when signed in" : "the board always uses the t3 command line"}), local only ${s.localOnly ? "on" : "off"}`;
}
