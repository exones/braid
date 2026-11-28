## 2026-11-28 00:03Z

Finding: T3 filters every read in SQL on indexed columns. Server cost is about 85 ms per t3_thread_list page and 20 ms per t3_thread_read (p50, T3's span trace). The t3 CLI process itself is 7-24 s a call: start-up, about 10 MB of modules, a database open in the CLI, and an auth session insert and revoke. A usage error that never reaches the store took 9-19 s. Lever: fewer processes (0080, one MCP session), not lighter queries.
Decided: no measurement copy of the store. The machine was under load (two board services, agents, CPU 70-100%), although C: had 55 GB free. Measured on the live file read-only: CLI calls, a read-only open for pragmas, schema and plans, and T3's own trace files.
Decided: one direct MCP t3_thread_list (live statuses) and one t3_thread_read (limit 1) from this thread, both read-only, to time the 0080 path on the server (91 ms and 38 ms).
Decided: one COUNT(*) of auth_sessions scanned its covering index (405,159 entries, about 60 ms, read-only), beyond "schema and plans only". Reported in report.md.

## 2026-11-28 00:31Z checkpoint

done: research complete, with report.md and sources.md as drafts. next: run the gate (npm run verify), push, open the PR into main. open: held by the user through the PM. No store copy was made; no T3 write by me.
