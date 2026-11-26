import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog, Tabs, Tooltip } from "radix-ui";
import { ROLES } from "../../src/braids/roles.ts";
import { Md } from "./Md.tsx";
import { TAG_COLOURS } from "./palette.ts";
import { copyText, type CopyEnv } from "../../src/board/copy.ts";
import { LimitChips, LimitsPanel, LimitsStrip } from "./Limits.tsx";
import { LANE_LABEL, ageText, cardMarks, splitId, strandMarks, t3codeUrl, threadEmoji, type Marks } from "../../src/board/marks.ts";
import { closeMode, hashFor, openMode, parseHash, programmeHash, pushedAfter, type Route } from "../../src/board/route.ts";
import { filterSearch, parseFilter, parseProgramme, programmeSearch, resolveProject, toggleProject } from "../../src/board/filter.ts";
import { DONE_PAGE, doneNewestFirst } from "../../src/board/model.ts";
import { askWho, clock as clockAt, pauseBox, resumeMode, resumeOnCard, usage,type PauseView } from "../../src/board/pause.ts";
import type { ProgrammeResume } from "../../src/board/programme.ts";
import type { PmLine as PmHandling } from "../../src/board/pm.ts";
import { CLOSED_PAGE, type RequestRow, type RequestsView } from "../../src/board/record.ts";
import { postAction, useAll, useItem, useTick, type MergeInfo, type StartInfo, type Tick, type InboxEntry, type BraidCard, type ItemDetail, type Lane, type Loaded, type Need, type PullRequest, type ThreadRole, type StrandCard, type ProjectInfo, type TaggedCard, type TaggedProgramme } from "./api.ts";

/** Whether the open details were pushed as a history entry (so closing can go back) or arrived with the page. */
let pushedOpen = false;

/** Whether several projects are served: only then an item's address carries its project (`#/p/<name>/0003`). Set by `App`. */
let severalProjects = false;

/** Opens an item's details. From the bare board it adds a history entry; inside open details it replaces, so one Back closes them. */
export function go(id: string, tab = "brief", project: string | null = null): void {
  const target = hashFor(id, tab, severalProjects ? project : null);
  if (openMode(location.hash) === "push") {
    pushedOpen = true;
    location.hash = target;
  } else {
    location.replace(target);
  }
}

/** Closes the details and returns to the board as it was: Back when we pushed the entry, else replace. */
function closeDetails(): void {
  if (closeMode(pushedOpen) === "back") {
    history.back();
  } else {
    location.replace("#/");
  }
}

function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => {
      const next = parseHash(location.hash);
      pushedOpen = pushedAfter(pushedOpen, next);
      setRoute(next);
    };
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function Status<T>({ loaded, children }: { loaded: Loaded<T>; children: (data: T) => ReactNode }) {
  if (loaded.state === "loading") {
    return <p className="p-6 text-slate-500">Loading…</p>;
  }
  if (loaded.state === "error") {
    return <p className="m-6 rounded-lg bg-red-50 p-4 text-red-800">{loaded.message}</p>;
  }
  return <>{children(loaded.data)}</>;
}

/** One colour per lane; the dot, the column header and the progress bar use them. */
const LANE_DOT: Record<Lane, string> = {
  "To Do": "bg-slate-300",
  "In Progress": "bg-blue-600",
  "In Review": "bg-violet-600",
  Waiting: "bg-amber-500",
  Done: "bg-green-600",
};

function LaneDot({ lane }: { lane: Lane }) {
  return <span className={`size-2 flex-none rounded-full ${LANE_DOT[lane]}`} />;
}

