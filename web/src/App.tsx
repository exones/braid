import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog, Tabs, Tooltip } from "radix-ui";
import { ROLES } from "../../src/braids/roles.ts";
import { Md } from "./Md.tsx";
import { LANE_LABEL, ageText, cardMarks, splitId, strandMarks, t3codeUrl, threadEmoji, type Marks } from "../../src/board/marks.ts";
import { closeMode, hashFor, openMode, parseHash, pushedAfter, type Route } from "../../src/board/route.ts";
import { DONE_PAGE, doneNewestFirst } from "../../src/board/model.ts";
import { postAction, useBoard, useItem, useTick, type MergeInfo, type StartInfo, type Tick, type BoardData, type InboxData, type InboxEntry, type BraidCard, type ItemDetail, type Lane, type Loaded, type Need, type PullRequest, type ThreadRole, type StrandCard } from "./api.ts";

/** Whether the open details were pushed as a history entry (so closing can go back) or arrived with the page. */
let pushedOpen = false;

/** Opens an item's details. From the bare board it adds a history entry; inside open details it replaces, so one Back closes them. */
export function go(id: string, tab = "brief"): void {
  const target = hashFor(id, tab);
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

const toneOf = (need: Need): string => NEED_TONE[need.kind === "review" ? "review" : need.kind === "checks failed" || need.kind === "stalled" ? "bad" : "wait"];

/** One line saying what the user needs to do, with its age; on a braid card also which strand it comes from. */
function NeedLine({ need, braid = false, className = "" }: { need: Need; braid?: boolean; className?: string }) {
  const parts = [
    braid && need.more > 0 ? `+${need.more} more in strands` : null,
    braid ? (need.who === null ? "braid, no strand involved" : `strand ${need.who}`) : null,
    ageText(need) === "" ? null : ageText(need),
  ].filter((p) => p !== null);
  return (
    <div className={`mt-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-[12.5px] leading-snug ${toneOf(need)} ${className}`}>
      {need.text}
      {parts.length > 0 && <small className="mt-px block text-[11px] text-slate-500">{parts.join(" · ")}</small>}
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
            postAction("open", idea ? { idea: id } : coordinator ? { id, thread: "coordinator" } : { id }).catch((err: unknown) => setError(err instanceof Error ? err.message : "failed"));
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asked, setAsked] = useState(readAsked);
  const sent = merge?.head == null ? undefined : asked[id]?.head === merge.head ? asked[id] : undefined;
  const reason = merge === null ? "no open review request" : sent !== undefined ? `asked the coordinator at ${sent.at}; waiting for it to merge` : merge.reason;
  const confirm = async () => {
    if (merge?.head == null) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await postAction("merge", { id, head: merge.head });
      const next = { ...readAsked(), [id]: { head: merge.head, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } };
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launched, setLaunched] = useState<Launched | null>(null);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const l = await postAction<Launched>("start", { id });
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

/** Open thread where the item has a thread, Coordinator on a braid with a coordinator thread; Start on a To Do braid; Merge on In Review items. */
function Actions({ id, lane, thread, threadRole = null, coordinator = null, merge, start = null, onLaunched }: { id: string; lane: Lane; thread: string | null; threadRole?: ThreadRole | null; coordinator?: string | null; merge: MergeInfo | null; start?: StartInfo | null; onLaunched?: (l: Launched) => void }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 max-md:gap-2">
      <OpenThread id={id} link={thread} role={threadRole} />
      <OpenThread id={id} link={coordinator} coordinator />
      {start !== null && <StartButton id={id} start={start} {...(onLaunched === undefined ? {} : { onLaunched })} />}
      {lane === "In Review" && <MergeButton id={id} merge={merge} />}
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

function Card({ braid, details }: { braid: BraidCard; details: boolean }) {
  const [open, setOpen] = useState(false);
  const [launched, setLaunched] = useState<Launched | null>(null);
  const tier = braid.labels.filter((l) => l.startsWith("tier:"));
  return (
    <div
      data-opens-details
      className="mb-2 cursor-pointer rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm hover:border-blue-600"
      onClick={() => go(braid.id)}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500"><Id id={braid.id} /></span>
        {braid.status === "Outline" && <Badge tone="bg-amber-100 text-amber-800">Outline</Badge>}
        {tier.map((l) => (
          <Badge key={l}>{l}</Badge>
        ))}
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
      {open && (
        <div className="mt-2 border-t border-dashed border-slate-200 pt-1">
          {braid.strands.map((s) => (
            <div
              key={s.id}
              data-opens-details
              className="flex flex-wrap items-center gap-1.5 py-1 text-[13px] hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                go(s.id);
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
            </div>
          ))}
        </div>
      )}
      {(braid.coordinator?.warning ?? launched?.warning ?? null) !== null && <Warn>{braid.coordinator?.warning ?? launched?.warning}</Warn>}
      <div className="mt-2 flex min-h-6 justify-end">
        <Actions id={braid.id} lane={braid.total === 0 || braid.merge !== null ? braid.lane : "Done"} thread={braid.total === 0 ? braid.thread : null} threadRole={braid.threadRole} coordinator={braid.coordinator?.link ?? null} merge={braid.merge} start={braid.lane === "To Do" ? braid.start : null} onLaunched={setLaunched} />
      </div>
    </div>
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
function InboxChip({ inbox, on }: { inbox: InboxData; on: boolean }) {
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launched, setLaunched] = useState<(Launched & { base: string; branch: string }) | null>(null);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      setLaunched(await postAction<Launched & { base: string; branch: string }>("promote", { id: entry.id }));
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

function InboxRow({ entry, expected, base }: { entry: InboxEntry; expected: string | null; base: string }) {
  const [open, setOpen] = useState(false);
  const preview = entry.kind === "idea" ? entry.text.split("\n").find((l) => l.trim() !== "") ?? "" : "";
  return (
    <div className="mb-2 rounded-lg border border-slate-200 bg-white shadow-sm" data-entry={entry.id}>
      <div className="flex items-start max-md:flex-wrap max-md:pb-2">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-lg bg-transparent px-2.5 py-2 text-left hover:bg-slate-50 max-md:basis-full">
          <Chevron open={open} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold"><Title text={entry.title} /></span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
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
  );
}

function InboxColumn({ title, entries, note, empty, expected, base }: { title: string; entries: readonly InboxEntry[]; note?: string; empty: ReactNode; expected: string | null; base: string }) {
  return (
    <section aria-label={title} className="rounded-xl bg-slate-200/70 p-3">
      <h2 className="mb-2.5 flex items-baseline gap-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <span className="text-base text-slate-900">{entries.length}</span>
        {title}
        {note !== undefined && <small className="font-normal tracking-normal normal-case">{note}</small>}
      </h2>
      {entries.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-[13px] text-slate-500">{empty}</div> : entries.map((e) => <InboxRow key={e.id} entry={e} expected={expected} base={base} />)}
    </section>
  );
}

/** The inbox: the open leftovers and ideas. An idea can be promoted to a braid; nothing else is written here. */
function InboxPage({ inbox, expected, base }: { inbox: InboxData; expected: string | null; base: string }) {
  return (
    <main className="max-w-[1200px] px-7 py-5">
      <a href="#/" className="text-[13px] text-blue-600 no-underline">← Board</a>
      <h1 className="text-xl font-bold">Inbox</h1>
      <p className="mb-2 max-w-[80ch] text-slate-500">Small findings agents left behind, and ideas you wrote down. Nothing here needs an answer now: leftovers are swept in one batch; an idea waits until you promote it to a braid, which launches a coordinator that plans it.</p>
      <p className="mb-3 text-xs text-slate-500">
        Read from the local copy of <code>braid-inbox</code>; Refresh fetches the remote first.{inbox.note !== null && <b className="ml-1 text-amber-700">{inbox.note}.</b>}
      </p>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <InboxColumn
          expected={expected}
          base={base}
          title="Leftovers"
          entries={inbox.leftovers}
          {...(inbox.leftovers.length >= SWEEP_DUE ? { note: "· sweep due" } : {})}
          empty={<><b className="block text-slate-900">No open leftovers.</b>Agents add them with <code>braid note "…" --from &lt;item&gt;</code>. A sweep is proposed at {SWEEP_DUE}.</>}
        />
        <InboxColumn expected={expected} base={base} title="Ideas" entries={inbox.ideas} empty={<><b className="block text-slate-900">No ideas yet.</b>Write one down with <code>$braid-idea &lt;a sentence&gt;</code>.</>} />
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
function DoneLane({ cards }: { cards: readonly BraidCard[] }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(DONE_PAGE);
  const rows = doneNewestFirst(cards);
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-6 w-full cursor-pointer items-center gap-1 rounded-md px-1 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase max-md:min-h-11">
        <span aria-hidden>{open ? "▾" : "▸"}</span> {open ? "Hide" : "Show"} done
      </button>
      {open && (
        <div>
          {rows.slice(0, shown).map((b) => (
            <button key={b.id} type="button" data-opens-details onClick={() => go(b.id)} className="flex w-full cursor-pointer items-center gap-2 border-b border-slate-300/60 px-1 py-1.5 text-left text-[13px] hover:underline max-md:min-h-11">
              <LaneDot lane="Done" />
              <span className="w-10 flex-none text-xs text-slate-500"><Id id={b.id} /></span>
              <span className="min-w-0 flex-1">{b.title}</span>
              <span className="flex-none text-[11px] whitespace-nowrap text-slate-500">{dayOf(b.doneAt)}</span>
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
function Board({ data, details }: { data: BoardData; details: boolean }) {
  const [active, setActive] = useState<Lane>(data.lanes[0] ?? "Waiting");
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
        className="grid grid-cols-5 items-start gap-3 p-4 max-md:grid-cols-1 max-md:px-3.5"
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
          return (
            <section key={lane} aria-label={LANE_LABEL[lane]} className={`min-h-48 rounded-xl bg-slate-200/70 p-2.5 ${lane === active ? "" : "max-md:hidden"}`}>
              <h3 className="mx-1 mb-2.5 mt-0.5 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 max-md:hidden">
                <span className="flex items-center gap-1.5"><LaneDot lane={lane} />{LANE_LABEL[lane]}</span>
                <span>{cards.length}</span>
              </h3>
              {lane === "Done" ? <DoneLane cards={cards} /> : cards.map((b) => <Card key={b.id} braid={b} details={details} />)}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ item, tab }: { item: ItemDetail; tab: string }) {
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
          {item.need.text}
          <div className="mt-1.5 text-[11px] text-slate-500">{item.lane === "In Review" ? "Merge the PR, or ask the coordinator for changes." : "Answer in the coordinator thread; the card leaves Needs You when the coordinator acts."}</div>
        </div>
      )}
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
      <Tabs.Root value={tab} onValueChange={(t) => go(item.id, t)}>
        <Tabs.List className="mb-3.5 flex gap-0.5 border-b border-slate-200">
          <Tabs.Trigger value="brief" className={trigger}>Brief</Tabs.Trigger>
          <Tabs.Trigger value="report" className={trigger}>Report</Tabs.Trigger>
          <Tabs.Trigger value="logs" className={trigger}>Logs ({item.logs.length})</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="brief"><Md text={item.brief} empty="This brief has no text." /></Tabs.Content>
        <Tabs.Content value="report"><Md text={item.report} empty="No report yet." /></Tabs.Content>
        <Tabs.Content value="logs"><Logs logs={item.logs} /></Tabs.Content>
      </Tabs.Root>
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
  const row = (id: string, label: ReactNode, title: string, strand: StrandCard | null) => (
    <button
      key={id}
      type="button"
      onClick={() => go(id)}
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
function DetailsPanel({ id, tab, tick }: { id: string; tab: string; tick: Tick }) {
  const loaded = useItem(id, tick);
  return (
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
            <span className="flex-1" />
            <Dialog.Close aria-label="Close details" title="Close (Esc)" className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-base hover:border-blue-600 max-md:size-11">✕</Dialog.Close>
          </div>
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

export function App() {
  const route = useRoute();
  const [details, setDetails] = useDetails();
  const { tick, refresh } = useTick();
  const board = useBoard(tick);
  const notes =
    board.state === "ready"
      ? [
          // Unreadable GitHub is a readiness problem, shown once in the banner below.
          board.data.t3.state === "unavailable" ? `T3 unavailable (${board.data.t3.reason}): no agent states` : null,
        ].filter((n) => n !== null)
      : [];
  return (
    <RemoteContext value={board.state !== "ready" || board.data.remote}>
    <Tooltip.Provider>
      <div className="min-h-screen bg-slate-100 text-sm text-slate-900">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 bg-white px-5 py-2.5">
          <b className="text-base" title="Each braid sits in the lane where it needs you most.">braid · attention board</b>
          {board.state === "ready" && <span className="text-slate-500 max-md:hidden">Each braid sits in the lane where it needs you most. · {board.data.repo} · braids/</span>}
          <span className="flex-1" />
          {board.state === "ready" && <InboxChip inbox={board.data.inbox} on={route.inbox} />}
          <label className="flex cursor-pointer items-center gap-1.5 text-xs" title="Show the line on each card saying what is needed; off moves the text into the icon's tooltip">
            <input type="checkbox" checked={details} onChange={(e) => setDetails(e.target.checked)} /> Details
          </label>
          <span className="text-xs text-slate-500">
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
        {board.state === "ready" && board.data.problems.length > 0 && (
          <div role="note" aria-label="This project is not ready for braid" className="border-b border-amber-300 bg-amber-50 px-5 py-2 text-xs text-amber-900">
            <b>This project is not ready for braid.</b> The board shows what it can read.
            <ul className="mt-1 list-disc pl-5">
              {board.data.problems.map((p) => (
                <li key={p.key}>
                  {p.reason}: {p.todo}
                </li>
              ))}
            </ul>
          </div>
        )}
        {route.inbox ? (
          <Status loaded={board}>{(data) => <InboxPage inbox={data.inbox} expected={data.inbox.expected ?? null} base={data.inbox.base ?? "origin/main"} />}</Status>
        ) : (
          <Status loaded={board}>{(data) => <Board data={data} details={details} />}</Status>
        )}
        {route.id !== null && <DetailsPanel id={route.id} tab={route.tab} tick={tick} />}
      </div>
    </Tooltip.Provider>
    </RemoteContext>
  );
}
