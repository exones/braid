---
id: '0080/E'
title: "Hold and Resume reach every thread"
status: Outline
labels: ["kind:story", "tier:L"]
dependencies: ['0080/C', '0080/D']
order: 50
---

## Goal

Signed in, the board's hold and limit pause stop every working thread of the braids they cover at once, delegated children included, and the resume gets through after a T3 restart. Builds on 0074's pause by code and its one resume path (already retrying a failed send until delivered, idea qcf4); starts only after 0074 is in `main` and `main` is merged into this braid. Ideas t4oj and b1yb (its gaps 1, 2, 3 and 5; "Hold all" itself is P5's).

## What works at the end

- A hold or a limit pause first interrupts each running thread with `t3_thread_interrupt` `stop: true` (children stop with their parent, first pass: about 1 to 4 s), then sends the pause words; the board lists each stopped parent's children and shows any still running. Signed out, it sends only, as today.
- Threads are found through T3's thread list, not only the board's records.
- The limit clash: a thread whose last run failed on a usage limit (0080/C's `failureOf`) counts as paused; the board doesn't nudge or message it except with the resume. T3's own usage-limit auto-resume stays off; the docs say why.
- Resume (limit or hold Go) uses 0074's one path and retries until T3 answers.
- Live check on scratch threads with a scratch child, archived afterwards.

## Open questions

- What 0074's final pause path looks like once merged (where the interrupt slots in).
- Whether a stopped parent's "restart your tasks" invitation needs the pause words to say not to.
