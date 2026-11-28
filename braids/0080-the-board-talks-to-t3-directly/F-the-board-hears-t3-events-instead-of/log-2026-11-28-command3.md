## 2026-11-28 13:54Z

Decided: events are polled at the shorter of T3's nextPollMs and 5 s (30 s after a failed poll): three in-memory reads in T3, and at 30 s they would add nothing to the 30 s refresh.
Decided: "pending count cached" holds only while the events are being read since before that read; a working thread with a pending question, a changed status or latest run, or named by an event is read again.
Decided: the full list is the unsettled threads (settled: false); the settled ones are listed once (first read, and after a truncated page), because PM and request threads and coordinator buttons need them; a thread that leaves the unsettled list is read once. Never an unfiltered or finished-status list.
Decided: the stop step (0080/E) takes the refresh's live list (up to 10 s old) and the list is now paged to its end (it costs by live threads only).
Decided: the MCP and CLI reads share one assembly (snapshotOf in src/board/t3.ts), so the lanes can't differ by path.
