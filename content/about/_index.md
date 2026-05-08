---
title: "About mlaify"
description: "mlaify is the open-source umbrella for Aegis, AttackMap, and a portfolio of AI-assisted workflow tools. Security-first, status-honest, documentation-close-to-code."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 10
toc: true
sidebar: false
lead: "An open-source umbrella for security-first protocol work and AI-assisted workflow tools."
---

## What mlaify is

mlaify is an open-source umbrella for two kinds of work:

1. **Security-first protocol and tooling.** Aegis (post-quantum encrypted messaging) and AttackMap (defensive security analysis) are the load-bearing projects.
2. **AI-assisted workflow tools.** OmekaRapper (cataloging), OpenSift (study), and OpenContractRx (hospital contracts) are smaller, focused applications of AI to specific workflows.

Everything lives on [GitHub under the mlaify organization](https://github.com/mlaify), under permissive open-source licenses.

## What we believe

The way mlaify projects look — small, protocol-first, status-honest, documentation-close-to-code — is not an accident. It comes from three convictions:

**Security architecture is design work, not paperwork.** Threat models and protocol RFCs are first-class artifacts in our repos. They are written *before* the code stabilizes, not retroactively to satisfy a checklist. When a project lacks a threat model, we say so on its page.

**Status you can trust beats marketing.** Every project on this site carries an explicit status. "Alpha" means alpha. "Hardening pending" means we have not yet hardened it. We would rather lose a lead than oversell a `v0.1`.

**Composability over monoliths.** We favor module boundaries that let other people swap pieces — analyzers in AttackMap, identity providers and relays in Aegis, AI providers in OmekaRapper and OpenSift. This costs more upfront and pays off everywhere downstream.

These show up as our [build principles](/build-principles/), which every project on the site follows.

## Where this is going

The current direction:

- **Expand practical AI workflows that are usable now.** OmekaRapper, OpenSift, and OpenContractRx are growing in scope, not in number.
- **Mature security posture and reliability.** Aegis and AttackMap move from `v0.1` toward audited, production-ready releases.
- **Publish architecture, lifecycle, and threat-model notes early.** Repos that don't have these get them.

This site is the public-facing portion of that work. It is intentionally a hub, not a marketing surface — but it is also no longer a bare directory listing. Aegis and AttackMap deserve the room to be explained properly, and the rest of the portfolio gets the same treatment as it matures.

## How to get involved

- **Try something.** [Run the Aegis CLI](/aegis/getting-started/), or [point AttackMap at one of your repositories](/attackmap/getting-started/).
- **File issues.** Every repo has issues open. Bugs, ergonomic frustrations, missing platform support — all welcome.
- **Send patches.** See [how to contribute](/contribute/).
- **Talk to us.** Discussions are open on every repo on GitHub.

## Legal

Site copyright is held by mlaify; project source is licensed per-repository (MIT unless a `LICENSE` file says otherwise).
