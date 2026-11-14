---
id: '0015'
title: "Needs You when the coordinator waits"
status: Outline
labels: ["kind:spike", "tier:M"]
dependencies: ['0008']
delivery: epic
---

## Goal

The board shows a braid in Needs You when the coordinator has stopped and is waiting for the user's answer (a stop case, a plan question, a merge request), preferably from the threads' own state rather than a label someone must remember to set (user, 2026-11-14).

## Working at the end

When the coordinator waits for the user, its braid sits in Needs You with the reason; when the user answers, it leaves.

## Possibilities to weigh

- **The coordinator's pending question in T3:** when it asks with the host's question tool, `t3 thread show` reports `pendingRequestCount > 0`, as for workers today. The coordinator's thread joins its braid by its worktree (on the braid branch). Gaps: questions asked in plain chat don't count; a coordinator on `plan/` or `main` doesn't join a braid.
- **A T3 "waiting for the user" state:** if T3 marks a thread whose last turn ended by asking the user (or adds such a field), read it. Needs T3 support; check what `t3 thread show` offers by then.
- **A `stop:<key>` label** the coordinator sets when it stops and removes when answered: works everywhere, but depends on the coordinator remembering both steps.
- **The PR side:** a recap that asks for the user's merge already shows as To Review; maybe only stops other than merges need this at all.

## Open questions

- Which of these, alone or combined; whether the skills should require the question tool for stops.
- Check T3's thread fields at the time (`t3 thread show --json`).

Plan it fully when its turn comes, asking the user if needed.
