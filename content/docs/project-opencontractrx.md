---
title: "OpenContractRx"
description: "Open-source contract intelligence, renewal, and AI-assisted drafting platform focused on hospital workflows."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 60
toc: true
status: "alpha"
---

Repository: [mlaify/OpenContractRx](https://github.com/mlaify/OpenContractRx)

## What it is

OpenContractRx is an open-source contract intelligence and renewal platform built for hospital workflows. The core loop is **upload → extract → review → renew → draft**: a contract enters the system, key terms are extracted, the renewal calendar is populated, humans review, and AI-assisted drafting produces the next iteration with an auditable rationale.

The hospital framing matters. Contract management in hospitals has specific shapes — large vendor catalogs, regulated terms, finance-and-clinical sign-off, and a strong preference for tools that show their work over tools that don't.

## v1 goals

- **Contract upload workflows** — drag-and-drop, batch, and email-in paths.
- **Key-term extraction** — parties, effective dates, term length, auto-renewal clauses, indemnification, termination rights, financial terms.
- **Renewal dashboards** — 120 / 90 / 60 / 30 day buckets, owner assignment, status tracking.
- **Human-in-the-loop review** — every extraction is reviewable; nothing surfaces to leadership unsigned-off.
- **AI-assisted drafting with auditable rationale** — the model proposes language; the platform records *why* it proposed that language and what source clauses it referenced.

## Monorepo architecture

OpenContractRx is a typed monorepo with clear layer separation:

| Path | Role |
|---|---|
| `apps/api` | FastAPI backend — REST + auth + workflow orchestration |
| `apps/worker` | Background worker — OCR, extraction, embedding |
| `apps/web` | Next.js frontend |
| `packages/core` | Shared Python schemas (Pydantic) |

The split lets the API stay snappy under load while heavy work (OCR, model inference, embedding) runs out-of-band on the worker.

## Status

Active v1 goals with baseline platform scaffolding. The schema and data model are stable enough to build against; UI surface area is the active investment area.

## Where to read more

- [Repository](https://github.com/mlaify/OpenContractRx) — source, schemas, deploy notes
- [Build principles](/build-principles/) — the conventions every mlaify project follows
