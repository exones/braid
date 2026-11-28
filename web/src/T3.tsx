// The T3 button (docs/board.md, "T3 sign-in"; the 0080/D mockups): icon-only, a "T3" monogram with a state dot, next to
// the provider chips; the words are in its tooltip, and a click opens a small panel. Sign-in starts from the host only;
// sign-out works from the phone too. The page never sees the token.
import { useState } from "react";
import { Dialog, Tooltip } from "radix-ui";
import { clock } from "../../src/board/pause.ts";
import { buttonTone, fullDate, tooltip } from "../../src/t3/words.ts";
import { postT3, type SignInView } from "./api.ts";

const TONE_BUTTON = {
  in: "border-green-300 bg-green-50",
  soon: "border-amber-300 bg-amber-50",
  out: "border-dashed border-slate-300 bg-white text-slate-500",
  bad: "border-red-300 bg-red-50 text-red-800",
  none: "border-dashed border-slate-200 bg-white text-slate-400 cursor-default",
  wait: "border-blue-300 bg-blue-50",
} as const;
const TONE_DOT = { in: "bg-green-600", soon: "bg-amber-600", out: "bg-white ring-1 ring-slate-400", bad: "bg-red-600", none: "hidden", wait: "bg-blue-600" } as const;
const PILL = { in: "bg-green-100 text-green-800", soon: "bg-amber-100 text-amber-800", out: "bg-slate-100 text-slate-600", bad: "bg-red-100 text-red-800", none: "bg-slate-100 text-slate-500", wait: "bg-blue-100 text-blue-800" } as const;

function pillText(v: SignInView): string {
  if (v.waitingUntil !== null) {
    return "waiting for T3";
  }
  if (v.state === "soon") {
    return `ends ${clock(v.expiresAt ?? "", new Date(0)).replace(/ \d\d:\d\d$/, "")}`;
  }
  return v.state === "in" ? "signed in" : v.reason === "not signed in" ? "not signed in" : "signed out";
}

const btn = "cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-xs hover:border-blue-600 disabled:cursor-default disabled:opacity-60 max-md:min-h-11 max-md:px-3.5 max-md:text-sm";
const code = "rounded bg-slate-100 px-1 font-mono text-[11px]";

