// Rasterize the design pack: every SVG to PNG, and the guidelines HTML to PDF,
// with headless Chrome or Edge.
// Usage: node design/source/build/render.mjs [design-dir]   (default: design/)
// Set BRAID_BROWSER to the browser executable to override the search.
import {spawnSync} from 'node:child_process'
import {existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const D = path.resolve(process.argv[2] ?? path.join(here, '..', '..'))

const candidates = () => {
  const list = []
  if (process.platform === 'win32') {
    for (const base of [process.env['ProgramFiles'], process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA]) {
      if (!base) continue
      list.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'))
      list.push(path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
    }
  } else if (process.platform === 'darwin') {
    list.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium')
  } else {
    for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
      for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable']) {
        if (dir) list.push(path.join(dir, name))
      }
    }
  }
  return list
}

const findBrowser = () => {
  const override = process.env.BRAID_BROWSER
  if (override) {
    if (!existsSync(override)) throw new Error(`BRAID_BROWSER is set to "${override}", which does not exist.`)
    return override
  }
  const list = candidates()
  const found = list.find((c) => existsSync(c))
  if (!found) {
    throw new Error(`No Chrome or Edge found. Install one, or set BRAID_BROWSER to its executable. Searched:\n  ${list.join('\n  ')}`)
  }
  return found
}

const BROWSER = findBrowser()
const TMP = mkdtempSync(path.join(os.tmpdir(), 'braid-render-'))
const run = (args) => {
  const r = spawnSync(BROWSER, ['--headless=new', '--disable-gpu', ...args], {encoding: 'utf8'})
  if (r.status !== 0) throw new Error(`${BROWSER} failed (${r.status ?? r.error}): ${r.stderr}`)
}

const size = (svg) => {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(readFileSync(svg, 'utf8'))
  return [Number(m[1]), Number(m[2])]
}

const png = (svg, out, width) => {
  const [w, h] = size(svg)
  const height = Math.round((width * h) / w)
  const html = path.join(TMP, `${path.basename(out, '.png')}.html`)
  writeFileSync(html, `<html><body style="margin:0;background:transparent"><img src="${pathToFileURL(svg).href}" style="display:block;width:${width}px;height:${height}px"></body></html>`)
  mkdirSync(path.dirname(out), {recursive: true})
  run(['--hide-scrollbars', '--force-device-scale-factor=1', '--default-background-color=00000000',
    `--window-size=${width},${height}`, `--screenshot=${out}`, pathToFileURL(html).href])
}

const logos = path.join(D, 'logo', 'svg')
for (const f of readdirSync(logos).filter((n) => n.endsWith('.svg')).sort()) {
  const stem = path.basename(f, '.svg')
  const [w] = size(path.join(logos, f))
  png(path.join(logos, f), path.join(D, 'logo', 'png', `${stem}@2x.png`), Math.round(w * 2))
  png(path.join(logos, f), path.join(D, 'logo', 'png', `${stem}.png`), Math.round(w))
}
const icons = path.join(D, 'icons')
for (const s of [1024, 512, 192]) png(path.join(icons, 'braid-app-icon.svg'), path.join(icons, 'png', `braid-app-icon-${s}.png`), s)
png(path.join(icons, 'braid-app-icon-light.svg'), path.join(icons, 'png', 'braid-app-icon-light-1024.png'), 1024)
png(path.join(icons, 'braid-app-icon.svg'), path.join(icons, 'png', 'apple-touch-icon.png'), 180)
for (const s of [16, 32, 48]) png(path.join(icons, 'favicon.svg'), path.join(icons, 'png', `favicon-${s}.png`), s)
png(path.join(D, 'social', 'braid-social-preview.svg'), path.join(D, 'social', 'braid-social-preview.png'), 1280)

run(['--no-pdf-header-footer', '--allow-file-access-from-files',
  `--print-to-pdf=${path.join(D, 'braid-brand-guidelines.pdf')}`,
  pathToFileURL(path.join(D, 'source', 'brand-guidelines.html')).href])
console.log('rendered with', BROWSER)
