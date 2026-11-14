// Sample braids with faked GitHub and T3 results for `braid board --demo`: every lane and every
// Waiting reason shows. Nothing here reads the repository, `gh` or `t3`, and nothing is written.
import { loadTree, type Braid, type Tree } from "../braids/store.js";
import type { Github } from "./github.js";
import type { T3, T3Thread } from "./t3.js";

const brief = (id: string, title: string, status: string, extra = ""): string =>
  `---\nid: '${id}'\ntitle: ${title}\nstatus: ${status}\n${extra}---\n\n## Goal\n\n${title}. Sample text from \`braid board --demo\`.\n\n## Acceptance\n\n- It works.\n`;

const FILES: Readonly<Record<string, string>> = {
  "braids/0001-sample-login/brief.md": brief("0001", "Sample login flow", "In Progress", "labels:\n  - tier:L\n"),
  "braids/0001-sample-login/A-form/brief.md": brief("0001/A", "Login form", "Done", "order: 1\n"),
  "braids/0001-sample-login/B-session/brief.md": brief("0001/B", "Session storage", "In Progress", "order: 2\n"),
  "braids/0001-sample-login/C-reset/brief.md": brief("0001/C", "Password reset", "To Do", "order: 3\n"),
  "braids/0002-sample-search/brief.md": brief("0002", "Sample search", "In Progress", "labels:\n  - tier:M\n"),
  "braids/0002-sample-search/A-index/brief.md": brief("0002/A", "Search index", "In Progress", "order: 1\n"),
  "braids/0002-sample-search/B-ui/brief.md": brief("0002/B", "Search page", "In Progress", "order: 2\n"),
  "braids/0003-sample-export/brief.md": brief("0003", "Sample export", "In Progress", "labels:\n  - tier:M\n"),
  "braids/0003-sample-export/A-csv/brief.md": brief("0003/A", "CSV export", "In Progress", "order: 1\n"),
  "braids/0003-sample-export/B-pdf/brief.md": brief("0003/B", "PDF export", "In Progress", "order: 2\nlabels:\n  - ask:approve-layout\n"),
  "braids/0003-sample-export/C-tests/brief.md": brief("0003/C", "Export tests", "In Progress", "order: 3\n"),
  "braids/0004-sample-billing/brief.md": brief("0004", "Sample billing", "In Progress", "labels:\n  - tier:S\n"),
  "braids/0004-sample-billing/A-invoice/brief.md": brief("0004/A", "Invoice page", "In Progress"),
  "braids/0005-sample-themes/brief.md": brief("0005", "Sample themes", "To Do", "labels:\n  - tier:S\n"),
  "braids/0006-sample-audit/brief.md": brief("0006", "Sample audit log", "Outline"),
  "braids/0007-sample-import/brief.md": brief("0007", "Sample import", "In Progress", "labels:\n  - tier:M\n"),
  "braids/0007-sample-import/A-parser/brief.md": brief("0007/A", "Parser", "In Progress"),
  "braids/0008-sample-mail/brief.md": brief("0008", "Sample mail", "Done", "labels:\n  - tier:S\n"),
  "braids/0008-sample-mail/A-send/brief.md": brief("0008/A", "Send mail", "Done"),
  "braids/0008-sample-mail/A-send/report.md": "# Report\n\nSample report text.\n",
};

/** The sample files as a read-only tree; no disk is touched. */
export function demoTree(): Tree {
  const names = Object.keys(FILES);
  return {
    source: null,
    list(dir) {
      const prefix = `${dir}/`;
      const seen = new Map<string, boolean>();
      for (const name of names) {
        if (name.startsWith(prefix)) {
          const rest = name.slice(prefix.length);
          const slash = rest.indexOf("/");
          seen.set(slash === -1 ? rest : rest.slice(0, slash), slash !== -1);
        }
      }
      return [...seen].sort(([a], [b]) => (a < b ? -1 : 1)).map(([name, isDir]) => ({ name, isDir }));
    },
    read(file) {
      return FILES[file] ?? null;
    },
  };
}

export function demoBraids(): Braid[] {
  return loadTree(demoTree());
}

const pr = (number: number, state: "open" | "merged", checks: "passing" | "failing" | "pending" | "none") => ({
  ...(checks === "failing" ? { failed: ["verify (windows-latest)"] } : {}),
  number,
  url: `https://github.com/example/sample/pull/${number}`,
  state,
  checks,
});

export function demoGithub(): Github {
  return {
    status: { state: "ok" },
    prs: new Map([
      ["0001/A", pr(11, "merged", "passing")],
      ["0001/B", pr(12, "open", "passing")],
      ["0002/B", pr(13, "open", "failing")],
      ["0003/A", pr(14, "open", "passing")],
      ["0003/C", pr(17, "open", "passing")],
      ["0008/A", pr(15, "merged", "passing")],
      ["0008", pr(16, "merged", "passing")],
    ]),
  };
}

const thread = (id: string, state: T3Thread["state"], pending = 0): T3Thread => ({ id, state, pending, link: null });

/** Agents: 0002/A runs, 0003/A asks a question, 0004/A stopped, 0002/B has failing checks and no agent. */
export function demoT3(down = false): T3 {
  if (down) {
    return { status: { state: "unavailable", reason: "T3 is not running" }, threads: new Map() };
  }
  return {
    status: { state: "ok" },
    threads: new Map<string, readonly T3Thread[]>([
      ["0002/A", [thread("demo-1", "running")]],
      ["0003/A", [thread("demo-2", "running", 1)]],
      ["0004/A", [thread("demo-3", "stopped")]],
      ["0007/A", [thread("demo-4", "running")]],
    ]),
  };
}
