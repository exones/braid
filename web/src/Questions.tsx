// The Questions panel (docs/board.md, "The Questions panel"), right of the lanes: every open question of the shown projects,
// ranked by what it blocks, each answered in place; then looks and FYIs, and Decided. Below `md` it is the Requests tab,
// full screen, and the board is the other tab (0084/C).
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Tooltip } from "radix-ui";
import { OUTCOME_LABEL, RANK_LABEL, nextAfter, outcomeText, splitQuestions, type Rank } from "../../src/board/question-list.ts";
import { CLOSED_PAGE } from "../../src/board/record.ts";
import type { TaggedDecided, TaggedQuestion } from "../../src/board/combined.ts";
import { ANSWER_MAX, answerRequest, closeRequest } from "./api.ts";
import { CloseButton } from "./Close.tsx";
import { Md } from "./Md.tsx";
import { AskingLink, BlockLine, CodeChip, MergeButton, ProjectContext, ProjectTag, go, goProgramme } from "./App.tsx";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

const keyOf = (q: { readonly project: string; readonly code: string }): string => `${q.project}/${q.code}`;

/** `35m` as "35 min", `2h` as "2 h", `3d` as "3 d". */
const waitText = (age: string): string => `${age.slice(0, -1)} ${age.endsWith("m") ? "min" : age.slice(-1)}`;

