---
title: "Aegis"
description: "Detailed Aegis workspace page covering draft-stage status, protocol-centric architecture, and explicit threat-model and security-posture framing."
date: 2026-04-21T11:00:00-05:00
lastmod: 2026-04-21T11:00:00-05:00
draft: false
weight: 70
toc: true
---

Repository: [mlaify/aegis](https://github.com/mlaify/aegis)

Status in repo docs: `v0.1` draft integration workspace.

## Scope

Aegis is a secure asynchronous messaging reference stack centered on:

- cryptographic identity continuity
- encrypted private payloads
- zero-trust relay infrastructure
- protocol-first design

## Current implementation highlights

- draft RFCs and schemas in `aegis-spec`
- core message models in `aegis-core`
- reference relay endpoints for envelope push/fetch
- end-to-end local CLI loop (`seal -> push -> fetch -> open`)

## Security posture

The project docs explicitly separate current guarantees from future hardening work, including signature enforcement, prekey lifecycle, relay auth, and federation.
