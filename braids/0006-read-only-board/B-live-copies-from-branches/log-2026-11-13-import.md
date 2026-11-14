## 2026-11-13 22:01Z

Decisions: a braid branch is read too (its brief and strands), not only strand branches: a strand without its own branch shows its state on the epic branch. Braids and strands that exist only on a branch are added. A branch already in HEAD is skipped (covers merged branches and the checked-out branch, whose uncommitted edits win). Among copies of one item (local/origin/, two slugs) the newest commit wins, local on a tie. A malformed copy on a branch is skipped rather than failing the board. No git fetch on the board.

Review of PR #66 (not blocking): documented that merged means merge commit or fast-forward (squash/rebase leftovers overlay until deleted, with a test); for-each-ref narrowed to braid branch patterns; merge-base only on each item's winning copy. Suggestion 3 (branch on the item page) left for the user.
