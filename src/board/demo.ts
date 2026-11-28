// Sample braids with faked GitHub, T3 and requests for `braid board --demo`: every state and every
// reason shows. Nothing here reads the repository, `gh` or `t3`, and nothing is written.
import { loadTree, type Braid, type Tree } from "../braids/store.js";
import { GITHUB_TODO, type Problem } from "../braids/readiness.js";
import { ACKNOWLEDGED, DISMISSED, newRecord, type NewRequest, type Request } from "../braids/requests.js";
import type { Pause } from "../braids/pauses.js";
import type { InboxData } from "./inbox.js";
import type { Github } from "./github.js";
import type { ReadSignals } from "./signals.js";
import type { StartContext } from "./model.js";
import type { T3, T3Coordinator, T3Thread } from "./t3.js";
import { buildView, type LimitsView } from "./limits.js";
import { DEFAULT_LIMITS, NOT_MEASURED, type ProviderReading, type WindowReading } from "../braids/limits.js";
import { planOf, type PlanRead } from "./plans.js";

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
  // Paused for a provider limit (`braid pause`): 0025 waits for its resume, 0026's resume is overdue, 0027's never came (stalled).
  "braids/0025-sample-uploads/brief.md": brief("0025", "Sample uploads", "In Progress", "labels:\n  - tier:M\n"),
  "braids/0025-sample-uploads/A-store/brief.md": brief("0025/A", "Upload store", "Done", "order: 1\n"),
  "braids/0025-sample-uploads/B-page/brief.md": brief("0025/B", "Upload page", "In Progress", "order: 2\n"),
  "braids/0025-sample-uploads/C-limits/brief.md": brief("0025/C", "Size limits", "To Do", "order: 3\n"),
  "braids/0026-sample-webhooks/brief.md": brief("0026", "Sample webhooks", "In Progress", "labels:\n  - tier:S\n"),
  "braids/0026-sample-webhooks/A-sender/brief.md": brief("0026/A", "Webhook sender", "In Progress"),
  "braids/0027-sample-quotas/brief.md": brief("0027", "Sample quotas", "In Progress", "labels:\n  - tier:S\n"),
  "braids/0027-sample-quotas/A-counter/brief.md": brief("0027/A", "Quota counter", "In Progress"),
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
  return filesTree(FILES);
}

function filesTree(files: Readonly<Record<string, string>>): Tree {
  const names = Object.keys(files);
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
      return files[file] ?? null;
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

const thread = (id: string, role: T3Thread["role"], pending = 0, provider = "Claude_Everix"): T3Thread => ({ id, role, pending, link: `https://t3.example/thread/${id}`, provider });

/** What the demo's BRAID.md says. */
export const DEMO_START: StartContext = { main: "main", expected: { provider: "Claude_Everix", model: "claude-opus-5-5" } };

/** Coordinators: 0009's runs next to its running strands (the board's Coordinator button opens it, a strand's Open thread opens the strand); 0011's runs on the model BRAID.md names, 0013's on another one (the card warns). */
const demoCoordinators = new Map<string, T3Coordinator>([
  ["0009", { id: "demo-10", link: "https://t3.example/thread/demo-10", provider: "Claude_Everix", model: "claude-opus-5-5" }],
  ["0011", { id: "demo-6", link: "https://t3.example/thread/demo-6", provider: "Claude_Everix", model: "claude-opus-5-5" }],
  ["0013", { id: "demo-7", link: "https://t3.example/thread/demo-7", provider: "Claude_Everix", model: "claude-sonnet-5-5" }],
]);

/** Idle coordinators: 0010's thread is waiting (not running, not archived); it only gets the Coordinator button. */
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
    // The programmes' PM threads: all idle (a PM waits between messages); `inbox-sweep`'s braids don't run either, so it reads stalled.
    states: new Map([["demo-pm-1", "idle"], ["demo-pm-2", "idle"], ["demo-pm-3", "idle"]]),
    links: new Map(["demo-pm-1", "demo-pm-2", "demo-pm-3"].map((id) => [id, `https://t3.example/thread/${id}`])),
    // The idea "Run two workers at once" is being planned (Promote to Braid): its row shows that and Open thread.
    ideaThreads: new Map<string, T3Coordinator>([["coordinator/idea-2026-11-15-w8nn", { id: "demo-11", link: "https://t3.example/thread/demo-11", provider: "Claude_Everix", model: "claude-opus-5-5" }]]),
    idle: new Map<string, readonly T3Thread[]>([["0002/B", [thread("demo-8", "worker")]]]),
    threads: new Map<string, readonly T3Thread[]>([
      ["0002/A", [thread("demo-1", "worker")]],
      ["0003/A", [thread("demo-2", "worker", 1)]],
      ["0009/A", [thread("demo-3", "worker")]],
      ["0009/B", [thread("demo-4", "worker", 0, "codex")]],
      // A subagent reviewer (recorded with `braid review`): it has no Open thread; it shows inside its coordinator's thread.
      ["0010/A", [{ ...thread("demo-5", "reviewer", 0, "cursor"), link: null }]],
    ]),
  };
}

