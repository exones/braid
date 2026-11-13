import { useEffect, useState, type ReactNode } from "react";
import { Tabs, Tooltip } from "radix-ui";
import { Md } from "./Md.tsx";
import { useBoard, useItem, type BoardData, type BraidCard, type ItemDetail, type Lane, type Loaded, type PullRequest } from "./api.ts";

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

const DOT: Record<string, string> = {
  "In Progress": "bg-blue-600",
  "In Review": "bg-blue-600",
  Done: "bg-green-600",
  Waiting: "bg-red-600",
  Outline: "bg-amber-500",
  "To Do": "bg-slate-400",
};

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

/** Why an item waits; nothing outside the Waiting lane. */
function Reason({ reason }: { reason: string | null }) {
  return reason === null ? null : <span className="block text-xs text-amber-700">Waiting: {reason}</span>;
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
      <Reason reason={braid.reason} />
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
              <span className={`size-2 flex-none rounded-full ${DOT[s.status] ?? ""}`} />
              <span className="w-10 flex-none text-xs text-slate-500">{s.id.slice(2)}</span>
              <span className="flex-1">
                {s.title}
                {s.branch !== null && <FromBranch branch={s.branch} />}
                <Reason reason={s.reason} />
              </span>
              <PrLink pr={s.pr} />
              <span className="text-xs text-slate-500">{s.status}</span>
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
              <span>{lane}</span>
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
    ["Status", item.status],
    ["Branch", item.branch ?? "working tree"],
    ["Delivery", item.delivery ?? "-"],
    ["Depends on", item.dependencies.length === 0 ? "-" : item.dependencies.join(", ")],
    ["Order", item.order === null ? "-" : String(item.order)],
    ["Folder", item.folder],
  ];
  const pr = item.pr;
  const trigger = "cursor-pointer border-b-2 border-transparent px-3.5 py-2 text-slate-500 data-[state=active]:border-blue-600 data-[state=active]:font-semibold data-[state=active]:text-slate-900";
  return (
    <main className="overflow-auto px-7 py-5">
      <div className="text-xs text-slate-500">{item.id}</div>
      <h1 className="mb-1.5 text-xl font-semibold">{item.title}</h1>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{item.status}</Badge>
        {item.labels.map((l) => (
          <Badge key={l} tone="bg-indigo-100 text-indigo-800">{l}</Badge>
        ))}
        <span className="flex-1" />
        <Actions lane={item.lane} />
      </div>
      <Reason reason={item.reason} />
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
  const item = (id: string, label: string, status: string, sub: boolean) => (
    <button
      key={id}
      type="button"
      onClick={() => go(id)}
      className={`mt-0.5 flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left hover:bg-slate-100 ${sub ? "ml-3.5 w-[calc(100%-0.875rem)]" : ""} ${current === id ? "bg-indigo-100 font-semibold" : ""}`}
    >
      {sub && <span className={`size-2 flex-none rounded-full ${DOT[status] ?? ""}`} />}
      {label}
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
      <div className="mb-2 text-xs text-slate-500">{braid.lane}</div>
      {item(braid.id, "Braid brief", braid.status, false)}
      {braid.strands.map((s) => item(s.id, `${s.id.slice(5)} · ${s.title}`, s.status, true))}
    </nav>
  );
}

function ItemPage({ id, tab }: { id: string; tab: string }) {
  const loaded = useItem(id);
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
  const board = useBoard();
  return (
    <Tooltip.Provider>
      <div className="min-h-screen bg-slate-100 text-sm text-slate-900">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-2.5">
          <b className="text-base">braid</b>
          {board.state === "ready" && <span className="text-slate-500">{board.data.repo} · braids/</span>}
          <span className="flex-1" />
          <span className="text-xs text-slate-500">
            {board.state === "ready" && board.data.github.state === "unavailable"
              ? `GitHub unavailable (${board.data.github.reason}): showing stored states · reload to refresh`
              : "read-only · reload to refresh"}
          </span>
        </header>
        {route.id === null ? (
          <Status loaded={board}>{(data) => <Board data={data} />}</Status>
        ) : (
          <ItemPage id={route.id} tab={route.tab} />
        )}
      </div>
    </Tooltip.Provider>
  );
}
