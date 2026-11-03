import { parseArgs } from "./args.js";
import { LedgerFailure } from "./errors.js";
import { helpText } from "./help.js";
import { executeCommand } from "./ledger.js";
import { createDefaultLedgerIo, type LedgerIo } from "./ledger-fs.js";
import { readPackageVersion } from "./package-version.js";

export interface RunOptions {
  readonly cwd?: string;
  readonly stdout?: (chunk: string) => void;
  readonly stderr?: (chunk: string) => void;
  readonly io?: Partial<LedgerIo>;
}

export { createDefaultLedgerIo };

export async function run(argv: readonly string[], options: RunOptions = {}): Promise<number> {
  const writeOut =
    options.stdout ??
    ((chunk: string) => {
      process.stdout.write(chunk);
    });
  const writeErr =
    options.stderr ??
    ((chunk: string) => {
      process.stderr.write(chunk);
    });
  try {
    const parsed = parseArgs(argv);
    if (!parsed.ok) {
      writeErr(`${parsed.message}\n`);
      return 1;
    }
    const args = parsed.args;
    const version = readPackageVersion();
    if (args.help) {
      writeOut(helpText(version, args.helpTopic));
      return 0;
    }
    if (args.version) {
      writeOut(`braid ${version}\n`);
      return 0;
    }
    if (args.command === null) {
      writeOut(helpText(version, "general"));
      return 0;
    }
    const outcome = await executeCommand(args.command, {
      rootArg: args.root,
      cwd: options.cwd ?? process.cwd(),
      io: options.io,
    });
    if (outcome.stdout.length > 0) {
      writeOut(outcome.stdout);
    }
    if (outcome.stderr.length > 0) {
      writeErr(outcome.stderr);
    }
    return outcome.code;
  } catch (error) {
    if (error instanceof LedgerFailure) {
      writeErr(`${error.message}\n`);
      return error.exitCode;
    }
    writeErr("error: unexpected failure\n");
    return 5;
  }
}