const MIN = 60_000;

/** The demo's pauses: 0025 paused by the board, resuming in 18 min; 0026's resume was due 20 min ago, 0027's 42 min ago (stalled for 17 min). */
export function demoPauses(now: Date = new Date()): Pause[] {
  const at = (minutes: number): string => new Date(now.getTime() + minutes * MIN).toISOString();
  const pause = (braid: string, resume: number, task: string): Pause => ({ braid, provider: "Claude_Everix", window: "five_hour", label: "Session", usedPercent: 97, resetsAt: at(resume - 5), resumeAt: at(resume), task, thread: "demo-coordinator-thread", by: "coordinator", at: at(-36) });
  // 0025: the board's pause (0064, 0074/C): its texts sent by code, and every agent answered.
  const board: Pause = {
    ...pause("0025", 18, ""),
    task: null,
    thread: "",
    by: "board",
    targets: [{ thread: "demo-coordinator-thread", kind: "coordinator", item: "0025" }, { thread: "demo-worker-thread", kind: "worker", item: "0025/C" }],
    replies: { sent: at(-36), outcome: "paused", answered: 2, total: 2, got: ["demo-coordinator-thread", "demo-worker-thread"], failed: [], noAnswer: [], reason: null },
  };
  return [board, pause("0026", -20, "demo-task-2"), pause("0027", -42, "demo-task-3")];
}

/**
 * The demo's provider readings, as of `now`: Claude_Everix's session is over its threshold (the three demo pauses name it, so it reads
 * paused), codex is fine and cursor can't be measured. Built by the same code as a real read; no cache file is touched.
 */
export function demoLimits(t3: T3, pauses: ReadonlyMap<string, Pause>, now: Date = new Date()): LimitsView {
  const window = (id: string, kind: WindowReading["kind"], label: string, used: number, resetMinutes: number): WindowReading => {
    const threshold = DEFAULT_LIMITS[kind];
    return { id, kind, label, usedPercent: used, threshold, resetsAt: new Date(now.getTime() + resetMinutes * MIN).toISOString(), reset: false, over: used >= threshold };
  };
  const checkedAt = new Date(now.getTime() - 20_000).toISOString();
  const claude = [window("five_hour", "session", "Session", 98, 52), window("seven_day", "weekly", "Weekly", 72, 2 * 24 * 60 + 20 * 60), window("seven_day_fable", "weekly", "Weekly · Fable", 8, 2 * 24 * 60 + 20 * 60)];
  const codex = [window("five_hour", "session", "Session", 18, 150), window("seven_day", "weekly", "Weekly", 60, 70)];
  const reading = (instanceId: string, roles: string[], models: string[], windows: WindowReading[]): ProviderReading => {
    const over = windows.filter((w) => w.over);
    const latest = over.at(0);
    return { instanceId, roles, models, verdict: latest === undefined ? "ok" : "pause", reason: latest === undefined ? null : `${latest.label} (${latest.id}) is at ${latest.usedPercent}%, threshold ${latest.threshold}%`, checkedAt, windows, pauseWindow: latest?.id ?? null, resumeAt: latest === undefined ? null : new Date(Date.parse(latest.resetsAt ?? "") + DEFAULT_LIMITS.buffer * MIN).toISOString(), blindSince: null };
  };
  const cursor: ProviderReading = { instanceId: "cursor", roles: ["reviewer"], models: ["grok-4.6"], verdict: "unknown", reason: `${NOT_MEASURED} (unsupported)`, checkedAt: null, windows: [], pauseWindow: null, resumeAt: null, blindSince: null };
  return buildView([reading("Claude_Everix", ["coordinator", "worker.story", "researcher"], ["claude-opus-5-5", "claude-sonnet-5-5"], claude), reading("codex", ["worker.task"], ["gpt-6-luna"], codex), cursor], DEFAULT_LIMITS, t3, pauses, now);
}

