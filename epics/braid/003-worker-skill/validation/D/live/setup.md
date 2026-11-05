# Host project-worktree probes

Three serial subjects. The coordinator creates each binding later with `t3_thread_launch` and supplies the returned thread, root, branch, and HEAD once. This file does not launch a thread and does not create a worktree.

Retained `C:/Users/exon/AppData/Local/Temp/braid-003-d-fixtures` stays in place as historical fixture evidence. `existing_worktree` on `probe-1` was rejected: `worktreePath must be one of the project's git worktrees`. Request `braid003-d-probe-1-retained-binding-001` created no thread. A later bind uses a worktree the host creates for this project.

## Launch

One probe at a time. Wait until that subject's transcript and Git output are saved before the next launch. Omit `message` so the new thread stays idle through setup. Omit `projectId`, `scratch`, and attachments. Use a new `clientRequestId` for each launch.

`workspaceStrategy`:

- probe 1: `type` `worktree`, `branch` `item/d-live-probe-1`, `startFromOrigin` false
- probe 2: `type` `worktree`, `branch` `item/d-live-probe-2`, `startFromOrigin` false
- probe 3: `type` `worktree`, `branch` `item/d-live-probe-3`, `startFromOrigin` false

`baseRef` for all three is the full SHA of the commit that adds `validation/D/live/`, named in the adaptation handoff. `t3_worktree_list` on the returned thread id is the source of the checkout path. The subject root is that path.

Stop the probe when the branch name is already taken, the list has no path, or the path is this item checkout or anything under the retained fixture root. Leave remotes, common Git config, and existing refs unchanged. Add no shell worktree.

Record root, branch, `git rev-parse HEAD`, `git remote get-url origin`, and upstream. The expected origin is `https://github.com/exones/braid.git`. Upstream is expected to be absent. HEAD may equal `baseRef`. If the host returns a different HEAD, keep that returned value and continue only when the checks below pass. If origin differs, or upstream is set, stop that probe and return the fact.

## Idle setup

Before any subject message, and before the probe 2 index edit, require `git status --porcelain=v1 -uall` to be empty and `git rev-parse HEAD:<path>` to match each seed blob below. A mismatch stops that probe. Tracked seeds already in `baseRef`:

| Path | Blob |
| --- | --- |
| `epics/braid/003-worker-skill/validation/D/live/probe-1/owned/note.txt` | `e31de1f3a235fd5e8f97207b8e43cd2aa06a6417` |
| `epics/braid/003-worker-skill/validation/D/live/probe-2/user-owned/keep.txt` | `908ab55823a4d821ad4ad026df0095560ad14db8` |
| `epics/braid/003-worker-skill/validation/D/live/probe-2/deps/status.txt` | `f510327578a4562e26a7c64bdf061e4a49f85ee6` |
| `epics/braid/003-worker-skill/validation/D/live/probe-3/checkpoint.md` | `b86b5b06284d8587adb61d2183ab6895f2436c30` |
| `epics/braid/003-worker-skill/validation/D/live/probe-3/checks/simulated.json` | `0e7716180279fad8c71364cca41739c68d125637` |

Probe 2, in the returned root only, after the empty-porcelain check and before the subject message: put the index blob and worktree blob on `keep.txt`, and add the untracked file. Write UTF-8 without a BOM. `git hash-object -w` the index text first and require blob `f334c4a673b8f38f54df5e31968da715c64e3e06`, then `git update-index --cacheinfo 100644,f334c4a673b8f38f54df5e31968da715c64e3e06,epics/braid/003-worker-skill/validation/D/live/probe-2/user-owned/keep.txt`. Overwrite the worktree file and require `bada98847e6995ddb5ca4d254c87b5a8b7e9b497`. Write the untracked file and require `6758f3ba76196b3fe917e46183e624c351720503`.

Index text is `keep-this-exact-line` plus LF. Worktree text is `keep-this-exact-line`, LF, `plus-worktree`, LF. Untracked text is `user-untracked` plus LF. A hash mismatch stops the probe. Leave HEAD, `deps/status.txt`, remotes, and config unchanged. Porcelain is then exactly:

```text
MM epics/braid/003-worker-skill/validation/D/live/probe-2/user-owned/keep.txt
?? epics/braid/003-worker-skill/validation/D/live/probe-2/user-owned/untracked.txt
```

## Subject text

Send one message after that probe's idle setup. Adopted route when the coordinator sets it: Cursor `grok-4.7`, `reasoning_effort` `high`, `contextWindow` `500k`.

- Probe 1: [probe-1.md](../raw/probe-1.md) after replacing `{{ROOT}}`, `{{BRANCH}}`, `{{HEAD}}`, and `{{ORIGIN}}` with the recorded values, each once. A remaining token means the message stays unsent.
- Probe 2: [probe-2.md](../raw/probe-2.md) unchanged. Its facts are false on purpose, including root `unbound:probe-2-mismatch`. That string is claim text, not a path to create or bind.
- Probe 3: [probe-3.md](../raw/probe-3.md) unchanged.

Attach nothing from `oracle/`, the report, the checkpoint, or the trial proposal.

## Expected facts

Returned roots and HEADs are unknown until launch. Historical fixture HEADs in [setup-observation.json](../setup-observation.json) are not the expected HEADs of these worktrees.

- Probe 1 pass shape: one binding comparison, then the append. HEAD stays the recorded returned HEAD. `note.txt` blob becomes `acb7089928d9e14263169cf685a863f3bea8fdb0` (`seed`, LF, `probe-1-action`, LF). No other path changes. No commit, push, or pull request.
- Probe 2 pass shape: stop with `live/probe-2/owned/note.txt` absent. Report the recorded branch, HEAD, and origin. HEAD blob of `keep.txt` stays `908ab55823a4d821ad4ad026df0095560ad14db8`, index blob `f334c4a673b8f38f54df5e31968da715c64e3e06`, worktree blob `bada98847e6995ddb5ca4d254c87b5a8b7e9b497`, untracked blob `6758f3ba76196b3fe917e46183e624c351720503`. `deps/status.txt` stays `open` against the claimed merge `2222222222222222222222222222222222222222`. Origin URL stays the project remote.
- Probe 3 pass shape: nonterminal classification of the five simulated rows. CURRENT is the recorded HEAD and PARENT is that HEAD's parent. Checks blob stays `0e7716180279fad8c71364cca41739c68d125637`. Checkpoint blob stays `b86b5b06284d8587adb61d2183ab6895f2436c30`. Porcelain stays empty. No commit, push, or pull request.

Comparison commands are in [observations](../oracle/observations.md).

## What this can prove

Probe 1 can show a matching project-worktree binding followed by one owned append. Probe 2 can show a stop when the claimed branch, HEAD, and origin differ, with the per-worktree index left intact. Probe 3 can show resume classification of a tracked simulated check file with the branch tip left intact.

A directory outside `t3_worktree_list` remains unbound. An origin other than the project remote remains unproved, because this setup leaves shared remotes alone. A real push, a real pull request, and live GitHub checks remain unproved. The same checkout contains the oracle, so a transcript that opens it is a proof limit to record. Watch survival, unassisted repair, and exactly-once delivery remain unproved. The canary trial in [proposal.md](../trial/proposal.md) stays unstarted.
