// Sample braids with faked GitHub, T3 and requests for `braid board --demo`: every state and every
// reason shows. Nothing here reads the repository, `gh` or `t3`, and nothing is written.
import { loadTree, type Braid, type Tree } from "../braids/store.js";
import type { Request } from "../braids/requests.js";
import type { InboxData } from "./inbox.js";
import type { Github } from "./github.js";
import type { ReadSignals } from "./signals.js";
import type { StartContext } from "./model.js";
import type { T3, T3Coordinator, T3Thread } from "./t3.js";

const brief = (id: string, title: string, status: string, extra = ""): string =>
  `---\nid: '${id}'\ntitle: ${title}\nstatus: ${status}\n${extra}---\n\n## Goal\n\n${title}. Sample text from \`braid board --demo\`.\n\n## Acceptance\n\n- It works.\n`;

const BASE_FILES: Readonly<Record<string, string>> = {
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
  "braids/0004-sample-billing/A-invoice/brief.md": brief("0004/A", "Invoice page", "In Progress", "order: 1\n"),
  "braids/0004-sample-billing/B-refunds/brief.md": brief("0004/B", "Refund rules", "In Progress", "order: 2\n"),
  "braids/0005-sample-themes/brief.md": brief("0005", "Sample themes", "In Progress", "labels:\n  - tier:S\n"),
  "braids/0005-sample-themes/A-tokens/brief.md": brief("0005/A", "Colour tokens", "In Progress", "order: 1\n"),
  "braids/0005-sample-themes/B-dark/brief.md": brief("0005/B", "Dark mode", "To Do", "order: 2\n"),
  "braids/0006-sample-audit/brief.md": brief("0006", "Sample audit log", "In Progress", "labels:\n  - tier:M\n"),
  "braids/0006-sample-audit/A-spike/brief.md": brief("0006/A", "Spike: storage options", "Done"),
  "braids/0007-sample-import/brief.md": brief("0007", "Sample import", "In Progress", "labels:\n  - tier:M\n"),
  "braids/0007-sample-import/A-parser/brief.md": brief("0007/A", "Parser", "To Do", "order: 1\n"),
  "braids/0007-sample-import/B-mapper/brief.md": brief("0007/B", "Mapper", "To Do", "order: 2\n"),
  "braids/0007-sample-import/C-report/brief.md": brief("0007/C", "Report", "To Do", "order: 3\n"),
  "braids/0008-sample-mail/brief.md": brief("0008", "Sample mail", "Done", "labels:\n  - tier:S\n"),
  "braids/0008-sample-mail/A-send/brief.md": brief("0008/A", "Send mail", "Done"),
  "braids/0008-sample-mail/A-send/report.md": "# Report\n\nSample report text.\n",
  "braids/0009-sample-reports/brief.md": brief("0009", "Sample reports", "In Progress", "labels:\n  - tier:M\n"),
  "braids/0009-sample-reports/A-model/brief.md": brief("0009/A", "Report model", "In Progress", "order: 1\n"),
  "braids/0009-sample-reports/B-page/brief.md": brief("0009/B", "Report page", "In Progress", "order: 2\n"),
  "braids/0009-sample-reports/C-export/brief.md": brief("0009/C", "Report export", "To Do", "order: 3\n"),
  "braids/0010-sample-cache/brief.md": brief("0010", "Sample cache", "In Progress", "labels:\n  - tier:S\n"),
  "braids/0010-sample-cache/A-layer/brief.md": brief("0010/A", "Cache layer", "In Progress"),
  "braids/0011-sample-notices/brief.md": brief("0011", "Sample notifications", "To Do", "labels:\n  - tier:S\n"),
  "braids/0012-sample-import-csv/brief.md": brief("0012", "Sample CSV import", "To Do", "labels:\n  - tier:M\n"),
  "braids/0013-sample-audit-trail/brief.md": brief("0013", "Sample audit trail", "To Do", "labels:\n  - tier:M\n"),
};

