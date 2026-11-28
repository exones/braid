## 2026-11-28 15:20Z checkpoint

done: sections 9-11 added to 0084/B's mockups.html (Acknowledge and Dismiss on panel rows, opened card and board card; Decided with an acknowledged and a dismissed request; the phone's Board | Requests switch), screenshots in ~/.braid/artifacts/agento/0084/C-*.png; plan in the brief. next: the user's look, then build. open: button style, details Requests tab buttons, default phone tab.

Decided (mockup proposals, pending the look): worded buttons instead of icons; the board card gets no new Answer button; the phone opens the last tab used, the first time Requests if something waits; the Requests badge counts open questions without looks and FYIs.

## 2026-11-28 15:34Z

Verdict (user via the coordinator, noisy-ribbon-05gq A, "Noisy ribbon mockups approved"): approved. Buttons with words; Dismiss and Acknowledge inside the card's question box (no Answer button on the card); none in the details panel's Requests tab; the phone reopens the last tab used, Requests the first time if something waits. Next: merge origin/main (0084/F, PR #388), then build.

## 2026-11-28 16:10Z checkpoint

done: built per the approved mockups (asks per item/strand/programme, per-request pushes, --ack/--dismiss and buttons, phone switch, demo, docs, tests, screens); origin/main (PR #388) merged. next: gate, commit, PR. open: nothing for the user.

Decided: the board's answer action also takes close ack|dismiss on both listeners with no confirmation, under D120's guard, because the user asked for the buttons on the phone and one click, instead of a separate action.
Decided: each request pushes under <id>#<code>; an upgraded board clears the old per-item pushes and sends each open request once, because the sequence ID has to differ per question, instead of keeping the old ID for the first.
Decided: a look beside a handover counts as asked (Needs You), as a lone look already does, instead of a separate rule for looks.
Decided: the dismissal wake keeps the "Wake: " prefix of the other board messages before the quoted line.

## 2026-11-28 16:42Z

Bug from the user (request shiny-monkey-mo72, via the coordinator), fixed on PR #393: on the phone, "I answer with a button A, refreshed, it came back active, I pressed it, it makes immediately everything inactive, no message". The PM reproduced it: POST /api/action/answer takes about 11 s (the record's git writes), the buttons grey out with no "sending" text; a reload mid-send shows the request open again; the second press is refused silently. Wanted for Answer, Acknowledge and Dismiss: "Sending…" with a spinner on the pressed button, "still sending (the record is being written)" after about 5 s, any error in words on the card, an already answered request shown as answered (who, what) instead of active buttons, covering a reload mid-send, and the "sent" line kept until a refresh confirms it. Tests, a live check at phone width with a slow answer, screenshots. The page not updating live is 0078/O's.

## 2026-11-28 16:53Z checkpoint

Correction from the user (via the coordinator): shiny-monkey-mo72 was answered in chat, not by the button, so the phone's presses never recorded anything. Finding so far (cause not proven): nothing on the server cuts at 11 s; an answer can take far longer (record fetch, up to 60 s lock wait, write, push, wake); an unexpected error answered a bare "500 error" and was logged nowhere; main's page shows errors only at the top of the Questions panel, off screen on a phone. Added: action logging (arrived/done/refused/failed/page gone, listener and peer, no token or text), errors in words, the sending states, BRAID_DEMO_ACTION_MS. Next: a real phone press (asked through the coordinator), then the gate.
