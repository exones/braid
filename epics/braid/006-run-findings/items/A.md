# A: keep agents off real data; exact project facts for workers

- Kind: task. Tier: L. UI: no.
- Expected size: about 40 changed lines in five files; the worker skill grows by at most 115 words.
- Branch: `item/006-a-worker-facts` at the epic tip given at launch.
- PR into: `epic/006-run-findings`.
- Result to: the coordinator thread given at launch.

## Goal

In the first real run a test wrote fixture data into the user's real `%LOCALAPPDATA%`, a worker
read the user's own checkout to take a screenshot, and workers lost minutes guessing setup, shell
and test commands in fresh worktrees. Make the worker skill and the `BRAID.md` template prevent
that, by replacing wording rather than adding explanation.

## Start here

- `.agents/skills/braid-worker/SKILL.md` (735 words now).
- `.agents/skills/braid-coordinate/assets/braid-md.md` (218 words now).
- `.agents/skills/braid-coordinate/references/workflow.md`, section "Checks" only.
- `BRAID.md` and the README section "Braid skills in other projects".

Don't read `epics/reports/`; this brief has what you need.

## Change

Use this wording. Adjust grammar to fit the surrounding text, but don't add sentences.

1. `braid-md.md`, front matter: after `ci: []` add three optional fields.

   ```yaml
   shell: <optional: shell the agents' commands run in, for example pwsh 7>
   setup: <optional: run first in a new worktree, for example npm ci>
   test: <optional: focused test command, for example npx vitest run <file>>
   ```

   In the field notes below the heading, replace the `ci` and `models` bullets, and replace the
   "Setup" bullet with the "Real user data" one:
   - "`ci`: check names that must be green on a PR. `[]` means every reported check; `none` means
     the project has no hosted CI, and the gate run before the PR is the evidence."
   - "`models`: `provider / model-id / key=value, …`, with the exact IDs and option names the host
     lists (in T3: `orchestrator_capabilities`), for example `cursor / claude-sonnet-4-6 /
     effort=medium`. Options left out mean host defaults." Keep the existing sentences about
     `<role>.<kind>` and `skill:`.
   - "Real user data: <where the app keeps it, for example `%LOCALAPPDATA%\<app>`>. Agents never
     touch it; a brief may allow a read-only look."

2. `braid-worker/SKILL.md`:
   - Start, step 1: list `setup`, `shell` and `test` among the facts read from `BRAID.md`.
   - Start, new step 3: "Use `setup`, `shell` and `test` when provided; otherwise follow project
     conventions. In a new worktree, run setup before building or testing."
   - Work, new bullet: "Keep project edits in your worktree. Installed-skill reads and documented
     setup/toolchain use are allowed; installed-skill edits are not. Protect real application data.
     Tests and your own runs use temporary folders: in the test process, point `HOME`,
     `USERPROFILE`, `APPDATA`, `LOCALAPPDATA` and `XDG_*` there as well as the app's own settings,
     so a test of default paths stays inside. A read-only look at real data needs the brief's
     permission."
   - Work, new bullet: "Screenshots and scratch files (helper scripts, PR body drafts) go in
     `~/.braid/artifacts/<repo>/<epic>/<ID>/`, never in the repository."
   - Work: "Run focused tests while you work" becomes "Run focused tests (`test` in `BRAID.md`)
     while you work".
   - Deliver, step 3 starts: "If `ci` is `none`, go to step 5." Step 5 starts: "When every
     required check is green on your latest commit, or `ci` is `none`, call `unwatch_pull_request`
     if you watched, then …".
   - Habits: replace the "task prompt again" bullet with: "If you see your task prompt again, run
     `gh pr list --state all --head <branch>`. If your PR is merged, you're done: stop without
     reporting again. Otherwise carry on from where you are."
   - Final report, Screenshots line: "only for UI work: the final screens, embedded as images from
     your artifacts folder. Start the app with `run` from `BRAID.md`."
   - To stay within the cap, shorten Deliver step 4's sub-bullets; keep their meaning.

3. `workflow.md`, "Checks": replace the second bullet with "CI evidence is CI's own result: green
   `gh pr checks` on the PR's latest commit, limited to the `ci` names in `BRAID.md` if it lists
   any. A required check that never reports isn't green. With `ci: none` the gate run before the PR
   is the evidence."

4. `BRAID.md` (braid's own), front matter: add

   ```yaml
   shell: pwsh 7.6+
   setup: npm ci, with Node.js 26 on PATH (README "Build and verify")
   test: node --test test/<file>.test.ts; Pester suites: pwsh -NoProfile -File scripts/Test-Pester.ps1
   ```

   In the body, delete the "Setup before the gate works" bullet and add: "Read installed skills;
   don't edit them. Documented setup may install/reuse the shared Node.js toolchain. Tests use
   temporary skill destinations and toolchain stores, never the real installations."

5. README, "Braid skills in other projects": add `shell`, `setup` and `test` to the list of facts
   `BRAID.md` holds, and one sentence: "Agents keep screenshots and scratch files in
   `~/.braid/artifacts/`, outside every checkout."

## Already decided

- Review correction: distinguish real application data from authorized skill reads and toolchain
  setup/use. Keep test isolation and the word caps; compress existing prose as needed. Replace any
  U+FFFD corruption with ASCII `...`. Optional fields fall back to project conventions.

- Artifacts live outside every checkout; no `artifacts:` field and no `.gitignore` change.
- `shell`, `setup` and `test` are optional; a project without them works as today.
- Agents don't validate models against the host; the user writes exact IDs.
- Keep the final report format and the Deliver flow; they worked in the run.

## Out of scope

- The coordinator skill, `epic.md`, `brief.md`, `review.md`, and every other section of
  `workflow.md` (item B).
- New tests or scripts, sandboxing, changing `TEMP`/`TMP` or your own shell's environment, other
  projects' `BRAID.md`.

## Done when

- Word caps hold: worker skill at most 850 words, `braid-md.md` at most 300. Put before and after
  counts in the PR description.
- Following only `BRAID.md`, a fresh braid worktree gets from `setup` to a passing focused test.
- Walk-throughs in the PR description, one or two lines each: a test that clears the app's data
  setting to test the default path stays in a temporary folder; with `ci: none` the worker reports
  without watching; a replayed prompt after the merge ends without a second report.
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm ci
node --test test/cli.test.ts
npm run verify
foreach ($f in '.agents/skills/braid-worker/SKILL.md', '.agents/skills/braid-coordinate/assets/braid-md.md') {
  '{0,5} {1}' -f ((Get-Content $f -Raw) -split '\s+' | Where-Object { $_ }).Count, $f
}
```
