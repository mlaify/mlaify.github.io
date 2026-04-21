---
title: "OmekaRapper"
description: "Detailed OmekaRapper project page covering current scope, integration model, provider architecture, and practical implementation constraints."
date: 2026-04-21T11:00:00-05:00
lastmod: 2026-04-21T11:00:00-05:00
draft: false
weight: 40
toc: true
---

Repository: [mlaify/OmekaRapper](https://github.com/mlaify/OmekaRapper)

Status in repo docs: early development.

## Scope

OmekaRapper helps curators and researchers generate metadata suggestions from:

- article or OCR text
- uploaded PDFs
- web content

## Current capabilities

- Omeka admin panel integration in item add/edit flows
- Suggest-and-apply workflow for common Dublin Core fields
- Pluggable provider architecture (ChatGPT, Codex, Claude, Ollama-compatible endpoints)

## Notes

- PDF extraction requires `pdftotext`
- OCR fallback requires `pdftoppm` and `tesseract`
- richer semantic mapping is planned beyond literal value writes
