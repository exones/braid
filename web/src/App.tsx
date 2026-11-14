import { useEffect, useState, type ReactNode } from "react";
import { Tabs, Tooltip } from "radix-ui";
import { Md } from "./Md.tsx";
import { LANE_LABEL, cardMarks, strandMarks, type Marks } from "../../src/board/marks.ts";
import { useBoard, useItem, useTick, type Tick, type BoardData, type BraidCard, type ItemDetail, type Lane, type Loaded, type PullRequest, type StrandCard } from "./api.ts";

/** `#/` is the board, `#/0003` a braid, `#/0003/A` a strand; `?tab=report` picks a tab. */
interface Route {
  readonly id: string | null;
  readonly tab: string;
}

function parseHash(hash: string): Route {
  const [path = "", query = ""] = hash.replace(/^#\/?/, "").split("?");
  return { id: path === "" ? null : path, tab: new URLSearchParams(query).get("tab") ?? "brief" };
}

export function go(id: string | null, tab = "brief"): void {
  location.hash = id === null ? "#/" : `#/${id}${tab === "brief" ? "" : `?tab=${tab}`}`;
}

function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash));
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
        <Tooltip.Content sideOffset={4} className="rounded bg-slate-800 px-2 py-1 text-xs text-white">
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
  if (kind === "stopped") {
    return (
      <Icon tip={tooltip} className="rounded-full bg-red-600">
        <span className="size-1.5 rounded-[1px] bg-white" />
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
    <span className="inline-flex items-center gap-1.5">
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
      {marks.running && (
        <Icon tip="agent running" className="motion-safe:animate-[wob_2s_ease-in-out_infinite] text-blue-600">
          <svg {...svg} strokeWidth={2.2}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.4-.6-.6-2.4z" /></svg>
        </Icon>
      )}
    </span>
  );
}

function Badge({ children, tone = "bg-slate-200 text-slate-700" }: { children: ReactNode; tone?: string }) {
  return <span className={`rounded-full px-2 py-px text-[11px] ${tone}`}>{children}</span>;
}

/** A small icon button that is disabled in this version; the tooltip says why. */
function ActionIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span className="inline-flex" tabIndex={0} aria-label={`${label} (not available yet)`}>
          <button
            type="button"
            disabled
            aria-label={label}
            className="flex size-6 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-400"
          >
            {children}
          </button>
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={4} className="rounded bg-slate-800 px-2 py-1 text-xs text-white">
          {label}: not available yet
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
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

