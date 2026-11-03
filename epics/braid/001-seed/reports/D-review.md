# D: coordinator candidate inspection and independent local proof

Date: 2026-11-03. Current result: D Done after human merge; chronological inspection evidence follows.

## Final delivery and merge

Verified [PR #2](https://github.com/exones/agento/pull/2) is human-merged at `d81f4a5765b6b34e686d3827a15aaaf726e76f01`, 2026-11-03T18:20:40Z. Final PR head `147a4bd10ec0e45b4c25c9adee4ce9751d2502a6` passed [Windows/Ubuntu PR CI](https://github.com/exones/agento/actions/runs/41692089275); push-triggered checks also passed. Runtime/tests/package/scripts/workflows match the reviewed product revision `2cf2bf2`. Independent pass 02 resolved the original findings. D meets its delivery gates; no publication, release, or persistent controller promotion is implied. The user requested continuation to D1. Earlier In Review statements below describe the checks at those earlier boundaries.

PR: [#2](https://github.com/exones/agento/pull/2), branch `feat/package-bootstrap`, implementation head `10ff911294a72957fe7fc689757bb33d3c72b38d`. Coordinator owns subsequent status/evidence metadata; product/package changes require meaningful revalidation if made.

## What D introduces

- **Installable local controller:** previously the supported usage ran compiled files from the checkout. D adds exact-tarball installation in a clean consumer outside that checkout and proves the installed `agento` executable can perform the schema 1 ledger lifecycle. This is a private, unpublished candidate, not a registry release or stage 2 controller promotion.
- **Package verification entry point:** `npm run package:proof` runs the PowerShell package gate; the normal Verify entry point now includes it after the existing 40 product tests. It exercises separate installed CLI processes, paths with spaces, stored kinds, invalid transitions, preservation, lock timeout, concurrency, and relevant platform behavior. Lifecycle scripts cannot recurse into the pack/install proof.
- **Artifact identity:** `artifacts/package/` retains the exact tarball, npm pack metadata, and provenance sidecar with source SHA, dirty/candidate flags, tool versions, and digest. A dirty local probe is distinguished from clean committed-candidate proof. Nothing claims npm attestation or cross-platform byte reproducibility.
- **CI and release preparation:** Windows/Ubuntu jobs run the same gate and upload package artifacts; a manually triggered release workflow is prepared with publication guards. It has not been dispatched. npm owner/name selection and release configuration remain separate user-controlled setup.
- **Operating instructions:** README explains installing a fixed tarball outside development output, and distribution documentation lists the npm name collision and concrete setup steps. Schema, ledger commands, `.agento/` storage behavior, and manual completion semantics are unchanged.

The independent Windows proof below passed, but the later Ubuntu failure means D's full platform acceptance remains open. These notes describe implemented behavior and its evidence boundaries, not release readiness.

## Evidence inspected

Read worker `reports/D.md` and `checkpoints/D.md`, package/provenance, packing and verification scripts, package manifest, CI/release workflows, updated install/distribution instructions, and draft final report. Inspected archive listing: compiled `dist`, package manifest, and README; no development state, source tree, credentials, or runtime dependency on checkout paths was found in that inspection. Source maps/declarations are currently included under `dist`; that is not a source-import dependency.

Initial local checkout and index were clean at `10ff9112`. Independently ran `$env:AGENTO_REQUIRE_CLEAN = '1'; pwsh -NoProfile -File ./scripts/Test-Package.ps1`: exit 0, Node v26.13.0/npm 11.20.0/PowerShell 7.6.9. Rebuilt, packed, installed the exact tarball in a temporary consumer outside the source checkout, and exercised the installed executable through the script's lifecycle/failure/preservation/concurrency checks. Lock timeout was 5403 ms. Provenance records `sourceRevision` `10ff911294a72957fe7fc689757bb33d3c72b38d`, `worktreeDirty: false`, and `candidate: true`.

Artifact: `C:\code\agento\artifacts\package\agento-0.1.0.tgz`; SHA-256 `e40abb72422dacfc27a5f2d7a1f46dfda200640bc4f11c2640e936b4f809f3fb`, independently matched both before and after the run. Sidecar: `agento-0.1.0.provenance.json`. Both are gitignored. This supports the clean Windows candidate; no cross-OS byte-equality claim is made.

Worker's full Verify run already passed typecheck/build/40 tests plus package proof. The coordinator reran the new package gate, not the unchanged full product suite redundantly. Hosted Windows/Ubuntu PR #2 checks were In Progress when first queried; no hosted pass or artifact upload is claimed yet. The release workflow was not dispatched; no registry upload, tag, GitHub Release, merge, or stage 2 start occurred.

## Fresh review and open points

Assign R independently on this concrete candidate, including full seed outcomes and the new package/CI/release preparation. R must judge correctness, acceptance evidence, shell/native failure handling, source independence, artifact identity, current release-setup instructions, and limits. It is not a formal GitHub platform approval. Do not present this coordinator inspection as final acceptance.

The npm owner and available package name remain user decisions before publication. Worker lookup reports unscoped `agento` is another public package. Continue CI/review independently and retain `private: true`; never infer an npm scope from GitHub. Release setup changes, if later authorized, must preserve runnable verification for the selected publication identity.

R delegation request: client ID `4a749143-ddd0-4ea3-acab-cc90e7428378`, Sol High through Codex in the shared checkout, product read-only and only `reports/R.md` / `checkpoints/R.md` writable. No other implementation worker is active. Parent preserves product and Git state while review runs. Return findings before any final report/retro closure.

Review indexing update: this existing epic-wide assignment is `AGENTO-001/review-01`; R remains its legacy alias. The active output paths stay unchanged until the reviewer returns. Parent-scoped report/checkpoint filing and legacy pointers follow the new workflow convention. Routine future item reviews do not consume backlog letters.

## Ubuntu CI failure on review head

Host wake-up reports Ubuntu failure on `848d4d50e918ecd4586bad30a4ff67acd70efea5`. Read [run 41671972482, job 126042437548](https://github.com/exones/agento/actions/runs/41671972482/job/126042437548) failure logs: typecheck/build and all 40 product tests passed, clean pack and tarball install succeeded, then package proof exited 1 with `installed shim does not point at agento/dist/cli.js`.

Cause: `scripts/Test-Package.ps1` reads `.bin/agento` as text and requires a Windows-style wrapper reference to `agento/dist/cli.js` on every platform. npm's bundled `bin-links/lib/link-bin.js` and `link-gently.js` show POSIX bins are symlinks. Reading the POSIX bin follows the link and reads `dist/cli.js`, which correctly imports `./main.js` and has no wrapper-path literal. This is a package-proof portability defect; the failed installed ledger scenario has not yet run on Linux, so do not claim full Linux package proof.

Fix queued after R returns, preserving its exact candidate: validate Windows wrapper text as before; on POSIX resolve the installed bin symlink and compare its target to the installed package entry, then retain every executable scenario. Do not skip the installed proof or loosen acceptance. Parent changed only owned review/status metadata during this wake-up, without stage/commit/push or product mutation. R and the existing PR watch continue; no replacement reviewer or implementation delegate was launched.

## Changes after the review returned

The completed review is now [AGENTO-001/review-01](reviews/AGENTO-001/01.md), with legacy R pointers. It confirms the Ubuntu bin check and identifies hardcoded provisional name/version/privacy assumptions that made the documented release transition fail verification. Both are corrected locally; no existing lifecycle, preservation, concurrency, or manual-evidence assertion was removed.

The installed-bin check now distinguishes Windows wrapper files from POSIX symlinks, while verifying the selected package entry in both cases. Package identity/version/private mode and tarball/provenance names now follow the manifest and npm pack result. Scoped names are installed under their actual scoped package directory; the executable remains `agento`. CLI metadata/version tests check the supported manifest-driven behavior. Today's manifest is unchanged and remains private.

Validation after correction: normal `scripts/Verify.ps1` exited 0 on Windows with typecheck/build, all 40 tests, and package proof (dirty pre-commit probe, lock timeout 5431 ms, digest unchanged at `e40abb...`). A temporary manifest fixture `@agento-proof-fixture/agento`, version `0.1.1`, private false passed the 8 CLI tests and full package proof; its distinct tarball digest is `ad628e98a01aa8e3731fa28a91ee18627ef98e0cf90bb98b50ac38b046f592cf`, candidate false. Fixture evidence is gitignored under `artifacts/fixtures/scoped-identity/`. The original package manifest was restored byte-for-byte in cleanup. This fixture is not a selected npm identity or a publication.

The user's workflow changes are also persistent: parent-scoped review records preserve each checked revision and findings, and completed-item reports/briefings now explain introduced capabilities, important changes, validation, and limitations. Coordinator skill structural validation, documentation links, and formatting passed. These policy changes and product-proof corrections still need the next independent review; final CI, skill behavior proof, report/retro reconciliation, and human merge remain open.

## Corrected candidate and hosted CI

Clean corrected head `2cf2bf25957869dc94fec0718a6dbc67e905f8d7` passed the independent Windows package gate: exit 0, candidate true, dirty false, source revision matches HEAD, digest `e40abb72422dacfc27a5f2d7a1f46dfda200640bc4f11c2640e936b4f809f3fb`, lock timeout 5427 ms. Runtime/package inputs are unchanged; the corrected proof/metadata scripts are outside the tarball.

The coordinator verified [PR CI run 41674990291](https://github.com/exones/agento/actions/runs/41674990291) succeeds on exact head `2cf2bf25957869dc94fec0718a6dbc67e905f8d7`. [Windows job 126053095370](https://github.com/exones/agento/actions/runs/41674990291/job/126053095370) and [Ubuntu job 126053095962](https://github.com/exones/agento/actions/runs/41674990291/job/126053095962) both complete verification and packed-tarball upload successfully. GitHub lists non-expired artifacts `agento-package-windows-latest` and `agento-package-ubuntu-latest`. Push-triggered CI also succeeds. This establishes the previously failing Ubuntu installed-package path on the corrected candidate, without a general reproducibility or publication claim.

Independent review pass 02 and the isolated fresh short-goal skill exercise are still pending; no delegate was polled. Keep D In Review and reconcile their results/final report/retro at the next boundary. This CI evidence is an owned uncommitted update to include with the returned validation records, rather than a separate metadata-only push now.

## Final review and readiness reconciliation

[Independent pass 02](reviews/AGENTO-001/02.md) returned no actionable P1/P2/P3 finding on exact `2cf2bf25957869dc94fec0718a6dbc67e905f8d7`. The coordinator copied both reviewer outputs byte-for-byte from its isolated worktree, preserving exact scope/revision and its explicit limits. The reviewer independently checked bin branch behavior, manifest-driven proof, retained artifact identity, unchanged installed scenarios, and the user's workflow/reporting conventions. Hosted Linux execution is supplied by the separate passing CI record above, not attributed to the reviewer's Windows probes.

[Skill behavior proof](skill-proof.md) is also accepted: a fresh short-goal planning run found/read the workflow through AGENTS, produced a plan/story/checkpoint/report, preserved production state, and stopped before implementation. Its retained DOC1 proposal remains unapproved validation evidence. This resolves the declared bootstrap evidence gap without claiming invisible UI selection or every host/branch.

[Candidate report](final.md) and [retrospective](../retro.md) reconcile actual changes, outcome proof, retained failures/fixes, artifact/revision identity, and remaining authority. No further product fix or review round is indicated by current findings. This final evidence-only successor changes reports/checkpoints/validation records only; product/package inputs stay as reviewed at `2cf2bf2`. Require current-head hosted CI and the human merge decision before D Done. Keep publication, controller promotion, and stage 2 separate. GitHub is authoritative for the successor's checks; no additional commit is needed just to copy an evidence commit's own CI back into these files.
