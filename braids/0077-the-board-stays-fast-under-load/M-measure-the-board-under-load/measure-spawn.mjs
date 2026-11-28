// How long starting a process blocks Node's main thread on this machine now, with no board and no preload:
// `node measure-spawn.mjs [count]`. The time is of `spawn` itself (it returns once the process is created).
import { spawn } from "node:child_process";
import os from "node:os";

const count = Number(process.argv[2] ?? 30);
const cpu = () => os.cpus().reduce((t, c) => ({ idle: t.idle + c.times.idle, all: t.all + Object.values(c.times).reduce((a, b) => a + b, 0) }), { idle: 0, all: 0 });
const before = cpu();
for (const [command, args] of [["git", ["--version"]], ["cmd.exe", ["/d", "/c", "exit"]]]) {
  const ms = [];
  for (let i = 0; i < count; i++) {
    const began = performance.now();
    const child = spawn(command, args, { stdio: "pipe", windowsHide: true });
    ms.push(performance.now() - began);
    child.stdout.resume();
    await new Promise((done) => child.on("close", done));
  }
  ms.sort((a, b) => a - b);
  console.log(`${command}: ${count} starts, spawn blocked median ${Math.round(ms[count >> 1])} ms, max ${Math.round(ms.at(-1))} ms`);
}
const after = cpu();
console.log(`CPU during it: ${Math.round(100 * (1 - (after.idle - before.idle) / (after.all - before.all)))} %`);
