// `braid notify`: set up ntfy pushes once per machine, send a test or the PM's own line, turn them off, or show the state.
import { runT3, showThread, type T3Runner } from "../board/t3.js";
import { t3codeUrl } from "../board/marks.js";
import { findRoot } from "../braids/store.js";
import { titleRepoName } from "../braids/title.js";
import { sequenceOf } from "../notify/message.js";
import { braidHome, configFile, DEFAULT_SERVER, newTopic, normaliseServer, partialTopic, readConfig, tokenOf, TOKEN_VAR, validTopic, writeConfig, type NotifyConfig } from "../notify/config.js";
import { ntfyClearer, ntfySender, type Clearer, type Sender } from "../notify/sender.js";
import { UsageError } from "./braids.js";

const TEST_SEQUENCE = "braid-notify-test";

export interface NotifyDeps {
  readonly home?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly send?: Sender;
  readonly clear?: Clearer;
  /** The repository `send` names (`findRoot` of the working folder when not given). */
  readonly root?: string;
  readonly t3?: T3Runner;
}

/** The longest line `send` pushes; a longer one is cut with an ellipsis. */
export const SEND_MAX = 200;

/**
 * `braid notify send "<line>" --thread <id> [--programme <slug>]`: the PM's own push with no board item (its digest, "nothing can
 * run until you act"), sent at once without the board: `<repo> pm/<slug>: the PM`, the line, 🧭, high, opening the thread. One
 * sequence ID per programme, so a newer line replaces the older. Off, not set up or a failed send print why and return: a PM never
 * fails on it. The output names the server's host, never the topic or the token.
 */
async function sendLine(args: readonly string[], home: string, env: NodeJS.ProcessEnv, deps: NotifyDeps): Promise<string> {
  const thread = option(args, "--thread");
  const slug = option(args, "--programme");
  const known = new Set(["--thread", "--programme", thread, slug]);
  const words = args.filter((a) => !known.has(a));
  const usage = 'usage: braid notify send "<one line>" --thread <thread id> [--programme <slug>]';
  if (thread === undefined || words.length !== 1 || words[0]?.startsWith("--") === true) {
    throw new UsageError(usage);
  }
  const line = (words[0] ?? "").replace(/\s+/g, " ").trim();
  if (line === "") {
    throw new UsageError(usage);
  }
  const config = readConfig(home);
  if (config === null) {
    return "Not sent: notifications are not set up (braid notify setup).\n";
  }
  if (!config.enabled) {
    return "Not sent: notifications are off (braid notify setup turns them on).\n";
  }
  const root = deps.root ?? findRoot(process.cwd());
  const repo = titleRepoName(root);
  const where = await showThread(deps.t3 ?? runT3, root, thread);
  const click = where?.link == null ? null : t3codeUrl(where.link);
  const cut = line.length > SEND_MAX ? `${line.slice(0, SEND_MAX - 1)}…` : line;
  const send = deps.send ?? ntfySender();
  const host = new URL(config.server).host;
  try {
    await send(
      config,
      {
        title: slug === undefined ? `${repo}: the PM` : `${repo} pm/${slug}: the PM`,
        body: click === null ? `${cut}\nOpen the board` : cut,
        tags: ["compass"],
        priority: "high",
        click,
        sequence: sequenceOf(repo, slug === undefined ? "pm#send" : `pm/${slug}#send`),
      },
      tokenOf(env),
    );
  } catch (e) {
    return `Not sent: ${e instanceof Error ? e.message : String(e)}.\n`;
  }
  return `Sent to ${host}${click === null ? " (T3 doesn't know the thread: no link; the push says to open the board)" : ""}.\n`;
}

/** The one line `braid board` prints about notifications. */
export function notifyLine(config: NotifyConfig | null): string {
  return config !== null && config.enabled
    ? `Notifications: on (${config.server}, topic ${partialTopic(config.topic)})`
    : "Notifications: off (braid notify setup turns them on)";
}

function stateText(home: string, env: NodeJS.ProcessEnv): string {
  const config = readConfig(home);
  if (config === null) {
    return `Notifications: not set up. Run braid notify setup.\nSettings: ${configFile(home)}\n`;
  }
  return [
    `Notifications: ${config.enabled ? "on" : "off"}`,
    `Server: ${config.server}`,
    `Topic: ${partialTopic(config.topic)}`,
    `Token: ${tokenOf(env) === null ? `none (${TOKEN_VAR} is not set)` : `from ${TOKEN_VAR}`}`,
    `Settings: ${configFile(home)}`,
    "",
  ].join("\n");
}

