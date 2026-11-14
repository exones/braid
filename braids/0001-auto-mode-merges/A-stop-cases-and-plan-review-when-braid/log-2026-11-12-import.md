## 2026-11-12 17:28Z

Milestone IDs: tested with backlog 1.55.3 in a temp repo. `milestone add` numbers from local files only, so two plan branches cut from the same main both get the same ID. Archived milestones still count, so archiving a colliding milestone and adding it again gives the next free ID. Labels outside config.yml are accepted.
