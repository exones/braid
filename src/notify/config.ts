// The notification settings: one per-user file, `~/.braid/notify.json`, so one ntfy topic covers every
// project on the machine. The access token of a protected server is never stored: it comes only from
// the environment variable BRAID_NTFY_TOKEN.
import { randomInt } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_SERVER = "https://ntfy.sh";
export const TOKEN_VAR = "BRAID_NTFY_TOKEN";

export interface NotifyConfig {
  /** The ntfy server, `https://…` without a trailing slash. */
  readonly server: string;
  readonly topic: string;
  /** False after `braid notify off`; the settings are kept. */
  readonly enabled: boolean;
}

/** `~/.braid`, where the installed skills also live. */
export function braidHome(): string {
  return join(homedir(), ".braid");
}

export function configFile(home: string = braidHome()): string {
  return join(home, "notify.json");
}

const TOPIC = /^[A-Za-z0-9_-]{1,64}$/;

/** Whether ntfy takes this as a topic name. */
export function validTopic(topic: string): boolean {
  return TOPIC.test(topic);
}

/** The server as stored: an `https://` URL with no path, query or trailing slash; throws with the reason otherwise. */
export function normaliseServer(server: string): string {
  let url: URL;
  try {
    url = new URL(server);
  } catch {
    throw new Error(`--server needs a URL such as ${DEFAULT_SERVER}; got: ${server}`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`--server must be an https:// URL (the topic and token travel in the request); got: ${server}`);
  }
  if (url.username !== "" || url.password !== "" || url.search !== "" || url.hash !== "") {
    throw new Error("--server takes no user, password, query or fragment; the token comes from BRAID_NTFY_TOKEN");
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** An unguessable topic: `braid-` and 24 random characters (about 124 bits). */
export function newTopic(): string {
  let out = "braid-";
  for (let i = 0; i < 24; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/** The topic as braid shows it outside `setup`: its first 10 characters and an ellipsis. */
export function partialTopic(topic: string): string {
  return topic.length <= 10 ? `${topic.slice(0, 3)}…` : `${topic.slice(0, 10)}…`;
}

/** The settings, or null when they are missing or unreadable (then notifications are off). */
export function readConfig(home: string = braidHome()): NotifyConfig | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(configFile(home), "utf8"));
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const { server, topic, enabled } = parsed as Record<string, unknown>;
    if (typeof server !== "string" || typeof topic !== "string" || !validTopic(topic)) {
      return null;
    }
    return { server: normaliseServer(server), topic, enabled: enabled !== false };
  } catch {
    return null;
  }
}

/** Writes the settings: a temp file, then a rename. */
export function writeConfig(config: NotifyConfig, home: string = braidHome()): void {
  mkdirSync(home, { recursive: true });
  const file = configFile(home);
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify({ server: config.server, topic: config.topic, enabled: config.enabled }, null, 2)}\n`, { mode: 0o600 });
  renameSync(tmp, file);
}

/** The access token, from the environment only; null when unset or empty. */
export function tokenOf(env: NodeJS.ProcessEnv = process.env): string | null {
  const token = env[TOKEN_VAR];
  return token === undefined || token.trim() === "" ? null : token.trim();
}