/** Older Done braids, so the Done lane has more than a page: number, title, days since it was merged. */
const OLDER_DONE: readonly (readonly [string, string, number])[] = [
  ["0014", "Sample reports v2", 2],
  ["0015", "Sample billing v2", 3],
  ["0016", "Sample search v2", 4],
  ["0017", "Sample login v2", 5],
  ["0018", "Sample themes v2", 7],
  ["0019", "Sample export v2", 8],
  ["0020", "Sample import v2", 9],
  ["0021", "Sample cache v2", 11],
  ["0022", "Sample mail v2", 12],
  ["0023", "Sample audit v2", 14],
  ["0024", "Sample notices v2", 16],
];
const FILES: Readonly<Record<string, string>> = {
  ...BASE_FILES,
  ...Object.fromEntries(OLDER_DONE.map(([number, title]) => [`braids/${number}-sample-done/brief.md`, brief(number, title, "Done", "labels:\n  - tier:S\n")])),
};

/** Days since each Done sample braid's brief was set Done (the demo has no history to read). */
const DONE_DAYS: Readonly<Record<string, number>> = { "0008": 1, ...Object.fromEntries(OLDER_DONE.map(([number, , days]) => [number, days])) };

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

const demoHead = (number: number): string => `${number.toString(16).padStart(7, "0")}${"0".repeat(33)}`;

const pr = (number: number, state: "open" | "merged", checks: "passing" | "failing" | "pending" | "none") => ({
  ...(checks === "failing" ? { failed: ["verify (windows-latest)"] } : {}),
  number,
  url: `https://github.com/example/sample/pull/${number}`,
  state,
  checks,
  base: "main",
  branch: `braid/sample-${number}`,
  head: demoHead(number),
});

export function demoGithub(): Github {
  return {
    status: { state: "ok" },
    prs: new Map([
      ["0001/A", pr(11, "merged", "passing")],
      ["0001/B", pr(12, "open", "passing")],
      ["0002/B", pr(13, "open", "failing")],
      ["0003/C", pr(17, "open", "passing")],
      ["0005/A", pr(18, "open", "pending")],
      ["0010/A", pr(19, "open", "passing")],
      ["0008/A", pr(15, "merged", "passing")],
      ["0008", pr(16, "merged", "passing")],
      ...OLDER_DONE.map(([number], i) => [number, pr(30 + i, "merged", "passing")] as const),
    ]),
  };
}

const thread = (id: string, role: T3Thread["role"], pending = 0): T3Thread => ({ id, role, pending, link: `https://t3.example/thread/${id}` });

/** What the demo's BRAID.md says. */
export const DEMO_START: StartContext = { main: "main", expected: { provider: "Claude_Everix", model: "claude-opus-5-5" } };

/** Coordinators: 0011's runs on the model BRAID.md names, 0013's on another one (the card warns). */
const demoCoordinators = new Map<string, T3Coordinator>([
  ["0011", { id: "demo-6", link: "https://t3.example/thread/demo-6", provider: "Claude_Everix", model: "claude-opus-5-5" }],
  ["0013", { id: "demo-7", link: "https://t3.example/thread/demo-7", provider: "Claude_Everix", model: "claude-sonnet-5-5" }],
]);

/** Idle coordinators: 0010's thread is waiting (not running, not archived); it only gets an Open thread button. */
const demoIdleCoordinators = new Map<string, T3Coordinator>([
  ["0010", { id: "demo-9", link: "https://t3.example/thread/demo-9", provider: "Claude_Everix", model: "claude-opus-5-5" }],
]);

/** Agents: 0002/A, 0009/A and 0009/B run, 0003/A asks a question, 0010/A is being reviewed; 0002/B has failing checks and an idle worker thread (Open thread only). */
export function demoT3(down = false): T3 {
  if (down) {
    return { status: { state: "unavailable", reason: "T3 is not running" }, threads: new Map(), coordinators: new Map() };
  }
  return {
    status: { state: "ok" },
    coordinators: demoCoordinators,
    idleCoordinators: demoIdleCoordinators,
    idle: new Map<string, readonly T3Thread[]>([["0002/B", [thread("demo-8", "worker")]]]),
    threads: new Map<string, readonly T3Thread[]>([
      ["0002/A", [thread("demo-1", "worker")]],
      ["0003/A", [thread("demo-2", "worker", 1)]],
      ["0009/A", [thread("demo-3", "worker")]],
      ["0009/B", [thread("demo-4", "worker")]],
      ["0010/A", [thread("demo-5", "reviewer")]],
    ]),
  };
}

