// Acknowledge and Dismiss (docs/board.md, "Acknowledge and Dismiss"; the 0084/C mockups): one click closes a request
// without an answer, with words on the button and no confirmation. Acknowledge is for a look or an FYI only.
import { createContext, useContext, useState, type ReactNode } from "react";
import { closeRequest } from "./api.ts";

/** Reads the board again after an action; the app provides it. */
export const RefreshContext = createContext<() => void>(() => {});

export function CloseButton({ close, disabled, onClose, handle }: { close: "ack" | "dismiss"; disabled: boolean; onClose: () => void; handle: string }) {
  const ack = close === "ack";
  return (
    <button
      type="button"
      disabled={disabled}
      title={ack ? "Close as seen; nobody is woken" : "Close without an answer; the asking thread is told"}
      aria-label={`${ack ? "Acknowledge" : "Dismiss"} ${handle}`}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className={`inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold hover:border-blue-600 disabled:cursor-wait disabled:opacity-60 max-md:min-h-11 max-md:px-3.5 max-md:text-[13px] ${ack ? "border-green-600 bg-green-50 text-slate-900" : "border-slate-200 bg-white text-slate-700"}`}
    >
      <span aria-hidden>{ack ? "✓" : "⊘"}</span> {ack ? "Acknowledge" : "Dismiss"}
    </button>
  );
}

/** The buttons of a request in a card's need box: Acknowledge on a look, Dismiss on any; a refusal shows under them. */
export function CardActions({ project, handle, look, children }: { project: string; handle: string; look: boolean; children?: ReactNode }) {
  const refresh = useContext(RefreshContext);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = async (close: "ack" | "dismiss") => {
    setBusy(true);
    setError(null);
    try {
      const reply = await closeRequest(project, handle, close);
      // A dismissal whose wake couldn't go says so; the row goes at the next read either way.
      if (close === "dismiss" && !reply.woken) {
        setError(`Dismissed; the asking thread isn't told yet: ${reply.wake ?? "unknown"}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      refresh();
    }
  };
  return (
    // A click here must not open the card.
    <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {children}
      {look && <CloseButton close="ack" handle={handle} disabled={busy} onClose={() => void send("ack")} />}
      <CloseButton close="dismiss" handle={handle} disabled={busy} onClose={() => void send("dismiss")} />
      {error !== null && <span role="alert" className="basis-full text-[12px] text-red-800">{error}</span>}
    </div>
  );
}
