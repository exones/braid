# Directory map

Shared orientation for both skills; consult when locating files, not on every assignment.

```text
<checkout>/
├── AGENTS.md                 # project rules and role ownership
├── README.md                 # supported capabilities, setup and usage
├── package*.json, tsconfig*   # package, dependencies and TypeScript config
├── src/                      # CLI and ledger implementation
├── test/                     # tests and fixtures
├── scripts/                  # PowerShell build, verification and publishing
├── .github/                  # Actions workflows and PR template
├── .agents/skills/
│   ├── braid-coordinate/     # SKILL.md, assets/, references/, agents/
│   └── braid-worker/         # SKILL.md, assets/, references/, agents/
├── docs/                     # decisions, contracts and contributor guides
├── epics/
│   ├── README.md, report-format.md
│   └── braid/<NNN>-<slug>/
│       ├── epic.md, retro.md
│       ├── backlog/          # assigned work and acceptance criteria
│       ├── checkpoints/      # current.md shared; item/reviewer handoffs
│       ├── reports/          # item evidence and parent-scoped reviews
│       └── validation/       # retained exercises, where needed
└── inspiration/              # historical reference, not authority
```

Generated/local: `node_modules/` dependencies, `dist/` compiled code, `.tools/` pinned tools, `artifacts/` package/proof outputs. A CLI target root (which may differ from the checkout) contains `.braid/` ledger state, events, temporary state and lock. Released controllers are installed outside candidate checkouts.

Details stay authoritative in [epic layout and reviews](agile-workflow.md#files), [runtime storage](seed-contract.md#storage), and [build/install instructions](../README.md). This map describes current layout, not future roadmap components.
