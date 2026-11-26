// Names that can be said aloud (0072/G): every request gets an adjective and a noun when it opens, and its
// name is the words plus the four characters of its q-code: "yellow bear 5asx", shown and copied as one
// handle, `yellow-bear-5asx`. The words are unique among a project's open requests and may repeat over time;
// the q-code stays the file name and every key. A record written before has no words and keeps `q-5asx`.
import { createHash } from "node:crypto";

/**
 * Plain, familiar adjectives. None sounds like another word (no blue/blew, sweet/suite), none is a name a
 * speech engine capitalises (no Rusty, Sandy, Swift), none is a compound it may split, none is rude.
 */
export const ADJECTIVES: readonly string[] = [
  "yellow", "purple", "green", "orange", "silver", "golden", "brown", "happy", "brave", "calm",
  "clever", "gentle", "little", "giant", "tiny", "fuzzy", "shiny", "sleepy", "lucky", "funny",
  "snowy", "windy", "lazy", "proud", "quick", "wild", "warm", "soft", "smooth", "bright",
  "round", "tall", "fresh", "salty", "spicy", "crunchy", "early", "ancient", "noisy", "polite",
  "humble", "jolly", "curly", "fancy", "wooden", "hungry", "busy", "tidy", "bumpy", "steady",
  "cheerful", "friendly", "mighty", "silly", "fluffy", "muddy", "sticky", "rainy", "thirsty", "grumpy",
];

/** Plain, familiar nouns, by the same rules (no bear/bare, pair/pear, whale/wail, horse/hoarse, beetle/Beatle). */
export const NOUNS: readonly string[] = [
  "chair", "table", "lamp", "tiger", "lion", "rabbit", "turtle", "otter", "panda", "zebra",
  "camel", "monkey", "donkey", "parrot", "penguin", "dolphin", "kitten", "puppy", "robot", "rocket",
  "garden", "forest", "river", "island", "castle", "bridge", "window", "pencil", "button", "candle",
  "basket", "blanket", "pillow", "kettle", "spoon", "ladder", "wagon", "tractor", "bucket", "guitar",
  "piano", "violin", "banana", "lemon", "carrot", "potato", "tomato", "cookie", "muffin", "pickle",
  "mango", "cactus", "acorn", "pebble", "comet", "planet", "cloud", "feather", "mitten", "helmet",
  "anchor", "lantern", "magnet", "ribbon",
];

/** The two words a hash picks: an adjective and a noun. */
function pairOf(seed: string): string {
  const h = createHash("sha256").update(seed).digest();
  return `${ADJECTIVES[h.readUInt32BE(0) % ADJECTIVES.length] ?? ""} ${NOUNS[h.readUInt32BE(4) % NOUNS.length] ?? ""}`;
}

/**
 * The words for a new request with this code: picked from a hash of the code, and picked again (from a hash of
 * `<code>#<n>`) only while the pair is `taken` by an open request. Deterministic. Undefined only when every pair is open.
 */
export function pickWords(code: string, taken: (words: string) => boolean): string | undefined {
  for (let n = 0; n < 32; n++) {
    const words = pairOf(n === 0 ? code : `${code}#${n}`);
    if (!taken(words)) {
      return words;
    }
  }
  for (const a of ADJECTIVES) {
    for (const b of NOUNS) {
      if (!taken(`${a} ${b}`)) {
        return `${a} ${b}`;
      }
    }
  }
  return undefined;
}

/** Two lowercase words, as the record stores them. */
export const WORDS = /^[a-z]+ [a-z]+$/;

/** The one handle a request is shown and copied as: `yellow-bear-5asx`; `q-5asx` for a record without words. */
export function handleOf(r: { readonly code: string; readonly words?: string }): string {
  return r.words === undefined ? r.code : `${r.words.replace(" ", "-")}-${r.code.slice(2)}`;
}

/** A name as it is compared: lower case, letters and digits only ("Yellow Bear." and `yellow-bear` read `yellowbear`). */
const squash = (raw: string): string => raw.toLowerCase().replace(/[^a-z0-9]/g, "");

/** What a name resolves to: the one request it names, the several it could name, or none. */
export type Resolved<T> = { readonly one: T } | { readonly several: readonly T[] } | null;

/**
 * The request a spoken or typed name means, ignoring case, spaces, hyphens, joining and punctuation. The handle
 * (`yellow-bear-5asx`), the words with the suffix, the suffix (`5asx`) and the q-code (`q-5asx`) match any request,
 * open or closed; the words alone (`yellow bear`) only an open one. More than one request matched: `several`.
 */
export function resolveName<T extends { readonly code: string; readonly words?: string; readonly state: string }>(raw: string, requests: readonly T[]): Resolved<T> {
  const given = squash(raw);
  if (given === "") {
    return null;
  }
  const found = requests.filter((r) => {
    const suffix = r.code.slice(2);
    const words = r.words === undefined ? null : squash(r.words);
    return given === suffix || given === `q${suffix}` || (words !== null && (given === `${words}${suffix}` || (r.state === "open" && given === words)));
  });
  const [first] = found;
  return first === undefined ? null : found.length === 1 ? { one: first } : { several: found };
}
