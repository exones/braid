## 2026-11-28 10:50Z

Decided: no decision renumbered. main's 0077 decisions have slug IDs (D-board-async, D-running-count), so D121 and D122 do not collide. Rows are ordered D121, D122, then the slug rows.
Found: in test/requests.test.ts neither import is kept: main removed resetT3Memory from src/board/t3.ts (0077) and 0084/A removed the only use of handleOf.
