// 0072/G: names that can be said aloud. Every new request gets an adjective and a noun, unique among the project's
// open requests; its handle is `yellow-bear-5asx` (an old record keeps `q-5asx`); every command takes the name loosely.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { git, load, scratch, world } from "./support/done-fixtures.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const W: any = await load("../../dist/braids/words.js");
const R: any = await load("../../dist/braids/requests.js");
const B: any = await load("../../dist/braids/gitbranch.js");
const Cmd: any = await load("../../dist/commands/requests.js");
const { wakeMessage }: any = await load("../../dist/board/wake.js");

const HANDLE = /^[a-z]+-[a-z]+-[a-z0-9]{4}$/;
const handleIn = (out: string): string => /^(\S+)/.exec(out)?.[1] ?? assert.fail(`no handle in: ${out}`);
const tip = (root: string): string => git(root, "rev-parse", "braid-requests");

/** Rewrites request files on the branch as a race or an older braid would have left them (`words` set, or removed). */
function rewrite(root: string, change: Record<string, string | null>): void {
  B.lockedBranch(root, R.REQUESTS, () =>
    B.writeBranchUnlocked(root, R.REQUESTS, (view: any) => {
      const files = new Map<string, string>();
      for (const [code, words] of Object.entries(change)) {
        const { words: _old, ...file } = JSON.parse(view.read(`requests/${code}.json`));
        files.set(`requests/${code}.json`, `${JSON.stringify(words === null ? file : { ...file, words }, null, 2)}\n`);
      }
      return { files, message: "test: rewrite" };
    }),
  );
}

test("the word lists: 50 to 64 plain lowercase words each, no duplicates, no listed homophone", () => {
  const all = [...W.ADJECTIVES, ...W.NOUNS];
  for (const list of [W.ADJECTIVES, W.NOUNS]) {
    assert.ok(list.length >= 50 && list.length <= 64, `${list.length} words`);
  }
  assert.ok(all.every((w: string) => /^[a-z]+$/.test(w)), "lowercase ASCII letters only");
  assert.equal(new Set(all).size, all.length, "no word twice, in or across the lists");
  const homophones = ["bear", "bare", "pair", "pear", "pare", "blue", "blew", "right", "write", "rite", "red", "read", "sweet", "suite", "whale", "wail", "horse", "hoarse", "plain", "plane", "knight", "night", "flower", "flour", "deer", "dear", "hare", "hair", "tail", "tale", "sun", "son", "sea", "see", "mail", "male", "rose", "rows", "steel", "steal", "peace", "piece", "hole", "whole", "wood", "would", "meet", "meat", "sale", "sail", "chilly", "chili", "llama", "lama", "berry", "bury", "beetle", "quiet", "new", "knew", "one", "won", "two", "four", "eight", "grey", "gray"];
  assert.deepEqual(all.filter((w: string) => homophones.includes(w)), []);
});

test("the pick is deterministic, picks again when the pair is open, and the handle joins words and suffix", () => {
  const first = W.pickWords("q-5asx", () => false);
  assert.match(first, W.WORDS);
  assert.equal(W.pickWords("q-5asx", () => false), first, "the same code picks the same words");
  const next = W.pickWords("q-5asx", (w: string) => w === first);
  assert.notEqual(next, first, "an open request's pair is picked again");
  assert.equal(W.pickWords("q-5asx", (w: string) => w === first), next, "and that, too, deterministically");
  assert.equal(W.pickWords("q-5asx", () => true), undefined, "every pair open: no words");
  assert.equal(W.handleOf({ code: "q-5asx", words: "yellow bear" }), "yellow-bear-5asx");
  assert.equal(W.handleOf({ code: "q-5asx" }), "q-5asx", "a record without words keeps its q-code");
  assert.deepEqual([...R.takenWords([{ words: "yellow bear", state: "open" }, { words: "purple chair", state: "answered" }, { state: "open" }])], ["yellow bear"], "a closed request's words are free again");
});

test("a name resolves loosely; the words alone find only an open request; an ambiguous name names its candidates", () => {
  const a = { code: "q-5asx", words: "yellow bear", state: "open" };
  const b = { code: "q-7k2m", words: "yellow bear", state: "answered" };
  const old = { code: "q-9zzz", state: "open" };
  const all = [a, b, old];
  for (const raw of ["yellow-bear-5asx", "Yellow Bear 5ASX.", "yellowbear5asx", "yellow bear, 5asx!", "5asx", "q-5asx", "Q-5ASX", "q 5asx", "yellow bear", "Yellow Bear.", "yellow-bear", "YELLOWBEAR"]) {
    assert.deepEqual(W.resolveName(raw, all), { one: a }, raw);
  }
  assert.deepEqual(W.resolveName("yellow bear 7k2m", all), { one: b }, "words plus suffix find a closed request");
  assert.deepEqual(W.resolveName("7k2m", all), { one: b });
  assert.deepEqual(W.resolveName("yellow bear", [b, old]), null, "the words alone don't find a closed request");
  assert.deepEqual(W.resolveName("9zzz", all), { one: old });
  assert.equal(W.resolveName("purple chair", all), null);
  assert.equal(W.resolveName("...", all), null);
  const race = { code: "q-1abc", words: "yellow bear", state: "open" };
  assert.deepEqual(W.resolveName("yellow bear", [...all, race]), { several: [a, race] });
});