/** A small round icon with a hover text; the text is also the aria-label. */
function Icon({ tip, children, className = "" }: { tip: string; children: ReactNode; className?: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span role="img" aria-label={tip} tabIndex={0} className={`inline-flex size-4 flex-none items-center justify-center ${className}`}>
          {children}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">
          {tip}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

const svg = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

function ReasonMark({ kind, tooltip }: { kind: string; tooltip: string }) {
  if (kind === "question") {
    return <Icon tip={tooltip} className="rounded-full bg-amber-500 text-[11px] font-bold text-white">?</Icon>;
  }
  if (kind === "checks") {
    return (
      <Icon tip={tooltip} className="rounded-full bg-red-600 text-white">
        <svg {...svg} width={10} height={10} strokeWidth={3.5}><path d="M6 6l12 12M18 6L6 18" /></svg>
      </Icon>
    );
  }
  if (kind === "stalled") {
    return (
      <Icon tip={tooltip} className="text-red-600">
        <svg {...svg} strokeWidth={2.2}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      </Icon>
    );
  }
  if (kind === "limit") {
    return <Icon tip={tooltip} className="text-amber-500">⚖</Icon>;
  }
  if (kind === "plan") {
    return (
      <Icon tip={tooltip} className="text-amber-500">
        <svg {...svg} strokeWidth={2.2}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM9 12h6M9 16h4" /></svg>
      </Icon>
    );
  }
  return (
    <Icon tip={tooltip} className="text-amber-500">
      <svg {...svg} fill="currentColor" stroke="none"><path d="M5 2h2v20H5zM8 3h12l-3 5 3 5H8z" /></svg>
    </Icon>
  );
}

/** Reason icons, the review eye, the wrench and the Done tick, in this order. */
function Marks({ marks }: { marks: Marks }) {
  return (
    <span className="inline-flex flex-none items-center gap-1.5">
      {marks.reasons.map((r) => (
        <ReasonMark key={r.kind} kind={r.kind} tooltip={r.tooltip} />
      ))}
      {marks.paused !== null && (
        <Icon tip={marks.paused.tooltip} className={PAUSE_TONE[marks.paused.state].icon}>
          <svg {...svg} strokeWidth={2.4}><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></svg>
        </Icon>
      )}
      {marks.pm !== null && (
        <Icon tip={marks.pm} className="text-teal-700">
          <span aria-hidden>🧭</span>
        </Icon>
      )}
      {marks.review !== null && (
        <Icon tip={marks.review} className="text-violet-600">
          <svg {...svg} strokeWidth={2.2}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
        </Icon>
      )}
      {marks.done && (
        <Icon tip="Done" className="text-green-600">
          <svg {...svg} strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </Icon>
      )}
      {marks.activities.map((a) =>
        a.kind === "agent" ? (
          <Icon key={a.kind} tip={a.tooltip} className="motion-safe:animate-[wob_2s_ease-in-out_infinite] text-blue-600">
            <svg {...svg} strokeWidth={2.2}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.4-.6-.6-2.4z" /></svg>
          </Icon>
        ) : a.kind === "review" ? (
          <Icon key={a.kind} tip={a.tooltip} className="text-blue-600">
            <svg {...svg} strokeWidth={2.2}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></svg>
          </Icon>
        ) : (
          <Icon key={a.kind} tip={a.tooltip} className="text-blue-600">
            <svg {...svg} strokeWidth={2.2} className="motion-safe:animate-spin"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></svg>
          </Icon>
        ),
      )}
    </span>
  );
}

const NEED_TONE = {
  review: "border-violet-600 bg-violet-50 text-violet-900",
  bad: "border-red-600 bg-red-50 text-red-900",
  wait: "border-amber-500 bg-amber-50 text-amber-900",
} as const;

/** A paused braid: sky while it waits for its resume, amber once the resume is overdue. */
const PAUSE_TONE = {
  paused: { icon: "text-sky-600", box: "border-sky-600 bg-sky-50 text-sky-900" },
  pausing: { icon: "animate-pulse text-sky-600", box: "border-sky-600 bg-sky-50 text-sky-900" },
  due: { icon: "text-amber-600", box: "border-amber-500 bg-amber-50 text-amber-900" },
} as const;

/** The card's line for a paused braid in Working or To Do: the pause, and who paused it or when it reads Stalled. */
function PauseLine({ pause }: { pause: PauseView }) {
  return (
    <div className={`mt-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-[12.5px] leading-snug ${PAUSE_TONE[pause.state].box}`}>
      {pause.text}
      <small className="mt-px block text-[11px] text-slate-500">{pause.note}</small>
    </div>
  );
}

/** The card's line for a request the PM is handling: it keeps the lane the item's other state gives. */
function PmLine({ pm }: { pm: PmHandling }) {
  return (
    <div className="mt-1.5 rounded-md border-l-[3px] border-teal-700 bg-teal-50 px-1.5 py-1 text-[12.5px] leading-snug text-teal-900">
      🧭 {pm.text}
      <small className="mt-px block text-[11px] text-slate-500">
        {pm.forwarded === true ? `the PM asked you ${pm.age} ago · it pushes from the PM's thread` : `to the PM ${pm.age} ago · no push; it comes to you if the PM doesn't answer`}
      </small>
    </div>
  );
}

const toneOf = (need: Need): string => NEED_TONE[need.kind === "review" ? "review" : need.kind === "checks failed" || need.kind === "stalled" || (need.kind === "limit" && need.text.startsWith("Pause failed")) ? "bad" : "wait"];

/** One line saying what the user needs to do, with its age; on a braid card also which strand it comes from. */
function NeedLine({ need, braid = false, className = "" }: { need: Need; braid?: boolean; className?: string }) {
  const parts = [
    braid && need.more > 0 ? `+${need.more} more in strands` : null,
    braid ? (need.who === null ? "braid, no strand involved" : `strand ${need.who}`) : null,
    ageText(need) === "" ? null : ageText(need),
  ].filter((p) => p !== null);
  return (
    <div className={`mt-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-[12.5px] leading-snug ${toneOf(need)} ${className}`}>
      {need.code !== undefined && <><CodeChip code={need.code} />{" "}</>}
      {need.text}
      {need.code !== undefined && <AskingLink link={need.asking ?? null} />}
      {parts.length > 0 && <small className="mt-px block text-[11px] text-slate-500">{parts.join(" · ")}</small>}
      {need.also !== undefined && <NeedLine need={need.also} />}
    </div>
  );
}

/** A request's code (`q-7f3k`), the name to use for it in any thread. A click, tap or Enter copies it and says "copied" for a moment; the card under it stays as it is. */
function CodeChip({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = (e: { stopPropagation(): void; preventDefault(): void }) => {
    e.stopPropagation();
    e.preventDefault();
    void copyText(code, { isSecureContext: window.isSecureContext, clipboard: navigator.clipboard, document: document as unknown as CopyEnv["document"] }).then((ok) => {
      setState(ok ? "copied" : "failed");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setState("idle"), 1500);
    });
  };
  return (
    <button type="button" title={`Copy ${code}`} onClick={copy} className="relative cursor-copy whitespace-nowrap rounded border-0 bg-slate-900 p-0 px-1.5 align-baseline font-mono text-[11.5px] font-semibold text-amber-200">
      {code}
      {state !== "idle" && (
        <span role="status" className={`absolute -top-5 left-0 rounded px-1.5 py-px text-[11px] font-medium text-white shadow ${state === "copied" ? "bg-emerald-700" : "bg-red-700"}`}>
          {state === "copied" ? "copied" : "copy failed"}
        </span>
      )}
    </button>
  );
}

/** "Open asking thread": the T3 app link of the thread that asked; nothing when T3 doesn't list it. */
function AskingLink({ link }: { link: string | null }) {
  const app = link === null ? null : t3codeUrl(link);
  if (app === null) {
    return null;
  }
  return (
    <a href={app} onClick={(e) => e.stopPropagation()} className="ml-1.5 mt-1 inline-block whitespace-nowrap rounded border border-blue-200 bg-white px-1.5 text-[11.5px] text-blue-600 no-underline hover:border-blue-600">
      ↗ Open asking thread
    </a>
  );
}

/** What a request waits for, in words. */
function doneWhenText(doneWhen: string): string {
  const i = doneWhen.indexOf(":");
  const value = doneWhen.slice(i + 1);
  return i < 0 ? "done when answered" : doneWhen.startsWith("pr:") ? `done when PR #${value} is merged` : doneWhen.startsWith("braid:") ? `done when ${value} is merged into main` : doneWhen.startsWith("time:") ? `done at ${new Date(value).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}` : `done when ${doneWhen}`;
}

/** A timed wait's time (`time:<iso>`) as the card says it: `04:15` today, else the short date and time. */
function untilText(doneWhen: string): string {
  const at = new Date(doneWhen.slice(5));
  return at.toDateString() === new Date().toDateString() ? at.toLocaleTimeString([], { timeStyle: "short" }) : at.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

/** The quiet line on the asking braid's card for a request to another braid, or a timed wait (`to: self`): it doesn't ask the user. */
function WaitLine({ row }: { row: RequestRow }) {
  const timed = row.to === "self";
  return (
    <div className="mt-1.5 rounded-md border-l-[3px] border-slate-300 bg-slate-50 px-1.5 py-1 text-[12.5px] leading-snug text-slate-700">
      {timed ? `Waiting until ${untilText(row.doneWhen)}` : `Waiting on braid ${row.to}`}: <CodeChip code={row.code} /> {row.text}
      <small className="mt-px block text-[11px] text-slate-500">
        {timed ? "the board wakes it then" : doneWhenText(row.doneWhen)} · {row.item} {timed ? "waits since" : "asked"} {row.age} ago
        <AskingLink link={row.link} />
      </small>
    </div>
  );
}

function Badge({ children, tone = "bg-slate-200 text-slate-700" }: { children: ReactNode; tone?: string }) {
  return <span className={`rounded-full px-2 py-px text-[11px] ${tone}`}>{children}</span>;
}

const StartIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);
const MergeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <circle cx="6" cy="5" r="2" />
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="12" r="2" />
    <path d="M6 7v10M8 5c6 0 10 2 10 5" />
  </svg>
);

/** A braid number or strand id in full: the leading zeros in normal weight, the significant digits bold (`00`**`34`**`/A`). */
function Id({ id }: { id: string }) {
  // `id` is an id (`0034/A`) or text that holds ids (an inbox source such as `review 0012/A`).
  return (
    <>
      {id.split(/(\b\d{4}(?:\/[A-Z])?\b)/).map((part, i) => {
        if (i % 2 === 0) {
          return part;
        }
        const { zeros, digits, rest } = splitId(part);
        return <span key={i}>{zeros}<b className="font-bold text-slate-900">{digits}</b>{rest}</span>;
      })}
    </>
  );
}

/** A 24 px button; below `md` (a phone) it is at least 44 px. Start and Merge carry their one-word label there; the thread buttons stay an emoji. */
const BUTTON = "flex size-6 items-center justify-center gap-1.5 rounded-md border max-md:size-auto max-md:min-h-11 max-md:min-w-11 max-md:px-4 max-md:text-sm max-md:font-semibold";
const EMOJI_BUTTON = "text-[13px] leading-none max-md:text-xl";

/** The label shown on a phone only; desktop buttons are icon-only with a tooltip. */
const Label = ({ children }: { children: ReactNode }) => <span className="md:hidden">{children}</span>;

/** The project the item being drawn belongs to: every action sends it. */
const ProjectContext = createContext("");

/** The projects served (in served order) and whether the page tells them apart; one project served looks as it always did. */
interface Scope {
  readonly projects: ReadonlyMap<string, { readonly info: ProjectInfo; readonly index: number }>;
  /** More than one project is served: items are addressed with their project and the project block shows. */
  readonly several: boolean;
  /** More than one project is shown: cards and inbox entries carry a project tag. */
  readonly tagged: boolean;
}
const ScopeContext = createContext<Scope>({ projects: new Map(), several: false, tagged: false });

const colourOf = (index: number) => TAG_COLOURS[index % TAG_COLOURS.length] ?? TAG_COLOURS[0];

/** How old a snapshot is, as "12 s", "14 min" or "3 h". */
function ageOf(ms: number | null): string {
  if (ms === null) {
    return "";
  }
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.round(s / 3600)} h`;
}

/** A project's name with its colour; a ⚠ when its latest read failed (the card shows the older board). */
function ProjectTag({ name }: { name: string }) {
  const entry = useContext(ScopeContext).projects.get(name);
  const c = colourOf(entry?.index ?? 0);
  const failed = entry?.info.failure != null;
  return (
    <span
      data-project-tag={name}
      title={failed ? `Reading ${name} failed ${ageOf(entry.info.ageMs)} ago: this is its older board` : undefined}
      className={`inline-flex items-center gap-1 rounded-full border bg-white px-1.5 text-[11px] font-semibold ${c.text} ${c.border}`}
    >
      <span className={`size-2 flex-none rounded-full ${c.dot}`} />
      {name}
      {failed && <span aria-label="read failed" className="font-bold text-red-700">⚠</span>}
    </span>
  );
}

/** Whether the server says this page came over Tailscale (`remote` in the board data), not from the local board. */
const RemoteContext = createContext(false);

/**
 * Open thread: a small button that opens the item's thread in the T3 desktop app (the server opens it); on a phone, the
 * thread's `t3code://` app link. Over Tailscale (the server refuses `open` there) only the app link, at every width.
 * Nothing is drawn when there is no thread. `coordinator` is the braid's Coordinator button: the same, for the coordinator
 * thread (the server is asked with `thread: "coordinator"`), a 🧠 and an accent colour.
 */
function OpenThread({ id, link, role = null, coordinator = false, idea = false }: { id: string; link: string | null; role?: ThreadRole | null; coordinator?: boolean; idea?: boolean }) {
  const remoteBoard = useContext(RemoteContext);
  const project = useContext(ProjectContext);
  const [error, setError] = useState<string | null>(null);
  if (link === null) {
    return null;
  }
  const app = t3codeUrl(link);
  const what = coordinator ? "Open the coordinator thread" : "Open thread";
  const emoji = coordinator || idea ? ROLES.coordinator : threadEmoji(role);
  const tone = coordinator ? "border-blue-600 text-blue-700" : "border-slate-200 text-slate-700";
  if (remoteBoard && app === null) {
    return null;
  }
  return (
    <>
      {app !== null && (
        <a href={app} onClick={(e) => e.stopPropagation()} aria-label={`${what} in the T3 app`} title={`${what} in the T3 app`} className={`${BUTTON} ${tone} bg-white no-underline ${remoteBoard ? "" : "md:hidden"}`}>
          <span aria-hidden="true" className={EMOJI_BUTTON}>{emoji}</span>
        </a>
      )}
    {!remoteBoard && (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={`${what} in T3`}
          onClick={(e) => {
            e.stopPropagation();
            setError(null);
            postAction("open", idea ? { project, idea: id } : coordinator ? { project, id, thread: "coordinator" } : { project, id }).catch((err: unknown) => setError(err instanceof Error ? err.message : "failed"));
          }}
          className={`${BUTTON} ${app === null ? "" : "max-md:hidden"} ${error === null ? tone : "border-red-600 text-red-700"} bg-white hover:border-blue-600`}
        >
          <span aria-hidden="true" className={EMOJI_BUTTON}>{emoji}</span>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">{error ?? `${what} in T3`}</Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
    )}
    </>
  );
}

const ASKED_KEY = "braid-merge-asked";
type Asked = Record<string, { head: string; at: string }>;
const readAsked = (): Asked => {
  try {
    return JSON.parse(sessionStorage.getItem(ASKED_KEY) ?? "{}") as Asked;
  } catch {
    return {};
  }
};

const short = (head: string | null): string => (head ?? "unknown").slice(0, 7);
const CHECK_MARK = { passing: "text-green-600", failing: "text-red-600", pending: "text-amber-500" } as const;

/**
 * Merge on request: opens the confirmation; on confirm the server asks the coordinator that handed the PR
 * over. Off, with its reason in the tooltip, when there is no open review request or coordinator thread,
 * the checks aren't green, or the coordinator was already asked for this head.
 */
function MergeButton({ id, merge }: { id: string; merge: MergeInfo | null }) {
  const project = useContext(ProjectContext);
  const key = `${project}/${id}`;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asked, setAsked] = useState(readAsked);
  const sent = merge?.head == null ? undefined : asked[key]?.head === merge.head ? asked[key] : undefined;
  const reason = merge === null ? "no open review request" : sent !== undefined ? `asked the coordinator at ${sent.at}; waiting for it to merge` : merge.reason;
  const confirm = async () => {
    if (merge?.head == null) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await postAction("merge", { project, id, head: merge.head });
      const next = { ...readAsked(), [key]: { head: merge.head, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } };
      sessionStorage.setItem(ASKED_KEY, JSON.stringify(next));
      setAsked(next);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  if (merge === null || reason !== null) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {sent !== undefined && <small className="text-[11px] text-violet-700">Asked to merge #{merge?.pr} at {short(sent.head)}</small>}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="inline-flex" tabIndex={0} aria-label={`Merge: ${reason ?? ""}`}>
              <button type="button" disabled aria-label="Merge" className={`${BUTTON} cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400`}>
                <MergeIcon /> <Label>Merge</Label>
              </button>
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">Merge: {reason}</Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </span>
    );
  }
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Dialog.Trigger asChild>
            <button type="button" aria-label="Merge" onClick={(e) => e.stopPropagation()} className={`${BUTTON} cursor-pointer border-violet-600 bg-violet-600 text-white hover:bg-violet-700`}>
              <MergeIcon /> <Label>Merge</Label>
            </button>
          </Dialog.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">Merge: ask the coordinator</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <Dialog.Content onClick={(e) => e.stopPropagation()} className="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-xl">
          <Dialog.Title className="text-base font-semibold">Merge PR #{merge.pr}?</Dialog.Title>
          <Dialog.Description className="mb-3 text-slate-500">{id}</Dialog.Description>
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-slate-500">PR</dt>
            <dd>#{merge.pr}{merge.branch !== null && <> <code className="break-all text-xs">{merge.branch}</code></>}</dd>
            <dt className="text-slate-500">Head commit</dt>
            <dd><code className="text-xs">{short(merge.head)}</code></dd>
            <dt className="text-slate-500">Merges into</dt>
            <dd><code className="break-all text-xs">{merge.target ?? "unknown"}</code></dd>
            <dt className="text-slate-500">Checks</dt>
            <dd>
              {merge.runs.length === 0 && (merge.checks ?? "unknown")}
              {merge.runs.map((c) => (
                <div key={c.name}><span className={CHECK_MARK[c.result]}>{c.result === "passing" ? "✓" : c.result === "failing" ? "✗" : "…"}</span> {c.name}</div>
              ))}
            </dd>
          </dl>
          <p className="mt-3 text-xs text-slate-500">Tells the coordinator that handed over the PR: “Merge #{merge.pr} at {short(merge.head)}, from the board.” The board does not merge itself.</p>
          {error !== null && <p role="alert" className="mt-3 rounded-md border-l-[3px] border-red-600 bg-red-50 px-2.5 py-1.5 text-[13px] text-red-900">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1 hover:border-blue-600">Cancel</Dialog.Close>
            <button type="button" disabled={busy} onClick={() => void confirm()} className="flex cursor-pointer items-center gap-1.5 rounded-md border border-violet-600 bg-violet-600 px-3 py-1 font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">
              <MergeIcon /> {busy ? "Asking…" : "Ask coordinator to merge"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The warning style of the mockups (`#warn`): a coordinator on another model than BRAID.md names. */
function Warn({ children }: { children: ReactNode }) {
  return <div role="status" className="mt-1.5 rounded-md border-l-[3px] border-amber-500 bg-amber-50 px-1.5 py-1 text-[12.5px] leading-snug text-amber-900">{children}</div>;
}

interface Launched {
  readonly link: string | null;
  readonly warning: string | null;
}

/**
 * Start: opens the confirmation; on confirm the server launches a new coordinator thread for the braid.
 * Off, with `Start: <reason>` in the tooltip, when T3 isn't reachable, the braid isn't To Do or a coordinator runs.
 */
function StartButton({ id, start, onLaunched }: { id: string; start: StartInfo; onLaunched?: (l: Launched) => void }) {
  const project = useContext(ProjectContext);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launched, setLaunched] = useState<Launched | null>(null);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const l = await postAction<Launched>("start", { project, id });
      setLaunched(l);
      onLaunched?.(l);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const reason = start.reason ?? (launched === null ? null : "a coordinator for this braid was just started");
  if (reason !== null) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {launched !== null && <small className="text-[11px] text-green-700">Coordinator started</small>}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="inline-flex" tabIndex={0} aria-label={`Start: ${reason}`}>
              <button type="button" disabled aria-label="Start" className={`${BUTTON} cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400`}>
                <StartIcon /> <Label>Start</Label>
              </button>
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">Start: {reason}</Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </span>
    );
  }
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Dialog.Trigger asChild>
            <button type="button" aria-label="Start" onClick={(e) => e.stopPropagation()} className={`${BUTTON} cursor-pointer border-blue-600 bg-blue-600 text-white hover:bg-blue-700`}>
              <StartIcon /> <Label>Start</Label>
            </button>
          </Dialog.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">Start: launch a coordinator</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <Dialog.Content onClick={(e) => e.stopPropagation()} className="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-xl">
          <Dialog.Title className="text-base font-semibold">Start braid {id}?</Dialog.Title>
          <Dialog.Description className="mb-3 text-slate-500">A new coordinator thread runs it.</Dialog.Description>
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-slate-500">Launches</dt>
            <dd>a new <b>coordinator thread</b> in T3 that runs the braid and starts its workers</dd>
            <dt className="text-slate-500">Model</dt>
            <dd>T3 project default{start.expected !== null && <>; BRAID.md names <code className="text-xs">{start.expected}</code></>}</dd>
            <dt className="text-slate-500">Base branch</dt>
            <dd><code className="break-all text-xs">{start.base}</code>{start.planned ? <> (the braid branch)</> : <> (the main branch; the item has no braid branch yet)</>}</dd>
          </dl>
          {error !== null && <p role="alert" className="mt-3 rounded-md border-l-[3px] border-red-600 bg-red-50 px-2.5 py-1.5 text-[13px] text-red-900">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1 hover:border-blue-600">Cancel</Dialog.Close>
            <button type="button" disabled={busy} onClick={() => void confirm()} className="flex cursor-pointer items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-3 py-1 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
              <StartIcon /> {busy ? "Starting…" : "Start coordinator"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const RetryIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v5h-5" />
  </svg>
);

/**
 * Resume now (0074/D): an icon-only button (▶, ↻ while a resume is pending) with its words in the tooltip, and a confirmation that
 * says what is sent. The server marks the records; the acting board sends through the one resume path.
 */
function ResumeButton({ tip, retry, title, sub, rows, foot, confirm, body }: { tip: string; retry: boolean; title: string; sub: string; rows: readonly (readonly [string, ReactNode])[]; foot: string; confirm: string; body: object }) {
  const project = useContext(ProjectContext);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await postAction("resume", { project, ...body });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Dialog.Trigger asChild>
            <button type="button" aria-label={tip} onClick={(e) => e.stopPropagation()} className={`${BUTTON} cursor-pointer border-sky-600 bg-sky-600 text-white hover:bg-sky-700`}>
              {retry ? <RetryIcon /> : <StartIcon />}
            </button>
          </Dialog.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">{tip}</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <Dialog.Content onClick={(e) => e.stopPropagation()} className="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-xl">
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mb-3 text-slate-500">{sub}</Dialog.Description>
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-slate-500">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-500">{foot}</p>
          {error !== null && <p role="alert" className="mt-3 rounded-md border-l-[3px] border-red-600 bg-red-50 px-2.5 py-1.5 text-[13px] text-red-900">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1 hover:border-blue-600">Cancel</Dialog.Close>
            <button type="button" disabled={busy} onClick={() => void go()} className="flex cursor-pointer items-center gap-1.5 rounded-md border border-sky-600 bg-sky-600 px-3 py-1 font-semibold text-white hover:bg-sky-700 disabled:cursor-wait disabled:opacity-60">
              {retry ? <RetryIcon /> : <StartIcon />} {busy ? "Sending…" : confirm}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** A paused braid's Resume now: directly without a PM, through the PM on a PM-run braid; ↻ while a send is pending. None on a hold. */
function BraidResume({ id, pause }: { id: string; pause: PauseView }) {
  const p = pause.record;
  const mode = resumeMode(p);
  if (mode === null) {
    return null;
  }
  const now = new Date();
  const r = p.resuming;
  const retry = r?.failedSince != null;
  const ask = mode !== "direct";
  const who = askWho(p);
  const tip = retry ? "Retry the resume now" : ask ? (r?.askedAt != null ? `Ask ${who} again to resume` : `Ask ${who} to resume`) : "Resume now";
  const agents = (p.targets ?? []).filter((t) => t.kind !== "pm");
  const rows: [string, ReactNode][] = [
    ["Paused for", `${usage(p)} since ${clockAt(p.at, now)}`],
    [
      "Sends to",
      ask ? (
        `${who}, one message`
      ) : (
        <>
          {agents.map((t) => (
            <div key={t.thread}>
              {t.item} {t.kind} · <code className="text-xs">{t.thread.slice(0, 12)}…</code>
            </div>
          ))}
        </>
      ),
    ],
    ["Then", ask ? `nothing else: ${who} resumes it with braid resume ${id} --limit` : `clears the board's record for ${id}`],
  ];
  return (
    <ResumeButton
      tip={tip}
      retry={retry}
      title={ask ? `Ask ${who} to resume ${id}?` : `Resume ${id} now?`}
      sub={retry ? `Resume pending since ${clockAt(r?.failedSince ?? p.at, now)}` : `Paused since ${clockAt(p.at, now)}`}
      rows={rows}
      foot={ask ? `${who === "the PM" ? "The PM" : "The coordinator"} gets one message naming the paused braid and the command that resumes it. A send T3 can't take is retried at each refresh.` : "Each thread gets its resume text by code, the same path as the board's timer and braid resume --limit. A thread T3 can't reach stays pending and is retried at each refresh."}
      confirm={ask ? `Ask ${who}` : retry ? "Retry now" : "Resume now"}
      body={{ braid: id }}
    />
  );
}

/** A paused programme's Resume now: one message asks the PM to resume its braids in its order. */
function ProgrammeResumeButton({ slug, resume }: { slug: string; resume: ProgrammeResume }) {
  const tip = resume.pending ? "Retry the resume now" : resume.askedAt !== null ? "Ask the PM again to resume" : "Ask the PM to resume";
  return (
    <ResumeButton
      tip={tip}
      retry={resume.pending}
      title={`Ask the PM to resume ${slug}?`}
      sub={`${resume.braids.length} braid${resume.braids.length === 1 ? "" : "s"} paused for a limit`}
      rows={[
        ["Paused braids", resume.braids.join(", ")],
        ["Sends to", "the PM, one message"],
      ]}
      foot="The PM resumes each with braid resume <number> --limit, in its order. A send T3 can't take is retried at each refresh."
      confirm="Ask the PM"
      body={{ programme: slug }}
    />
  );
}

/** Open thread where the item has a thread, Coordinator on a braid with a coordinator thread; Start on a To Do braid; Merge on In Review items. */
function Actions({ id, lane, thread, threadRole = null, coordinator = null, merge, start = null, onLaunched }: { id: string; lane: Lane; thread: string | null; threadRole?: ThreadRole | null; coordinator?: string | null; merge: MergeInfo | null; start?: StartInfo | null; onLaunched?: (l: Launched) => void }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 max-md:gap-2">
      <OpenThread id={id} link={thread} role={threadRole} />
      <OpenThread id={id} link={coordinator} coordinator />
      {start !== null && <StartButton id={id} start={start} {...(onLaunched === undefined ? {} : { onLaunched })} />}
      {(lane === "In Review" || (lane === "Waiting" && merge !== null)) && <MergeButton id={id} merge={merge} />}
    </span>
  );
}

/** Says which branch a card's state came from, when not from the checked-out files. */
function FromBranch({ branch }: { branch: string }) {
  return (
    <span className="block break-all font-mono text-[11px] text-slate-400" title="State read from this branch">
      from {branch}
    </span>
  );
}

/** A link to the item's PR; clicking it must not open the card. */
function PrLink({ pr }: { pr: PullRequest | null }) {
  if (pr === null) {
    return null;
  }
  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-xs text-blue-700 hover:underline"
      title={`Pull request #${pr.number}, ${pr.state}`}
    >
      PR #{pr.number}
    </a>
  );
}

function Card({ braid, details }: { braid: TaggedCard; details: boolean }) {
  const scope = useContext(ScopeContext);
  const [open, setOpen] = useState(false);
  const [launched, setLaunched] = useState<Launched | null>(null);
  const tier = braid.labels.filter((l) => l.startsWith("tier:"));
  const stale = scope.projects.get(braid.project)?.info.failure != null;
  return (
    <ProjectContext value={braid.project}>
    <div
      data-opens-details
      className={`mb-2 cursor-pointer rounded-lg border bg-white p-2.5 shadow-sm hover:border-blue-600 ${stale ? "border-dashed border-slate-300" : "border-slate-200"}`}
      onClick={() => go(braid.id, "brief", braid.project)}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500"><Id id={braid.id} /></span>
        {braid.status === "Outline" && <Badge tone="bg-amber-100 text-amber-800">Outline</Badge>}
        {tier.map((l) => (
          <Badge key={l}>{l}</Badge>
        ))}
        {scope.tagged && <ProjectTag name={braid.project} />}
        <PrLink pr={braid.pr} />
        <Marks marks={cardMarks(braid, details)} />
        <span className="flex-1" />
        {braid.total > 0 && (
          <button
            type="button"
            className="cursor-pointer text-xs text-slate-500"
            aria-expanded={open}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? "▾" : "▸"} strands
          </button>
        )}
      </div>
      <div className="my-1 font-semibold">{braid.title}</div>
      {braid.programme !== null && <div className="mb-1"><ProgrammeTag slug={braid.programme} /></div>}
      {braid.branch !== null && <FromBranch branch={braid.branch} />}
      {braid.total > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-200">
            <div className="h-full bg-green-600" style={{ width: `${(braid.done / braid.total) * 100}%` }} />
          </div>
          <span className="text-xs text-slate-500">
            {braid.done}/{braid.total}
          </span>
        </div>
      )}
      {details && !open && braid.need !== null && (braid.lane === "Waiting" || braid.lane === "In Review") && <NeedLine need={braid.need} braid={braid.total > 0 || braid.need.who !== null} />}
      {details && !open && braid.pmAsk !== null && braid.need?.by !== "pm" && <NeedLine need={braid.pmAsk} />}
      {details && !open && braid.pm !== null && <PmLine pm={braid.pm} />}
      {details && !open && braid.waits.map((w) => <WaitLine key={w.code} row={w} />)}
      {details && !open && braid.pause !== null && (braid.lane === "In Progress" || braid.lane === "To Do") && <PauseLine pause={braid.pause} />}
      {open && (
        <div className="mt-2 border-t border-dashed border-slate-200 pt-1">
          {braid.strands.map((s) => (
            <div
              key={s.id}
              data-opens-details
              className="flex flex-wrap items-center gap-1.5 py-1 text-[13px] hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                go(s.id, "brief", braid.project);
              }}
            >
              <LaneDot lane={s.lane} />
              <span className="w-14 flex-none text-xs text-slate-500"><Id id={s.id} /></span>
              <span className="flex-1">
                {s.title}
                {s.branch !== null && <FromBranch branch={s.branch} />}
              </span>
              <PrLink pr={s.pr} />
              <Marks marks={strandMarks(s, details)} />
              <span onClick={(e) => e.stopPropagation()}><Actions id={s.id} lane={s.lane} thread={s.thread} threadRole={s.threadRole} merge={s.merge} /></span>
              {details && s.need !== null && <NeedLine need={s.need} className="ml-[34px] basis-full" />}
              {details && s.pmAsk !== null && s.need?.by !== "pm" && <NeedLine need={s.pmAsk} className="ml-[34px] basis-full" />}
            </div>
          ))}
        </div>
      )}
      {(braid.coordinator?.warning ?? launched?.warning ?? null) !== null && <Warn>{braid.coordinator?.warning ?? launched?.warning}</Warn>}
      <div className="mt-2 flex min-h-6 items-center justify-end gap-1.5">
        {resumeOnCard(braid.pause, braid.lane) && <span onClick={(e) => e.stopPropagation()}><BraidResume id={braid.id} pause={braid.pause} /></span>}
        <Actions id={braid.id} lane={braid.total === 0 || braid.merge !== null ? braid.lane : "Done"} thread={braid.total === 0 ? braid.thread : null} threadRole={braid.threadRole} coordinator={braid.coordinator?.link ?? null} merge={braid.merge} start={braid.lane === "To Do" ? braid.start : null} onLaunched={setLaunched} />
      </div>
    </div>
    </ProjectContext>
  );
}