/** The requests and broke alarms of the demo, as of `now`: every kind of request, both alarms. Nothing is read or written. */
export function demoSignals(now: Date = new Date()): ReadSignals {
  const at = (minutes: number): string => new Date(now.getTime() - minutes * MIN).toISOString();
  let n = 0;
  const request = (id: string, kind: Request["kind"], text: string, minutes: number, extra: Partial<NewRequest> = {}): Request => newRecord({ id, kind, text, at: at(minutes), thread: null, code: `q-d${String((n += 1)).padStart(3, "0")}`, ...extra });
  /** A request that ended `minutes` ago: answered by the user or the PM, withdrawn, or met. */
  const closed = (id: string, text: string, opened: number, ended: number, end: { state: "answered" | "withdrawn" | "met"; by: "user" | "pm" | "coordinator" | "board"; text?: string; reason?: string }, extra: Partial<NewRequest> = {}): Request => {
    const r = request(id, "question", text, opened, extra);
    return { ...r, state: end.state, events: [...r.events, { event: end.state, at: at(ended), by: end.by, ...(end.text === undefined ? {} : { text: end.text }), ...(end.reason === undefined ? {} : { reason: end.reason }) }] };
  };
  const requests: Request[] = [
    request("0001/B", "review", "review PR #12 at 0000012", 120, { pr: 12, head: demoHead(12), thread: "demo-coordinator" }),
    request("0003/B", "decision", "Decide: approve the PDF layout (approve-layout)", 60, { key: "approve-layout" }),
    request("0003/C", "review", "review PR #17 at 0000011", 180, { pr: 17, head: demoHead(17) }),
    request("0004/B", "question", "Which rounding rule should refunds use, half-up or banker's?", 35, { context: "Refunds are rounded to cents. The invoices round **half-up**; banker's rounding would make a refund differ from its invoice by a cent now and then.", options: ["Half-up, as the invoices do", "Banker's rounding"] }),
    request("0006", "decision", "Decide: which spike option to build (spike-direction)", 120, { key: "spike-direction" }),
    request("0007", "plan", "Approve the plan: 3 strands, A to C", 20, {
      context: "Sample import needs three pieces, in order:\n\n- **A** the parser\n- **B** the mapper\n- **C** the report page\n\nAbout 900 lines in 14 files. Nothing runs until you answer.",
      options: ["Approve the plan as it is", "Approve, but drop strand C (the report page)", "Don't start yet: I want to read the plan"],
    }),
    // A question the PM answers first: the card keeps its lane and shows the teal "The PM is handling" line, with 🧭.
    request("0009/A", "question", "Should the report totals include refunds?", 3, { to: "pm", pm: "demo-pm-1" }),
  ];
  // 0004/B has three open requests: the question above, this one and the PM's.
  requests.push(request("0004/B", "question", "Does a refund of a partly paid order go to the card or to credit?", 20));
  const asks: Request[] = [request("0004/B", "action", "install the runner on the build machine", 8, { by: "pm" })];
  // A request to another braid's coordinator: not the user's; the asking braid's card shows it quietly, with its "done when".
  // The wait was reminded once, and 0002's coordinator gave an estimate: the Requests tab lists both.
  const wait = request("0009", "question", "Can search ship before reports?", 120, { to: "0002", doneWhen: "braid:0002" });
  const waits: Request[] = [
    {
      ...wait,
      eta: at(-90),
      events: [...wait.events, { event: "reminded", at: at(60), by: "board", text: "sent to the 0002 coordinator" }, { event: "eta", at: at(50), by: "coordinator", text: at(-90), reason: "after strand 0002/C merges" }],
    },
  ];
  const ended: Request[] = [
    closed("0004/A", "Which tax table should it load?", 300, 280, { state: "answered", by: "user", text: "B: the 2026 table." }),
    closed("0009", "Should totals include refunds?", 240, 235, { state: "answered", by: "pm", text: "Yes, net of refunds.", reason: "the goal says totals as the customer sees them" }),
    closed("0004/B", "Which locale for the invoice dates?", 200, 190, { state: "withdrawn", by: "coordinator", text: "the brief already says en-GB" }),
    closed("0003/A", "Wait for the search index", 1500, 1400, { state: "met", by: "board", text: "PR #31 merged" }, { to: "0002", doneWhen: "pr:31" }),
  ];
  const programmes: Request[] = [
    request("pm/working-product", "decision", "Should the export ship before billing? A. Yes: export first, billing after B. No: billing first C. Both at once, with the limit raised to 3", 12, { by: "pm", thread: "demo-pm-1" }),
    request("pm/working-product", "question", "Run the inbox sweep now, or after billing?", 5, { by: "pm", thread: "demo-pm-1" }),
  ];
  // Closed without an answer: one dismissed, one acknowledged; both read under Decided.
  ended.push(closed("0004/B", "Should refunds show on the invoice PDF?", 330, 320, { state: "withdrawn", by: "user", text: DISMISSED }));
  const seen = closed("0006", "The spike's notes are in its report; read them when you like.", 400, 380, { state: "answered", by: "user", text: ACKNOWLEDGED });
  ended.push({ ...seen, kind: "look" });
  // Decided lists a programme's answered requests too: no item's Requests tab does.
  ended.push(closed("pm/working-product", "Should billing wait for the export?", 900, 880, { state: "answered", by: "user", text: "A. Yes: export first, billing after" }, { by: "pm", thread: "demo-pm-1" }));
  const began: Readonly<Record<string, number>> = { "0002/B": 14, "0004/A": 25, "demo/inbox-sweep pm": 14 };
  return {
    now,
    requests: new Map(requests.map((r) => [r.id, r])),
    asks: new Map(asks.map((r) => [r.id, r])),
    open: [...requests, ...asks].sort((a, b) => a.at.localeCompare(b.at)),
    programmes,
    waits,
    closed: ended,
    pauses: new Map(demoPauses(now).map((p) => [p.braid, p])),
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
      { kind: "leftover", id: "2026-11-18-k3fa", title: "`braid note --from` rejects \"review 0012/A\" with a trailing space", text: "Found in the review of PR #118. `parseFrom` trims nothing, so a pasted `review 0012/A ` fails with \"unknown source\". Where: `src/commands/inbox.ts`. Why it matters: the coordinator pastes sources from chat.", from: "review 0012/A", ref: ["PR #118 comment on inbox.ts:41"], age: "2h", passed: 0, planning: null },
      { kind: "leftover", id: "2026-11-17-p9zx", title: "Windows: `braid inbox show` prints the item folder with backslashes", text: "The report of 0020/A names it under Open. Output is correct but docs/cli.md shows forward slashes; pick one and say so.", from: "0020/A", ref: [], age: "1d", passed: 0, planning: null },
      { kind: "leftover", id: "2026-11-16-r7ab", title: "README install section still says Node 24", text: "Seen while writing the PR body of #124. The engines field says `>=26.13.0 <27`.", from: "PR #124", ref: [], age: "2d", passed: 0, planning: null },
      { kind: "leftover", id: "2026-11-12-m2qe", title: "Board: the Merge confirmation lists checks in a random order", text: "From `For later items:` of 0009/C. Sort by name so the same PR always reads the same.", from: "0009/C", ref: ["PR #96"], age: "6d", passed: 1, planning: null },
    ],
    ideas: [
      { kind: "idea", id: "2026-11-18-q1wd", title: "A \"what changed since I looked\" view", text: "When I come back after a day, I want one place that says which braids moved lane since my last visit, newest first.\n\n- Not a notification feed: it is read when I open the board.\n- Could be a mark on the cards instead of a page.\n\nUnsure whether the board should remember my last visit (a cookie) or `braid recap` should.", from: null, ref: [], age: "40m", passed: 0, planning: null },
      { kind: "idea", id: "2026-11-15-w8nn", title: "Run two workers at once on independent strands", text: "Strands without a dependency between them could run in parallel. The board would show two wrenches on the braid.", from: null, ref: [], age: "3d", passed: 0, planning: null },
      { kind: "idea", id: "2026-11-10-t5cc", title: "Phone board: swipe between lanes", text: "The phone layout stacks the lanes; swiping would be faster.", from: null, ref: [], age: "8d", passed: 0, planning: null },
    ],
  };
}

