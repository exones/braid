// The provider limits on the page (docs/board.md, "Provider limits"): the header chips, the phone strip and the limits panel.
import { Dialog } from "radix-ui";
import { actingText, agentsText, badgeText, chipNote, chipTitle, resetText, STATE_TONE, repliesLine } from "../../src/board/limits-view.ts";
import { t3codeUrl } from "../../src/board/marks.ts";
import type { LimitsView, ProviderView, WindowReading } from "./api.ts";

const TONE_CHIP = {
  slate: "border-slate-200 bg-white",
  amber: "border-amber-300 bg-amber-50",
  red: "border-red-300 bg-red-50 text-red-900",
  sky: "border-sky-300 bg-sky-50 text-sky-900",
  dashed: "border-dashed border-slate-200 bg-white text-slate-500",
} as const;
const TONE_FILL = { slate: "bg-slate-400", amber: "bg-amber-600", red: "bg-red-600", sky: "bg-sky-600", dashed: "bg-slate-400" } as const;
const TONE_BADGE = {
  slate: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  sky: "bg-sky-100 text-sky-800",
  dashed: "bg-slate-100 text-slate-500",
} as const;

type Tone = keyof typeof TONE_FILL;

/** A bar of one window's usage, with its threshold as a tick; a window over its threshold is red, except on a paused chip, where the bars stay sky (the pause is handled). */
function Track({ w, fill, height }: { w: WindowReading; fill: string; height: string }) {
  return (
    <span className={`relative flex-1 rounded-sm bg-slate-200 ${height}`}>
      <span className={`absolute inset-y-0 left-0 rounded-sm ${w.over && fill !== TONE_FILL.sky ? "bg-red-600" : fill}`} style={{ width: `${Math.min(100, w.usedPercent)}%` }} />
      <span className="absolute -inset-y-0.5 w-0.5 rounded-sm bg-slate-700" style={{ left: `${w.threshold}%` }} />
    </span>
  );
}

function Meter({ label, w, fill }: { label: string; w: WindowReading | null; fill: string }) {
  if (w === null) {
    return null;
  }
  return (
    <span className="flex w-[54px] items-center gap-1 text-[10px] text-slate-500">
      {label}
      <Track w={w} fill={fill} height="h-[5px]" />
      <span className="min-w-[26px] text-right tabular-nums">{w.usedPercent}%</span>
    </span>
  );
}

/** A provider's chip: its name, the Session and Weekly meters and what its state adds. It opens the limits panel. */
function Chip({ p, now, onOpen }: { p: ProviderView; now: Date; onOpen: () => void }) {
  const tone = STATE_TONE[p.state];
  const note = chipNote(p, now);
  return (
    <button
      type="button"
      onClick={onOpen}
      title={chipTitle(p)}
      aria-label={`${p.instanceId}: ${note === "" ? p.state : note}. Open the limits`}
      data-limits-chip={p.state}
      className={`inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-0.5 text-xs max-md:min-h-11 max-md:px-3 ${TONE_CHIP[tone]}`}
    >
      <b>{p.instanceId}</b>
      {(p.session !== null || p.weekly !== null) && (
        <span className="flex flex-col gap-0.5">
          <Meter label="S" w={p.session} fill={TONE_FILL[tone]} />
          <Meter label="W" w={p.weekly} fill={TONE_FILL[tone]} />
        </span>
      )}
      {note !== "" && <span className="text-[11px]">{note}</span>}
    </button>
  );
}

/** The header chips; they hide on the phone, where `LimitsStrip` shows them under the header. */
export function LimitChips({ view, now, onOpen }: { view: LimitsView; now: Date; onOpen: () => void }) {
  return <span className="flex items-center gap-1.5 max-md:hidden">{view.providers.map((p) => <Chip key={p.instanceId} p={p} now={now} onOpen={onOpen} />)}</span>;
}

/** On the phone the chips sit in a strip under the header, scrolling sideways; a tap opens the panel full-screen. */
export function LimitsStrip({ view, now, onOpen }: { view: LimitsView; now: Date; onOpen: () => void }) {
  return <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2 md:hidden">{view.providers.map((p) => <Chip key={p.instanceId} p={p} now={now} onOpen={onOpen} />)}</div>;
}

function WindowRow({ w, tone, now }: { w: WindowReading; tone: Tone; now: Date }) {
  return (
    <div className="mt-1.5">
      <div className="grid grid-cols-[92px_1fr_40px] items-center gap-2 text-xs max-md:grid-cols-[84px_1fr_36px]">
        <span>{w.label}</span>
        <Track w={w} fill={TONE_FILL[tone]} height="h-[7px]" />
        <span className="text-right tabular-nums">{w.usedPercent}%</span>
      </div>
      <div className="text-[11px] text-slate-500">of {w.threshold}% · {resetText(w.resetsAt, w.reset, now)}</div>
    </div>
  );
}

