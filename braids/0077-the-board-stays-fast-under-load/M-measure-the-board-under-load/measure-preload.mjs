// Preload for the 0077/M measurement (`node --import <this> dist/cli.js board|gate ...`). No product code changes.
//
// M_HOME      temporary home: os.homedir() answers it, so ~/.braid (gate slots, address file, project list) is temporary.
//             The environment is left alone, so git, gh and t3 started by braid keep their real settings.
// M_PROTECT   (board only) `;`-separated folders that must not be written. Writes to a `.braid` folder under them go to a
//             mirror under M_HOME (and are read back from there); other writes under them throw. Git and t3 commands
//             that write are refused. Unset for a gate.
// M_STOP      the process exits when this file appears (so --cpu-prof is written).
// M_OUT       a JSON-lines file for redirected/refused writes, slow process starts and the event loop delay.
import fs from "node:fs";
import fsp from "node:fs/promises";
import cp from "node:child_process";
import os from "node:os";
import { syncBuiltinESMExports } from "node:module";
import { dirname, join, resolve } from "node:path";
import { monitorEventLoopDelay } from "node:perf_hooks";

const home = process.env.M_HOME;
if (!home) throw new Error("M_HOME is required");
os.homedir = () => home;

const out = process.env.M_OUT;
const append = fs.appendFileSync.bind(fs);
const exists = fs.existsSync.bind(fs);
const log = (kind, data) => {
  if (out) append(out, `${JSON.stringify({ at: new Date().toISOString(), kind, ...data })}\n`);
};