const when = (at: string): string => new Date(at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/** An icon-only button with its words in the tooltip. */
function IconButton({ tip, onClick, children, className = "border-slate-200 bg-white text-slate-700", type = "button", disabled = false }: { tip: string; onClick?: () => void; children: ReactNode; className?: string; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type={type}
          aria-label={tip}
          disabled={disabled}
          {...(onClick === undefined ? {} : { onClick })}
          className={`flex size-7 flex-none cursor-pointer items-center justify-center rounded-md border text-[13px] hover:border-blue-600 disabled:cursor-wait disabled:opacity-60 max-md:size-11 ${className}`}
        >
          <span aria-hidden>{children}</span>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">{tip}</Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

const Mark = ({ children, tone }: { children: ReactNode; tone: string }) => <span className={`rounded-full px-1.5 text-[10.5px] font-bold uppercase text-white ${tone}`}>{children}</span>;

/** The handle, the escalation or look mark, and the wait. */
function Head({ q, children }: { q: TaggedQuestion; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <CodeChip code={q.handle} />
      {q.escalated !== null && <Mark tone="bg-red-600">⚠ escalated</Mark>}
      {q.rank === "look" && <Mark tone="bg-slate-500">look</Mark>}
      <span className="ml-auto whitespace-nowrap text-[11.5px] text-slate-500">{waitText(q.age)}</span>
      {children}
    </div>
  );
}

function Who({ q }: { q: { readonly project: string; readonly who: string } }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-slate-500">
      <ProjectTag name={q.project} />
      <span>{q.who}</span>
    </div>
  );
}

/** What answering unblocks: `blocks 0072/B · decide`; a programme's own request stops its programme. */
function Blocks({ q }: { q: TaggedQuestion }) {
  return (
    <div className="mt-0.5 text-xs">
      {q.programme !== null && <b className="font-semibold">stops programme {q.programme} · </b>}
      <BlockLine blocks={q.blocks} act={q.act} />
    </div>
  );
}

/** A review request's PR link and the card's Merge button, with its confirmation. */
function MergeLine({ q }: { q: TaggedQuestion }) {
  if (q.pr === null) {
    return null;
  }
  return (
    <div className="mt-1.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {q.pr.url === null ? <span className="text-xs">PR #{q.pr.number}</span> : <a href={q.pr.url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 hover:underline">PR #{q.pr.number} ↗</a>}
      <MergeButton id={q.id} merge={q.merge} />
    </div>
  );
}

/** What a row or an opened card does without an answer (0084/C): `ack` (a look or an FYI) or `dismiss`, sent at once. */
type Close = (how: "ack" | "dismiss") => void;

/** The "✎ Answer" button beside Acknowledge and Dismiss. */
const AnswerButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 hover:border-blue-600 max-md:min-h-11 max-md:px-3.5 max-md:text-[13px]"
  >
    <span aria-hidden>✎</span> Answer
  </button>
);

function Row({ q, busy, onOpen, onClose }: { q: TaggedQuestion; busy: boolean; onOpen: () => void; onClose: Close }) {
  const tone = q.rank === "look" ? "border-l-slate-400 bg-white" : q.escalated !== null ? "border-red-600 bg-red-50" : "border-l-amber-500 bg-white";
  return (
    <div data-question={q.handle} onClick={onOpen} className={`mb-1.5 cursor-pointer rounded-lg border border-l-[3px] border-slate-200 px-2.5 py-1.5 hover:border-blue-600 ${tone}`}>
      <Head q={q} />
      <button type="button" aria-expanded={false} className="my-0.5 block w-full cursor-pointer text-left text-[13.5px] font-semibold">{q.text}</button>
      <Who q={q} />
      <Blocks q={q} />
      <MergeLine q={q} />
      <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
        {q.kind === "look" && <CloseButton close="ack" handle={q.handle} disabled={busy} onClose={() => onClose("ack")} />}
        <AnswerButton onClick={onOpen} />
        <CloseButton close="dismiss" handle={q.handle} disabled={busy} onClose={() => onClose("dismiss")} />
      </div>
    </div>
  );
}

/** Links the item (or, for a programme's own request, the programme's plan): all an older request without context has. */
function ItemLink({ q }: { q: TaggedQuestion }) {
  return (
    <button
      type="button"
      data-opens-details
      onClick={() => (q.programme === null ? go(q.id, "brief", q.project) : goProgramme(`${q.project}/${q.programme}`))}
      className="cursor-pointer whitespace-nowrap rounded border border-blue-200 bg-white px-1.5 text-[11.5px] text-blue-600 hover:border-blue-600"
    >
      {q.programme === null ? q.id : `🧭 ${q.programme}`}
    </button>
  );
}

/**
 * The roomy card: the context (open, can be folded), the question, one button per likely answer that sends at once, and
 * ✎ Custom, which swaps the buttons for a one-line field. A request without options shows the field only.
 */
function Opened({ q, busy, onSend, onClose, onDone }: { q: TaggedQuestion; busy: boolean; onSend: (text: string) => void; onClose: () => void; onDone: Close }) {
  const [context, setContext] = useState(true);
  const [custom, setCustom] = useState(false);
  const [typed, setTyped] = useState("");
  const box = useRef<HTMLDivElement>(null);
  // A block body: returning what scrollIntoView gives (a promise in newer Chrome) would make React call it as the cleanup.
  useEffect(() => {
    void box.current?.scrollIntoView({ block: "nearest" });
  }, []);
  // A look is seen, not asked: its field opens from "✎ Answer".
  const field = custom || (q.options.length === 0 && q.kind !== "look");
  const send = (e: FormEvent) => {
    e.preventDefault();
    if (typed.trim() !== "") {
      onSend(typed);
    }
  };
  const placeholder = q.act === "do" ? "Say what you did, in one line" : q.act === "merge" ? "Or ask for changes, in one line" : "Your answer, in one line";
  return (
    <div ref={box} data-question={q.handle} className={`mb-2 rounded-xl border bg-white px-4 py-3.5 shadow-md ${q.escalated !== null ? "border-red-600" : "border-blue-600"}`}>
      <Head q={q}>
        <IconButton tip="Close the card" onClick={onClose}>▴</IconButton>
      </Head>
      <div className="mt-1.5"><Who q={q} /></div>
      <Blocks q={q} />
      {q.escalated !== null && <div className="text-[11.5px] text-red-800">{q.escalated}.</div>}
      {q.context !== null && (
        <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
          <button type="button" aria-expanded={context} onClick={() => setContext(!context)} className="block w-full cursor-pointer text-left text-[11.5px] font-bold uppercase tracking-wide text-slate-500 max-md:min-h-11">
            {context ? "▾" : "▸"} Context
          </button>
          {context && <div className="break-words text-[13px] text-slate-700"><Md text={q.context} empty="" /></div>}
        </div>
      )}
      <div className="my-3 break-words text-[15.5px] font-semibold leading-snug">{q.text}</div>
      {q.note !== null && <div className="mb-2 text-xs text-slate-500">The PM's note: {q.note}</div>}
      <MergeLine q={q} />
      {field ? (
        <form onSubmit={send} className="mt-2 flex items-center gap-1.5">
          <input
            aria-label="Your answer"
            autoFocus={custom}
            value={typed}
            maxLength={ANSWER_MAX}
            placeholder={placeholder}
            onChange={(e) => setTyped(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-blue-600 bg-white px-2.5 py-1.5 max-md:min-h-11"
          />
          <IconButton tip="Send" type="submit" disabled={busy || typed.trim() === ""} className="border-blue-600 bg-blue-600 text-white">➤</IconButton>
          {q.options.length > 0 && <IconButton tip="Back to the options" onClick={() => setCustom(false)}>✕</IconButton>}
        </form>
      ) : (
        q.options.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {q.options.map((option, i) => (
              <button
                key={i}
                type="button"
                disabled={busy}
                onClick={() => onSend(OPTION_LETTERS[i] ?? option)}
                className="flex w-full cursor-pointer items-baseline gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-blue-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 max-md:min-h-11"
              >
                <b className="rounded border border-slate-400 px-1.5 text-xs">{OPTION_LETTERS[i]}</b>
                <span className="min-w-0 break-words">{option}</span>
              </button>
            ))}
          </div>
        )
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {q.kind === "look" && <CloseButton close="ack" handle={q.handle} disabled={busy} onClose={() => onDone("ack")} />}
        {q.kind === "look" && !field && <AnswerButton onClick={() => setCustom(true)} />}
        {q.kind !== "look" && !field && <IconButton tip="Custom answer" onClick={() => setCustom(true)}>✎</IconButton>}
        <span className="flex-1" />
        <CloseButton close="dismiss" handle={q.handle} disabled={busy} onClose={() => onDone("dismiss")} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <AskingLink link={q.link} />
        {q.context === null && <ItemLink q={q} />}
      </div>
    </div>
  );
}

function Fold({ open, onClick, children }: { open: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-expanded={open} onClick={onClick} className="mb-1.5 mt-2.5 flex w-full cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500 max-md:min-h-11">
      <span aria-hidden>{open ? "▾" : "▸"}</span> {children}
    </button>
  );
}

function DecidedRow({ d }: { d: TaggedDecided }) {
  const dismissed = d.outcome === "dismissed";
  return (
    <div className={`mb-1.5 rounded-lg border border-l-[3px] border-slate-200 bg-white px-2.5 py-1.5 ${dismissed ? "border-l-slate-400" : "border-l-green-600"}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <CodeChip code={d.handle} />
        <span className={`rounded-full px-2 text-[11px] font-semibold ${d.by === "pm" ? "bg-teal-100 text-teal-800" : dismissed ? "bg-slate-200 text-slate-700" : "bg-green-100 text-green-800"}`}>{d.outcome === null ? `decided by ${d.by === "pm" ? "the PM" : "you"}` : OUTCOME_LABEL[d.outcome]}</span>
        <span className="ml-auto whitespace-nowrap text-[11.5px] text-slate-500">{when(d.at)}</span>
      </div>
      <div className="my-0.5 break-words text-[13.5px] font-semibold">{d.text}</div>
      <div className={`mt-1 break-words rounded border-l-[3px] bg-slate-50 px-2 py-0.5 ${dismissed ? "border-slate-400 text-slate-700" : "border-green-600"}`}>{d.outcome === null ? <><b>Answer:</b> {d.answer}</> : outcomeText(d.outcome, d.handle)}</div>
      {d.reason !== null && <div className="mt-1 break-words rounded border-l-[3px] border-slate-400 bg-slate-50 px-2 py-0.5 text-slate-700"><b>{d.by === "pm" ? "PM's reason:" : "Reason:"}</b> {d.reason}</div>}
      <div className="mt-1"><Who q={d} /></div>
    </div>
  );
}

interface Sent {
  readonly handle: string;
  readonly answer: string;
  /** Why the asking thread wasn't woken, or a warning of the record's write; null when all went. */
  readonly note: string | null;
  /** Set for a request closed without an answer. */
  readonly closed?: "ack" | "dismiss";
}

/** The panel's content, and the answering: what is open, what was just sent, what the board refused. */
function useAnswering(questions: readonly TaggedQuestion[], refresh: () => void) {
  const [opened, setOpened] = useState<string | null>(null);
  const [answered, setAnswered] = useState<ReadonlySet<string>>(new Set());
  const [looksOpen, setLooksOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const split = splitQuestions(questions.filter((q) => !answered.has(keyOf(q))));
  const open = (key: string | null) => {
    setError(null);
    setSent(null);
    setOpened(key);
  };
  const send = async (q: TaggedQuestion, text: string) => {
    const key = keyOf(q);
    // The order as shown when the answer was given: the next question is the one under it.
    const order = [...split.ranked, ...(looksOpen ? split.looks : [])].map(keyOf);
    setBusy(true);
    setError(null);
    setSent(null);
    try {
      const reply = await answerRequest(q.project, q.handle, text);
      setAnswered((a) => new Set([...a, key]));
      setOpened(nextAfter(order, key));
      const note = [reply.woken === false ? `Recorded; the asking thread isn't woken yet: ${reply.wake ?? "unknown"}` : null, reply.warning ?? null].filter((n) => n !== null).join(" ");
      const letter = OPTION_LETTERS.indexOf(text as (typeof OPTION_LETTERS)[number]);
      setSent({ handle: q.handle, answer: letter >= 0 && q.options[letter] !== undefined ? `${text} · ${q.options[letter]}` : text.trim(), note: note === "" ? null : note });
    } catch (e) {
      // Closed meanwhile, or refused: say why, and read the list again.
      setError(`${q.handle}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
      refresh();
    }
  };
  const close = async (q: TaggedQuestion, how: "ack" | "dismiss") => {
    const key = keyOf(q);
    const order = [...split.ranked, ...(looksOpen ? split.looks : [])].map(keyOf);
    setBusy(true);
    setError(null);
    setSent(null);
    try {
      const reply = await closeRequest(q.project, q.handle, how);
      setAnswered((a) => new Set([...a, key]));
      setOpened((o) => (o === key ? nextAfter(order, key) : o));
      const note = [how === "dismiss" && !reply.woken ? `Recorded; the asking thread isn't told yet: ${reply.wake ?? "unknown"}` : null, reply.warning ?? null].filter((n) => n !== null).join(" ");
      setSent({ handle: q.handle, answer: "", note: note === "" ? null : note, closed: how });
    } catch (e) {
      setError(`${q.handle}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
      refresh();
    }
  };
  return { ...split, opened, open, looksOpen, setLooksOpen, busy, sent, error, send, close };
}

type Answering = ReturnType<typeof useAnswering>;

function List({ a, decided }: { a: Answering; decided: readonly TaggedDecided[] }) {
  const [decidedOpen, setDecidedOpen] = useState(false);
  const [shown, setShown] = useState(CLOSED_PAGE);
  // Each question acts in its own project (Merge reads it from the context).
  const item = (q: TaggedQuestion) => (
    <ProjectContext key={keyOf(q)} value={q.project}>
      {a.opened === keyOf(q) ? <Opened q={q} busy={a.busy} onSend={(text) => void a.send(q, text)} onClose={() => a.open(null)} onDone={(how) => void a.close(q, how)} /> : <Row q={q} busy={a.busy} onOpen={() => a.open(keyOf(q))} onClose={(how) => void a.close(q, how)} />}
    </ProjectContext>
  );
  const heading = (rank: Rank) => (
    <h3 className="mx-0.5 mb-1.5 mt-3 flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-slate-500">
      <span className={`size-2 rounded-full ${rank === "escalated" ? "bg-red-600" : "bg-amber-500"}`} />
      {RANK_LABEL[rank]}
    </h3>
  );
  return (
    <>
      {a.error !== null && <p role="alert" className="mt-2 rounded-lg border-l-[3px] border-red-600 bg-red-50 px-2.5 py-1.5 text-red-900">{a.error}</p>}
      {a.sent !== null && (
        <div role="status" className="mt-2 break-words rounded-lg border border-green-600 bg-green-50 px-2.5 py-1.5 text-[12.5px]">
          {a.sent.closed === "dismiss" ? "⊘" : "✓"} <CodeChip code={a.sent.handle} /> {a.sent.closed === "dismiss" ? "dismissed" : a.sent.closed === "ack" ? "acknowledged" : a.sent.answer}
          <span className="block text-slate-500">{a.sent.note ?? (a.sent.closed === "dismiss" ? "the asking thread is told" : a.sent.closed === "ack" ? "nobody is woken" : "sent")}</span>
        </div>
      )}
      {a.ranked.length === 0 && <p className="mx-0.5 mt-3 text-xs text-slate-500">No open questions.</p>}
      {a.ranked.map((q, i) => (
        <div key={keyOf(q)}>
          {a.ranked[i - 1]?.rank !== q.rank && heading(q.rank)}
          {item(q)}
        </div>
      ))}
      {a.looks.length > 0 && (
        <>
          <Fold open={a.looksOpen} onClick={() => a.setLooksOpen(!a.looksOpen)}>{RANK_LABEL.look} · {a.looks.length}</Fold>
          {a.looksOpen && a.looks.map(item)}
        </>
      )}
      {decided.length > 0 && (
        <>
          <Fold open={decidedOpen} onClick={() => setDecidedOpen(!decidedOpen)}>Decided · {decided.length}{decidedOpen ? " · newest first" : ""}</Fold>
          {decidedOpen && decided.slice(0, shown).map((d) => <DecidedRow key={keyOf(d)} d={d} />)}
          {decidedOpen && decided.length > shown && (
            <button type="button" onClick={() => setShown(shown + CLOSED_PAGE)} className="w-full cursor-pointer rounded-md border border-slate-200 bg-white py-1.5 text-xs hover:border-blue-600 max-md:min-h-11">
              Show more ({decided.length - shown})
            </button>
          )}
        </>
      )}
    </>
  );
}

/**
 * The panel: open (416 px, scrolling by itself while the lanes scroll) or collapsed to a rail with the open count (looks
 * and FYIs left out) and an escalation mark. On a phone it is the Requests tab (`phone`), with no rail and no collapsing.
 */
export function QuestionsPanel({ questions, decided, open, setOpen, refresh, phone }: { questions: readonly TaggedQuestion[]; decided: readonly TaggedDecided[]; open: boolean; setOpen: (open: boolean) => void; refresh: () => void; phone: boolean }) {
  const a = useAnswering(questions, refresh);
  const count = a.ranked.length;
  const escalated = a.ranked.filter((q) => q.rank === "escalated").length;
  const tip = `${count} open question${count === 1 ? "" : "s"}${escalated > 0 ? ` · ${escalated} escalated to you` : ""}`;
  return (
    <>
      {!open && (
        <aside aria-label="Questions" className="flex w-14 flex-none flex-col items-center gap-1.5 self-stretch border-l border-slate-200 bg-white py-3 max-md:hidden">
          <IconButton tip="Open the Questions panel" onClick={() => setOpen(true)}>«</IconButton>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button type="button" aria-label={tip} onClick={() => setOpen(true)} className="relative mt-1.5 flex size-9 cursor-pointer items-center justify-center rounded-lg border border-amber-400 bg-amber-100 hover:border-blue-600">
                <span aria-hidden>❓</span>
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{count}</span>
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="left" sideOffset={4} className="z-[60] rounded bg-slate-800 px-2 py-1 text-xs text-white">{tip}</Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
          {escalated > 0 && (
            <button type="button" aria-label={`${escalated} escalated to you`} title={`${escalated} escalated to you`} onClick={() => setOpen(true)} className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-red-600 bg-red-50 font-extrabold text-red-600">!</button>
          )}
        </aside>
      )}
      <div className={`flex-none self-stretch border-l border-slate-200 bg-white max-md:border-l-0 max-md:bg-transparent ${open ? "" : "md:hidden"} ${phone ? "" : "max-md:hidden"}`}>
        <aside aria-label="Questions" className="w-[26rem] p-3 text-[13px] md:sticky md:top-0 md:max-h-screen md:overflow-y-auto max-md:w-full">
          {/* On a phone the Requests tab names it. */}
          <div className="flex items-center gap-2 max-md:hidden">
            <span aria-hidden>❓</span>
            <b className="text-[15px]">Questions</b>
            <span className="text-xs text-slate-500">{count}</span>
            <span className="flex-1" />
            <span className="max-md:hidden"><IconButton tip="Collapse the Questions panel" onClick={() => setOpen(false)}>»</IconButton></span>
          </div>
          <List a={a} decided={decided} />
        </aside>
      </div>
    </>
  );
}
