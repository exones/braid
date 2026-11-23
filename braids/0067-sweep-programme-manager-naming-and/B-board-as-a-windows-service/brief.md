---
id: '0067/B'
title: "Board as a Windows service"
status: Outline
labels: ["kind:story", "tier:L", "ask:security", "ask:architecture"]
dependencies: ['0067/A']
order: 20
---

## Goal

The board runs as a Windows service of the kind the user chooses (asked through the PM after the research), started with the machine or the login and restarted on failure, with one braid command group to install, remove, restart and show it (status, port, address from 0067/A's file). Detailed once the user has chosen.
