// Tracked Markdown link check for scripts/Test-DocsGate.ps1.
// Uses remark-validate-links and the same unified-engine remark-cli uses.
// The engine cwd is the repository being scanned, and the file list is
// relative to that root. remark-cli was not given absolute paths in another
// directory: on Windows its ignore helper throws when path.relative crosses
// drives, which is how CI (checkout on D:, temp fixture on C:) failed.
import path from 'node:path'
import {remark} from 'remark'
import remarkValidateLinks from 'remark-validate-links'
import {engine} from 'unified-engine'
import config from '../.remarkrc.mjs'

const root = process.argv[2]
const files = process.argv.slice(3)
if (!root || files.length === 0) {
  process.stderr.write('usage: check-markdown-links.mjs <repository-root> <relative-markdown>...\n')
  process.exit(2)
}

const pluginEntry = Array.isArray(config.plugins)
  ? config.plugins.find((entry) => Array.isArray(entry) && entry[0] === 'remark-validate-links')
  : undefined
const pluginOptions = pluginEntry && pluginEntry[1] && typeof pluginEntry[1] === 'object'
  ? pluginEntry[1]
  : null
if (!pluginOptions) {
  process.stderr.write('.remarkrc.mjs is missing the remark-validate-links options\n')
  process.exit(2)
}

const issues = []

function reporter(fileList) {
  const list = Array.isArray(fileList) ? fileList : [...fileList]
  for (const file of list) {
    const reported = typeof file.path === 'string' ? file.path : ''
    const absolute = path.resolve(root, reported)
    const relative = path.relative(root, absolute).split(path.sep).join('/')
    const messages = Array.isArray(file.messages) ? file.messages : []
    for (const message of messages) {
      issues.push({
        file: relative,
        reason: typeof message.reason === 'string' ? message.reason : String(message),
      })
    }
  }
  return ''
}

engine(
  {
    processor: remark,
    cwd: root,
    files,
    plugins: [[remarkValidateLinks, pluginOptions]],
    detectConfig: false,
    detectIgnore: false,
    output: false,
    out: false,
    color: false,
    quiet: true,
    frail: false,
    reporter,
  },
  (error) => {
    if (error) {
      process.stderr.write(`${error.stack || error.message || String(error)}\n`)
      process.exit(1)
    }
    process.stdout.write(JSON.stringify(issues))
    process.exit(0)
  },
)
