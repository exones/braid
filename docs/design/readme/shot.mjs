// usage: node shot.mjs <out.png> <width> <height> <url> [waitText] [fullPage]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [out, w, h, url, waitText = 'attention board', full] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP}/shot-${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(300); }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 500 });
await send('Page.navigate', { url });
for (let i = 0; i < 60; i++) { await sleep(500); if (await ev(`document.body.innerText.includes(${JSON.stringify(waitText)}) && !document.body.innerText.includes('Loading...')`)) break; }
await sleep(800);
if (process.env.CLICK) { await ev(process.env.CLICK); await sleep(1000); }
let clip;
if (full) { const hh = await ev('document.documentElement.scrollHeight'); clip = { x: 0, y: 0, width: +w, height: Math.min(hh, +h), scale: 1 }; }
const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) });
writeFileSync(out, Buffer.from(r.result.data, 'base64'));
ws.close(); edge.kill();
process.exit(0);