/** The panel's body: the state, what to do and the actions for it. */
function Panel({ view, remote, now }: { view: SignInView; remote: boolean; now: Date }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [approval, setApproval] = useState<string | null>(null);
  const tone = buttonTone(view);
  const run = async (what: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await what();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  // The tab opens on the click itself (a tab opened after a reply is often blocked), then goes to T3's approval page.
  const signIn = () => {
    const tab = window.open("", "_blank");
    void run(async () => {
      try {
        const reply = await postT3<{ authorizeUrl: string }>("login");
        setApproval(reply.authorizeUrl);
        if (tab !== null) {
          tab.opener = null;
          tab.location.href = reply.authorizeUrl;
        }
      } catch (e) {
        tab?.close();
        throw e;
      }
    });
  };
  const signOut = () =>
    void run(async () => {
      const out = await postT3<{ had: boolean; revoked: boolean }>("logout");
      setConfirming(false);
      setNote(!out.had ? "There was no T3 sign-in to sign out." : out.revoked ? null : 'Signed out here, but T3 couldn\'t be reached to revoke it: revoke "braid board" in T3\'s Settings → Sharing & access.');
    });
  const cancel = () => void run(async () => void (await postT3("cancel")));
  const host = !remote;
  const uses = view.access === "cli" ? "the t3 command line (access: cli)" : "the sign-in (access: auto)";
  if (confirming) {
    return (
      <div data-t3-confirm>
        <Dialog.Title className="mb-1.5 text-[13px] font-semibold">Sign out of T3?</Dialog.Title>
        <p className="text-[13px]">The board revokes its sign-in in T3 and forgets it on this machine. Until you sign in again it uses the t3 command line, as before.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" disabled={busy} onClick={signOut} className={`${btn} border-red-300 text-red-700`}>
            Sign out
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={btn}>
            Cancel
          </button>
        </div>
        {error !== null && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
      </div>
    );
  }
  return (
    <div data-t3-panel={tone}>
      <div className="mb-1.5 flex items-center gap-2">
        <Dialog.Title className="text-[13px] font-semibold">T3 sign-in</Dialog.Title>
        <span className={`rounded-full px-2 text-[11px] font-semibold ${PILL[tone]}`}>{pillText(view)}</span>
      </div>
      {view.waitingUntil !== null ? (
        <>
          <p className="rounded-md border-l-[3px] border-blue-600 bg-blue-50 px-2 py-1 text-xs text-blue-900">
            T3's approval page opened in a new tab. Approve <b>braid board</b> at <b>Full access</b> there; this panel turns signed in by itself.
          </p>
          <dl className="my-1.5 grid grid-cols-[88px_1fr] gap-x-2 text-xs">
            <dt className="text-slate-500">waits until</dt>
            <dd>{clock(view.waitingUntil, now)} (5 min)</dd>
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {approval !== null && (
              <a href={approval} target="_blank" rel="noopener noreferrer" className={`${btn} no-underline text-slate-900`}>
                Open the approval page again
              </a>
            )}
            <button type="button" disabled={busy} onClick={cancel} className={btn}>
              Cancel
            </button>
          </div>
        </>
      ) : view.state !== "out" ? (
        <>
          {view.state === "soon" && (
            <p className="rounded-md border-l-[3px] border-amber-500 bg-amber-50 px-2 py-1 text-xs text-amber-900">
              T3 ends every sign-in after 30 days. {host ? `Sign in again before ${fullDate(view.expiresAt ?? "")} to keep it.` : <>To sign in again, sign in from the board on the PC, or run <code className={code}>braid t3 login</code>.</>}
            </p>
          )}
          <dl className="my-1.5 grid grid-cols-[100px_1fr] gap-x-2 text-xs">
            <dt className="text-slate-500">T3</dt>
            <dd>{view.origin}</dd>
            <dt className="text-slate-500">level</dt>
            <dd>Full access</dd>
            <dt className="text-slate-500">until</dt>
            <dd>{fullDate(view.expiresAt ?? "")}</dd>
            <dt className="text-slate-500">the board uses</dt>
            <dd className={view.access === "cli" ? "font-semibold" : ""}>{uses}</dd>
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {view.state === "soon" && host && (
              <button type="button" disabled={busy} onClick={signIn} className={`${btn} border-blue-600 bg-blue-600 text-white`}>
                Sign in again
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => setConfirming(true)} className={`${btn} border-red-300 text-red-700`}>
              Sign out of T3
            </button>
          </div>
          <p className="mt-1.5 text-[11.5px] text-slate-500">
            {view.access === "cli" ? (
              <>Change it with <code className={code}>braid t3 set --access auto</code>.</>
            ) : (
              <>Sign out revokes "braid board" in T3, as <code className={code}>braid t3 logout</code>; the board goes back to the t3 command line.</>
            )}
          </p>
        </>
      ) : (
        <>
          {view.reason === "refused" && (
            <p className="rounded-md border-l-[3px] border-red-600 bg-red-50 px-2 py-1 text-xs text-red-900">
              T3 refused the sign-in{view.refusedAt === null ? "" : ` at ${clock(view.refusedAt, now)}`} (revoked or ended in T3). The board stopped using it and won't try it again.
            </p>
          )}
          {view.reason === "ended" && <p className="rounded-md border-l-[3px] border-red-600 bg-red-50 px-2 py-1 text-xs text-red-900">The T3 sign-in ended on {fullDate(view.expiresAt ?? "")}; T3 ends every sign-in after 30 days.</p>}
          {view.reason === "no secret store" ? (
            <p className="text-[13px]">This host has no OS secret store the board can use, so it keeps no T3 sign-in and uses the t3 command line.</p>
          ) : host ? (
            <>
              <p className="text-[13px]">Until then the board uses the t3 command line.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button type="button" disabled={busy} onClick={signIn} className={`${btn} border-blue-600 bg-blue-600 text-white`}>
                  Sign in to T3
                </button>
              </div>
              <p className="mt-1.5 text-[11.5px] text-slate-500">
                Or run <code className={code}>braid t3 login</code> in a terminal.
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px]" data-t3-phone>
                Sign in from the board on the PC, or run <code className={code}>braid t3 login</code>.
              </p>
              <p className="mt-1.5 text-xs text-slate-500">T3's approval page has to open on the PC where T3 runs, so the phone can't start it. Until then the board uses the t3 command line.</p>
            </>
          )}
        </>
      )}
      {note !== null && <p className="mt-1.5 text-xs text-amber-800">{note}</p>}
      {error !== null && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}

/** The button with its tooltip and panel; on the phone the panel is a sheet at the bottom. */
export function T3Button({ view, remote, now, phone = false }: { view: SignInView; remote: boolean; now: Date; phone?: boolean }) {
  const [open, setOpen] = useState(false);
  const tone = buttonTone(view);
  const tip = tooltip(view, now, remote);
  const clickable = tone !== "none";
  return (
    <>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={`${tip.head}. ${tip.hint}`}
            data-t3-button={tone}
            onClick={() => clickable && setOpen(!open)}
            className={`relative inline-flex h-[26px] w-[34px] flex-none items-center justify-center rounded-lg border text-[11px] font-extrabold tracking-tight ${clickable ? "cursor-pointer" : ""} ${TONE_BUTTON[tone]} ${phone ? "max-md:h-11 max-md:w-11" : ""}`}
          >
            T3
            <span className={`absolute -right-1 -top-1 size-[9px] rounded-full border-2 border-white ${TONE_DOT[tone]}`} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={6} className="z-[60] max-w-[320px] rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-slate-50">
            {tip.head}
            <span className="block text-[11px] text-slate-300">{tip.hint}</span>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      {open && (
        <Dialog.Root open modal={false} onOpenChange={(o) => { if (!o) setOpen(false); }}>
          <Dialog.Portal>
            <Dialog.Content
              aria-describedby={undefined}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={(e) => {
                if (e.target instanceof Element && e.target.closest("[data-t3-button]") !== null) {
                  e.preventDefault();
                }
              }}
              className="fixed right-5 top-[52px] z-40 w-[340px] rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13px] shadow-[0_10px_30px_rgba(15,23,42,0.13)] max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:w-auto max-md:rounded-b-none max-md:px-4 max-md:pb-5 max-md:text-sm"
            >
              <Panel view={view} remote={remote} now={now} />
              <Dialog.Close className={`${btn} mt-2.5 md:hidden`}>Close</Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
