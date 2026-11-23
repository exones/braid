// Windows tools by full path. A bare name is looked up on PATH, where another program of that name can come first:
// under Git Bash `whoami` is GNU coreutils', which rejects `/user`. These tools live in %SystemRoot%\System32.
import { win32 } from "node:path";

/** The full path of `exe` in `%SystemRoot%\System32` (`C:\Windows` when SystemRoot isn't set). */
export function system32(exe: string, env: NodeJS.ProcessEnv = process.env): string {
  const root = env["SystemRoot"] !== undefined && env["SystemRoot"] !== "" ? env["SystemRoot"] : "C:\\Windows";
  return win32.join(root, "System32", exe);
}