/** `braid board --demo-not-ready`: a project with problems, for the note above the lanes. */
export function demoProblems(): Problem[] {
  return [
    { key: "no-braids", reason: "it has backlog/ but no braids/", todo: "run braid import-backlog" },
    { key: "braid-md", reason: "BRAID.md has no gate, ci in its front matter", todo: "add gate, ci to BRAID.md" },
    { key: "github", reason: "GitHub can't be read (gh is not logged in; run gh auth login)", todo: GITHUB_TODO },
  ];
}

// The second and third sample projects of `braid board --demo` (docs/board.md, "Several projects"): a small
// project with a question waiting and a PR in review, and one that isn't ready for braid.

const API_FILES: Readonly<Record<string, string>> = {
  "braids/0001-rate-limits/brief.md": brief("0001", "Rate limits per key", "In Progress", "labels:\n  - tier:M\n"),
  "braids/0001-rate-limits/A-counter/brief.md": brief("0001/A", "Request counter", "Done", "order: 1\n"),
  "braids/0001-rate-limits/B-headers/brief.md": brief("0001/B", "Limit headers", "In Progress", "order: 2\n"),
  "braids/0002-token-rotation/brief.md": brief("0002", "Token rotation", "In Progress", "labels:\n  - tier:S\n"),
  "braids/0003-openapi-docs/brief.md": brief("0003", "OpenAPI docs", "To Do", "labels:\n  - tier:S\n"),
  "braids/0004-health-check/brief.md": brief("0004", "Health check endpoint", "Done", "labels:\n  - tier:S\n"),
};

