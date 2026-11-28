// A `t3` or `gh` call that outlives its timeout is killed, and then it has no exit code: that is not "not installed". Only a command that can't
// start (ENOENT) is missing; a killed one reads as not answering, which the next refresh tries again.

/** How long one `t3` or `gh` call may run before it is killed. */
export const CALL_TIMEOUT_MS = 30_000;

/** Whether the call was killed for taking longer than its timeout (the async runners' `killed`, the sync one's `ETIMEDOUT`). */
export function timedOut(error: Error | undefined): boolean {
  const e = error as (Error & { killed?: boolean; code?: unknown; signal?: unknown }) | undefined;
  return e !== undefined && (e.code === "ETIMEDOUT" || (e.killed === true && e.signal !== null && e.signal !== undefined));
}

/** The reason to show for a call that couldn't finish: not installed (ENOENT), not answering (killed at the timeout), or the OS's own words. */
export function callFailure(name: string, command: string, error: Error): string {
  if (timedOut(error)) {
    return `${name} didn't answer within ${CALL_TIMEOUT_MS / 1000} s; retrying`;
  }
  return (error as Error & { code?: unknown }).code === "ENOENT" || /ENOENT/.test(error.message) ? `${command} is not installed or not on PATH` : `${command} could not run (${error.message})`;
}