test("a record with words reads them; an unknown field is ignored; a record without words reads without", () => {
  const base = { code: "q-5asx", item: "0001", kind: "question", text: "x", by: "coordinator", thread: null, to: "user", doneWhen: "answered", eta: null, events: [{ event: "opened", at: "2026-11-25T10:00:00.000Z", by: "coordinator" }] };
  const withWords = R.parseRecord("requests/q-5asx.json", JSON.stringify({ ...base, words: "yellow bear", colour: "teal" }));
  assert.equal(withWords.words, "yellow bear");
  assert.equal(withWords.state, "open");
  assert.equal("colour" in withWords, false);
  assert.equal("words" in R.parseRecord("requests/q-5asx.json", JSON.stringify(base)), false);
  assert.equal("words" in R.parseRecord("requests/q-5asx.json", JSON.stringify({ ...base, words: "Yellow!" })), false, "words not as braid writes them are ignored");
});

test("new requests get words unique among the open ones, stored on the record; the CLI shows the handle", async () => {
  const w = world();
  const out = Cmd.askCommand(w.root, ["0001/A", "Which name?", "--kind", "decision"]);
  const handle = handleIn(out);
  assert.match(handle, HANDLE);
  const r = R.loadRecord(w.root).requests[0];
  assert.equal(R.handleOf(r), handle);
  assert.equal(JSON.parse(git(w.root, "show", `braid-requests:requests/${r.code}.json`)).words, r.words);
  assert.equal(handle, `${r.words.replace(" ", "-")}-${r.code.slice(2)}`);
  // Many open at once: no two share their words.
  for (let i = 0; i < 6; i++) {
    R.openRequest(w.root, { id: `pm/p${i}`, by: "pm", kind: "question", text: "x", at: new Date().toISOString(), thread: null });
  }
  const open = R.loadRequests(w.root);
  assert.equal(new Set(open.map((x: any) => x.words)).size, open.length);
  const list = (await Cmd.requestsCommand(w.root, [], { gh: w.opts.gh })) as string;
  assert.match(list, new RegExp(`^${handle} {2}0001/A {2}decision`, "m"));
  assert.match(wakeMessage(r, { state: "met", who: "board", text: "PR #5 merged" }), new RegExp(`^Wake: ${handle} is met \\(PR #5 merged\\)`));
  assert.match(wakeMessage({ code: "q-9zzz", text: "x" }, { state: "met", who: "board" }), /^Wake: q-9zzz is met/);
});

test("every command takes the name loosely; the words alone don't find a closed request, the words plus suffix do", async () => {
  const w = world();
  const handle = handleIn(Cmd.askCommand(w.root, ["0001/A", "Which name?"]));
  const words = handle.split("-").slice(0, 2).join(" ");
  const suffix = handle.split("-")[2] as string;
  assert.match(Cmd.etaCommand(w.root, [handle.replaceAll("-", ""), "2h"]), new RegExp(`^${handle} \\(0001/A\\): expected by`));
  assert.match((await Cmd.requestsCommand(w.root, [`${words} ${suffix}`.toUpperCase()], { gh: w.opts.gh })) as string, new RegExp(`^${handle} {2}0001/A {2}question {2}open`));
  assert.match(Cmd.answerCommand(w.root, w.root, [`${words[0]?.toUpperCase()}${words.slice(1)}.`]), new RegExp(`^${handle} 0001/A: answered by the user\\n$`));
  assert.throws(() => Cmd.withdrawCommand(w.root, [words, "--why", "x"]), new RegExp(`braid withdraw: no request named ${words}; nothing changed`));
  assert.match((await Cmd.requestsCommand(w.root, [`${words}-${suffix}`], { gh: w.opts.gh })) as string, new RegExp(`^${handle} {2}0001/A {2}question {2}answered`));
  assert.throws(() => Cmd.answerCommand(w.root, w.root, [handle]), new RegExp(`braid answer: ${handle} \\(0001/A\\) is already answered`));
  // The item id still names the item's open request; the next one is withdrawn by its suffix.
  const next = handleIn(Cmd.askCommand(w.root, ["0001/A", "Another?"]));
  assert.match(Cmd.withdrawCommand(w.root, [next.split("-")[2] as string, "--why", "no"]), new RegExp(`^${next} 0001/A: withdrawn: no`));
});

