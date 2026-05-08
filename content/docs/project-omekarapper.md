---
title: "OmekaRapper"
description: "AI-assisted Omeka S cataloging module that generates reviewable Dublin Core metadata suggestions from text, PDFs, OCR, and web content."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 40
toc: true
status: "alpha"
---

Repository: [mlaify/OmekaRapper](https://github.com/mlaify/OmekaRapper)

## What it is

OmekaRapper is an Omeka S module that brings AI-assisted metadata cataloging into the standard admin workflow. It reads the content a curator is working on, suggests Dublin Core metadata values, and lets the curator review, edit, and apply each suggestion before anything is written back to the catalog.

The shape of the integration is intentional: AI is a **suggestion engine in the existing workflow**, not a separate tool curators have to context-switch into. Suggestions are reviewable. Nothing applies silently.

## Scope

OmekaRapper generates metadata suggestions from:

- article or OCR text
- uploaded PDFs (`pdftotext`, with `pdftoppm` + `tesseract` fallback for image-based PDFs)
- web content (URL fetch + extraction)

Output targets the Dublin Core element set that Omeka S exposes by default — Title, Creator, Subject, Description, Date, Type, Format, Identifier, Source, Language, Relation, Coverage, Rights.

## Capabilities

- **Admin panel integration** — the suggestion UI lives inside the standard Omeka S item add/edit flows. No separate dashboard.
- **Suggest-and-apply workflow** — every suggestion is shown with provenance and confidence; curators apply one, edit one, or skip.
- **Pluggable provider architecture** — Claude API, OpenAI API, ChatGPT Codex, Claude Code, and Ollama-compatible endpoints. Swappable per-installation.
- **Reviewable defaults** — nothing writes back to the catalog without an explicit apply step. This is non-negotiable; OmekaRapper does not run as an autopilot.

## Status

Early development. Core ingestion and suggestion paths work. Hardening and richer semantic mapping (beyond literal value writes) are open work.

## Where to read more

- [Repository](https://github.com/mlaify/OmekaRapper) — source, install instructions, issues
- [Build principles](/build-principles/) — the conventions every mlaify project follows