function option(args: readonly string[], name: string): string | undefined {
  const at = args.indexOf(name);
  if (at === -1) {
    return undefined;
  }
  const value = args[at + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new UsageError(`${name} needs a value`);
  }
  return value;
}

function setup(args: readonly string[], home: string): string {
  const topicArg = option(args, "--topic");
  const serverArg = option(args, "--server");
  const fresh = args.includes("--new-topic");
  const known = new Set(["--topic", "--server", "--new-topic", topicArg, serverArg]);
  const unknown = args.filter((a) => !known.has(a));
  if (unknown.length > 0) {
    throw new UsageError(`braid notify setup takes only --topic <topic>, --server <url>, --new-topic; got: ${unknown.join(" ")}`);
  }
  if (topicArg !== undefined && fresh) {
    throw new UsageError("--topic and --new-topic don't go together");
  }
  if (topicArg !== undefined && !validTopic(topicArg)) {
    throw new UsageError("--topic takes 1 to 64 letters, digits, - and _");
  }
  let server: string;
  try {
    server = serverArg === undefined ? (readConfig(home)?.server ?? DEFAULT_SERVER) : normaliseServer(serverArg);
  } catch (e) {
    throw new UsageError(e instanceof Error ? e.message : String(e));
  }
  const old = readConfig(home);
  const kept = topicArg === undefined && !fresh && old !== null;
  const topic = topicArg ?? (kept ? old.topic : newTopic());
  writeConfig({ server, topic, enabled: true }, home);
  const url = `${server}/${topic}`;
  return [
    `Notifications: on. Settings: ${configFile(home)}${kept ? " (kept the topic you had; --new-topic makes another)" : ""}`,
    "",
    "Subscribe on your phone in the ntfy app: + (Subscribe to topic), then",
    `  Topic:  ${topic}`,
    `  Server: ${server}${server === DEFAULT_SERVER ? " (the default)" : " (Use another server)"}`,
    `or open ${url}`,
    "",
    "Anyone who knows the topic can read its pushes; keep it to yourself. The running braid board sends them.",
    `A protected server: set ${TOKEN_VAR} to an access token in the board's environment. Check with braid notify test.`,
    "",
  ].join("\n");
}

/** `braid notify [setup|test|off|send]`. */
export async function notifyCommand(args: readonly string[], deps: NotifyDeps = {}): Promise<string> {
  const home = deps.home ?? braidHome();
  const env = deps.env ?? process.env;
  const [sub, ...rest] = args;
  if (sub === undefined) {
    return stateText(home, env);
  }
  if (sub === "setup") {
    return setup(rest, home);
  }
  if (sub === "send") {
    return sendLine(rest, home, env, deps);
  }
  if (rest.length > 0 || (sub !== "test" && sub !== "off")) {
    throw new UsageError('usage: braid notify [setup [--topic <topic>] [--server <url>] [--new-topic] | test | off | send "<one line>" --thread <id> [--programme <slug>]]');
  }
  const config = readConfig(home);
  if (config === null) {
    throw new UsageError("notifications are not set up; run braid notify setup");
  }
  if (sub === "off") {
    writeConfig({ ...config, enabled: false }, home);
    return `Notifications: off. The settings stay in ${configFile(home)}; braid notify setup turns them on again with the same topic.\n`;
  }
  const send = deps.send ?? ntfySender();
  try {
    await send(config, { title: "braid: test", body: "Notifications from braid board reach this device.", tags: ["white_check_mark"], priority: "default", click: null, sequence: null }, tokenOf(env));
  } catch (e) {
    throw new UsageError(`the test push failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  // The second step: a push with a sequence ID, then its clear, so the clear a gone need relies on can be seen on a real topic.
  const clear = deps.clear ?? ntfyClearer();
  try {
    await send(config, { title: "braid: test clear", body: "This push should leave the device a moment after it arrives.", tags: ["wastebasket"], priority: "default", click: null, sequence: TEST_SEQUENCE }, tokenOf(env));
    await clear(config, TEST_SEQUENCE, tokenOf(env));
  } catch (e) {
    throw new UsageError(`the test push was sent, but the clear step failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  return (
    `Sent a test push to ${config.server}, topic ${partialTopic(config.topic)}${config.enabled ? "" : " (notifications are off: the board sends nothing until braid notify setup)"}.\n` +
    "Then sent a second push with a sequence ID and cleared it: it should arrive and then leave the device (Android and the web app only).\n"
  );
}
