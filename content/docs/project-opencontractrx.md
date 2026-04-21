---
title: "OpenContractRx"
description: "Detailed OpenContractRx page outlining healthcare contract-intelligence goals, monorepo architecture, and currently documented integration surfaces."
date: 2026-04-21T11:00:00-05:00
lastmod: 2026-04-21T11:00:00-05:00
draft: false
weight: 60
toc: true
---

Repository: [mlaify/OpenContractRx](https://github.com/mlaify/OpenContractRx)

Status in repo docs: active v1 goals with baseline platform scaffolding.

## Scope

OpenContractRx is an open-source contract intelligence, renewal, and drafting platform for hospitals.

## v1 goals

- contract upload workflows
- key-term extraction
- renewal dashboards (120/90/60/30 day buckets)
- human-in-the-loop review
- AI-assisted drafting with auditable rationale

## Monorepo architecture

- `apps/api`: FastAPI backend
- `apps/worker`: background OCR/extraction/embedding
- `apps/web`: Next.js frontend
- `packages/core`: shared Python schemas
