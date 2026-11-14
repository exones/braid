Changed: scripts/Install-Skills.ps1 now also installs the braid CLI from the same ref as the skills: npm ci, npm run build, npm pack, npm install -g <tarball>, then checks `braid --version` prints `braid <version>`; the version is recorded as cliVersion in the stamp. The CLI step runs before any skill is copied, so a failure leaves installed skills untouched. -SkipCli skips it; -NpmCommand and -BraidCommand are test seams. README documents it.
Why: the skills must always be able to call a matching braid.
Validation: npm run verify passes locally; 5 new Pester tests with npm and braid stubbed (command sequence, version mismatch, npm failure, missing package.json, -SkipCli); CI green on Windows and Ubuntu. The real installer was not run against this machine's global npm.
Open: nothing.
For later items: the stamp gained an optional cliVersion field; the skills' missing-braid message (TASK-7.3) should point to the README "Braid skills in other projects" section. Possible later addition: an -Uninstall or a check mode that reports installed skill/CLI versions against a ref.
Needs the user: none
