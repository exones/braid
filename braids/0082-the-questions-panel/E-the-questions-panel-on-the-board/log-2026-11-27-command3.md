## 2026-11-27 09:41Z

Decided: scope, the panel lists only requests that reach the user (the cards' routing): one the PM is still handling is not listed until it escalates or is forwarded. A non-look request that nothing waits on (an open question on a Done item) gets its own ranked group 'Blocks nothing' above the folded Look and FYI, which keeps only the look kind (D118); a look stays folded even when escalated.

## 2026-11-27 10:16Z

Built the panel, model, demo data, tests and docs; npm run verify passed (816 tests). The demo screens run found a crash after an answer (an effect returned scrollIntoView's promise as its cleanup), fixed before commit.
