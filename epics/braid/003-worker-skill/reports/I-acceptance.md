# I acceptance

I is Done after the human squash merge of PR21. The coordinator adopts the reviewed proof command and worker references for D; package publication and the final epic merge into main remain separate.

## What changed

`scripts/Test-PrProof.ps1` produces a finite current-head CI/artifact snapshot. Active readiness requires current scope, an unchanged open PR on the same target, the live target tip, and correctly ordered final merge parents. Historical merged proof is explicitly distinct. Offline fixtures remain part of verify; live network proof remains outside it.

## Why

Workers can produce one structured verdict instead of reconstructing the standard proof by hand. Independent review corrected cached-base and final-identity defects before adoption. The command remains a finite snapshot and implements the prose gate; it is not an atomic GitHub transaction or a merge decision.

## Left for you

No action now. Continue D's bounded evaluation on this adopted baseline. D's own proof, independent review and human merge still precede the final epic gates. K stays deferred.

## Technical record

- Checked head `4fed09d514ceaa7d90b4ab5fe1be2e45f76bfcb4`; checked base `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`. [PR21](https://github.com/exones/braid/pull/21) human squash merge `d66843cfb23b1c5c3891732c458d30d2b077fae1` into `epic/braid-003-worker-skill` at `2026-11-05T09:52:12Z`, verified via GitHub. Squash ancestry is not claimed: merge and checked head have identical tree `74eac2da893d1fa1af1dd7a20b29c8f65ec65696`, diff empty. Plain git pull preserved unpublished coordinator records through merge `48fe75c724aca0ddf271661bc18f980e29f8fd4e`.
- Workflow `.github/workflows/ci.yml`, push run `41961723639` attempt1: Ubuntu job `127029392267`, Windows job `127029391373`, SUCCESS. Pull_request run `41961730264` attempt1: Ubuntu job `127029412439`, Windows job `127029412879`, SUCCESS. Install dependencies, Verify and Upload packed tarball SUCCESS on all four. Push source is checked head. PR source is merge-test `1b08f102475da058f09ca8a5f94ff6e5863f1110`, parents checked base then checked head. Provenance candidate true, worktreeDirty false; PR head field equals checked head and push field empty.
- Full artifact proof independently verified by review003: push Ubuntu artifact `13385488438`, archive SHA256 `a02ffe9ad27f8ec304d7ef40fad036dba4675db5ebbbf04645096c093d776abc`; push Windows `13385956584`, `60c71a12dd64018cd23417789ec31aa1e173f72c173bbc6c01b848ee3f61d48d`; PR Ubuntu `13385248381`, `9789e5b2d66f445044057f74b6aae2e89c8cff6d5a0e00ade93e92fc29dc3262`; PR Windows `13385373920`, `c3b817a57691260130595376954c067be2800943a753973ebcb30fb53de7a151`. Each contained tarball matched provenance digest `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`. Equal digests are this head's observation. SkipArtifacts was not used.
- [Review001](reviews/I/I-pr-proof-script-review-001.md) High F1 fixed at d5fbbff; [review002](reviews/I/I-pr-proof-script-review-002.md) Medium F1 fixed at checked head; [review003](reviews/I/I-pr-proof-script-review-003.md) checked exact head, no findings. [Triage](I-coordinator-triage.md) retains dispositions, copied-output hashes and limits. No formal GitHub approval claimed. Fixtures and live full-mode proof passed; author's local full verify was a dirty probe from d5fbbff with40 tests, both skill validators passed. Reviewer did not repeat full verify/validators; hosted Verify supplied clean candidate evidence. No live close/retarget trial.
- Adopted operating revision `d66843cfb23b1c5c3891732c458d30d2b077fae1`, immutable installation `C:/Users/exon/.codex/braid-pins/d66843cfb23b1c5c3891732c458d30d2b077fae1`, worker source `.agents/skills/braid-worker/SKILL.md`, blob `13c3cf9679f6abb78d242840a80574abeb5ecf9d`. Full relative reference graph retained outside candidate checkouts, no .git or writable worker checkout. Main-ahead check after fetch returned0; no main sync needed. No product controller run, package0.1.1/schema1 unchanged. The scoped I base freeze ends with this verified merge and publication of retained records; no general push-timing policy is adopted from deferred K.
