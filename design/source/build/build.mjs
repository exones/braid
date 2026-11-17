// Rebuild every SVG of the design pack from logo-geometry.json.
// Usage: node design/source/build/build.mjs [output-dir]   (default: design/)
// Edit the constants and tables below to change colours, layout, padding, social text.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const D = JSON.parse(readFileSync(path.join(here, 'logo-geometry.json'), 'utf8'))
const OUT = path.resolve(process.argv[2] ?? path.join(here, '..', '..'))
const S = 1 / D.scale

// Colours
const NAVY = '#082A48', VIOLET = '#7835EF', VIOLET_LIGHT = '#A27BFF', WHITE = '#FFFFFF'
const MIST = '#F4F2FB'
// Layout
const PAD = 40 // artboard padding around lockups; clear space is documented separately
const HORIZONTAL_WORD_RATIO = 0.98 // wordmark height / symbol height in the horizontal lockup
const HORIZONTAL_GAP = 0.32 // gap between symbol and wordmark, as a share of symbol height
// Icons: [file, size, inset, background, strand colours, corner radius]
const ICON_INSET = 170
// Social preview
const SOCIAL = {
  width: 1280, height: 640, symbolWidth: 300, top: 215, tagY: 110, fontSize: 34,
  line: 'Orchestrates agents. Keeps the ledger. ', accent: 'Braids the work.', tagColor: '#C9D3DF',
}

const f2 = (x) => x.toFixed(2)
// Python-style float repr for the one value written unformatted (e.g. 640.0).
const pyFloat = (x) => (Number.isInteger(x) ? x.toFixed(1) : String(x))

const paths = (layer) => D.layers[layer].map((p) => `<path transform="${p.transform}" d="${p.d}"/>`).join('')
const group = (layer, fill, id) => `<g id="${id}" fill="${fill}">${paths(layer)}</g>`

const [sx0, sy0, sx1, sy1] = D.bbox_symbol
const [wx0, wy0, wx1, wy1] = D.bbox_wordmark
const SYM_W = sx1 - sx0 + 1, SYM_H = sy1 - sy0 + 1
const WORD_W = wx1 - wx0 + 1, WORD_H = wy1 - wy0 + 1

const symbol = (navy, violet, x = 0, y = 0, k = 1) => {
  const t = `translate(${f2(x)} ${f2(y)}) scale(${(k * S).toFixed(6)}) translate(${f2(-sx0 / S)} ${f2(-sy0 / S)})`
  return `<g id="symbol" transform="${t}">${group('symbol-navy', navy, 'strands-navy')}${group('symbol-violet', violet, 'strand-violet')}</g>`
}
const wordmark = (fill, x = 0, y = 0, k = 1) => {
  const t = `translate(${f2(x)} ${f2(y)}) scale(${(k * S).toFixed(6)}) translate(${f2(-wx0 / S)} ${f2(-wy0 / S)})`
  return `<g id="wordmark" transform="${t}">${group('wordmark', fill, 'letters')}</g>`
}
const svg = (w, h, body, title, desc) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" role="img" aria-labelledby="title desc">\n` +
  `<title id="title">${title}</title>\n<desc id="desc">${desc}</desc>\n${body}\n</svg>\n`

// Colour versions: [navy strands, violet strand, wordmark]
const SCHEMES = {
  color: [NAVY, VIOLET, NAVY],
  reversed: [WHITE, VIOLET_LIGHT, WHITE],
  'mono-navy': [NAVY, NAVY, NAVY],
  'mono-white': [WHITE, WHITE, WHITE],
}
const DESC_SYM = 'Three strands - two navy, one violet - weave together; each starts at a round commit-like endpoint.'