test("an ambiguous name is refused with its candidates and nothing changes; an old record shows and takes its q-code", async () => {
  const w = world();
  Cmd.askCommand(w.root, ["0001/A", "One?"]);
  Cmd.askCommand(w.root, ["0002", "Two?"]);
  const [a, b] = R.loadRequests(w.root);
  // As a race could leave it: two open requests with the same words.
  rewrite(w.root, { [b.code]: a.words });
  const before = tip(w.root);
  const both = `${R.handleOf(a)} \\(0001/A, open\\), ${R.handleOf({ ...b, words: a.words })} \\(0002, open\\)`;
  assert.throws(() => Cmd.answerCommand(w.root, w.root, [a.words]), new RegExp(`braid answer: "${a.words}" names 2 requests: ${both}; give the whole name; nothing changed`));
  assert.throws(() => Cmd.etaCommand(w.root, [a.words, "2h"]), /names 2 requests/);
  assert.equal(tip(w.root), before, "nothing written");
  assert.match(Cmd.answerCommand(w.root, w.root, [R.handleOf(a)]), /0001\/A: answered/, "the whole name tells them apart");
  // A record an older braid wrote: no words, shown and found by its q-code.
  rewrite(w.root, { [b.code]: null });
  const list = (await Cmd.requestsCommand(w.root, [], { gh: w.opts.gh })) as string;
  assert.match(list, new RegExp(`^${b.code} {2}0002 {2}question`, "m"));
  assert.match(Cmd.etaCommand(w.root, [b.code.slice(2), "2h"]), new RegExp(`^${b.code} \\(0002\\)`));
  assert.match(Cmd.withdrawCommand(w.root, [b.code.toUpperCase(), "--why", "no"]), new RegExp(`^${b.code} 0002: withdrawn`));
});

test("two clones opening requests at once never get the same words", async () => {
  const w = world();
  const other = join(scratch, `other-${Math.random().toString(36).slice(2)}`);
  git(scratch, "clone", "-q", git(w.root, "remote", "get-url", "origin"), other);
  git(other, "config", "user.email", "o@example.com");
  git(other, "config", "user.name", "o");
  const script = join(scratch, "open-words.mjs");
  writeFileSync(
    script,
    `import { openRequest } from ${JSON.stringify(pathToFileURL(fileURLToPath(new URL("../dist/braids/requests.js", import.meta.url))).href)};
const [root, prefix] = process.argv.slice(2);
for (let i = 0; i < 4; i++) openRequest(root, { id: "pm/" + prefix + i, by: "pm", kind: "question", text: "x", at: new Date().toISOString(), thread: null });`,
  );
  const run = (root: string, prefix: string) => new Promise<number | null>((done) => spawn(process.execPath, [script, root, prefix]).on("close", done));
  assert.deepEqual(await Promise.all([run(w.root, "a"), run(other, "b")]), [0, 0]);
  B.fetchBranch(w.root, R.REQUESTS);
  const open = R.loadRequests(w.root);
  assert.equal(open.length, 8);
  assert.equal(new Set(open.map((r: any) => r.words)).size, 8, "eight requests, eight pairs of words");
});

test("a new code always holds a letter: an all-digit draw is drawn again", () => {
  // The source draws four digits (index 31 is "5") first, then four letters.
  const draws = [[31, 33, 29, 28], [0, 1, 2, 3]];
  assert.equal(R.newCode(() => false, () => Uint8Array.from(draws.shift() ?? assert.fail("drew too often"))), "q-abcd");
  assert.equal(draws.length, 0);
});

test("an old all-digit code still resolves by q-code, by name and, when no item has the number, bare", async () => {
  const w = world();
  const open = (item: string, code: string, words: string): void => {
    B.lockedBranch(w.root, R.REQUESTS, () =>
      B.writeBranchUnlocked(w.root, R.REQUESTS, () => {
        const record = R.newRecord({ id: item, kind: "question", text: "Old?", at: new Date().toISOString(), thread: null, code, words });
        const { code: _code, id, ...file } = record;
        return { files: new Map([[`requests/${code}.json`, `${JSON.stringify({ code, item: id, ...file }, null, 2)}\n`]]), message: "test: old record" };
      }),
    );
  };
  open("0001/A", "q-5732", "yellow bear");
  const shown = /^yellow-bear-5732 {2}0001\/A {2}question {2}open/;
  for (const given of ["q-5732", "yellow-bear-5732", "yellow bear", "5732"]) {
    assert.match((await Cmd.requestsCommand(w.root, [given], { gh: w.opts.gh })) as string, shown, given);
  }
  assert.match(Cmd.etaCommand(w.root, ["5732", "2h"]), /^yellow-bear-5732 \(0001\/A\): expected by/);
  assert.match(Cmd.answerCommand(w.root, w.root, ["q-5732", "yes"]), /^yellow-bear-5732 0001\/A: answered/);
  open("0001/A", "q-9902", "purple chair");
  assert.match(Cmd.withdrawCommand(w.root, ["purple-chair-9902", "--why", "no"]), /^purple-chair-9902 0001\/A: withdrawn/);
  open("0001/A", "q-4411", "green lamp");
  assert.match(Cmd.answerCommand(w.root, w.root, ["4411", "yes"]), /^green-lamp-4411 0001\/A: answered/);
  // A number a braid has keeps meaning the braid.
  open("0001/A", "q-0002", "calm otter");
  assert.throws(() => Cmd.etaCommand(w.root, ["0002", "2h"]), /0002 is an item/);
  assert.match(Cmd.withdrawCommand(w.root, ["0002", "--why", "no"]), /^0002: no open request/);
});
