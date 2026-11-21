// Spike 0057: cost of one process start, the way the tests start them.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const N = 30;
const scratch = mkdtempSync(join(tmpdir(), "spike-bench-"));
const home = join(scratch, "home");
mkdirSync(home);
writeFileSync(join(home, ".gitconfig"), "[user]\n\tname = t\n\temail = t@example.com\n");
const env = { ...process.env, HOME: home, USERPROFILE: home, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: join(home, ".gitconfig") };
const cli = join(process.cwd(), "dist", "cli.js");
function time(label, fn) {
  fn(-1);
  const t = performance.now();
  for (let i = 0; i < N; i++) fn(i);
  console.log(`${label.padEnd(28)} ${((performance.now() - t) / N).toFixed(1)} ms`);
}
time("node -e 0", () => spawnSync(process.execPath, ["-e", "0"], { env }));
time("node dist/cli.js --help", () => spawnSync(process.execPath, [cli, "--help"], { env }));
time("git --version", () => spawnSync("git", ["--version"], { env }));
time("git init (temp)", (i) => spawnSync("git", ["init", "-q", join(scratch, `r${i}`)], { env }));
time("git add+commit (temp)", (i) => {
  const r = join(scratch, `r${i}`);
  writeFileSync(join(r, "f.txt"), String(i));
  spawnSync("git", ["-C", r, "add", "-A"], { env });
  spawnSync("git", ["-C", r, "commit", "-qm", "x"], { env });
});