const primary = (n, v, wm) => {
  const gap = D.bbox_wordmark[1] - D.bbox_symbol[3]
  const w = SYM_W + 2 * PAD
  const h = SYM_H + gap + WORD_H + 2 * PAD
  return [w, h, symbol(n, v, PAD, PAD) + wordmark(wm, PAD + (wx0 - sx0), PAD + SYM_H + gap)] // keeps the approved optical alignment
}
const horizontal = (n, v, wm) => {
  const k = (WORD_H * HORIZONTAL_WORD_RATIO) / SYM_H
  const sw = SYM_W * k, sh = SYM_H * k
  const gap = sh * HORIZONTAL_GAP
  const h = Math.max(sh, WORD_H) + 2 * PAD
  const w = sw + gap + WORD_W + 2 * PAD
  return [w, h, symbol(n, v, PAD, PAD + (h - 2 * PAD - sh) / 2, k) + wordmark(wm, PAD + sw + gap, PAD + (h - 2 * PAD - WORD_H) / 2)]
}
const symbolOnly = (n, v) => [SYM_W + 2 * PAD, SYM_H + 2 * PAD, symbol(n, v, PAD, PAD)]
const wordmarkOnly = (n, v, wm) => [WORD_W + 2 * PAD, WORD_H + 2 * PAD, wordmark(wm, PAD, PAD)]

const LOCKUPS = {
  'braid-logo-primary': [primary, 'braid logo', `The braid symbol above the lowercase braid wordmark. ${DESC_SYM}`],
  'braid-logo-horizontal': [horizontal, 'braid logo', `The braid symbol beside the lowercase braid wordmark. ${DESC_SYM}`],
  'braid-symbol': [symbolOnly, 'braid', DESC_SYM],
  'braid-wordmark': [wordmarkOnly, 'braid', 'The lowercase braid wordmark.'],
}

const write = (dir, name, text) => {
  mkdirSync(dir, {recursive: true})
  writeFileSync(path.join(dir, name), text, {encoding: 'utf8'})
}

const logoDir = path.join(OUT, 'logo', 'svg')
for (const [name, [fn, title, desc]] of Object.entries(LOCKUPS)) {
  for (const [scheme, [n, v, wm]] of Object.entries(SCHEMES)) {
    if (name === 'braid-wordmark' && (scheme === 'reversed' || scheme === 'mono-navy')) continue // same as color / mono-white
    const [w, h, body] = fn(n, v, wm)
    write(logoDir, `${name}-${scheme}.svg`, svg(w, h, body, title, desc))
  }
}

// Icons: square artboards. inset = padding around the symbol.
const squareIcon = (size, inset, bg, n, v, radius) => {
  const k = (size - 2 * inset) / SYM_W
  const sh = SYM_H * k
  return svg(size, size, `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>` + symbol(n, v, inset, (size - sh) / 2, k), 'braid', DESC_SYM)
}
const iconDir = path.join(OUT, 'icons')
write(iconDir, 'braid-app-icon.svg', squareIcon(1024, ICON_INSET, NAVY, WHITE, VIOLET_LIGHT, 224))
write(iconDir, 'braid-app-icon-light.svg', squareIcon(1024, ICON_INSET, MIST, NAVY, VIOLET, 224))
write(iconDir, 'favicon.svg', squareIcon(64, 6, NAVY, WHITE, VIOLET_LIGHT, 14))

// Social preview (GitHub 1280x640): reversed horizontal lockup + tagline.
{
  const {width: W, height: H} = SOCIAL
  const k = SOCIAL.symbolWidth / SYM_W
  const sw = SYM_W * k, sh = SYM_H * k
  const kw = (sh * HORIZONTAL_WORD_RATIO) / WORD_H
  const ww = WORD_W * kw, wh = WORD_H * kw
  const gap = sh * HORIZONTAL_GAP
  const x0 = (W - (sw + gap + ww)) / 2, y0 = SOCIAL.top
  const body = `<rect width="${W}" height="${H}" fill="${NAVY}"/>` +
    symbol(WHITE, VIOLET_LIGHT, x0, y0 + (wh - sh) / 2, k) +
    wordmark(WHITE, x0 + sw + gap, y0, kw) +
    `<text x="${pyFloat(W / 2)}" y="${pyFloat(y0 + wh + SOCIAL.tagY)}" text-anchor="middle" font-family="Poppins, 'Segoe UI', sans-serif" font-size="${SOCIAL.fontSize}" font-weight="500" fill="${SOCIAL.tagColor}">${SOCIAL.line}<tspan fill="${VIOLET_LIGHT}">${SOCIAL.accent}</tspan></text>`
  write(path.join(OUT, 'social'), 'braid-social-preview.svg',
    svg(W, H, body, 'braid', 'braid logo on navy with the line: Orchestrates agents. Keeps the ledger. Braids the work.'))
}
console.log('built SVGs in', OUT)
