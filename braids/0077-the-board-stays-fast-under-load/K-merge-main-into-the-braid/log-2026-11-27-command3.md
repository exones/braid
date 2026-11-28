## 2026-11-27 22:48Z

Decided: the board answer action (0082/D) was made async (boardAnswer awaits fetch, record read and write; wakePageAnswer awaits the woken mark), since main had written it with the synchronous readers. Merge 459a183f.
Found: 0077 dropped readT3's ttl memory (resetT3Memory, ttlMs); main's tests lost those arguments. No decision number is shared by the two sides, so nothing was renumbered.
