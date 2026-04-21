---
title: "OpenSift"
description: "Detailed OpenSift project page summarizing capabilities, maturity level, provider workflows, and currently documented hardening posture."
date: 2026-04-21T11:00:00-05:00
lastmod: 2026-04-21T11:00:00-05:00
draft: false
weight: 50
toc: true
---

Repository: [mlaify/OpenSift](https://github.com/mlaify/OpenSift)

Status in repo docs: hobby proof-of-concept.

## Scope

OpenSift is an AI study assistant that ingests materials and retrieves grounded context for generation.

Core flow:

1. ingest source material
2. retrieve relevant chunks
3. generate study output

## Current capabilities

- local-first study workflows
- multiple chat modes (`study_chat`, `assignment_planner`, `study_guide`, `key_points`, `quiz`, `explain`)
- provider paths for Claude Code, ChatGPT Codex, Claude API, and OpenAI API
- gateway mode that can supervise UI and optional MCP server

## Security posture

Repo docs explicitly describe local-first constraints and non-production hardening status, with documented improvements around XSS, SSRF controls, and persistence safety.
