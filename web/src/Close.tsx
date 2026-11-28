// Acknowledge and Dismiss (docs/board.md, "Acknowledge and Dismiss"; the 0084/C mockups): one click closes a request
// without an answer, with words on the button and no confirmation. Acknowledge is for a look or an FYI only. Also what
// every send shows while it goes (docs/board.md, "While it sends"): the pressed button, then the line under it.
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { goneLine, mayPress, sendKey, type Closed, type Send } from "../../src/board/sends.ts";
import { dropSend, submit, useSends } from "./sends.ts";

/** Reads the board again after an action; the app provides it. */
export const RefreshContext = createContext<() => void>(() => {});

/** The request's send, if any, and what its buttons may do. */
export function useRequestSend(project: string, handle: string) {
  const { sends, stage } = useSends();
  const send = sends.find((s) => sendKey(s.project, s.handle) === sendKey(project, handle)) ?? null;
  const at = send === null ? null : stage(send);
  return {
    send,
    at,
    /** Buttons are disabled while it sends, and gone once it is recorded or the request is closed. */
    disabled: !mayPress(at),
    done: at === "sent" || at === "closed",
    /** Whether this button is the one under way. */
    sending: (press: string): boolean => (at === "sending" || at === "still") && send?.press === press,
  };
}

/** A pressed button's words while its send goes. */
export function Sending() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="size-3 flex-none animate-spin rounded-full border-2 border-current border-t-transparent" />
      Sending…
    </span>
  );
}

/** What became of a request's send, in words under its buttons; nothing without one. */
export function SendLine({ send, at }: { send: Send | null; at: ReturnType<typeof useRequestSend>["at"] }) {
  const line = useRef<HTMLDivElement>(null);
  const before = useRef(at);
  // When the reply comes, the buttons above go and the line moves: keep it on screen.
  useEffect(() => {
    if ((before.current === "sending" || before.current === "still") && (at === "sent" || at === "failed" || at === "closed")) {
      line.current?.scrollIntoView({ block: "nearest" });
    }
    before.current = at;
  }, [at]);
  if (send === null || at === null) {
    return null;
  }
  const tone = at === "failed" || at === "unconfirmed" ? "border-red-600 bg-red-50 text-red-900" : at === "sent" || at === "closed" ? "border-green-600 bg-green-50 text-slate-900" : "border-blue-600 bg-blue-50 text-slate-900";
  return (
    <div ref={line} role={at === "failed" ? "alert" : "status"} className={`mt-1.5 basis-full break-words rounded-md border-l-[3px] px-2 py-1 text-left text-[12.5px] font-normal ${tone}`}>
      {at === "sending" && <>Sending “{send.label}”…</>}
      {at === "still" && <>Sending “{send.label}”… still sending (the record is being written)</>}
      {at === "sent" && <>✓ {send.label} — sent{send.note !== null && <span className="block">{send.note}</span>}</>}
      {at === "closed" && <>{send.note}</>}
      {at === "failed" && <>Not sent: {send.note}</>}
      {at === "unconfirmed" && <>“{send.label}” isn't confirmed: the record doesn't show it. Press again if it is still wanted.</>}
    </div>
  );
}

/**
 * The lines of sends whose request left the open list: who closed it and with what, as the record has it (`closed`, by
 * `project/handle`). Pinned to the bottom of the window, so they show wherever the page is scrolled and in either phone
 * view; they go by themselves after a while, or with ✕.
 */
export function SendNotices({ closed }: { closed: ReadonlyMap<string, Closed> }) {
  const { sends } = useSends();
  const gone = sends.filter((s) => s.gone !== null);
  if (gone.length === 0) {
    return null;
  }
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 max-h-[40vh] overflow-y-auto md:left-auto md:w-96">
      {gone.map((s) => (
        <div key={sendKey(s.project, s.handle)} role="status" className="mt-2 flex items-start gap-2 break-words rounded-lg border border-green-600 bg-green-50 px-2.5 py-1.5 text-[12.5px] text-slate-900 shadow-lg">
          <span className="min-w-0 flex-1">
            <b className="font-mono text-[11.5px]">{s.handle}</b> {goneLine(s, closed.get(sendKey(s.project, s.handle)))}
            {s.phase === "sent" && s.note !== null && <span className="block text-slate-500">{s.note}</span>}
          </span>
          <button type="button" aria-label={`Hide the line of ${s.handle}`} onClick={() => dropSend(s)} className="cursor-pointer text-slate-500 max-md:min-h-11 max-md:px-2">✕</button>
        </div>
      ))}
    </div>
  );
}

export function CloseButton({ close, disabled, sending = false, onClose, handle }: { close: "ack" | "dismiss"; disabled: boolean; sending?: boolean; onClose: () => void; handle: string }) {
  const ack = close === "ack";
  return (
    <button
      type="button"
      disabled={disabled}
      title={ack ? "Close as seen; nobody is woken" : "Close without an answer; the asking thread is told"}
      aria-label={sending ? `Sending ${handle}` : `${ack ? "Acknowledge" : "Dismiss"} ${handle}`}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className={`inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold hover:border-blue-600 disabled:cursor-wait max-md:min-h-11 max-md:px-3.5 max-md:text-[13px] ${sending ? "" : "disabled:opacity-60"} ${ack ? "border-green-600 bg-green-50 text-slate-900" : "border-slate-200 bg-white text-slate-700"}`}
    >
      {sending ? <Sending /> : <><span aria-hidden>{ack ? "✓" : "⊘"}</span> {ack ? "Acknowledge" : "Dismiss"}</>}
    </button>
  );
}

/** The buttons of a request in a card's need box: Acknowledge on a look, Dismiss on any; what a send does shows under them. */
export function CardActions({ project, handle, look, children }: { project: string; handle: string; look: boolean; children?: ReactNode }) {
  const refresh = useContext(RefreshContext);
  const { send, at, disabled, done, sending } = useRequestSend(project, handle);
  const press = (close: "ack" | "dismiss") => void submit(project, handle, close, close === "ack" ? "Acknowledge" : "Dismiss", refresh);
  return (
    // A click here must not open the card.
    <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {children}
      {!done && look && <CloseButton close="ack" handle={handle} disabled={disabled} sending={sending("ack")} onClose={() => press("ack")} />}
      {!done && <CloseButton close="dismiss" handle={handle} disabled={disabled} sending={sending("dismiss")} onClose={() => press("dismiss")} />}
      <SendLine send={send} at={at} />
    </div>
  );
}
