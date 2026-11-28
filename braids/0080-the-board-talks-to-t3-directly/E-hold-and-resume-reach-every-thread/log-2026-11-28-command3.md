## 2026-11-28 12:47Z

Decided: one live-only `t3_thread_list` with `allProjects: true` per tick, shared by every braid (lighter than one per braid; T3's projectId is not braid's folder). One page of 100 live threads, no paging.
Decided: a hold is acted on once, when the board (repository lease, signed in) first sees it without `replies`: its targets are the braid's working threads on every provider (`targetsOf` with provider null), minus the thread that ran `braid pause --hold`. The hold record carries `targets`, `replies` and `stop` like a board record (`patchPauses` takes which records it may change).
Decided: "still working" = live targets that haven't answered plus live children of targets, checked each tick for 10 minutes while replies are counted or a thread still runs; one push at 2 minutes (key `pause:still:<braid>:<stop time>`). Answered targets don't count, since the text itself starts a short reply turn.
Decided: a hold settles its count without a push or PM message (the still-working push is its alarm).
Decided: the limit clash in the count is read from the `thread show` output it already makes (`failureOf` on `error`); nudge and remind read `sig.failures` (0080/C).
Decided: a target that is a delegated child is never interrupted, even when its parent isn't a target; it shows as still working if it keeps running.