/** Start belongs on To Do items, Merge on In Review items; other lanes show nothing. */
function Actions({ lane }: { lane: Lane }) {
  if (lane === "To Do") {
    return <ActionIcon label="Start"><StartIcon /></ActionIcon>;
  }
  if (lane === "In Review") {
    return <ActionIcon label="Merge"><MergeIcon /></ActionIcon>;
  }
  return null;
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

function Card({ braid }: { braid: BraidCard }) {
  const [open, setOpen] = useState(false);
  const tier = braid.labels.filter((l) => l.startsWith("tier:"));
  return (
    <div
      className="mb-2 cursor-pointer rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm hover:border-blue-600"
      onClick={() => go(braid.id)}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500">{braid.id}</span>
        {braid.status === "Outline" && <Badge tone="bg-amber-100 text-amber-800">Outline</Badge>}
        {tier.map((l) => (
          <Badge key={l}>{l}</Badge>
        ))}
        <PrLink pr={braid.pr} />
        <Marks marks={cardMarks(braid)} />
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
      {open && (
        <div className="mt-2 border-t border-dashed border-slate-200 pt-1">
          {braid.strands.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-1.5 py-1 text-[13px] hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                go(s.id);
              }}
            >
              <LaneDot lane={s.lane} />
              <span className="w-10 flex-none text-xs text-slate-500">{s.id.slice(2)}</span>
              <span className="flex-1">
                {s.title}
                {s.branch !== null && <FromBranch branch={s.branch} />}
              </span>
              <PrLink pr={s.pr} />
              <Marks marks={strandMarks(s)} />
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex min-h-6 justify-end">
        <Actions lane={braid.lane} />
      </div>
    </div>
  );
}

function Board({ data }: { data: BoardData }) {
  return (
    <div className="grid grid-cols-5 items-start gap-3 p-4">
      {data.lanes.map((lane) => {
        const cards = data.braids.filter((b) => b.lane === lane);
        return (
          <section key={lane} aria-label={lane} className="min-h-48 rounded-xl bg-slate-200/70 p-2.5">
            <h3 className="mx-1 mb-2.5 mt-0.5 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="flex items-center gap-1.5"><LaneDot lane={lane} />{LANE_LABEL[lane]}</span>
              <span>{cards.length}</span>
            </h3>
            {cards.map((b) => (
              <Card key={b.id} braid={b} />
            ))}
          </section>
        );
      })}
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
    <main className="overflow-auto px-7 py-5">
      <div className="text-xs text-slate-500">{item.id}</div>
      <h1 className="mb-1.5 text-xl font-semibold">{item.title}</h1>
      <div className="flex flex-wrap items-center gap-1.5">
        <LaneDot lane={item.lane} />
        <Badge>{LANE_LABEL[item.lane]}</Badge>
        <Marks marks={marks} />
        {item.labels.map((l) => (
          <Badge key={l} tone="bg-indigo-100 text-indigo-800">{l}</Badge>
        ))}
        <span className="flex-1" />
        <Actions lane={item.lane} />
      </div>
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
    </main>
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

function Contents({ braid, current }: { braid: BraidCard; current: string }) {
  const item = (id: string, label: string, strand: StrandCard | null) => (
    <button
      key={id}
      type="button"
      onClick={() => go(id)}
      className={`mt-0.5 flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left hover:bg-slate-100 ${strand !== null ? "ml-3.5 w-[calc(100%-0.875rem)]" : ""} ${current === id ? "bg-indigo-100 font-semibold" : ""}`}
    >
      {strand !== null && <LaneDot lane={strand.lane} />}
      <span className="flex-1">{label}</span>
      {strand !== null && <Marks marks={strandMarks(strand)} />}
    </button>
  );
  return (
    <nav className="overflow-auto border-r border-slate-200 bg-white p-3.5">
      <button type="button" onClick={() => go(null)} className="mb-2.5 cursor-pointer text-[13px] text-blue-700">
        ← Board
      </button>
      <h2 className="text-[15px] font-semibold">
        {braid.id} {braid.title}
      </h2>
      <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
        <LaneDot lane={braid.lane} />
        {LANE_LABEL[braid.lane]}
        <Marks marks={cardMarks(braid)} />
      </div>
      {item(braid.id, "Braid brief", null)}
      {braid.strands.map((s) => item(s.id, `${s.id.slice(5)} · ${s.title}`, s))}
    </nav>
  );
}

function ItemPage({ id, tab, tick }: { id: string; tab: string; tick: Tick }) {
  const loaded = useItem(id, tick);
  return (
    <Status loaded={loaded}>
      {(item) => (
        <div className="grid h-[calc(100vh-45px)] grid-cols-[290px_1fr]">
          <Contents braid={item.braid} current={id} />
          <Detail key={item.id} item={item} tab={tab} />
        </div>
      )}
    </Status>
  );
}

export function App() {
  const route = useRoute();
  const { tick, refresh } = useTick();
  const board = useBoard(tick);
  const notes =
    board.state === "ready"
      ? [
          board.data.github.state === "unavailable" ? `GitHub unavailable (${board.data.github.reason}): showing stored states` : null,
          board.data.t3.state === "unavailable" ? `T3 unavailable (${board.data.t3.reason}): no agent states` : null,
        ].filter((n) => n !== null)
      : [];
  return (
    <Tooltip.Provider>
      <div className="min-h-screen bg-slate-100 text-sm text-slate-900">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-2.5">
          <b className="text-base" title="Each braid sits in the lane where it needs you most.">braid · attention board</b>
          {board.state === "ready" && <span className="text-slate-500">Each braid sits in the lane where it needs you most. · {board.data.repo} · braids/</span>}
          <span className="flex-1" />
          <span className="text-xs text-slate-500">
            {notes.length > 0 ? `${notes.join(" · ")} · ` : "read-only · "}refreshes every 30 s
          </span>
          <button
            type="button"
            onClick={refresh}
            className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 hover:border-blue-600"
          >
            Refresh
          </button>
        </header>
        {route.id === null ? (
          <Status loaded={board}>{(data) => <Board data={data} />}</Status>
        ) : (
          <ItemPage id={route.id} tab={route.tab} tick={tick} />
        )}
      </div>
    </Tooltip.Provider>
  );
}