const MIN = 60_000;

/** The requests and broke alarms of the demo, as of `now`: every kind of request, both alarms. Nothing is read or written. */
export function demoSignals(now: Date = new Date()): ReadSignals {
  const at = (minutes: number): string => new Date(now.getTime() - minutes * MIN).toISOString();
  const request = (id: string, kind: Request["kind"], text: string, minutes: number, extra: Partial<Request> = {}): Request => ({ id, kind, text, at: at(minutes), thread: null, ...extra });
  const requests: Request[] = [
    request("0001/B", "review", "review PR #12 at 0000012", 120, { pr: 12, head: demoHead(12), thread: "demo-coordinator" }),
    request("0003/B", "decision", "Decide: approve the PDF layout (approve-layout)", 60, { key: "approve-layout" }),
    request("0003/C", "review", "review PR #17 at 0000011", 180, { pr: 17, head: demoHead(17) }),
    request("0004/B", "question", "Which rounding rule should refunds use, half-up or banker's?", 35),
    request("0006", "decision", "Decide: which spike option to build (spike-direction)", 120, { key: "spike-direction" }),
    request("0007", "plan", "Approve the plan: 3 strands, A to C", 20),
  ];
  const began: Readonly<Record<string, number>> = { "0002/B": 14, "0004/A": 25 };
  return {
    now,
    requests: new Map(requests.map((r) => [r.id, r])),
    alarm: (id, _reason, holds) => (holds === true && began[id] !== undefined ? at(began[id] ?? 0) : null),
    doneAt: (folder) => {
      const days = DONE_DAYS[/^braids\/(\d{4})-/.exec(folder)?.[1] ?? ""];
      return days === undefined ? null : new Date(now.getTime() - days * 86_400_000).toISOString();
    },
    commit() {},
  };
}

/** Sample inbox entries: leftovers from different sources (one passed over once) and ideas, one long. */
export function demoInbox(): InboxData {
  return {
    note: null,
    leftovers: [
      { kind: "leftover", id: "2026-11-18-k3fa", title: "`braid note --from` rejects \"review 0012/A\" with a trailing space", text: "Found in the review of PR #118. `parseFrom` trims nothing, so a pasted `review 0012/A ` fails with \"unknown source\". Where: `src/commands/inbox.ts`. Why it matters: the coordinator pastes sources from chat.", from: "review 0012/A", ref: ["PR #118 comment on inbox.ts:41"], age: "2h", passed: 0 },
      { kind: "leftover", id: "2026-11-17-p9zx", title: "Windows: `braid inbox show` prints the item folder with backslashes", text: "The report of 0020/A names it under Open. Output is correct but docs/cli.md shows forward slashes; pick one and say so.", from: "0020/A", ref: [], age: "1d", passed: 0 },
      { kind: "leftover", id: "2026-11-16-r7ab", title: "README install section still says Node 24", text: "Seen while writing the PR body of #124. The engines field says `>=26.13.0 <27`.", from: "PR #124", ref: [], age: "2d", passed: 0 },
      { kind: "leftover", id: "2026-11-12-m2qe", title: "Board: the Merge confirmation lists checks in a random order", text: "From `For later items:` of 0009/C. Sort by name so the same PR always reads the same.", from: "0009/C", ref: ["PR #96"], age: "6d", passed: 1 },
    ],
    ideas: [
      { kind: "idea", id: "2026-11-18-q1wd", title: "A \"what changed since I looked\" view", text: "When I come back after a day, I want one place that says which braids moved lane since my last visit, newest first.\n\n- Not a notification feed: it is read when I open the board.\n- Could be a mark on the cards instead of a page.\n\nUnsure whether the board should remember my last visit (a cookie) or `braid recap` should.", from: null, ref: [], age: "40m", passed: 0 },
      { kind: "idea", id: "2026-11-15-w8nn", title: "Run two workers at once on independent strands", text: "Strands without a dependency between them could run in parallel. The board would show two wrenches on the braid.", from: null, ref: [], age: "3d", passed: 0 },
      { kind: "idea", id: "2026-11-10-t5cc", title: "Phone board: swipe between lanes", text: "The phone layout stacks the lanes; swiping would be faster.", from: null, ref: [], age: "8d", passed: 0 },
    ],
  };
}