const roots = (process.env.M_PROTECT ?? "").split(";").filter(Boolean).map((r) => resolve(r).toLowerCase());
if (roots.length > 0) {
  const mirrored = new Map(); // lower-cased real path -> mirror path
  const under = (p) => {
    if (typeof p !== "string" && !(p instanceof URL)) return null;
    const full = resolve(p instanceof URL ? p.pathname : p);
    const low = full.toLowerCase();
    const root = roots.find((r) => low === r || low.startsWith(`${r}\\`) || low.startsWith(`${r}/`));
    return root === undefined ? null : { full, low };
  };
  const forWrite = (p, op) => {
    const hit = under(p);
    if (hit === null) return p;
    if (!/[\\/]\.braid([\\/]|$)/.test(hit.low)) {
      log("refused-write", { op, path: hit.full });
      throw new Error(`measure: refused ${op} ${hit.full}`);
    }
    let to = mirrored.get(hit.low);
    if (to === undefined) {
      to = join(home, "mirror", hit.full.replace(/[:]/g, ""));
      fs.mkdirSync(dirname(to), { recursive: true });
      // A folder that exists already stays read from the real place; only files move to the mirror.
      if (exists(hit.full) && fs.statSync(hit.full).isFile()) fs.copyFileSync(hit.full, to);
      if (op !== "mkdir") {
        mirrored.set(hit.low, to);
        log("redirected-write", { op, path: hit.full });
      }
    }
    return to;
  };
  const forRead = (p) => {
    const hit = under(p);
    return hit === null ? p : (mirrored.get(hit.low) ?? p);
  };
  const wrap = (mod, name, map) => {
    const real = mod[name];
    if (typeof real !== "function") return;
    mod[name] = function (...args) {
      return real.apply(this, map(args));
    };
    if (name === "realpathSync" && real.native) mod[name].native = real.native;
  };
  const isWrite = (flags) => typeof flags === "string" ? /[wa+]/.test(flags) : typeof flags === "number" && (flags & 3) !== 0;
  const first = (op) => (a) => [forWrite(a[0], op), ...a.slice(1)];
  const both = (op) => (a) => [forWrite(a[0], op), forWrite(a[1], op), ...a.slice(2)];
  const second = (op) => (a) => [forRead(a[0]), forWrite(a[1], op), ...a.slice(2)];
  const open = (a) => [isWrite(a[1]) ? forWrite(a[0], "open") : forRead(a[0]), ...a.slice(1)];
  const read = (a) => [forRead(a[0]), ...a.slice(1)];
  for (const [mod, suffix] of [[fs, "Sync"], [fs, ""], [fsp, ""]]) {
    for (const op of ["writeFile", "appendFile", "unlink", "rm", "rmdir", "truncate", "utimes", "chmod"]) wrap(mod, op + suffix, first(op));
    wrap(mod, `mkdir${suffix}`, (a) => {
      const hit = under(a[0]);
      if (hit !== null && exists(hit.full)) return a; // mkdir of an existing folder changes nothing
      return [forWrite(a[0], "mkdir"), ...a.slice(1)];
    });
    wrap(mod, `rename${suffix}`, both("rename"));
    wrap(mod, `copyFile${suffix}`, second("copyFile"));
    wrap(mod, `open${suffix}`, open);
    for (const op of ["readFile", "stat", "lstat", "access"]) wrap(mod, op + suffix, read);
  }
  wrap(fs, "existsSync", read);
  wrap(fs, "createWriteStream", first("createWriteStream"));

  const WRITES = /(^|[\s"'])(fetch|pull|push|commit|commit-tree|update-ref|fast-import|merge|checkout|switch|reset|clean|gc|prune|mktree|hash-object -w|branch -[dDmM]|worktree (add|remove|prune)|thread (send|create|archive|delete|settle|rename|interrupt)|pr (create|merge|edit|comment|close))($|[\s"'])/;
  const refuse = (command, args) => {
    const argv = Array.isArray(args) ? args : [];
    // git -C <dir> / -c k=v come before the subcommand.
    let i = 0;
    while (argv[i] === "-C" || argv[i] === "-c") i += 2;
    const isGit = /git(\.exe)?$/i.test(command);
    const line = isGit ? argv.slice(i, i + 2).join(" ") : argv.join(" ");
    const writes = isGit ? WRITES.test(`${argv[i] ?? ""} `) || /^(worktree (add|remove|prune)|branch -[dDmM]|hash-object -w)/.test(line) : /\b(thread (send|create|archive|delete|settle|rename|interrupt)|pr (create|merge|edit|comment|close))\b/.test(line);
    if (writes) {
      log("refused-command", { command, args: argv.slice(0, 8) });
      throw new Error(`measure: refused ${command} ${line}`);
    }
  };
  // The time a process start blocks the event loop (CreateProcess), per minute, and the slow ones one by one.
  let starts = 0;
  let blocked = 0;
  let worst = 0;
  const timedStart = (name) => {
    const real = cp[name];
    const wrapped = function (command, args, ...rest) {
      refuse(command, args);
      const began = performance.now();
      try {
        return real.call(this, command, args, ...rest);
      } finally {
        const ms = performance.now() - began;
        starts += 1;
        blocked += ms;
        worst = Math.max(worst, ms);
        if (ms > 200) log("slow-start", { ms: Math.round(ms), command: String(command).replace(/^.*[\\/]/, ""), args: (Array.isArray(args) ? args : []).slice(0, 4) });
      }
    };
    for (const key of Object.getOwnPropertySymbols(real)) wrapped[key] = real[key];
    cp[name] = wrapped;
  };
  for (const name of ["spawn", "execFile", "spawnSync", "execFileSync"]) timedStart(name);

  const delay = monitorEventLoopDelay({ resolution: 20 });
  delay.enable();
  let n = 0;
  setInterval(() => {
    log("loop", { maxMs: Math.round(delay.max / 1e6), p99Ms: Math.round(delay.percentile(99) / 1e6), starts, startBlockedMs: Math.round(blocked), startWorstMs: Math.round(worst), n: n++ });
    delay.reset();
    starts = 0;
    blocked = 0;
    worst = 0;
  }, 5000).unref();

  // The board's own lines on standard error (BRAID_BOARD_TIMINGS=1) get the time they were written.
  const write = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, ...rest) => write(`${new Date().toISOString()} ${chunk}`, ...rest);
}

syncBuiltinESMExports();

const stop = process.env.M_STOP;
if (stop) {
  setInterval(() => {
    if (exists(stop)) process.exit(0);
  }, 1000).unref();
}
