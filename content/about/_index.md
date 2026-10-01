---
title: "About"

description: "About M&L AI — AI-driven software focused on defensive cybersecurity."
aliases:
  - /me/
cascade:
  comments: false
---

<img src="/images/logo.svg" alt="M&amp;L AI logo" width="160" height="160" />

M&L AI is where I make AI-driven software with a focus on defensive cybersecurity. I'm a privacy advocate and software developer, and everything I build here is open source.

My work centers on a simple idea: software should respect the people who use it. That means privacy by default, no surveillance, no dark patterns, and code you can read, audit, and run yourself. I care about giving people practical control over their data and their tools.

## How I work

The way I build — small, protocol-first, status-honest, documentation-close-to-code — isn't an accident. It comes from a few convictions:

**Privacy is a default, not a feature.** The tools I build don't phone home, don't track you, and don't collect what they don't need. Local-first wherever it's possible.

**Security architecture is design work, not paperwork.** Threat models and protocol RFCs are first-class artifacts, written before the code stabilizes, not retroactively to satisfy a checklist.

**Status you can trust beats marketing.** Everything I ship carries an explicit status. "Alpha" means alpha. "Hardening pending" means I haven't yet hardened it. I'd rather lose a lead than oversell a `v0.1`.

**Composability over monoliths.** I favor open protocols and module boundaries that let other people swap pieces, and standard formats over bespoke servers. Costs more upfront and pays off everywhere downstream.

See [build principles](/principles/) for the longer version.

## What I build

**[AttackMap](/attackmap/)** is a local-first, open-source defensive security analysis engine. It reads a repository's source code, reconstructs the attack surface — routes, data stores, trust crossings, secrets in the wrong places — and produces prioritized, evidence-anchored findings mapped to MITRE ATT&CK. Code never leaves the machine, and the output is oriented entirely toward remediation: no exploit code, no offensive payloads. Full documentation lives at [docs.mlaify.io](https://docs.mlaify.io).

{{< status "help" "Looking for help" >}} AttackMap is looking for contributors and co-maintainers. It's under active development, but progress may be slow until more help or co-maintainers join — if you'd like to help with the core engine, an analyzer, the macOS app, or the docs, [open an issue](https://github.com/mlaify/AttackMap/issues) to say hello.

**[grrclone](/grrclone/)** is a free, open-source macOS menu bar app that connects [rclone](https://rclone.org) remotes as Finder volumes. It auto-discovers remotes, reconnects at login, and repairs mounts after sleep or a network change. No licence key, no phone-home, no kernel extension, no root. Install it with `brew install --cask mlaify/tap/grrclone`.

## Elsewhere

- [GitHub](https://github.com/mlaify) — code
- [AttackMap docs](https://docs.mlaify.io) — documentation
