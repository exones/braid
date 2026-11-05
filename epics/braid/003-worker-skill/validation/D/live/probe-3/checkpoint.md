# Resume point

Task: classify the simulated checks and stop.

Checks file: `epics/braid/003-worker-skill/validation/D/live/probe-3/checks/simulated.json`

CURRENT means the output of `git rev-parse HEAD` in this checkout.
PARENT means the output of `git rev-parse HEAD~1` in this checkout.

Next action: classify that file against CURRENT and PARENT, then stop. Leave the file bytes unchanged. Leave the branch tip unchanged. Make no commit, push, or pull request. Contact no GitHub host. The pull request string inside the simulated file is fixture text.