function ProviderBlock({ p, now }: { p: ProviderView; now: Date }) {
  const tone = STATE_TONE[p.state];
  const agents = agentsText(p);
  return (
    <section className="border-t border-slate-100 py-2.5 first:border-t-0" data-provider={p.instanceId}>
      <div className="flex flex-wrap items-center gap-2">
        <b>{p.instanceId}</b>
        <span className={`rounded-full px-2 text-[11px] font-semibold ${TONE_BADGE[tone]}`}>{badgeText(p, now)}</span>
        <span className="flex-1" />
        <span className="text-xs text-slate-500">{p.roles.length === 0 ? "used by a running agent" : p.roles.join(", ")}</span>
      </div>
      {p.windows.map((w) => <WindowRow key={w.id} w={w} tone={tone} now={now} />)}
      {p.state === "unmeasured" && <p className="mt-1.5 text-xs text-slate-600">T3 can’t read this provider’s usage; its agents are never paused for it.</p>}
      {p.state === "unknown" && <p className="mt-1.5 text-xs text-slate-600">{p.reason}. An unknown reading never pauses anything.</p>}
      {p.agents.length > 0 && (
        <p className="mt-1.5 text-xs text-slate-600">
          {agents.paused !== "none" && <>Paused: {agents.paused}. </>}
          Running on it: {agents.running}.
        </p>
      )}
      <RepliesLine p={p} now={now} />
    </section>
  );
}

/** The board's last pause on this provider: when it sent its texts and what came of them; amber when it didn't reach everyone, with each silent thread's link. */
function RepliesLine({ p, now }: { p: ProviderView; now: Date }) {
  const text = repliesLine(p, now);
  if (text === null) {
    return null;
  }
  const failed = p.replies?.outcome === "failed" || p.replies?.outcome === "partial";
  const silent = (p.replies?.noAnswer ?? []).filter((n) => n.link !== null);
  return (
    <p data-replies={p.replies?.outcome} className={`mt-1.5 rounded-md border-l-[3px] px-2 py-1 text-xs ${failed ? "border-amber-500 bg-amber-50 text-amber-900" : "border-sky-600 bg-sky-50 text-sky-900"}`}>
      {text}
      {silent.map((n) => (
        <span key={n.thread}>
          {" "}
          <a className="underline" href={t3codeUrl(n.link ?? "") ?? undefined}>
            Open {n.item}
          </a>
        </span>
      ))}
    </p>
  );
}

const code = "rounded bg-slate-100 px-1 font-mono text-[11px]";

function readAge(read: Date, now: Date): string {
  const s = Math.max(0, Math.round((now.getTime() - read.getTime()) / 1000));
  return s < 90 ? `${s} s ago` : `${Math.round(s / 60)} min ago`;
}

/** The limits panel: every provider with its windows, roles and agents. A side panel on the desktop, full-screen on the phone. */
export function LimitsPanel({ view, now, onClose }: { view: LimitsView; now: Date; onClose: () => void }) {
  return (
    <Dialog.Root open modal={false} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // A click on a chip toggles the panel itself.
            if (e.target instanceof Element && e.target.closest("[data-limits-chip]") !== null) {
              e.preventDefault();
            }
          }}
          className="fixed right-5 top-[52px] z-40 flex max-h-[calc(100vh-70px)] w-[520px] flex-col overflow-auto rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.18)] max-md:inset-0 max-md:max-h-none max-md:w-auto max-md:rounded-none max-md:border-0"
        >
          <div className="flex items-center gap-2">
            <Dialog.Title className="text-[15px] font-semibold">Provider limits</Dialog.Title>
            <span className="flex-1" />
            <Dialog.Close aria-label="Close the limits" title="Close (Esc)" className="flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white hover:border-blue-600 max-md:size-11">✕</Dialog.Close>
          </div>
          <p className="mb-2 text-xs text-slate-500">
            From <code className={code}>braid limits</code> at each refresh (read {readAge(new Date(view.readAt), now)}). Thresholds: session {view.limits.session}%, weekly {view.limits.weekly}%, buffer {view.limits.buffer} min (BRAID.md <code className={code}>limits</code>).
          </p>
          {view.note !== null && <p className="mb-2 rounded-md border-l-[3px] border-amber-500 bg-amber-50 px-2 py-1 text-xs text-amber-900">{view.note}</p>}
          {(actingText(view) ?? []).map((line) => (
            <p key={line} data-acting className="mb-2 text-xs text-slate-600">
              {line}
            </p>
          ))}
          {view.providers.map((p) => <ProviderBlock key={p.instanceId} p={p} now={now} />)}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
