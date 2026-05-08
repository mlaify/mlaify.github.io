---
title: "OpenSift"
description: "OpenSift is a local-first study assistant that ingests material, retrieves grounded context, and generates study outputs across six chat modes."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 50
toc: true
status: "alpha"
---

Repository: [mlaify/OpenSift](https://github.com/mlaify/OpenSift)

## What it is

OpenSift is a local-first study assistant. You ingest source material (notes, articles, lecture transcripts, PDFs), OpenSift retrieves the relevant chunks, and a chosen chat mode generates study output that is grounded in what you actually read — not hallucinated from elsewhere.

"Local-first" is load-bearing: the ingest pipeline, retrieval index, and chat history live on the user's machine. The provider call (Claude, OpenAI, etc.) is a discrete network step the user controls, not a continuous background sync.

## Core flow

```text
ingest  →  retrieve  →  generate
   ↑                       ↓
   └──── re-ingest ────────┘   (notes the user takes are themselves ingestible)
```

## Chat modes

OpenSift exposes six purpose-built modes rather than one general-purpose chat:

- `study_chat` — open-ended Q&A grounded in the corpus
- `assignment_planner` — break a deliverable into ordered steps
- `study_guide` — generate a structured guide from the corpus
- `key_points` — extract the highest-signal claims
- `quiz` — generate questions and grade answers against the source
- `explain` — explain a concept using the corpus's framing

Modes are template-driven; new ones can be added without touching the retrieval layer.

## Provider paths

- Claude API
- OpenAI API
- Claude Code (local invocation)
- ChatGPT Codex (local invocation)

A "gateway mode" lets OpenSift supervise a UI and an optional MCP server for richer tool integration.

## Security posture

OpenSift is documented as a hobby proof-of-concept and is **not production-hardened**. Documented improvements include XSS containment in rendered output, SSRF controls on URL ingest, and persistence-safety review of the local index. See the repo's `SECURITY.md` for the current list.

## Status

Hobby proof-of-concept. Functional for personal study use; not packaged for general distribution.

## Where to read more

- [Repository](https://github.com/mlaify/OpenSift) — source, install, mode templates
- [Build principles](/build-principles/) — the conventions every mlaify project follows