const SWEEP_DUE = 3;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`mt-1 flex-none text-slate-500 ${open ? "rotate-90" : ""}`}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** The header chip: the open counts; it opens the Inbox page. */
function InboxChip({ inbox, on }: { inbox: MergedInbox; on: boolean }) {
  const zero = inbox.leftovers.length === 0 && inbox.ideas.length === 0;
  return (
    <a
      href="#/inbox"
      title="Open the inbox: leftovers and ideas"
      className={`inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-0.5 text-xs no-underline hover:border-blue-600 ${on ? "border-blue-600" : "border-slate-200"} ${zero ? "text-slate-500" : "text-slate-900"}`}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-slate-500">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />
      </svg>
      Inbox <b>{inbox.leftovers.length}</b> leftovers <span className="text-slate-300">·</span> <b>{inbox.ideas.length}</b> ideas
    </a>
  );
}

/** A title with `code` spans. */
function Title({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/).map((p, i) => (p.startsWith("`") && p.length > 1 ? <code key={i} className="rounded bg-slate-100 px-1 font-mono text-[12px]">{p.slice(1, -1)}</code> : p))}</>;
}

/** Promote to Braid: opens the confirmation; on confirm the server launches a coordinator thread that plans a braid from the idea. */
function PromoteButton({ entry, expected, base, onLaunched }: { entry: InboxEntry; expected: string | null; base: string; onLaunched: () => void }) {
  const project = useContext(ProjectContext);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launched, setLaunched] = useState<(Launched & { base: string; branch: string }) | null>(null);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      setLaunched(await postAction<Launched & { base: string; branch: string }>("promote", { project, id: entry.id }));
      onLaunched();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const done = launched !== null;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <Dialog.Trigger asChild>
        <button type="button" aria-label={`Promote to Braid: ${entry.title}`} onClick={(e) => e.stopPropagation()} className={`${PROMOTE} cursor-pointer border-blue-600 bg-blue-600 text-white hover:bg-blue-700`}>
          <PromoteIcon /> Promote to Braid
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <Dialog.Content onClick={(e) => e.stopPropagation()} className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[480px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-xl">
          <Dialog.Title className="text-base font-semibold">{done ? "Coordinator started" : "Promote this idea to a braid?"}</Dialog.Title>
          <Dialog.Description className="mb-3 text-slate-500">{done ? "It is planning the braid in its own T3 thread." : "A new coordinator plans it; nothing starts until you approve the plan."}</Dialog.Description>
          {done ? (
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[13px] max-md:grid-cols-1">
              <dt className="text-slate-500">Branch</dt>
              <dd><code className="break-all text-xs">{launched.branch}</code> from <code className="text-xs">{launched.base}</code></dd>
              <dt className="text-slate-500">Next</dt>
              <dd>Open its thread and approve the plan there. The idea stays in the inbox until then.</dd>
            </dl>
          ) : (
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[13px] max-md:grid-cols-1">
              <dt className="text-slate-500">Idea</dt>
              <dd><b><Title text={entry.title} /></b></dd>
              <dt className="text-slate-500">Launches</dt>
              <dd>a new <b>coordinator thread</b> in T3 that plans a braid from this idea with the braid skill</dd>
              <dt className="text-slate-500">Then</dt>
              <dd>it asks you to approve the plan; after that it takes the idea out of the inbox. The idea stays here until then.</dd>
              <dt className="text-slate-500">Model</dt>
              <dd>T3 project default{expected !== null && <>; BRAID.md names <code className="text-xs">{expected}</code></>}</dd>
              <dt className="text-slate-500">Base branch</dt>
              <dd><code className="break-all text-xs">{base}</code>, branch <code className="break-all text-xs">coordinator/idea-{entry.id}</code></dd>
            </dl>
          )}
          {launched?.warning != null && <Warn>{launched.warning}</Warn>}
          {error !== null && <p role="alert" className="mt-3 rounded-md border-l-[3px] border-red-600 bg-red-50 px-2.5 py-1.5 text-[13px] text-red-900">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close className="min-h-8 cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1 hover:border-blue-600 max-md:min-h-11 max-md:flex-1">{done ? "Close" : "Cancel"}</Dialog.Close>
            {!done && (
              <button type="button" disabled={busy} onClick={() => void confirm()} className={`${PROMOTE} cursor-pointer border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60`}>
                <PromoteIcon /> {busy ? "Starting…" : "Promote to Braid"}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const PROMOTE = "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-0.5 text-[13px] font-semibold max-md:min-h-11 max-md:flex-1 max-md:px-4 max-md:text-sm";

const PromoteIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
  </svg>
);

/** An idea's actions: Promote to Braid, or "Being planned" with Open thread once a coordinator for it runs. */
function IdeaActions({ entry, expected, base }: { entry: InboxEntry; expected: string | null; base: string }) {
  const [started, setStarted] = useState(false);
  if (entry.planning !== null || started) {
    return (
      <span className="flex items-center gap-1.5 max-md:w-full max-md:gap-2">
        <span className="rounded-full bg-violet-50 px-2 text-xs text-violet-700">{entry.planning === null ? "Coordinator started" : "Being planned"}</span>
        {entry.planning !== null && <OpenThread id={entry.id} link={entry.planning.link} idea />}
      </span>
    );
  }
  return <PromoteButton entry={entry} expected={expected} base={base} onLaunched={() => setStarted(true)} />;
}

/** An inbox entry with the project it is from. */
type TaggedEntry = InboxEntry & { readonly project: string };

/** The open entries of the projects shown, each tagged with its project (`note` is the first project's, for its name). */
interface MergedInbox {
  readonly leftovers: readonly TaggedEntry[];
  readonly ideas: readonly TaggedEntry[];
  readonly notes: readonly string[];
}

function mergeInbox(infos: readonly ProjectInfo[]): MergedInbox {
  const tag = (project: string, list: readonly InboxEntry[]): TaggedEntry[] => list.map((e) => ({ ...e, project }));
  return {
    leftovers: infos.flatMap((i) => tag(i.name, i.inbox?.leftovers ?? [])),
    ideas: infos.flatMap((i) => tag(i.name, i.inbox?.ideas ?? [])),
    notes: infos.flatMap((i) => (i.inbox?.note == null ? [] : [i.inbox.note])),
  };
}

function InboxRow({ entry }: { entry: TaggedEntry }) {
  const scope = useContext(ScopeContext);
  const meta = scope.projects.get(entry.project)?.info.inbox;
  const expected = meta?.expected ?? null;
  const base = meta?.base ?? "origin/main";
  const [open, setOpen] = useState(false);
  const preview = entry.kind === "idea" ? entry.text.split("\n").find((l) => l.trim() !== "") ?? "" : "";
  return (
    <ProjectContext value={entry.project}>
    <div className="mb-2 rounded-lg border border-slate-200 bg-white shadow-sm" data-entry={entry.id}>
      <div className="flex items-start max-md:flex-wrap max-md:pb-2">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-lg bg-transparent px-2.5 py-2 text-left hover:bg-slate-50 max-md:basis-full">
          <Chevron open={open} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold"><Title text={entry.title} /></span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              {scope.tagged && <ProjectTag name={entry.project} />}
              {entry.kind === "leftover" && entry.from !== null && <span className="rounded-full bg-indigo-50 px-1.5 font-mono text-[11px] text-indigo-800"><Id id={entry.from} /></span>}
              {entry.passed > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[11px] text-amber-800" title="A sweep proposed it and you passed it over; at 2 it is dropped">passed over ×{entry.passed}</span>}
              {entry.age !== null && <span className="whitespace-nowrap">{entry.age} ago</span>}
            </span>
            {!open && preview !== "" && <span className="mt-0.5 line-clamp-2 block text-[13px] text-slate-600">{preview}</span>}
          </span>
        </button>
        {entry.kind === "idea" && (
          <span className="flex flex-none px-2.5 py-2 max-md:w-full max-md:py-0 max-md:pl-9">
            <IdeaActions entry={entry} expected={expected} base={base} />
          </span>
        )}
      </div>
      {open && (
        <div className="border-t border-dashed border-slate-200 py-2 pr-3 pl-8">
          <Md text={entry.text} empty="" />
          {entry.ref.length > 0 && <div className="mt-1 text-xs text-slate-500">Links: {entry.ref.join(" · ")}</div>}
          <div className="mt-1 text-xs text-slate-500">{entry.id}</div>
        </div>
      )}
    </div>
    </ProjectContext>
  );
}

function InboxColumn({ title, entries, note, empty }: { title: string; entries: readonly TaggedEntry[]; note?: string; empty: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-xl bg-slate-200/70 p-3">
      <h2 className="mb-2.5 flex items-baseline gap-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <span className="text-base text-slate-900">{entries.length}</span>
        {title}
        {note !== undefined && <small className="font-normal tracking-normal normal-case">{note}</small>}
      </h2>
      {entries.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-[13px] text-slate-500">{empty}</div> : entries.map((e) => <InboxRow key={`${e.project}/${e.id}`} entry={e} />)}
    </section>
  );
}

/** The inbox: the open leftovers and ideas. An idea can be promoted to a braid; nothing else is written here. */
function InboxPage({ inbox }: { inbox: MergedInbox }) {
  return (
    <main className="max-w-[1200px] px-7 py-5">
      <a href="#/" className="text-[13px] text-blue-600 no-underline">← Board</a>
      <h1 className="text-xl font-bold">Inbox</h1>
      <p className="mb-2 max-w-[80ch] text-slate-500">Small findings agents left behind, and ideas you wrote down. Nothing here needs an answer now: leftovers are swept in one batch; an idea waits until you promote it to a braid, which launches a coordinator that plans it.</p>
      <p className="mb-3 text-xs text-slate-500">
        Read from the local copy of <code>braid-inbox</code>; Refresh fetches the remote first.{inbox.notes.map((n) => <b key={n} className="ml-1 text-amber-700">{n}.</b>)}
      </p>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <InboxColumn
          title="Leftovers"
          entries={inbox.leftovers}
          {...(inbox.leftovers.length >= SWEEP_DUE ? { note: "· sweep due" } : {})}
          empty={<><b className="block text-slate-900">No open leftovers.</b>Agents add them with <code>braid note "…" --from &lt;item&gt;</code>. A sweep is proposed at {SWEEP_DUE}.</>}
        />
        <InboxColumn title="Ideas" entries={inbox.ideas} empty={<><b className="block text-slate-900">No ideas yet.</b>Write one down with <code>$braid-idea &lt;a sentence&gt;</code>.</>} />
      </div>
    </main>
  );
}

const SHORT_LABEL: Record<Lane, string> = { Waiting: "Needs you", "In Review": "Review", "In Progress": "Working", "To Do": "To Do", Done: "Done" };

/** Touches starting within this many px of the left or right screen edge are the browser's back and forward gestures, not swipes. */
const EDGE = 30;

/** The day a Done braid became Done, as "Nov 17"; empty when the date isn't known. */
const dayOf = (iso: string | null): string => (iso === null ? "" : new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }));

/**
 * The Done lane: collapsed by default; opened, the 10 newest braids as rows, newest first by the day they became
 * Done, and Show more for the next 10.
 */
function DoneLane({ cards, open, setOpen }: { cards: readonly TaggedCard[]; open: boolean; setOpen: (open: boolean) => void }) {
  const tagged = useContext(ScopeContext).tagged;
  const [shown, setShown] = useState(DONE_PAGE);
  const rows = doneNewestFirst(cards);
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-6 w-full cursor-pointer items-center gap-1 rounded-md px-1 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase max-md:min-h-11 md:hidden">
        <span aria-hidden>{open ? "▾" : "▸"}</span> {open ? "Hide" : "Show"} done
      </button>
      {open && (
        <button type="button" aria-expanded onClick={() => setOpen(false)} className="mb-1 flex min-h-6 w-full cursor-pointer items-center gap-1 rounded-md px-1 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase max-md:hidden">
          <span aria-hidden>▾</span> Hide done
        </button>
      )}
      {open && (
        <div>
          {rows.slice(0, shown).map((b) => (
            <button key={`${b.project}/${b.id}`} type="button" data-opens-details onClick={() => go(b.id, "brief", b.project)} className="flex w-full cursor-pointer flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-slate-300/60 px-1 py-1.5 text-left text-[13px] hover:underline max-md:min-h-11">
              <LaneDot lane="Done" />
              <span className="w-10 flex-none text-xs text-slate-500"><Id id={b.id} /></span>
              {tagged && <ProjectTag name={b.project} />}
              {b.programme !== null && <span title={`Run by the programme ${b.programme}`} aria-label={`programme ${b.programme}`} className="flex-none text-xs">🧭</span>}
              <span className="min-w-24 flex-1">{b.title}</span>
              <span className="ml-auto flex-none text-[11px] whitespace-nowrap text-slate-500">{dayOf(b.doneAt)}</span>
            </button>
          ))}
          {rows.length > shown && (
            <button type="button" onClick={() => setShown(shown + DONE_PAGE)} className="mt-2 w-full cursor-pointer rounded-md border border-slate-200 bg-white py-1.5 text-xs hover:border-blue-600 max-md:min-h-11 max-md:text-sm">
              Show more ({rows.length - shown})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The lanes. From `md` up all five stand side by side; on a phone a tab bar with counts shows one lane at a time
 * (Needs You first), and swiping left or right moves to the next or previous lane.
 */
function Board({ data, details }: { data: { readonly lanes: readonly Lane[]; readonly braids: readonly TaggedCard[] }; details: boolean }) {
  const [active, setActive] = useState<Lane>(data.lanes[0] ?? "Waiting");
  const [doneOpen, setDoneOpen] = useState(false);
  const stripped = !doneOpen && data.lanes.includes("Done");
  const touch = useRef<{ x: number; y: number } | null>(null);
  const move = (by: number) => {
    const next = data.lanes[data.lanes.indexOf(active) + by];
    if (next !== undefined) {
      setActive(next);
    }
  };
  return (
    <div>
      <div role="tablist" aria-label="Lanes" className="sticky top-0 z-10 flex border-b border-slate-200 bg-white md:hidden">
        {data.lanes.map((lane) => (
          <button
            key={lane}
            type="button"
            role="tab"
            aria-selected={lane === active}
            onClick={() => setActive(lane)}
            className={`flex min-h-12 flex-1 cursor-pointer flex-col items-center justify-center border-b-[3px] text-[11px] ${lane === active ? "border-amber-500 font-semibold text-slate-900" : "border-transparent text-slate-500"}`}
          >
            <b className="text-base text-slate-900">{data.braids.filter((b) => b.lane === lane).length}</b>
            {SHORT_LABEL[lane]}
          </button>
        ))}
      </div>
      <div
        className={`grid items-start gap-3 p-4 max-md:grid-cols-1 max-md:px-3.5 ${stripped ? "grid-cols-[repeat(4,minmax(0,1fr))_3rem]" : "grid-cols-5"}`}
        onTouchStart={(e) => {
          const t = e.touches[0];
          // A touch that starts at a screen edge is the browser's back or forward gesture, not a swipe.
          touch.current = t === undefined || t.clientX < EDGE || t.clientX > innerWidth - EDGE ? null : { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          const start = touch.current;
          if (start !== null && t !== undefined && Math.abs(t.clientX - start.x) > 60 && Math.abs(t.clientX - start.x) > 2 * Math.abs(t.clientY - start.y)) {
            move(t.clientX < start.x ? 1 : -1);
          }
          touch.current = null;
        }}
      >
        {data.lanes.map((lane) => {
          const cards = data.braids.filter((b) => b.lane === lane);
          if (lane === "Done" && stripped) {
            return (
              <section key={lane} aria-label={LANE_LABEL[lane]} className={`max-md:min-h-48 max-md:rounded-xl max-md:bg-slate-200/70 max-md:p-2.5 ${lane === active ? "" : "max-md:hidden"}`}>
                <button type="button" aria-expanded={false} onClick={() => setDoneOpen(true)} className="flex min-h-48 w-full cursor-pointer flex-col items-center gap-2 rounded-xl bg-slate-200/70 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-300/70 max-md:hidden">
                  <LaneDot lane={lane} />
                  <span>{cards.length}</span>
                  <span className="[writing-mode:vertical-rl]">{LANE_LABEL[lane]}</span>
                </button>
                <div className="md:hidden"><DoneLane cards={cards} open={false} setOpen={setDoneOpen} /></div>
              </section>
            );
          }
          return (
            <section key={lane} aria-label={LANE_LABEL[lane]} className={`min-h-48 rounded-xl bg-slate-200/70 p-2.5 ${lane === active ? "" : "max-md:hidden"}`}>
              <h3 className="mx-1 mb-2.5 mt-0.5 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 max-md:hidden">
                <span className="flex items-center gap-1.5"><LaneDot lane={lane} />{LANE_LABEL[lane]}</span>
                <span>{cards.length}</span>
              </h3>
              {lane === "Done" ? <DoneLane cards={cards} open={doneOpen} setOpen={setDoneOpen} /> : cards.map((b) => <Card key={`${b.project}/${b.id}`} braid={b} details={details} />)}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ item, tab }: { item: ItemDetail; tab: string }) {
  const project = useContext(ProjectContext);
  const rows: [string, string][] = [
    ["Stored status", item.status],
    ["Branch", item.branch ?? "working tree"],
    ["Delivery", item.delivery ?? "-"],
    ["Depends on", item.dependencies.length === 0 ? "-" : item.dependencies.join(", ")],
    ["Order", item.order === null ? "-" : String(item.order)],
    ["Folder", item.folder],
  ];
  const pr = item.pr;
  const strand = item.braid.strands.find((s) => s.id === item.id);
  const marks = strand === undefined ? cardMarks(item.braid) : strandMarks(strand);
  const trigger = "cursor-pointer border-b-2 border-transparent px-3.5 py-2 text-slate-500 data-[state=active]:border-blue-600 data-[state=active]:font-semibold data-[state=active]:text-slate-900";
  return (
    <div className="min-h-0 flex-1 overflow-auto px-7 py-5 max-md:px-4">
      <div className="text-xs text-slate-500"><Id id={item.id} /></div>
      <Dialog.Title className="mb-1.5 text-xl font-semibold">{item.title}</Dialog.Title>
      <div className="flex flex-wrap items-center gap-1.5">
        <LaneDot lane={item.lane} />
        <Badge>{LANE_LABEL[item.lane]}</Badge>
        <Marks marks={marks} />
        {item.labels.map((l) => (
          <Badge key={l} tone="bg-indigo-100 text-indigo-800">{l}</Badge>
        ))}
        <span className="flex-1" />
        <Actions id={item.id} lane={item.lane} thread={item.id.includes("/") || item.braid.total === 0 ? item.thread : null} threadRole={item.threadRole} coordinator={item.id.includes("/") ? null : item.braid.coordinator?.link ?? null} merge={item.merge} start={item.id.includes("/") ? null : item.braid.start} />
      </div>
      {!item.id.includes("/") && item.braid.coordinator?.warning != null && <Warn>{item.braid.coordinator.warning}</Warn>}
      {item.need !== null && (
        <div className={`my-3.5 max-w-[75ch] rounded-lg border-l-[3px] px-3.5 py-2.5 ${toneOf(item.need)}`}>
          <b className="mb-0.5 block text-xs uppercase tracking-wide">{item.lane === "In Review" ? "To review" : "Needs you"}{ageText(item.need) === "" ? "" : ` · ${ageText(item.need)}`}</b>
          {item.need.code !== undefined && <><CodeChip code={item.need.code} />{" "}</>}
          {item.need.text}
          {item.need.also !== undefined && <div className={`mt-2 rounded-md border-l-[3px] px-1.5 py-1 ${toneOf(item.need.also)}`}>{item.need.also.text}</div>}
          {item.need.code !== undefined && <div className="mt-2 flex flex-wrap items-center gap-1.5"><AskingLink link={item.need.asking ?? null} /><span className="text-[11px] text-slate-500">Say <b>{item.need.code}</b> in any thread to refer to it.</span></div>}
          <div className="mt-1.5 text-[11px] text-slate-500">{item.need.by === "pm" ? "Answer in the PM thread; the card leaves Needs You when the PM closes the request." : item.lane === "In Review" ? "Merge the PR, or ask the coordinator for changes." : item.need.kind === "limit" ? (item.need.text.startsWith("Pause failed") ? "Check which agents still run on the provider, then resume the braid." : "Wait for the reset, or move the role to another model in BRAID.md and resume the braid.") : "Answer in the coordinator thread; the card leaves Needs You when the coordinator acts."}</div>
        </div>
      )}
      {item.pmAsk !== null && item.need?.by !== "pm" && (
        <div className={`my-3.5 max-w-[75ch] rounded-lg border-l-[3px] px-3.5 py-2.5 ${toneOf(item.pmAsk)}`}>
          <b className="mb-0.5 block text-xs uppercase tracking-wide">Needs you · from the PM{ageText(item.pmAsk) === "" ? "" : ` · ${ageText(item.pmAsk)}`}</b>
          {item.pmAsk.code !== undefined && <><CodeChip code={item.pmAsk.code} />{" "}</>}
          {item.pmAsk.text}
          {item.pmAsk.code !== undefined && <div className="mt-2"><AskingLink link={item.pmAsk.asking ?? null} /></div>}
          <div className="mt-1.5 text-[11px] text-slate-500">Answer in the PM thread; the card leaves Needs You when the PM closes the request.</div>
        </div>
      )}
      {item.pm !== null && (
        <div role="note" className="my-3.5 max-w-[75ch] rounded-lg border-l-[3px] border-teal-700 bg-teal-50 px-3.5 py-2.5 text-teal-900">
          <b className="mb-0.5 block text-xs uppercase tracking-wide">{item.pm.forwarded === true ? "Asked of you through the PM" : "For the PM"} · {item.pm.age} ago</b>
          {item.pm.text}
          <div className="mt-1.5 text-[11px] text-slate-500">{item.pm.forwarded === true ? "The PM forwarded it: it comes to you from the PM's thread. Your own answer still wins." : "It comes to you if the PM doesn't answer in time or forwards it. Your own answer still wins."}</div>
        </div>
      )}
      {item.pause !== null && <PauseBox pause={item.pause} />}
      <dl className="my-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        {pr !== null && (
          <div className="contents">
            <dt className="text-slate-500">Pull request</dt>
            <dd>
              <PrLink pr={pr} /> <span className="text-slate-500">{pr.state}, checks {pr.checks}</span>
            </dd>
          </div>
        )}
      </dl>
      <Tabs.Root value={tab} onValueChange={(t) => go(item.id, t, project)}>
        <Tabs.List className="mb-3.5 flex gap-0.5 border-b border-slate-200">
          <Tabs.Trigger value="brief" className={trigger}>Brief</Tabs.Trigger>
          <Tabs.Trigger value="report" className={trigger}>Report</Tabs.Trigger>
          <Tabs.Trigger value="logs" className={trigger}>Logs ({item.logs.length})</Tabs.Trigger>
          <Tabs.Trigger value="requests" className={trigger}>Requests ({item.requests.open.length + item.requests.waiting.length + item.requests.closed.length})</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="brief"><Md text={item.brief} empty="This brief has no text." /></Tabs.Content>
        <Tabs.Content value="report"><Md text={item.report} empty="No report yet." /></Tabs.Content>
        <Tabs.Content value="logs"><Logs logs={item.logs} /></Tabs.Content>
        <Tabs.Content value="requests"><RequestsTab view={item.requests} /></Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

/** The details panel's pause: since when, the window and the resume, who paused it and how to resume by hand. */
function PauseBox({ pause }: { pause: PauseView }) {
  const box = pauseBox(pause, new Date());
  return (
    <div role="note" className={`my-3.5 max-w-[75ch] rounded-lg border-l-[3px] px-3.5 py-2.5 ${PAUSE_TONE[pause.state].box}`}>
      <b className="mb-0.5 block text-xs uppercase tracking-wide">{box.head}</b>
      {box.text}
      <div className="mt-1.5 text-[11px] text-slate-500">{box.foot}</div>
    </div>
  );
}

const REQUEST_STATE: Record<RequestRow["state"], { label: string; tone: string }> = {
  open: { label: "open", tone: "bg-amber-100 text-amber-800" },
  answered: { label: "answered", tone: "bg-green-100 text-green-800" },
  withdrawn: { label: "withdrawn", tone: "bg-slate-100 text-slate-600" },
  met: { label: "met", tone: "bg-violet-100 text-violet-800" },
};

const WHO: Record<string, string> = { user: "you", pm: "the PM", coordinator: "the coordinator", board: "the board" };

const when = (at: string): string => new Date(at).toLocaleString([], { dateStyle: "short", timeStyle: "short" });

/** One request: code, state (who answered), kind, the text, the answer or the reason, and the times. */
function RequestCard({ row }: { row: RequestRow }) {
  const end = row.closed;
  const state = REQUEST_STATE[row.state];
  const label = end !== null && row.state === "answered" ? `answered by ${WHO[end.by] ?? end.by}` : state.label;
  return (
    <div className="my-2 max-w-[75ch] rounded-lg border border-slate-200 px-3 py-2 text-[13.5px]">
      <div className="flex flex-wrap items-center gap-1.5">
        <CodeChip code={row.code} />
        <span className={`rounded-full px-2 py-px text-[11px] font-semibold ${state.tone}`}>{label}</span>
        <Badge>{row.kind}</Badge>
        {/^\d{4}$/.test(row.to) && <Badge>to braid {row.to}</Badge>}
        {row.to === "self" && <Badge>waiting until {untilText(row.doneWhen)}</Badge>}
        <span className="flex-1" />
        {end !== null ? <span className="text-xs text-slate-500">{when(end.at)}</span> : <AskingLink link={row.link} />}
      </div>
      <div className="mt-1">{row.text}</div>
      {end?.text != null && (
        <div className={`mt-1.5 rounded border-l-[3px] bg-slate-50 px-2 py-1 text-[13px] ${row.state === "answered" ? "border-green-600" : "border-slate-400 text-slate-700"}`}>
          {row.state !== "answered" && <b>{row.state === "met" ? "Met: " : `Withdrawn by ${WHO[end.by] ?? end.by}: `}</b>}
          {end.text}
        </div>
      )}
      {end?.reason != null && (
        <div className="mt-1.5 rounded border-l-[3px] border-slate-400 bg-slate-50 px-2 py-1 text-[13px] text-slate-700">
          <b>Reason:</b> {end.reason}
        </div>
      )}
      <div className="mt-1 text-[11.5px] text-slate-500">
        {row.item} · asked {when(row.at)}
        {row.state === "open" ? ` (${row.age} ago)` : ""} · {doneWhenText(row.doneWhen)}
        {row.note !== null && ` · forwarded: ${row.note}`}
        {row.state === "open" && row.eta !== null && <b className="font-semibold text-slate-700"> · expected by {when(row.eta)}{Date.parse(row.eta) <= Date.now() ? ", missed" : ""}</b>}
      </div>
      {row.history.length > 1 && <RequestHistory row={row} />}
    </div>
  );
}

/** An open request's opening, estimates and reminders, oldest first: who did what when. */
function RequestHistory({ row }: { row: RequestRow }) {
  // The estimate comes from the addressee: another braid's coordinator, or the PM.
  // The same words as `braid requests <code>`: the coordinator is named by its braid.
  const whoOf = (event: string, by: string): string => (by === "coordinator" ? (event === "eta" && /^\d{4}$/.test(row.to) ? `the ${row.to} coordinator` : `the ${row.item.slice(0, 4)} coordinator`) : (WHO[by] ?? by));
  return (
    <ul className="mt-1.5 list-none p-0 text-[12.5px] text-slate-700">
      {row.history.map((e, i) => (
        <li key={i} className="border-l-2 border-slate-200 py-0.5 pl-2.5">
          <span className="inline-block w-24 text-slate-500">{when(e.at)}</span>
          <b className="font-semibold">{e.event}</b>
          {e.event === "eta" && e.text !== null && ` ${when(e.text)}`} by {whoOf(e.event, e.by)}
          {e.event === "reminded" && e.text !== null && ` (${e.text})`}
          {e.reason !== null && `: ${e.reason}`}
        </li>
      ))}
    </ul>
  );
}

/** The Requests tab: open, waiting on another braid, then the closed ones newest first, ten at first. */
function RequestsTab({ view }: { view: RequestsView }) {
  const [shown, setShown] = useState(CLOSED_PAGE);
  const heading = (text: string) => <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{text}</h3>;
  if (view.open.length + view.waiting.length + view.closed.length === 0) {
    return <p className="text-slate-500">No requests yet.</p>;
  }
  return (
    <div>
      {view.open.length > 0 && <>{heading(`Open · ${view.open.length}`)}{view.open.map((r) => <RequestCard key={r.code} row={r} />)}</>}
      {view.waiting.length > 0 && <>{heading(`Waiting · ${view.waiting.length}`)}{view.waiting.map((r) => <RequestCard key={r.code} row={r} />)}</>}
      {view.closed.length > 0 && (
        <>
          {heading(`Closed · ${view.closed.length} · newest first`)}
          {view.closed.slice(0, shown).map((r) => <RequestCard key={r.code} row={r} />)}
          {view.closed.length > shown && (
            <button type="button" onClick={() => setShown(shown + CLOSED_PAGE)} className="cursor-pointer rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-blue-600">
              Show more ({view.closed.length - shown})
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Logs({ logs }: { logs: ItemDetail["logs"] }) {
  const [picked, setPicked] = useState(0);
  const log = logs[picked];
  if (log === undefined) {
    return <p className="text-slate-500">No logs yet.</p>;
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {logs.map((l, i) => (
          <button
            key={l.name}
            type="button"
            onClick={() => setPicked(i)}
            className={`cursor-pointer rounded-full px-2.5 py-px text-xs ${i === picked ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            {l.name.replace(/^log-|\.md$/g, "")}
          </button>
        ))}
      </div>
      <Md text={log.text} empty="This log is empty." />
    </div>
  );
}

/** The braid's contents, a rail beside the details: the braid, its brief and one row per strand. */
function Contents({ braid, current }: { braid: BraidCard; current: string }) {
  const project = useContext(ProjectContext);
  const row = (id: string, label: ReactNode, title: string, strand: StrandCard | null) => (
    <button
      key={id}
      type="button"
      onClick={() => go(id, "brief", project)}
      className={`mt-0.5 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left hover:bg-slate-100 ${strand !== null ? "ml-3.5 w-[calc(100%-0.875rem)]" : "w-full"} ${current === id ? "bg-indigo-100 font-semibold" : ""}`}
    >
      {strand !== null && <LaneDot lane={strand.lane} />}
      <span className="min-w-0 flex-1 truncate" title={title}>{label}</span>
      {strand !== null && <Marks marks={strandMarks(strand)} />}
    </button>
  );
  return (
    <nav aria-label={`${braid.id} ${braid.title}`} className="overflow-y-auto overflow-x-hidden border-r border-slate-200 bg-slate-50 p-3.5 max-md:max-h-[34vh] max-md:border-b max-md:border-r-0 max-md:p-3">
      <h2 className="text-[15px] font-semibold"><Id id={braid.id} /> {braid.title}</h2>
      <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
        <LaneDot lane={braid.lane} />
        {LANE_LABEL[braid.lane]}
        <Marks marks={cardMarks(braid)} />
      </div>
      {row(braid.id, "Braid brief", "Braid brief", null)}
      {braid.strands.map((x) => row(x.id, <span><Id id={x.id} /> · {x.title}</span>, `${x.id} · ${x.title}`, x))}
    </nav>
  );
}

/**
 * The item's details: a panel over the right of the board (the whole screen below md). The board
 * stays mounted underneath; Esc, the close button, a click on the board and Back close it.
 */
function DetailsPanel({ id, tab, project, unknown = null, tick }: { id: string; tab: string; project: string; unknown?: string | null; tick: Tick }) {
  const scope = useContext(ScopeContext);
  const fetched = useItem(id, unknown === null ? project : null, tick);
  const served = [...scope.projects.keys()];
  const loaded: Loaded<ItemDetail> = unknown === null ? fetched : { state: "error", message: `No such project: ${unknown}. This board serves ${served.join(", ")}.` };
  const failure = scope.projects.get(project)?.info;
  return (
    <ProjectContext value={project}>
    <Dialog.Root open modal={false} onOpenChange={(open) => { if (!open) closeDetails(); }}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // A click on another card opens it; a click on a layer above (a confirm dialog) is not outside.
            if (e.target instanceof Element && e.target.closest("[data-opens-details], [role=dialog], [role=tooltip]") !== null) {
              e.preventDefault();
            }
          }}
          className="fixed bottom-0 right-0 top-[45px] z-40 flex w-[min(100vw,max(720px,min(70vw,1200px)))] flex-col border-l border-slate-200 bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)] max-md:inset-0 max-md:w-auto max-md:border-0"
        >
          <div className="flex flex-none items-center gap-2 border-b border-slate-200 px-7 py-2 max-md:px-4">
            <button type="button" onClick={closeDetails} className="cursor-pointer text-[13px] text-blue-700 md:hidden">← Board</button>
            {scope.several && unknown === null && <ProjectTag name={project} />}
            <span className="flex-1" />
            <Dialog.Close aria-label="Close details" title="Close (Esc)" className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-base hover:border-blue-600 max-md:size-11">✕</Dialog.Close>
          </div>
          {scope.several && failure?.failure != null && (
            <div role="note" className="flex-none border-b border-red-200 bg-red-50 px-7 py-1.5 text-xs text-red-800 max-md:px-4">
              <b>{project}: the latest read failed</b> ({failure.failure}). This is its board as of {ageOf(failure.ageMs) === "" ? "never" : `${ageOf(failure.ageMs)} ago`}; actions may be refused until a read succeeds.
            </div>
          )}
          <Status loaded={loaded}>
            {(item) => (
              <div className={`grid min-h-0 flex-1 ${item.braid.strands.length > 0 ? "grid-cols-[280px_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[auto_minmax(0,1fr)]" : ""}`}>
                {item.braid.strands.length > 0 && <Contents braid={item.braid} current={id} />}
                <Detail key={item.id} item={item} tab={tab} />
              </div>
            )}
          </Status>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </ProjectContext>
  );
}

/** The Details setting: whether cards show the line saying what is needed. On by default, kept in a cookie. */
function useDetails(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => !/(?:^|; )details=off/.test(document.cookie));
  return [on, (value) => {
    document.cookie = `details=${value ? "on" : "off"}; max-age=31536000; path=/; samesite=lax`;
    setOn(value);
  }];
}

const OPEN_KEY = "braid-projects-open";

/** Whether the desktop Projects block is open: closed until clicked, then remembered in this browser (local storage). */
function useProjectsOpen(): [boolean, (on: boolean) => void] {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(OPEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  return [open, (on) => {
    try {
      localStorage.setItem(OPEN_KEY, on ? "1" : "0");
    } catch {
      // Private mode: the state still holds for this page.
    }
    setOpen(on);
  }];
}

type Tone = "ok" | "nr" | "fail" | "none";

/** What a project's line says about it: ready, not ready, a failed read (with how old its board is), or not read yet. */
function readiness(info: ProjectInfo): { tone: Tone; text: string; age: string } {
  const age = ageOf(info.ageMs);
  if (info.failure !== null) {
    return { tone: "fail", text: "Read failed", age: info.readAt === null ? "no board yet" : `board is ${age} old` };
  }
  if (info.problems.length > 0) {
    return { tone: "nr", text: `Not ready · ${info.problems.length} problem${info.problems.length === 1 ? "" : "s"}`, age: age === "" ? "" : `read ${age} ago` };
  }
  if (info.readAt === null) {
    return { tone: "none", text: "Not read yet", age: "" };
  }
  return { tone: "ok", text: "Ready", age: `read ${age} ago` };
}

const TONE: Record<Tone, string> = { ok: "text-green-800", nr: "text-amber-800", fail: "font-semibold text-red-800", none: "text-slate-500" };
const TONE_MARK: Record<Tone, string> = { ok: "✓", nr: "▲", fail: "✕", none: "…" };
const LANES_ORDER: readonly Lane[] = ["Waiting", "In Review", "In Progress", "To Do", "Done"];

function ReadinessText({ info }: { info: ProjectInfo }) {
  const r = readiness(info);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs md:whitespace-nowrap ${TONE[r.tone]}`}>
      <span aria-hidden>{TONE_MARK[r.tone]}</span>
      {r.text}
      {r.age !== "" && <span className="font-normal text-slate-500">· {r.age}</span>}
    </span>
  );
}

/** The five lane counts of a project. */
function LaneCounts({ info }: { info: ProjectInfo }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {LANES_ORDER.map((lane) => (
        <span key={lane} className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 text-[11.5px] ${info.counts[lane] === 0 ? "text-slate-400" : "text-slate-800"}`}>
          <LaneDot lane={lane} />
          <b>{info.counts[lane]}</b> {SHORT_LABEL[lane].toLowerCase()}
        </span>
      ))}
    </span>
  );
}

/** The boxes under a project's line: a failed read and its readiness problems. */
function ProjectNotes({ info }: { info: ProjectInfo }) {
  return (
    <>
      {info.failure !== null && (
        <div role="note" className="mb-1.5 ml-9 rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800 max-md:ml-2">
          <b>The latest read of {info.name} failed:</b> {info.failure}. {info.readAt === null ? "No board has been read yet." : `Showing the board read ${ageOf(info.ageMs)} ago; its cards have a dashed edge.`} The board retries every 30 s.
        </div>
      )}
      {info.problems.length > 0 && (
        <div role="note" aria-label={`${info.name} is not ready for braid`} className="mb-1.5 ml-9 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 max-md:ml-2">
          <b>{info.name} is not ready for braid.</b> The board shows what it can read.
          <ul className="mt-1 list-disc pl-5">
            {info.problems.map((p) => (
              <li key={p.key}>
                {p.reason}: {p.todo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** One project's line: tick it to show it, "only" to show just it. */
function ProjectLine({ info, index, on, onToggle, onOnly, big = false }: { info: ProjectInfo; index: number; on: boolean; onToggle: () => void; onOnly: () => void; big?: boolean }) {
  const c = colourOf(index);
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-1.5 py-1 ${on ? "" : "opacity-55"} ${big ? "min-h-14" : "min-h-8"}`}>
      <label className="flex min-w-[9rem] cursor-pointer items-center gap-2 font-bold">
        <input type="checkbox" checked={on} onChange={onToggle} className={big ? "size-5" : "size-4"} />
        <span className={`size-2.5 flex-none rounded-full ${c.dot}`} />
        {info.name}
      </label>
      <LaneCounts info={info} />
      <span className="flex-1" />
      <ReadinessText info={info} />
      <button type="button" onClick={onOnly} className={`cursor-pointer text-xs text-blue-700 ${big ? "min-h-11 px-2 text-sm font-semibold" : ""}`} aria-label={`Show only ${info.name}`}>only</button>
    </div>
  );
}

/** The projects with something to say: a failed read or a readiness problem. */
const troubled = (infos: readonly ProjectInfo[]) => infos.filter((i) => i.failure !== null || i.problems.length > 0);

/**
 * The project filter. On a desktop a block that starts as one summary line (always naming a failed read or a project that
 * isn't ready) and opens to one line per project; on a phone a picker above the lanes that opens a sheet.
 */
function ProjectsBar({ infos, selected, onSelect }: { infos: readonly ProjectInfo[]; selected: readonly string[]; onSelect: (next: string[]) => void }) {
  const served = infos.map((i) => i.name);
  const [open, setOpen] = useProjectsOpen();
  const [sheet, setSheet] = useState(false);
  const bad = troubled(infos);
  const toggle = (name: string) => onSelect(toggleProject(selected, name, served));
  return (
    <>
      <section aria-label="Projects" className="border-b border-slate-200 bg-white px-5 py-1.5 max-md:hidden">
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-7 flex-1 cursor-pointer flex-wrap items-center gap-x-3 gap-y-0.5 text-left">
            <b className="text-slate-900">Projects</b>
            <span>{selected.length} of {infos.length} shown</span>
            {bad.map((i) => (
              <span key={i.name} data-problem={i.name} className={`inline-flex items-center gap-1.5 ${TONE[readiness(i).tone]} ${selected.includes(i.name) ? "" : "opacity-60"}`}>
                <span className={`size-2 rounded-full ${colourOf(served.indexOf(i.name)).dot}`} />
                {i.name}: {i.failure !== null ? "read failed" : "not ready"}
              </span>
            ))}
            <span className="flex-1" />
            <span className="text-blue-700">{open ? "▾ Hide projects" : "▸ Show projects"}</span>
          </button>
          {open && selected.length < infos.length && (
            <button type="button" onClick={() => onSelect([...served])} className="cursor-pointer text-blue-700">Show all</button>
          )}
        </div>
        {open && (
          <div className="mt-1 border-t border-slate-100 pt-1">
            {infos.map((info, index) => (
              <div key={info.name}>
                <ProjectLine info={info} index={index} on={selected.includes(info.name)} onToggle={() => toggle(info.name)} onOnly={() => onSelect([info.name])} />
                <ProjectNotes info={info} />
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="md:hidden">
        <Dialog.Root open={sheet} onOpenChange={setSheet}>
          <Dialog.Trigger asChild>
            <button type="button" aria-label="Choose projects" className="mx-3.5 mt-2.5 flex min-h-12 w-[calc(100%-1.75rem)] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-[15px] font-bold">
              <span className="flex gap-0.5">
                {selected.map((n) => <span key={n} className={`size-2.5 rounded-full ${colourOf(served.indexOf(n)).dot}`} />)}
              </span>
              {selected.length === infos.length ? "All projects" : selected.join(" + ")}
              <span className="ml-auto text-[13px] font-normal text-slate-500">{selected.length} of {infos.length} ▾</span>
            </button>
          </Dialog.Trigger>
          {bad.filter((i) => selected.includes(i.name)).map((i) => (
            <div key={i.name} role="note" className={`mx-3.5 mt-2 rounded-lg border-l-[3px] px-2.5 py-1.5 text-[12.5px] ${i.failure !== null ? "border-red-600 bg-red-50 text-red-800" : "border-amber-500 bg-amber-50 text-amber-900"}`}>
              <b>{i.name}:</b> {i.failure !== null ? (i.readAt === null ? "read failed, no board yet" : `read failed, its board is ${ageOf(i.ageMs)} old`) : `not ready for braid · ${i.problems.length} problem${i.problems.length === 1 ? "" : "s"}`}
            </div>
          ))}
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
            <Dialog.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white pb-4 shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300" />
              <div className="flex items-center justify-between px-5 pt-2">
                <Dialog.Title className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Projects</Dialog.Title>
                {selected.length < infos.length && <button type="button" onClick={() => onSelect([...served])} className="min-h-11 cursor-pointer text-[13px] font-semibold text-blue-700">Show all</button>}
              </div>
              <div className="px-3">
                {infos.map((info, index) => (
                  <div key={info.name} className="border-t border-slate-100 first:border-0">
                    <ProjectLine info={info} index={index} big on={selected.includes(info.name)} onToggle={() => toggle(info.name)} onOnly={() => onSelect([info.name])} />
                    <ProjectNotes info={info} />
                  </div>
                ))}
              </div>
              <Dialog.Close className="mx-5 mt-3 block min-h-12 w-[calc(100%-2.5rem)] cursor-pointer rounded-xl bg-blue-700 text-[15px] font-semibold text-white">
                Show {selected.length === infos.length ? "all" : selected.length} project{selected.length === 1 ? "" : "s"}
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}

// ---- Programmes (docs/board.md, "Programmes"): the panel left of the lanes, its rail, the filter, the details, the phone strip.

const PANEL_KEY = "braid-programmes-open";

/** Whether the programmes panel is open (not the rail): open until collapsed, then remembered in this browser (local storage). */
function usePanelOpen(): [boolean, (on: boolean) => void] {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(PANEL_KEY) !== "0";
    } catch {
      return true;
    }
  });
  return [open, (on) => {
    try {
      localStorage.setItem(PANEL_KEY, on ? "1" : "0");
    } catch {
      // not remembered: still applied
    }
    setOpen(on);
  }];
}

/** The programme filter of the page: the key `?programme=` narrows the lanes to, and the setter (null shows all). */
const FilterContext = createContext<{ readonly key: string | null; readonly set: (key: string | null) => void }>({ key: null, set: () => {} });

/** Opens a programme's details over the board, as `go` opens an item's. */
function goProgramme(key: string): void {
  const target = programmeHash(key);
  if (openMode(location.hash) === "push") {
    pushedOpen = true;
    location.hash = target;
  } else {
    location.replace(target);
  }
}

/** Needs you first (oldest ask first, across projects), then Working in project order, then slug. */
function programmeOrder(list: readonly TaggedProgramme[], order: ReadonlyMap<string, number>): { needs: TaggedProgramme[]; working: TaggedProgramme[] } {
  const live = list.filter((p) => p.section !== null);
  const needs = live.filter((p) => p.section === "needs").sort((a, b) => (a.need?.since ?? "").localeCompare(b.need?.since ?? ""));
  const working = live.filter((p) => p.section === "working").sort((a, b) => (order.get(a.project) ?? 0) - (order.get(b.project) ?? 0) || a.slug.localeCompare(b.slug));
  return { needs, working };
}

/** The PM thread button: the server opens the thread (`open` with the programme's slug); on a phone or over Tailscale the app link. */
function PmThread({ p, big = false, icon = false }: { p: TaggedProgramme; big?: boolean; icon?: boolean }) {
  const remoteBoard = useContext(RemoteContext);
  const [error, setError] = useState<string | null>(null);
  if (p.link === null) {
    return null;
  }
  const app = t3codeUrl(p.link);
  const look = `inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border bg-white px-2 py-0.5 text-[12.5px] hover:border-blue-600 ${error === null ? "border-teal-600 text-teal-800" : "border-red-600 text-red-700"} ${big ? "min-h-11 flex-1 text-[15px] font-semibold" : "max-md:min-h-11"}`;
  const label = icon ? "" : big ? "Open PM thread" : "PM thread";
  return (
    <>
      {app !== null && (
        <a href={app} onClick={(e) => e.stopPropagation()} aria-label="Open the PM thread in the T3 app" title="Open the PM thread in the T3 app" className={`${look} no-underline ${remoteBoard ? "" : "md:hidden"}`}>
          <span aria-hidden>🧭</span> {label}
        </a>
      )}
      {!remoteBoard && (
        <button
          type="button"
          aria-label="Open the PM thread in T3"
          title={error ?? "Open the PM thread in T3"}
          onClick={(e) => {
            e.stopPropagation();
            setError(null);
            postAction("open", { project: p.project, programme: p.slug }).catch((err: unknown) => setError(err instanceof Error ? err.message : "failed"));
          }}
          className={`${look} cursor-pointer ${app === null ? "" : "max-md:hidden"}`}
        >
          <span aria-hidden>🧭</span> {label}
        </button>
      )}
    </>
  );
}

/** ◎ Only these: narrows the lanes to the programme's braids; pressed again (or Show all) it shows every braid. */
function OnlyThese({ p, short = false, icon = false }: { p: TaggedProgramme; short?: boolean; icon?: boolean }) {
  const filter = useContext(FilterContext);
  const on = filter.key === p.key;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Show every braid" : `Only the braids of ${p.slug}`}
      title={on ? "Show every braid again" : "Show only this programme's braids in the lanes"}
      onClick={(e) => {
        e.stopPropagation();
        filter.set(on ? null : p.key);
      }}
      className={`inline-flex cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[12.5px] max-md:min-h-11 max-md:min-w-11 ${on ? "border-teal-700 bg-teal-700 font-semibold text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-600"}`}
    >
      <span aria-hidden>◎</span> {icon ? "" : short ? "Only" : "Only these"}
      {on && !short && <span aria-hidden> · ✕</span>}
    </button>
  );
}

/** The text of a PM request as lines: `A. …`, `B. …` options become a list. */
function optionLines(text: string): { head: string; options: string[] } {
  const parts = text.split(/\s+(?=[A-H]\.\s)/);
  return { head: parts[0] ?? "", options: parts.slice(1) };
}

/** A programme's need: the PM's request with its options, or the stall with what the board saw. */
function ProgrammeNeed({ p }: { p: TaggedProgramme }) {
  return (
    <>
      {p.need !== null && <OneNeed p={p} need={p.need} />}
      {p.forwards.map((f) => (
        <OneNeed key={f.id} p={p} need={f.need} item={f.id} />
      ))}
    </>
  );
}

function OneNeed({ p, need, item }: { p: TaggedProgramme; need: Need; item?: string }) {
  if (need.kind === "stalled") {
    return (
      <div className="mt-1.5 rounded-md border-l-[3px] border-amber-500 bg-amber-50 px-2 py-1.5 text-[13px] leading-snug text-amber-950">
        <b>⏳ Stalled:</b> the PM stopped and none of its braids is running
        <small className="mt-0.5 block text-[11px] text-slate-500">{p.seen ?? ""} · for {need.age ?? "?"} · wake it in the PM thread</small>
      </div>
    );
  }
  const words = /^(The PM asks you(?: to)?:)\s*(.*)$/s.exec(need.text);
  const { head, options } = optionLines(words?.[2] ?? need.text);
  return (
    <div className="mt-1.5 rounded-md border-l-[3px] border-amber-500 bg-amber-50 px-2 py-1.5 text-[13px] leading-snug text-amber-950">
      {need.code !== undefined && <><CodeChip code={need.code} />{" "}</>}
      <b>{words?.[1] ?? "The PM asks you:"}</b> {head}
      {need.code !== undefined && <AskingLink link={need.asking ?? null} />}
      {options.length > 0 && (
        <ul className="mt-0.5 list-none pl-1">
          {options.map((o) => (
            <li key={o} className="pl-4 -indent-4">{o}</li>
          ))}
        </ul>
      )}
      <small className="mt-0.5 block text-[11px] text-slate-500">{item === undefined ? "programme" : `from ${item}`} · {ageText(need)} · answer in the PM thread</small>
    </div>
  );
}

/** The mark at the top right of a programme card: ? asks, ⏳ stalled, ⏸ held. */
function ProgrammeMark({ p }: { p: TaggedProgramme }) {
  if (p.need !== null || p.forwards.length > 0) {
    return (
      <span title={p.need?.kind === "stalled" ? "Stalled" : "The PM asks you"} className="flex size-5 flex-none items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
        {p.need?.kind === "stalled" ? "⏳" : "?"}
      </span>
    );
  }
  return p.hold !== null ? <span title="Held" className="flex size-5 flex-none items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">⏸</span> : null;
}

/** One programme in the panel. */
function ProgrammeCard({ p }: { p: TaggedProgramme }) {
  const scope = useContext(ScopeContext);
  const filter = useContext(FilterContext);
  const dim = filter.key !== null && filter.key !== p.key;
  const on = filter.key === p.key;
  const tone = p.section === "needs" ? "border-amber-400 bg-amber-50/40" : "border-slate-200 bg-white";
  return (
    <div data-programme={p.key} className={`mb-2 rounded-lg border p-2.5 shadow-sm ${tone} ${on ? "ring-2 ring-teal-600" : ""} ${dim ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-1.5">
        {scope.tagged && <ProjectTag name={p.project} />}
        <button type="button" data-opens-details onClick={() => goProgramme(p.key)} className="flex min-w-0 cursor-pointer items-center gap-1 font-semibold hover:underline">
          <span aria-hidden>🧭</span>
          <span className="truncate">{p.slug}</span>
        </button>
        <span className="flex-1" />
        <ProgrammeMark p={p} />
      </div>
      {p.goal !== null && <div className="mt-0.5 text-xs leading-snug text-slate-500">{p.goal}</div>}
      {p.error !== null && <div className="mt-1.5 rounded-md border-l-[3px] border-red-600 bg-red-50 px-2 py-1 text-xs text-red-900">{p.error}</div>}
      <ProgrammeNeed p={p} />
      {p.error === null && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-200">
            <div className="h-full bg-green-600" style={{ width: `${p.total === 0 ? 0 : (p.done / p.total) * 100}%` }} />
          </div>
          <span className="text-xs whitespace-nowrap text-slate-500">
            {p.done}/{p.total} done · {p.running} running
          </span>
        </div>
      )}
      {p.error === null && p.hold !== null && (
        <div className={`mt-1.5 rounded-md border-l-[3px] px-2 py-1 text-[12.5px] leading-snug ${p.resume?.pending === true ? "border-amber-500 bg-amber-50 text-amber-900" : "border-sky-600 bg-sky-50 text-sky-900"}`}>
          ⏸ {p.status}
          {p.resume !== null && <small className="mt-px block text-[11px] text-slate-500">{p.resume.note}</small>}
        </div>
      )}
      {p.error === null && p.hold === null && <div className="mt-1 text-[13px] leading-snug text-slate-700">{p.need?.kind === "stalled" ? "No braid running" : p.status}</div>}
      <div className="mt-2 flex flex-wrap gap-1">
        <PmThread p={p} />
        <OnlyThese p={p} />
        <button type="button" data-opens-details onClick={() => goProgramme(p.key)} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[12.5px] text-slate-700 hover:border-blue-600 max-md:min-h-11">
          <span aria-hidden>≡</span> Plan
        </button>
        {p.error === null && p.resume !== null && (
          <>
            <span className="flex-1" />
            <ProgrammeResumeButton slug={p.slug} resume={p.resume} />
          </>
        )}
      </div>
    </div>
  );
}

function SectionHead({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <h3 className="mx-1 mb-1.5 mt-3 flex items-center justify-between text-xs font-semibold tracking-wide text-slate-500 uppercase">
      <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${tone}`} />{label}</span>
      <span>{count}</span>
    </h3>
  );
}

/** The desktop panel left of the lanes: Needs you and Working, or (collapsed) the rail of icons. */
function ProgrammesPanel({ list }: { list: readonly TaggedProgramme[] }) {
  const scope = useContext(ScopeContext);
  const [open, setOpen] = usePanelOpen();
  const order = new Map([...scope.projects].map(([name, { index }]) => [name, index]));
  const { needs, working } = programmeOrder(list, order);
  if (!open) {
    return (
      <aside aria-label="Programmes" className="flex w-14 flex-none flex-col items-center gap-1.5 self-stretch border-r border-slate-200 bg-white py-3 max-md:hidden">
        <button type="button" aria-label="Open the programmes panel" title="Open the programmes panel" onClick={() => setOpen(true)} className="mb-1 flex size-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-xs hover:border-blue-600">»</button>
        {needs.length > 0 && <span className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Needs</span>}
        {needs.map((p) => <RailIcon key={p.key} p={p} />)}
        {working.length > 0 && <span className="mt-2 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Work</span>}
        {working.map((p) => <RailIcon key={p.key} p={p} />)}
      </aside>
    );
  }
  return (
    <aside aria-label="Programmes" className="w-80 flex-none self-stretch border-r border-slate-200 bg-white px-3 py-3 max-md:hidden">
      <div className="mb-1 flex items-center gap-2">
        <span aria-hidden>🧭</span>
        <b className="text-[15px]">Programmes</b>
        <span className="text-xs text-slate-500">{needs.length + working.length}</span>
        <span className="flex-1" />
        <button type="button" aria-label="Collapse the programmes panel" title="Collapse to icons" onClick={() => setOpen(false)} className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-xs hover:border-blue-600">«</button>
      </div>
      <SectionHead label="Needs you" count={needs.length} tone="bg-amber-500" />
      {needs.length === 0 ? <p className="mx-1 text-xs text-slate-500">No programme needs you.</p> : needs.map((p) => <ProgrammeCard key={p.key} p={p} />)}
      <SectionHead label="Working" count={working.length} tone="bg-teal-700" />
      {working.length === 0 ? <p className="mx-1 text-xs text-slate-500">No other programme.</p> : working.map((p) => <ProgrammeCard key={p.key} p={p} />)}
    </aside>
  );
}

/** One programme on the rail: amber with ? or ⏳ when it needs you, else 🧭 (⏸ held); its project's colour dot; the name in the tooltip. */
function RailIcon({ p }: { p: TaggedProgramme }) {
  const scope = useContext(ScopeContext);
  const c = colourOf(scope.projects.get(p.project)?.index ?? 0);
  const needs = p.section === "needs";
  const tip = `${scope.several ? `${p.project}/` : ""}${p.slug}${needs ? (p.need?.kind === "stalled" ? ": stalled" : ": the PM asks you") : p.hold !== null ? ": on hold" : ""}`;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button type="button" data-opens-details aria-label={tip} onClick={() => goProgramme(p.key)} className={`relative flex size-9 cursor-pointer items-center justify-center rounded-lg border text-base ${needs ? "border-amber-400 bg-amber-100 text-amber-900" : "border-slate-200 bg-white"} hover:border-blue-600`}>
          <span aria-hidden>{needs ? (p.need?.kind === "stalled" ? "⏳" : "?") : p.hold !== null ? "⏸" : "🧭"}</span>
          {scope.several && <span className={`absolute bottom-0.5 left-0.5 size-2 rounded-full ${c.dot}`} />}
          {needs && <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">1</span>}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="right" sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">{tip}</Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** The teal bar above the lanes while a programme filter is on. */
function FilterBar({ p, count }: { p: TaggedProgramme; count: number }) {
  const filter = useContext(FilterContext);
  return (
    <div role="status" className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-teal-600 bg-teal-50 px-3 py-2 text-[13px] text-teal-950 max-md:hidden">
      <span aria-hidden>🧭</span>
      <span>
        Showing only the braids of <b className="mx-1">{p.key}</b> ({count}). Your other braids are hidden, and lane counts follow.
      </span>
      <span className="flex-1" />
      <button type="button" onClick={() => filter.set(null)} className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-0.5 text-xs hover:border-blue-600">Show all</button>
    </div>
  );
}

/** The phone: a strip above the lane tabs that opens like a drawer, then the filter chip. */
function PhoneProgrammes({ list }: { list: readonly TaggedProgramme[] }) {
  const scope = useContext(ScopeContext);
  const filter = useContext(FilterContext);
  const [open, setOpen] = useState(false);
  const order = new Map([...scope.projects].map(([name, { index }]) => [name, index]));
  const { needs, working } = programmeOrder(list, order);
  const filtered = list.find((p) => p.key === filter.key);
  if (needs.length + working.length === 0 && filtered === undefined) {
    return null;
  }
  return (
    <div className="px-3.5 pt-3 md:hidden">
      <div className={`rounded-xl border ${needs.length > 0 && !open ? "border-amber-400 bg-amber-50" : "border-teal-600 bg-teal-50"}`}>
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-12 w-full cursor-pointer items-center gap-2 px-3.5 text-left">
          <span aria-hidden className="text-lg">🧭</span>
          {open && <b className="text-[15px] text-teal-900">Programmes</b>}
          <span className={open ? "text-xs text-slate-500" : "text-[15px]"}>
            {needs.length > 0 ? <b className={open ? "font-normal" : "text-amber-950"}>{needs.length} needs you</b> : <b>none needs you</b>}
            <span className="text-slate-500"> · {working.length} working</span>
          </span>
          <span className="flex-1" />
          <span aria-hidden className="text-xs text-slate-500">{open ? "▴" : "▾"}</span>
        </button>
        {open && (
          <div className="px-2.5 pb-2.5">
            {needs.map((p) => (
              <div key={p.key} className="mb-2 rounded-lg border border-amber-400 bg-white p-2.5">
                <div className="flex items-center gap-1.5">
                  {scope.tagged && <ProjectTag name={p.project} />}
                  <button type="button" data-opens-details onClick={() => goProgramme(p.key)} className="cursor-pointer font-semibold">🧭 {p.slug}</button>
                  <span className="flex-1" />
                  <ProgrammeMark p={p} />
                </div>
                <ProgrammeNeed p={p} />
                <div className="mt-2 flex gap-2">
                  <PmThread p={p} big />
                  <OnlyThese p={p} short />
                </div>
              </div>
            ))}
            {working.map((p) => {
              const c = colourOf(scope.projects.get(p.project)?.index ?? 0);
              return (
                <div key={p.key} className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                  {scope.several && <span className={`size-2 flex-none rounded-full ${c.dot}`} />}
                  <button type="button" data-opens-details onClick={() => goProgramme(p.key)} className="min-w-0 flex-1 cursor-pointer text-left">
                    <b className="block truncate">{p.hold !== null ? "⏸ " : "🧭 "}{p.slug}</b>
                    <span className="block truncate text-xs text-slate-500">{scope.several ? `${p.project} · ` : ""}{p.hold !== null ? "on hold" : `${p.running} running · ${p.done}/${p.total} done`}</span>
                  </button>
                  <PmThread p={p} icon />
                  <OnlyThese p={p} icon />
                </div>
              );
            })}
          </div>
        )}
      </div>
      {filtered !== undefined && (
        <div className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-teal-700 bg-white px-3.5">
          <span className={`size-2 rounded-full ${colourOf(scope.projects.get(filtered.project)?.index ?? 0).dot}`} />
          <span className="text-slate-500">Only:</span>
          <b>🧭 {filtered.slug}</b>
          <span className="flex-1" />
          <button type="button" aria-label="Show every braid" onClick={() => filter.set(null)} className="flex size-11 cursor-pointer items-center justify-center text-lg text-slate-600">✕</button>
        </div>
      )}
    </div>
  );
}

const ROW_TONE: Readonly<Record<string, string>> = { done: "text-slate-500", running: "text-slate-700", "waiting on user": "font-semibold text-amber-800", "ready to merge": "text-violet-800", planned: "text-slate-500", stopped: "text-slate-500", dropped: "text-slate-400 line-through" };

const DetailHead = ({ children }: { children: ReactNode }) => <h4 className="mb-1 mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">{children}</h4>;

const clock = (iso: string): string => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** A programme's details over the right of the board (`#/programme/<project>/<slug>`): what the plan's front matter holds. */
function ProgrammeDetails({ name, list }: { name: string; list: readonly TaggedProgramme[] }) {
  const scope = useContext(ScopeContext);
  const p = list.find((x) => x.key === name);
  return (
    <Dialog.Root open modal={false} onOpenChange={(open) => { if (!open) closeDetails(); }}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (e.target instanceof Element && e.target.closest("[data-opens-details], [role=dialog], [role=tooltip]") !== null) {
              e.preventDefault();
            }
          }}
          className="fixed bottom-0 right-0 top-[45px] z-40 flex w-[min(100vw,max(640px,min(48vw,900px)))] flex-col border-l border-slate-200 bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)] max-md:inset-0 max-md:w-auto max-md:border-0"
        >
          <div className="flex flex-none flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-2 max-md:px-4">
            <button type="button" onClick={closeDetails} className="cursor-pointer text-[13px] text-blue-700 md:hidden">← Board</button>
            <Dialog.Title className="flex items-center gap-1.5 text-[17px] font-bold"><span aria-hidden>🧭</span>{p?.slug ?? name}</Dialog.Title>
            {p !== undefined && scope.several && <ProjectTag name={p.project} />}
            <span className="flex-1" />
            {p !== undefined && <PmThread p={p} />}
            {p !== undefined && <OnlyThese p={p} />}
            <Dialog.Close aria-label="Close details" title="Close (Esc)" className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-base hover:border-blue-600 max-md:size-11">✕</Dialog.Close>
          </div>
          {p === undefined ? (
            <p className="m-6 rounded-lg bg-red-50 p-4 text-red-800">No programme {name} on this board.</p>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto px-5 py-3 max-md:px-4">
              <ProgrammeNeed p={p} />
              {p.error !== null && (
                <div className="my-2 rounded-md border-l-[3px] border-red-600 bg-red-50 px-2 py-1.5 text-[13px] text-red-900">
                  {p.error}. Fix it with <code>braid check --plan pm/{p.slug}.md</code> on {p.branch}.
                </div>
              )}
              {p.goal !== null && <DetailHead>Goal, in your words</DetailHead>}
              {p.goal !== null && <p>“{p.goal}”</p>}
              {p.rows.length > 0 && <DetailHead>Plan</DetailHead>}
              {p.rows.map((r) => (
                <button
                  key={r.row}
                  type="button"
                  data-opens-details
                  disabled={r.braid === null}
                  onClick={() => {
                    if (r.braid !== null) {
                      go(r.braid, "brief", p.project);
                    }
                  }}
                  className="flex w-full items-center gap-2 border-b border-slate-200 py-1.5 text-left text-[13.5px] enabled:cursor-pointer enabled:hover:underline max-md:min-h-11"
                >
                  <span className="w-8 flex-none text-xs text-slate-500">{r.row}</span>
                  {r.lane !== null ? <LaneDot lane={r.lane} /> : <span aria-hidden className="size-2 flex-none rounded-full border border-dashed border-slate-400" />}
                  {r.braid !== null && <b className="flex-none">{r.braid}</b>}
                  <span className="min-w-0 flex-1">{r.title}</span>
                  <span className={`flex-none text-xs ${ROW_TONE[r.state] ?? "text-slate-500"}`}>{r.state}</span>
                </button>
              ))}
              {p.next !== null && <DetailHead>Next</DetailHead>}
              {p.next !== null && <p>{p.next}</p>}
              {p.handling.length > 0 && <DetailHead>The PM is handling</DetailHead>}
              {p.handling.length > 0 && <p>{p.handling.join(" · ")}</p>}
              {p.error === null && <DetailHead>Last digest · parallel limit · hold</DetailHead>}
              {p.error === null && (
                <p>
                  {p.digest ?? "no digest yet"} · {p.limit === null ? "no limit recorded" : `limit ${p.limit}`}, {p.running} running · {p.hold === null ? "no hold" : `held since ${clock(p.hold.since)}${p.hold.words === "" ? "" : `: “${p.hold.words}”`}`}
                </p>
              )}
              <p className="mt-3 inline-block rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">Plan file pm/{p.slug}.md on {p.branch}</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The 🧭 tag on a card of a braid a programme runs. */
function ProgrammeTag({ slug }: { slug: string }) {
  return (
    <span title={`Run by the programme ${slug}`} className="inline-flex items-center gap-1 rounded-full border border-teal-600 bg-white px-1.5 text-[11px] text-teal-800">
      <span aria-hidden>🧭</span>
      {slug}
    </span>
  );
}

/**
 * The address's filters: the projects shown (`?projects=`, every project without it) and the programme the lanes are
 * narrowed to (`?programme=<project>/<slug>`), each rewritten in the address without a history entry when changed. A
 * programme whose project isn't shown, or that the board doesn't know, is dropped from the address once the board is read.
 */
function useFilters(served: readonly string[], keys: readonly string[] | null): { selected: string[]; setSelected: (next: string[]) => void; programme: string | null; setProgramme: (key: string | null) => void } {
  const [search, setSearch] = useState(location.search);
  useEffect(() => {
    const onChange = () => setSearch(location.search);
    addEventListener("popstate", onChange);
    return () => removeEventListener("popstate", onChange);
  }, []);
  const write = (query: string) => {
    history.replaceState(null, "", `${location.pathname}${query}${location.hash}`);
    setSearch(query);
  };
  const selected = parseFilter(search, served);
  const programme = keys === null ? null : parseProgramme(search, keys, selected);
  const asked = new URLSearchParams(search).get("programme");
  useEffect(() => {
    if (keys !== null && asked !== null && programme === null) {
      write(programmeSearch(search, null));
    } else if (programme !== null && asked !== programme) {
      write(programmeSearch(search, programme)); // `?programme=<slug>` on a one-project board, written in full
    }
  });
  return {
    selected,
    setSelected: (next) => {
      const keep = programme !== null && next.includes(programme.slice(0, programme.indexOf("/"))) ? programme : null;
      write(programmeSearch(filterSearch(next, served), keep));
    },
    programme,
    setProgramme: (key) => write(programmeSearch(search, key)),
  };
}

export function App() {
  const route = useRoute();
  const [details, setDetails] = useDetails();
  const { tick, refresh } = useTick();
  const all = useAll(tick);
  const infos = all.state === "ready" ? all.data.projects : [];
  const served = infos.map((i) => i.name);
  const keys = all.state === "ready" ? all.data.programmes.map((p) => p.key) : null;
  const { selected, setSelected, programme, setProgramme } = useFilters(served, keys);
  const several = infos.length > 1;
  severalProjects = several;
  const scope: Scope = {
    projects: new Map(infos.map((info, index) => [info.name, { info, index }])),
    several,
    tagged: several && selected.length > 1,
  };
  const shown = infos.filter((i) => selected.includes(i.name));
  const programmes = all.state === "ready" ? all.data.programmes.filter((p) => selected.includes(p.project)) : [];
  const only = programmes.find((p) => p.key === programme) ?? null;
  const board = all.state === "ready" ? { lanes: all.data.lanes, braids: all.data.braids.filter((b) => selected.includes(b.project) && (only === null || (b.project === only.project && only.braids.includes(b.id)))) } : null;
  const panel = programmes.some((p) => p.section !== null) || only !== null;
  const inbox = mergeInbox(shown);
  // One project served keeps the page as it was: its notes in the header, its problems in a banner.
  const single = infos.length === 1 ? infos[0] : undefined;
  const notes = shown.flatMap((i) => (i.t3?.state === "unavailable" ? [`T3 unavailable (${i.t3.reason})${several ? ` for ${i.name}` : ""}: no agent states`] : []));
  const pauseNotes = shown.filter((i) => i.pausesNote !== null);
  const resolved = resolveProject(route.project, selected, served);
  const limits = all.state === "ready" && all.data.limits !== null && all.data.limits.providers.length > 0 ? all.data.limits : null;
  const [limitsOpen, setLimitsOpen] = useState(false);
  const toggleLimits = () => setLimitsOpen(!limitsOpen);
  const now = new Date();
  return (
    <RemoteContext value={all.state !== "ready" || all.data.remote}>
    <ScopeContext value={scope}>
    <FilterContext value={{ key: programme, set: setProgramme }}>
    <Tooltip.Provider>
      <div className="min-h-screen bg-slate-100 text-sm text-slate-900">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 bg-white px-5 py-2.5">
          <b className="text-base" title="Each braid sits in the lane where it needs you most.">braid · attention board</b>
          {single !== undefined && <span className="text-slate-500 max-md:hidden">Each braid sits in the lane where it needs you most. · {single.repo} · braids/</span>}
          {several && <span className="text-slate-500 max-md:hidden">Each braid sits in the lane where it needs you most.</span>}
          <span className="flex-1" />
          {limits !== null && <LimitChips view={limits} now={now} onOpen={toggleLimits} />}
          {all.state === "ready" && <InboxChip inbox={inbox} on={route.inbox} />}
          <label className="flex cursor-pointer items-center gap-1.5 text-xs" title="Show the line on each card saying what is needed; off moves the text into the icon's tooltip">
            <input type="checkbox" checked={details} onChange={(e) => setDetails(e.target.checked)} /> Details
          </label>
          <span className="text-xs text-slate-500">
            {pauseNotes.map((i) => (
              <b key={i.name} title={i.pausesNote ?? ""} className="text-amber-700">.braid/pauses.json{several ? ` of ${i.name}` : ""} could not be read: no pauses shown · </b>
            ))}
            {notes.length > 0 ? `${notes.join(" · ")} · ` : ""}refreshes every 30 s
          </span>
          <button
            type="button"
            onClick={refresh}
            className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 hover:border-blue-600"
          >
            Refresh
          </button>
        </header>
        {limits !== null && <LimitsStrip view={limits} now={now} onOpen={toggleLimits} />}
        {limitsOpen && limits !== null && <LimitsPanel view={limits} now={now} onClose={() => setLimitsOpen(false)} />}
        {several && <ProjectsBar infos={infos} selected={selected} onSelect={setSelected} />}
        {single !== undefined && single.problems.length > 0 && (
          <div role="note" aria-label="This project is not ready for braid" className="border-b border-amber-300 bg-amber-50 px-5 py-2 text-xs text-amber-900">
            <b>This project is not ready for braid.</b> The board shows what it can read.
            <ul className="mt-1 list-disc pl-5">
              {single.problems.map((p) => (
                <li key={p.key}>
                  {p.reason}: {p.todo}
                </li>
              ))}
            </ul>
          </div>
        )}
        {single !== undefined && single.failure !== null && (
          <div role="note" aria-label="The latest read failed" className="border-b border-red-300 bg-red-50 px-5 py-2 text-xs text-red-800">
            <b>The latest read failed:</b> {single.failure}. {single.readAt === null ? "No board has been read yet." : `This is the board read ${ageOf(single.ageMs)} ago.`}
          </div>
        )}
        {route.inbox ? (
          <Status loaded={all}>{() => <InboxPage inbox={inbox} />}</Status>
        ) : (
          <Status loaded={all}>
            {() =>
              board === null ? null : (
                <div className="flex items-stretch">
                  {panel && <ProgrammesPanel list={programmes} />}
                  <div className="min-w-0 flex-1">
                    {panel && <PhoneProgrammes list={programmes} />}
                    {only !== null && <FilterBar p={only} count={board.braids.length} />}
                    <Board data={board} details={details} />
                  </div>
                </div>
              )
            }
          </Status>
        )}
        {route.programme !== null && all.state === "ready" && <ProgrammeDetails name={route.programme} list={all.data.programmes} />}
        {route.id !== null && resolved !== null && all.state === "ready" && <DetailsPanel id={route.id} tab={route.tab} project={"name" in resolved ? resolved.name : ""} unknown={"unknown" in resolved ? resolved.unknown : null} tick={tick} />}
      </div>
    </Tooltip.Provider>
    </FilterContext>
    </ScopeContext>
    </RemoteContext>
  );
}
