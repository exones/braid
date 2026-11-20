// The autonomy presets braid ships. They are compiled into dist/, so the package needs no
// extra files; a project's own autonomy/<name>.md with the same name replaces one of them.

const careful = `---
name: careful
merge: none
continue: no
---
# careful: I decide every stop case and every merge

| Case | Decide yourself when | Ask me when |
| --- | --- | --- |
| security | never | always |
| dependency | never | always |
| architecture | never | always |
| data | never | always |
| process | never | always |
| outward | never | always |
| scope | up to two strands or one prerequisite of tier S or M, logged on the braid and in the next recap | anything more, new tier L work, or the goal or a Completion box changes |
| quality | never | always |

Tier L items: always ask.
`;

const steady = `---
name: steady
merge: strands
continue: yes
---
# steady: I look at the result and at the big decisions

| Case | Decide yourself when | Ask me when |
| --- | --- | --- |
| architecture | internal shape: a new module or function, a flag or optional field that older versions ignore, a refactor inside the item's files | an older CLI, file or habit breaks; a new command, storage or process; it contradicts docs/decisions.md |
| dependency | a dev-only tool, a patch or minor bump | a new runtime dependency, a major bump, a licence change, a paid service |
| scope | absorb within twice the size; up to two S or M strands | the goal or a Completion box changes; new tier L work |
| process | tests added or restructured, CI made stricter | skills, AGENTS.md, CLAUDE.md, BRAID.md, a preset, CI loosened, tests deleted or skipped: ask at the final PR |
| security, data, outward | never | always |
| quality | never | always, after two fix rounds |

When unsure which column applies: ask.
`;

const free = `---
name: free
merge: all
continue: yes
---
# free: decide everything yourself and log it

| Case | Decide yourself when | Ask me when |
| --- | --- | --- |
| security | always, and log it | never |
| dependency | always, and log it | never |
| architecture | always, and log it | never |
| data | always, and log it | never |
| process | always, and log it | never |
| outward | always, and log it | never |
| scope | always, and log it | never |
| quality | never | always, after two fix rounds |
`;

/** The shipped presets by name, in the order `braid autonomy --list` shows them. */
export const SHIPPED_PRESETS: ReadonlyMap<string, string> = new Map([
  ["careful", careful],
  ["steady", steady],
  ["free", free],
]);

/** The preset a project runs on when neither the brief nor BRAID.md names one. */
export const DEFAULT_PRESET = "careful";
