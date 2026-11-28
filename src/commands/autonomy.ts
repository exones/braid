// `braid autonomy <number>` and `braid autonomy --list`: which preset a braid runs on and its text.
// It reads as the base of the item's PR has it (`judgedPreset`). Agents read a preset only through this
// command, so the shipped ones need no copy in the skills.
import { availablePresets, DEFAULT_PRESET, judgedPreset, parsePreset, projectDefault, resolvePreset } from "../braids/autonomy.js";
import type { Brief } from "../braids/brief.js";
import { loadKnownBraids } from "../braids/branches.js";
import { SHIPPED_PRESETS } from "../braids/presets.js";
import { normaliseId, UsageError } from "./braids.js";
import { mainBranch } from "./start.js";

const USAGE = "usage: braid autonomy <id>  (a braid or strand id like 0008 or 0008/A), or braid autonomy --list";

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

const exceptionsOf = (brief: Brief): string => brief.sections.find((s) => s.title === "Autonomy")?.text ?? "";
const normal = (text: string): string => text.replace(/\r\n?/g, "\n").trimEnd();

export function autonomyCommand(root: string, args: readonly string[]): string {
  if (args.length === 1 && args[0] === "--list") {
    return list(root);
  }
  if (args.length !== 1 || (args[0] ?? "").startsWith("-")) {
    throw new UsageError(USAGE);
  }
  const id = normaliseId(args[0] ?? "");
  const number = id.slice(0, 4);
  // The live copy, as `braid view` shows it.
  const braid = loadKnownBraids(root, number).find((b) => b.number === number);
  if (braid === undefined) {
    throw new UsageError(`no braid ${number}`);
  }
  if (id !== number && !braid.strands.some((s) => `${number}/${s.letter}` === id)) {
    throw new UsageError(`no strand ${id}`);
  }
  // A strand's PR goes into the braid branch (into main with `delivery: main`), a braid's into main.
  const slug = /^braids\/\d{4}-(.+)$/.exec(braid.folder)?.[1] ?? "";
  const base = id === number || braid.brief.delivery === "main" ? mainBranch(root) : `braid/${number}-${slug}`;
  const { ref, brief, onBase, resolved, tree } = judgedPreset(root, base, number, braid.brief);
  const nameFrom =
    resolved.nameFrom === "brief"
      ? `the brief of ${number}`
      : resolved.nameFrom === "BRAID.md"
        ? "BRAID.md (the project default)"
        : "the built-in default (neither the brief nor BRAID.md names one)";
  if (resolved.source === null) {
    const where = ref === null ? "" : ` on ${ref}`;
    throw new UsageError(`autonomy preset ${resolved.name}, named by ${nameFrom}, does not exist${where}; available ${ref === null ? "here" : "there"}: ${[...availablePresets(root, tree).keys()].join(", ")}`);
  }
  const source = resolved.source;
  // A broken project file fails here as it fails braid check: exit 2 with its file and line.
  parsePreset(source.text, source.from === "shipped" ? `shipped preset ${source.name}` : source.from, source.name);
  const textFrom = source.from === "shipped" ? "shipped with braid" : SHIPPED_PRESETS.has(source.name) ? `${source.from} (replaces the shipped one)` : source.from;
  const exceptions = exceptionsOf(brief);
  const here = resolvePreset(root, braid.brief.autonomy);
  const differs = ref !== null && (here.name !== resolved.name || normal(here.source?.text ?? "") !== normal(source.text) || exceptionsOf(braid.brief) !== exceptions);
  const lines = [
    `Preset: ${resolved.name}`,
    `Name from: ${nameFrom}`,
    `Text from: ${textFrom}`,
    ...(onBase || braid.source === null ? [] : [`Brief read from: ${braid.source.branch}`]),
    ...(ref === null ? [] : [`Base: ${ref}${onBase ? "" : ` (without ${number} yet: the brief's autonomy and ## Autonomy are not from it)`}`]),
    ...(differs ? [`Differs here: preset ${here.name}, with another name, text or ## Autonomy in this checkout or on the braid's branch; it counts once it is on ${ref}`] : []),
    "",
    normal(source.text),
  ];
  if (exceptions !== "") {
    lines.push("", "This braid:", exceptions);
  }
  return `${lines.join("\n")}\n`;
}
