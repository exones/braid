// `braid notify`: set up ntfy pushes once per machine, send a test, turn them off, or show the state.
import { braidHome, configFile, DEFAULT_SERVER, newTopic, normaliseServer, partialTopic, readConfig, tokenOf, TOKEN_VAR, validTopic, writeConfig, type NotifyConfig } from "../notify/config.js";
import { ntfySender, type Sender } from "../notify/sender.js";
import { UsageError } from "./braids.js";

export interface NotifyDeps {
  readonly home?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly send?: Sender;
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

/** `braid notify [setup|test|off]`. */
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
  if (rest.length > 0 || (sub !== "test" && sub !== "off")) {
    throw new UsageError("usage: braid notify [setup [--topic <topic>] [--server <url>] [--new-topic] | test | off]");
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
    await send(config, { title: "braid: test", body: "Notifications from braid board reach this device.", tags: ["white_check_mark"], priority: "default", click: null }, tokenOf(env));
  } catch (e) {
    throw new UsageError(`the test push failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  return `Sent a test push to ${config.server}, topic ${partialTopic(config.topic)}${config.enabled ? "" : " (notifications are off: the board sends nothing until braid notify setup)"}.\n`;
}
