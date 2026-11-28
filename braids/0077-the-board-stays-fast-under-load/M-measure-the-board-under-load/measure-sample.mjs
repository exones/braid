// Asks a running board for the 0077/M measurement: `node measure-sample.mjs <board output file> <seconds> <out.jsonl> [stop file]`.
// Every second: /api/session (with the run's token, as `braid board --url` does) and the page `/`; every 5 s:
// /api/all (what the page loads), /api/projects (read time and failure per project), the machine's CPU load.
// Each request is sent on time whether or not the one before it answered. Reading only: no action is posted.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";

const [boardLog, seconds, out, stop] = process.argv.slice(2);
const log = (kind, data) => appendFileSync(out, `${JSON.stringify({ at: new Date().toISOString(), kind, ...data })}\n`);

let address;
for (let i = 0; i < 1200 && address === undefined; i++) {
  address = existsSync(boardLog) ? /(http:\/\/\S+?\/)#token=([0-9a-f]+)/.exec(readFileSync(boardLog, "utf8")) ?? undefined : undefined;
  if (address === undefined) await new Promise((done) => setTimeout(done, 100));
}
if (address === undefined) throw new Error("the board printed no address");
const [, base, token] = address;

const ask = (path, onBody) =>
  new Promise((done) => {
    const began = performance.now();
    const ms = () => Math.round(performance.now() - began);
    const req = http.get(new URL(path, base), { agent: false, headers: { "x-braid-token": token }, timeout: 70_000 }, (res) => {
      const parts = [];
      res.on("data", (d) => parts.push(d));
      res.on("end", () => {
        const took = ms();
        onBody?.(res.statusCode, Buffer.concat(parts).toString("utf8"));
        done({ ms: took, status: res.statusCode });
      });
    });
    req.on("timeout", () => req.destroy(new Error("no answer in 70 s")));
    req.on("error", (e) => done({ ms: ms(), error: e.message }));
  });

const cpu = () => os.cpus().reduce((t, c) => ({ idle: t.idle + c.times.idle, all: t.all + Object.values(c.times).reduce((a, b) => a + b, 0) }), { idle: 0, all: 0 });
let before = cpu();
let tick = 0;
let last = performance.now();
const pending = new Set();
const send = (path, kind, onBody) => {
  const p = ask(path, onBody).then((r) => log(kind, r));
  pending.add(p);
  p.finally(() => pending.delete(p));
};
const end = Date.now() + Number(seconds) * 1000;
const timer = setInterval(async () => {
  const lag = Math.round(performance.now() - last - 1000);
  last = performance.now();
  if (Date.now() > end || (stop && existsSync(stop))) {
    clearInterval(timer);
    await Promise.all(pending);
    return;
  }
  send("api/session", "session");
  send("", "page");
  if (tick % 5 === 0) {
    send("api/all", "all");
    send("api/projects", "projects", (status, body) => {
      if (status !== 200) return;
      log("state", { projects: JSON.parse(body).projects.map((p) => ({ name: p.name, readAt: p.readAt, failure: p.failure, problems: p.problems?.map((x) => x.key), github: p.github?.state ?? p.github, t3: p.t3?.state ?? p.t3 })) });
    });
    const now = cpu();
    log("machine", { cpuPercent: Math.round(100 * (1 - (now.idle - before.idle) / (now.all - before.all || 1))), freeGb: Math.round(os.freemem() / 1e9), samplerLagMs: lag });
    before = now;
  }
  tick += 1;
}, 1000);