/** The `api` sample project's braids. */
export function apiTree(): Tree {
  return filesTree(API_FILES);
}

export function apiBraids(): Braid[] {
  return loadTree(apiTree());
}

export function apiGithub(): Github {
  return {
    status: { state: "ok" },
    prs: new Map([
      ["0001/A", pr(41, "merged", "passing")],
      ["0002", pr(43, "open", "passing")],
      ["0004", pr(40, "merged", "passing")],
    ]),
  };
}

/** T3 runs no agent of the `api` project; its PM thread runs. */
export function apiT3(): T3 {
  return { status: { state: "ok" }, threads: new Map(), states: new Map([["api-pm-1", "running"]]), links: new Map([["api-pm-1", "https://t3.example/thread/api-pm-1"]]) };
}

const plan = (fields: readonly string[]): string => `---\n${fields.join("\n")}\n---\n\n# PM plan\n\nThe decisions and the change log, for people.\n`;

/**
 * The demo's programmes: `working-product` asks you (its request is in `demoSignals`), `inbox-sweep` is stalled (its PM is
 * idle and none of its braids runs), `ios-beta` is held (its braid 0005 shows paused), `launch-v1` is done (off the panel;
 * its braids carry the 🧭 tag in Done).
 */
export function demoPlans(now: Date = new Date()): PlanRead[] {
  const since = new Date(now.getTime() - 95 * MIN).toISOString();
  return [
    planOf("inbox-sweep", "pm/inbox-sweep", plan(["programme: inbox-sweep", "title: Inbox sweep", "goal: Turn the inbox ideas into braids or close them", "thread: demo-pm-2", "limit: 2", "state: running", "next: P3 audit trail, after 0012", "rows:", "  - P1 | 0006 | Sample audit log | waiting on user", "  - P2 | 0012 | Sample CSV import | planned", "  - P3 | - | Audit trail | planned"])),
    planOf("ios-beta", "pm/ios-beta", plan(["programme: ios-beta", "title: iOS beta", "goal: An iOS beta on TestFlight", "thread: demo-pm-3", "limit: 1", "state: held", `hold: ${since} wait until the App Store account is approved`, "rows:", "  - P1 | 0005 | Sample themes | running", "  - P2 | - | TestFlight build | planned"])),
    planOf("launch-v1", "pm/launch-v1", plan(["programme: launch-v1", "title: Launch v1", "goal: The first public release", "thread: demo-pm-4", "state: done", "rows:", "  - P1 | 0014 | Sample reports v2 | done", "  - P2 | 0015 | Sample billing v2 | done"])),
    planOf(
      "working-product",
      "pm/working-product",
      plan([
        "programme: working-product",
        "title: Working product",
        "goal: A working product per the specs: sign in, search, export and bill",
        "thread: demo-pm-1",
        "limit: 3",
        "state: running",
        "next: P4 Packaging, after 0003 merges",
        "digest: 20:03 · 1 done · 3 running · 7 PM decisions since 18:31",
        "rows:",
        "  - P0 | 0008 | Sample mail | done",
        "  - P1 | 0001 | Sample login flow | running",
        "  - P2 | 0002 | Sample search | running",
        "  - P3 | 0003 | Sample export | running",
        "  - P5 | 0004 | Sample billing | waiting on user",
        "  - P4 | - | Packaging for Windows | planned",
        "  - P6 | - | Settings and first run | planned",
      ]),
    ),
  ];
}

