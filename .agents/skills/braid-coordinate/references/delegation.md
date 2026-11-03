# T3 delegation during coordinated delivery

Use only when the user requested delivery/delegation, not for a planning-only request. Obtain preferred model/provider/settings and WIP limits from the project's current `AGENTS.md` and decisions.

- Call `orchestrator_capabilities` before the first `delegate_task`, then follow current host rules on when to refresh it. Use the exact offered provider, model ID, and option keys. Put reasoning and other selected settings in `target.options`. Report unavailability without substituting a different configuration.
- Use T3 `delegate_task` for another provider or a separate checkout. A child receives the supplied task without parent chat history; include exact epic/backlog/context paths and expected report/checkpoint ownership. Do not create a top-level thread for delegation.
- Use a shared checkout for the pre-Git analysis spike and for explicitly coordinated sequential work. Before choosing worktree isolation, establish Git and commit the context files. Uncommitted parent files are absent from an isolated child based on the parent commit. Let the delegation tool create/bind the checkout; never create a child worktree in the shell or the child's prompt.
- There is no separate builder skill. Put the worker's duties in the task, including the delivery rule that the worker opens the pull request, waits until required checks on that head finish, and only then hands off with the head SHA and the check result. Do not treat a running-check update as the handoff.
- Keep coordinator/worker writes disjoint. Allow the single worker to finish before the coordinator inspects or changes implementation files in a shared checkout.
- Follow the tool's returned `next`. For an asynchronous result saying completion wakes the coordinator, end the turn; do not poll, sleep, or install a watcher. At a later completion turn reread the shared checkpoint and returned report before advancing.
- Cancel replaced/unneeded delegate runs with `task_cancel`. New independent review/recheck assignments use a new `delegate_task`; read and apply the [review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing) when setting its title and output paths. Apply the host's current PR linking/watch rules if PR work is in scope.

If the host lacks delegation, provide the generated worker assignment and wait for its report through the manual handoff. The planning/analysis portions of the skill remain usable without T3. Delegated workers do not invoke the coordinator skill to create their own team.
