## 2026-11-28 10:50Z

Decided: no decision renumbered. main's 0077 decisions have slug IDs (D-board-async, D-running-count), so D121 and D122 do not collide. Rows are ordered D121, D122, then the slug rows.
Found: in test/requests.test.ts neither import is kept: main removed resetT3Memory from src/board/t3.ts (0077) and 0084/A removed the only use of handleOf.

## 2026-11-28 12:01Z checkpoint

done: origin/main (397b2431) merged as 24d9eb9c, conflicts resolved; openRequest/replaces keep 0084/A rule; the three request suites pass (46/46). First npm run verify: exit 1, 856 pass, 2 timing failures under load (inbox "first note creates braid-inbox", requests "asynchronous wait outlasts a moving lock queue"); both pass when run alone.; next: rerun npm run verify (the second run was killed unfinished for a machine restart), write report.md, tick the Completion boxes, push, open the PR into braid/0084-several-open-questions-per-item.; open: gate not finished; no PR.