/** The `api` project's programmes: one with the same slug as the demo project's (they stay apart), and a plan that doesn't parse. */
export function apiPlans(): PlanRead[] {
  return [
    planOf("broken-plan", "origin/pm/broken-plan", plan(["programme: broken-plan", "title: Broken plan", "goal: A plan the PM wrote wrong", "state: paused"])),
    planOf("working-product", "pm/working-product", plan(["programme: working-product", "title: Working API", "goal: The public API, limited and documented", "thread: api-pm-1", "limit: 2", "state: running", "next: P3 OpenAPI docs, after 0002 merges", "rows:", "  - P0 | 0004 | Health check endpoint | done", "  - P1 | 0001 | Rate limits per key | running", "  - P2 | 0002 | Token rotation | ready to merge", "  - P3 | 0003 | OpenAPI docs | planned"])),
  ];
}

/** `api`: a question on 0001/B and 0002's PR handed over for review. */
export function apiSignals(now: Date = new Date()): ReadSignals {
  const at = (minutes: number): string => new Date(now.getTime() - minutes * MIN).toISOString();
  const requests: Request[] = [
    newRecord({ id: "0001/B", kind: "question", text: "Send Retry-After in seconds or as a date?", at: at(15), thread: null, code: "q-a001", options: ["Seconds", "An HTTP date"], context: "`Retry-After` may be either. Seconds need no clock on the client." }),
    newRecord({ id: "0002", kind: "review", text: "review PR #43 at 000002b", at: at(50), thread: "api-coordinator", code: "q-a002", pr: 43, head: demoHead(43) }),
  ];
  return {
    now,
    requests: new Map(requests.map((r) => [r.id, r])),
    alarm: () => null,
    doneAt: (folder) => (folder.startsWith("braids/0004-") ? new Date(now.getTime() - 2 * 86_400_000).toISOString() : null),
    commit() {},
  };
}

