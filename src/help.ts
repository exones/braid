export type HelpTopic =
  | "general"
  | "init"
  | "new"
  | "status"
  | "story"
  | "story-add"
  | "story-start"
  | "story-block"
  | "story-complete";

const MANUAL_COMPLETION = "Completion is a manual record, not gate acceptance.";

function finish(lines: readonly string[]): string {
  return [...lines, "", MANUAL_COMPLETION, ""].join("\n");
}

export function helpText(version: string, topic: HelpTopic): string {
  const title = `braid ${version}`;
  switch (topic) {
    case "general":
      return finish([
        title,
        "",
        "Usage:",
        "  braid [--root <dir>] [--help|-h] [--version|-v]",
        "  braid [--root <dir>] init",
        "  braid [--root <dir>] new <epic-id> --title <text> --outcome <text>",
        "  braid [--root <dir>] status [epic-id] [--json]",
        "  braid [--root <dir>] story add <epic-id> <item-id> --title <text> [--kind story|task|spike] [--note <text>] [--next <text>]",
        "  braid [--root <dir>] story start <epic-id> <item-id> [--note <text>] [--next <text>]",
        "  braid [--root <dir>] story block <epic-id> <item-id> --reason <text> [--note <text>] [--next <text>]",
        "  braid [--root <dir>] story complete <epic-id> <item-id> --evidence <text> [--note <text>] [--next <text>]",
        "",
        "Options:",
        "  --root <dir>     Project root. Defaults to the working directory.",
        "  -h, --help       Show help.",
        "  -v, --version    Print the version from this package.",
        "",
        "Commands:",
        "  init       Create an empty schema 1 ledger at .braid/.",
        "  new        Create an epic.",
        "  status     Show epic and item status.",
        "  story      Record manual progress for a story, task, or spike.",
      ]);
    case "init":
      return finish([
        title,
        "",
        "Usage:",
        "  braid [--root <dir>] init",
        "",
        "Create an empty schema 1 ledger at .braid/. Running init again on valid schema 1 changes nothing.",
      ]);
    case "new":
      return finish([
        title,
        "",
        "Usage:",
        "  braid [--root <dir>] new <epic-id> --title <text> --outcome <text>",
        "",
        "Create one epic and no items. The epic id is explicit; schema 1 stores no current-epic pointer. The outcome text is immutable.",
      ]);
    case "status":
      return finish([
        title,
        "",
        "Usage:",
        "  braid [--root <dir>] status [epic-id] [--json]",
        "",
        "Show ledger status. With no epic id, list epics and state counts. --json prints one JSON document. Status does not change ledger files.",
      ]);
    case "story":
      return finish([
        title,
        "",
        "Usage:",
        "  braid [--root <dir>] story add <epic-id> <item-id> --title <text> [--kind story|task|spike] [--note <text>] [--next <text>]",
        "  braid [--root <dir>] story start <epic-id> <item-id> [--note <text>] [--next <text>]",
        "  braid [--root <dir>] story block <epic-id> <item-id> --reason <text> [--note <text>] [--next <text>]",
        "  braid [--root <dir>] story complete <epic-id> <item-id> --evidence <text> [--note <text>] [--next <text>]",
        "",
        "The command family for every work item is story. --kind is story, task, or spike and defaults to story.",
      ]);
    case "story-add":
      return finish([
        title,
        "",
        "Usage:",
        "  braid [--root <dir>] story add <epic-id> <item-id> --title <text> [--kind story|task|spike] [--note <text>] [--next <text>]",
        "",
        "Add a story, task, or spike in the backlog. The default next action is \"Start item <item-id>.\".",
      ]);
    case "story-start":
      return finish([
        title,
        "",
        "Usage:",
        "  braid [--root <dir>] story start <epic-id> <item-id> [--note <text>] [--next <text>]",
        "",
        "Start a backlog item, or resume a blocked item, into in-progress. The default next action is \"Continue item <item-id>.\".",
      ]);
    case "story-block":
      return finish([
        title,
        "",
        "Usage:",
        "  braid [--root <dir>] story block <epic-id> <item-id> --reason <text> [--note <text>] [--next <text>]",
        "",
        "Block an in-progress item. --reason is required. The default next action is \"Resolve: <reason>\" when it fits within 500 characters, otherwise \"Resolve block; see block reason.\". The full reason is preserved.",
      ]);
    case "story-complete":
      return finish([
        title,
        "",
        "Usage:",
        "  braid [--root <dir>] story complete <epic-id> <item-id> --evidence <text> [--note <text>] [--next <text>]",
        "",
        "Record manual completion of an in-progress item. This stores acceptance \"manual\" and is not gate acceptance.",
      ]);
    default: {
      const neverTopic: never = topic;
      throw new Error(`unknown help topic: ${String(neverTopic)}`);
    }
  }
}
