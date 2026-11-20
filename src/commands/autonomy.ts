// `braid autonomy <number>` and `braid autonomy --list`: which preset a braid runs on and its text.
// Agents read a preset only through this command, so the shipped ones need no copy in the skills.
import { availablePresets, DEFAULT_PRESET, parsePreset, projectDefault, resolvePreset } from "../braids/autonomy.js";
import { BRAID_ID } from "../braids/brief.js";
import { loadKnownBraids } from "../braids/branches.js";
import { SHIPPED_PRESETS } from "../braids/presets.js";
import { normaliseId, UsageError } from "./braids.js";

const USAGE = "usage: braid autonomy <number>  (a braid number like 0008), or braid autonomy --list";

function list(root: string): string {
  const fallback = projectDefault(root) ?? DEFAULT_PRESET;
  const presets = [...availablePresets(root).values()];
  const width = Math.max(...presets.map((p) => p.name.length));
  const lines = presets.map((p) => {
    const from = p.from === "shipped" ? "shipped" : SHIPPED_PRESETS.has(p.name) ? `${p.from} (replaces the shipped one)` : p.from;
    return `${p.name.padEnd(width)}  ${from}${p.name === fallback ? "  (default here)" : ""}`;
  });
  return `${lines.join("\n")}\n`;
}

export function autonomyCommand(root: string, args: readonly string[]): string {
  if (args.length === 1 && args[0] === "--list") {
    return list(root);
  }
  if (args.length !== 1 || (args[0] ?? "").startsWith("-")) {
    throw new UsageError(USAGE);
  }
  const number = normaliseId(args[0] ?? "");
  if (!BRAID_ID.test(number)) {
    throw new UsageError(`a preset belongs to a braid; give a braid number like 0008, not ${number}`);
  }
  // The live copy, as `braid view` shows it.
  const braid = loadKnownBraids(root, number).find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number}`);
  }
  const resolved = resolvePreset(root, braid.brief.autonomy);
  const nameFrom =
    resolved.nameFrom === "brief"
      ? `the brief of ${number}`
      : resolved.nameFrom === "BRAID.md"
        ? "BRAID.md (the project default)"
        : "the built-in default (neither the brief nor BRAID.md names one)";
  if (resolved.source === null) {
    throw new UsageError(`autonomy preset ${resolved.name}, named by ${nameFrom}, does not exist; available here: ${[...availablePresets(root).keys()].join(", ")}`);
  }
  const source = resolved.source;
  // A broken project file fails here as it fails braid check: exit 2 with its file and line.
  parsePreset(source.text, source.from === "shipped" ? `shipped preset ${source.name}` : source.from, source.name);
  const textFrom = source.from === "shipped" ? "shipped with braid" : SHIPPED_PRESETS.has(source.name) ? `${source.from} (replaces the shipped one)` : source.from;
  const exceptions = braid.brief.sections.find((s) => s.title === "Autonomy")?.text ?? "";
  const lines = [
    `Preset: ${resolved.name}`,
    `Name from: ${nameFrom}`,
    `Text from: ${textFrom}`,
    ...(braid.source === null ? [] : [`Brief read from: ${braid.source.branch}`]),
    "",
    source.text.replace(/\r\n?/g, "\n").trimEnd(),
  ];
  if (exceptions !== "") {
    lines.push("", "This braid:", exceptions);
  }
  return `${lines.join("\n")}\n`;
}