/** What only the `api` member adds for the Questions panel: a braid whose strands depend on each other, and one Done strand. */
const API_PANEL_FILES: Readonly<Record<string, string>> = {
  ...API_FILES,
  "braids/0005-search/brief.md": brief("0005", "Search", "In Progress", "labels:\n  - tier:M\n"),
  "braids/0005-search/A-index/brief.md": brief("0005/A", "Search index", "In Progress", "order: 1\n"),
  "braids/0005-search/B-query/brief.md": brief("0005/B", "Search query", "To Do", "order: 2\ndependencies:\n  - 0005/A\n"),
  "braids/0005-search/C-page/brief.md": brief("0005/C", "Search page", "To Do", "order: 3\ndependencies:\n  - 0005/A\n"),
  "braids/0005-search/D-accents/brief.md": brief("0005/D", "Accented letters", "In Progress", "order: 4\n"),
  "braids/0005-search/E-spike/brief.md": brief("0005/E", "Spike: search engines", "Done", "order: 5\n"),
};

export function apiPanelTree(): Tree {
  return filesTree(API_PANEL_FILES);
}

/** `apiSignals` and the Questions panel's other ranks: escalated, several items, nothing waiting (a Done strand), a look; and Decided with the PM's reason. */
export function apiPanelSignals(now: Date = new Date()): ReadSignals {
  const base = apiSignals(now);
  const at = (minutes: number): string => new Date(now.getTime() - minutes * MIN).toISOString();
  const ask = (code: string, words: string, id: string, kind: Request["kind"], text: string, minutes: number, extra: Partial<NewRequest> = {}): Request => newRecord({ id, kind, text, at: at(minutes), thread: "api-coordinator", code, words, ...extra });
  const open = [
    ask("q-9d3h", "brave fox", "0005/D", "question", "Should search match accented letters (café finds cafe)?", 24, { to: "pm", pm: "api-pm-1", context: "The index stores words as typed. Folding accents changes the index and the query, and means one rebuild.", options: ["Yes: fold accents in the index and the query", "No: exact letters only", "Only for French and German"] }),
    ask("q-7k2m", "calm otter", "0005/A", "decision", "Keep the search index in memory or in a file?", 9, { context: "The API runs as one process today. A file lets a restart skip the rebuild, and is one more thing to back up.", options: ["In memory, rebuilt at start", "In a file beside the database"] }),
    ask("q-2fhn", "quiet lark", "0005/E", "question", "Keep the spike's benchmark scripts in the repository?", 190),
    ask("q-1m9x", "gold seal", "0003", "look", "Token rotation goes next; the OpenAPI docs wait unless you say otherwise.", 300),
  ];
  const answered = (r: Request, minutes: number, by: "user" | "pm", text: string, reason?: string): Request => ({ ...r, state: "answered", events: [...r.events, { event: "answered", at: at(minutes), by, text, ...(reason === undefined ? {} : { reason }) }] });
  return {
    ...base,
    requests: new Map([...base.requests, ...open.map((r) => [r.id, r] as const)]),
    closed: [
      answered(ask("q-2c4v", "swift moth", "0002", "question", "How long does an old token keep working?", 1100), 1050, "user", "24 hours, and log each use"),
      answered(ask("q-5r8k", "mellow ibis", "0001/B", "question", "Should a limited request count against the key?", 200), 190, "pm", "No: only accepted requests count.", "the goal says limits protect the backend, which a refused request never reaches"),
      answered(ask("q-3i2b", "tiny tractor", "pm/working-product", "decision", "Should the docs ship before token rotation?", 400, { by: "pm", thread: "api-pm-1" }), 380, "user", "No: rotation first"),
    ],
  };
}

/** `notes`: a project still on Backlog.md, with an incomplete BRAID.md. */
export function notesProblems(): Problem[] {
  return demoProblems().filter((p) => p.key !== "github");
}

export const EMPTY_INBOX: InboxData = { note: null, leftovers: [], ideas: [] };
