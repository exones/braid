---
programme: <slug>
title: <short goal>
goal: <the user's goal in one line>
thread: <your thread id>
limit: 2
state: running
hold:
next: <which row starts next, and what it waits for>
digest:
rows:
  - P1 | - | <title> | planned
---
# PM plan: <short goal>

The front matter above is what the board reads; `braid check --plan pm/<slug>.md` checks it before every push. `rows` lists one line per sketch: `P<n> | <braid number or -> | <title> | <state>`. `state` is `running`, `held`, `done` or `stopped`; `hold` is empty, or `<ISO time> <the user's words>` while the user holds the work.

Branch: `pm/<slug>`

## Goal

<the user's words, quoted>

## Decisions

The user's decisions, quoted and dated, then the PM's own (one line each, with the braid it answered).

- <date>, user: "<their words>"
- <date>, PM for P<n> · <number>: <what>, because <why>

## Braids

| Row | Sketch | Braid | Coordinator thread | Depends on | State |
| --- | --- | --- | --- | --- | --- |
| P1 | <title>: <two or three lines> | <number or -> | <thread id or -> | <rows or -> | planned |

Row states: planned, running, waiting on user, ready to merge, done, stopped, dropped. Keep each row's braid, title and state the same as its `rows` line.

## Next

<which row starts next, and what it waits for>

## Change log

- <date time>Z: <what changed and why>
