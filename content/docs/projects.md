---
title: "Projects"
description: "Catalog of mlaify open-source projects beyond the Aegis and AttackMap headliners — OmekaRapper, OpenSift, OpenContractRx."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 30
toc: false
---

Aegis and AttackMap have their own top-level sections. The list below is the rest of the open-source portfolio.

## OmekaRapper

AI-assisted Omeka S cataloging module. Drops an assistant panel into the standard Omeka item add/edit screens; turns pasted text or uploaded PDFs into reviewable Dublin Core metadata suggestions that the curator applies into the form. Five pluggable providers (`dummy`, `chatgpt`, `codex`, `claude`, `ollama`), PDF + OCR support, async background jobs for heavy requests, and graceful heuristic fallback when a provider call fails. Suggest-and-apply only — never silent.

[Project page →](/docs/project-omekarapper/) · [Repository →](https://github.com/mlaify/OmekaRapper)

## OpenSift

Local-first study assistant. Ingests source material, retrieves grounded context, and generates study outputs across six chat modes (study chat, assignment planner, study guide, key points, quiz, explain). Provider-agnostic — Claude API, OpenAI API, ChatGPT Codex, and Claude Code paths supported.

[Project page →](/docs/project-opensift/) · [Repository →](https://github.com/mlaify/OpenSift)

## OpenContractRx

Open-source contract intelligence and renewal platform focused on hospital workflows. Contract upload → key-term extraction → renewal dashboards (120/90/60/30 day buckets) → human-in-the-loop review → AI-assisted drafting with auditable rationale. FastAPI backend, Next.js frontend, dedicated worker for OCR and embedding.

[Project page →](/docs/project-opencontractrx/) · [Repository →](https://github.com/mlaify/OpenContractRx)
