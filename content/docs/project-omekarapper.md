---
title: "OmekaRapper"
description: "AI-assisted Omeka S cataloging module. Curator-first workflow that turns pasted text or PDFs into reviewable Dublin Core metadata suggestions, with pluggable providers (Claude, OpenAI, Codex, Ollama) and graceful heuristic fallback."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 40
toc: true
status: "alpha"
---

{{< status "alpha" >}}

**Repository:** [mlaify/OmekaRapper](https://github.com/mlaify/OmekaRapper)

## What OmekaRapper is

OmekaRapper is an **Omeka S module** that adds an AI assistant panel directly to the admin item editor. A curator pastes source text or uploads a PDF; the module asks a configured AI provider for structured metadata suggestions; the curator reviews and applies what they want into the standard Omeka item form. Nothing writes back to the catalog without an explicit apply step.

The integration shape is the point: AI is a **suggestion engine inside the existing workflow**, not a separate tool curators have to context-switch into.

{{< callout type="note" >}}
OmekaRapper is **not** a fork of Omeka S, and **not** a separate archive platform. It is a module that plugs into Omeka S and extends the item editor.
{{< /callout >}}

## What the module does today

- Injects an AI assistant panel on item add and edit pages (`Admin → Items → Add/Edit Item`)
- Lets a curator paste source text and optionally upload a PDF
- Supports five providers: `dummy`, `chatgpt`, `codex`, `claude`, and `ollama`
- Extracts PDF text with `pdftotext`, falling back to OCR via `pdftoppm` + `tesseract` for scanned PDFs
- Asks the selected provider for **structured metadata suggestions** (normalized JSON, not raw API objects)
- Enriches or repairs sparse provider output with built-in heuristics
- Maps suggestions onto the Omeka properties available on the current item form
- Lets the curator apply individual fields or all detected property suggestions into the form

## Capabilities

{{< feature-grid cols="3" >}}

{{< feature icon="layout-dashboard" title="Curator-first integration" >}}
The assistant panel lives inside the standard Omeka S item add/edit screens. No separate dashboard, no context switch.
{{< /feature >}}

{{< feature icon="check" title="Suggest-and-apply, never silent" >}}
Every suggestion is shown for review. Apply one, edit one, or skip. Nothing writes to the catalog automatically.
{{< /feature >}}

{{< feature icon="puzzle" title="Pluggable providers" >}}
Five built-in providers covering hosted (Claude, OpenAI, Codex) and local (Ollama, LM Studio) endpoints. Swappable per-installation.
{{< /feature >}}

{{< feature icon="file-type-pdf" title="PDF and OCR aware" >}}
Embedded text via `pdftotext`. Image-based PDFs fall back to OCR via `pdftoppm` + `tesseract` (English, up to 10 pages per request).
{{< /feature >}}

{{< feature icon="shield-check" title="Graceful fallback" >}}
If a provider fails, the module still returns useful suggestions via heuristic extraction from the source text. The UI surfaces a warning, not a crash.
{{< /feature >}}

{{< feature icon="clock-bolt" title="Async for heavy requests" >}}
PDF-backed and large-text requests dispatch into Omeka background jobs. The browser polls and renders results when complete.
{{< /feature >}}

{{< /feature-grid >}}

## AI providers

The provider system is the core extension seam. Each provider implements a common interface: return its public name, and generate normalized catalog metadata from source text.

| Provider | Transport | Settings | Use case |
|---|---|---|---|
| `dummy` | None | Always available | Development fallback; produces a simple title and abstract heuristically |
| `chatgpt` | OpenAI Responses API | API key, model, endpoint | Hosted GPT-class models |
| `codex` | OpenAI transport (shares ChatGPT API key) | Model, endpoint, label | Distinct UI label; same OpenAI key |
| `claude` | Anthropic Messages API | API key, model, endpoint | Hosted Claude models |
| `ollama` | OpenAI-compatible chat completion | Model, endpoint, optional API key | Ollama, LM Studio, or any OpenAI-compatible local endpoint |

### Provider request strategy

Provider prompts are designed to:

- Return **conservative guesses only**; leave unknown fields empty
- Prefer **short abstracts**
- Return **arrays** for repeatable fields
- Build a **`properties` array tailored to the current Omeka item form**, not just generic Dublin Core
- Emit only valid JSON

### Failure behavior

Provider errors do not end the workflow:

1. The provider error becomes a **warning**, not a fatal response
2. The module **falls back to heuristic extraction** from the source text
3. The UI still renders usable metadata suggestions (title, abstract, subjects, identifiers) derived from the source itself

### Model discovery

The module configuration screen can refresh model lists directly from configured endpoints:

- OpenAI / Codex use `/v1/models`
- Claude uses Anthropic's models endpoint
- Ollama uses `/api/tags` and `/api/ps`

This is a configuration-time convenience. Curators do not interact with model discovery on item edit screens.

## Curator workflow

```
1. Open an item add or edit form (Admin → Items → Add/Edit Item)
2. Paste source text into the assistant panel
3. Optionally upload a PDF
4. Select a provider
5. Click "Suggest metadata"
6. Review the returned title, abstract, creators, subjects, identifiers, and detected properties
7. Apply either all detected properties (bulk) or individual fields
8. Save the Omeka item as usual
```

### Apply behavior

Two apply modes:

- **Apply all metadata** — uses the `properties` array (already tailored to the current form), locates each matching property field on the page, creates literal inputs as needed, and fills values
- **Per-field apply** — convenience buttons for `title` and `abstract`; other fields applied via bulk apply or manual copy

### PDF behavior

- If a PDF has **embedded text**, the module uses that text directly
- If not, and OCR tools are available, it OCRs the PDF pages
- If you also typed notes, those notes are **combined with the extracted PDF text**

### Async behavior

Some requests are queued into Omeka background jobs:

- The panel shows a background-processing status
- The browser polls the job-status endpoint
- Results render when the job completes

## Architecture

### Runtime flow

```
1. Omeka renders the item editor
2. Module listens to admin item add/edit view events; injects the OmekaRapper panel + JS
3. Frontend collects: pasted text, optional PDF, available Omeka property terms from the form
4. Request reaches AssistController → validates permissions, parses form context, extracts PDF text
5. SuggestionPipeline trims/summarizes long input, calls the selected provider
6. SuggestionEnricher merges provider output with heuristic extraction from full source
7. MetadataFieldMapper maps fields to available Omeka property terms (form-aware)
8. Frontend renders suggestions; curator applies into editor
```

### Main components

**Module bootstrap**
Installs and removes module settings. Renders the configuration form. Injects the assistant panel onto admin item pages.

**`AssistController`** — provides four endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/admin/omeka-rapper/providers` | GET | List enabled providers for the editor dropdown |
| `/admin/omeka-rapper/suggest` | POST | Generate metadata from text + optional PDF |
| `/admin/omeka-rapper/status` | GET | Poll a queued suggestion job |
| `/admin/omeka-rapper/models` | POST | Configuration-time model discovery |

**`AiClientManager`** resolves providers by name and returns the appropriate adapter (`DummyProvider`, `OpenAiProvider` for ChatGPT/Codex/Ollama, `AnthropicProvider` for Claude).

**`SuggestionPipeline`** does two key things:
- Trims or summarizes long source text before provider calls (preserves likely metadata lines + beginning + end of source)
- Always enriches the result so the module returns useful fields even on provider failure

**`SuggestionEnricher`** uses heuristic extraction for: title, abstract, creators, identifiers, date, publisher, publication, subjects, language, and several additional descriptive fields.

**`MetadataFieldMapper`** translates semantic fields into Omeka property suggestions based on actual form context.

### Queueing model

The module uses Omeka background jobs for heavier requests. Requests are queued when:

- The source includes a PDF
- The text exceeds the provider text limit

Queued results persist to **temporary JSON files** and are loaded through the `status` endpoint.

## Response schema

Providers return a normalized JSON object — not Omeka API objects directly:

```json
{
  "title": "Example Article Title",
  "alternative_title": "",
  "creators": ["Author One", "Author Two"],
  "contributors": [],
  "date": "2024",
  "publisher": "Example Press",
  "publication": "Journal of Examples",
  "abstract": "Short abstract here.",
  "subjects": ["archives", "metadata"],
  "identifiers": ["10.1234/example-doi"],
  "language": "English",
  "type": "",
  "extent": "",
  "rights": "",
  "spatial": "",
  "temporal": "",
  "relation": "",
  "source": "",
  "format": "",
  "properties": [
    { "term": "dcterms:title",   "values": ["Example Article Title"] },
    { "term": "dcterms:subject", "values": ["archives", "metadata"] }
  ]
}
```

**Schema notes:**

- Repeatable fields are **arrays of strings**
- Single-value fields are **strings**
- `properties` is an array of `{ term, values }` objects; values are plain strings
- The current module does **not** ask providers to emit Omeka API datatypes, URIs, or resource references

After the provider call, the pipeline:

1. Normalizes provider values
2. Derives fallback values from property suggestions where useful
3. Enriches missing fields heuristically from the source text
4. Rebuilds and merges `properties` using the current Omeka item form context

So the final payload the browser receives can be **stronger than the raw provider response**.

## Limits and policies

### Request limits

- **Source-text length:** maximum 200,000 characters combined
- **PDF upload:** maximum 25 MB
- **OCR:** PDF only, English only, up to 10 pages per request

### Provider input trimming

Providers do not receive the full source text when it exceeds the limit. The pipeline builds a smaller payload from likely metadata lines, the beginning of the source, and the end of the source.

### Apply policy (intentionally conservative)

- **Literal values only** — no automatic URI or linked-resource values
- **No direct writes** to the item until the curator saves the Omeka record
- Unknown or unavailable target properties are **skipped** rather than forced

### Failure policy

If provider access fails, the request does not crash. A warning is returned and heuristic extraction still attempts to produce useful suggestions.

## Configuration

Configure from `Admin → Modules → OmekaRapper → Configure`.

### Provider settings

Each provider has an enable toggle plus its own settings block:

- **ChatGPT:** API key, model, endpoint
- **Codex:** model, endpoint (shares the OpenAI API key with ChatGPT)
- **Claude:** API key, model, endpoint
- **Ollama:** model, endpoint, optional API key

### Operational settings

- **Default provider** — sets the provider selected by default in the item editor
- **Request timeout** — provider timeout in seconds; clamped below PHP's `max_execution_time`
- **Background job PHP CLI path** — required for the queued-job fallback path
- **PDF tool paths** — optional paths for `pdftotext`, `pdftoppm`, `tesseract`; module resolves from environment if blank
- **Refresh models** — per-provider action that queries the configured endpoint for model lists

### Operational advice

- Enable only the providers you intend to use
- Verify the PHP CLI path if background jobs are not starting
- Install PDF tools before rolling the feature out to curators
- Test at least one end-to-end request per provider after changing endpoints or model names

## Installation

```bash
# 1. Place the module in your Omeka installation
cd /path/to/omeka/modules
git clone https://github.com/mlaify/OmekaRapper.git

# 2. Install via the Omeka admin
#    Admin → Modules → install "OmekaRapper"

# 3. (Optional) Install PDF support
sudo apt install poppler-utils       # provides pdftotext + pdftoppm

# 4. (Optional) Install OCR fallback
sudo apt install tesseract-ocr

# 5. Configure providers
#    Admin → Modules → OmekaRapper → Configure
```

## Best fit, and what's still maturing

**Best fit:** articles, reports, journal content, OCR text, text-heavy PDFs.

**Less mature:** complex structured resources, audio or video, linked-data enrichment, automatic URI or resource-value assignment.

### Intentionally simple today

- Provider failures fall back to heuristics rather than a separate review queue
- Result persistence for background jobs uses temporary JSON files
- Apply behavior writes only literal text values
- Confidence reporting is minimal
- OCR is English-only and capped at 10 pages per request
- No automated test suite shipped with the module yet

### Not implemented (and explicitly out of scope today)

Earlier prototype documentation referenced a much larger architecture. The current module **does not include**:

- A standalone Python AI worker service
- Postgres or `pgvector` data layer
- Embeddings, vector search, or similarity-based related-item suggestions
- A separate suggestion review queue with accept/reject states
- Background pipelines for OCR, ASR, and backfill across collections
- Audio or video transcription
- Helm or Docker deployment material
- Datatype-aware writes beyond Omeka literal text inputs

If you read older docs that mention `AiAssistant`, worker endpoints, or pgvector — that's the prototype, not the shipping module.

## FAQ

**Is OmekaRapper a fork of Omeka S?**
No. It is an Omeka S module.

**Does the module write metadata automatically without review?**
No. Suggestions appear in the sidebar and the curator applies them into the item form. There is no accept/reject queue in the current implementation.

**Which providers are supported right now?**
`dummy`, `chatgpt`, `codex`, `claude`, and `ollama`. ChatGPT and Codex share the same OpenAI transport and API key, but can use different models and labels.

**Can I use local models?**
Yes. The `ollama` provider targets Ollama, LM Studio, or any OpenAI-compatible local endpoint.

**Does it support PDFs?**
Yes — embedded text via `pdftotext`, with OCR fallback via `pdftoppm` + `tesseract`.

**Does it support audio or video transcription?**
No. That was part of an older prototype architecture, not the shipping module.

**Does it use Postgres, pgvector, or embeddings?**
No. The current module has no embeddings, similarity search, or Postgres data layer.

**How are suggested fields mapped into Omeka?**
The browser sends available item-form property terms, labels, and descriptions to the server. The module uses those terms to build a `properties` list tailored to the current form.

**What kinds of values can it apply?**
Literal text values only.

**What happens if the provider call fails?**
The pipeline catches the error and falls back to heuristics. The UI still returns title, abstract, subject, and identifier suggestions derived from the source.

**Are large requests handled asynchronously?**
Yes. Large text payloads and PDF-backed requests dispatch to Omeka background jobs and are polled from the UI.

## Troubleshooting

**Providers don't appear in the editor**
Check the provider is enabled in module settings, any required API key is configured, and the current user can create or update items.

**Suggestion requests fail immediately**
Check that PHP cURL is installed, the configured endpoint URL is valid, the selected provider is actually enabled, and uploaded PDFs are under the size limit.

**PDF upload fails**
Confirm the file is really a PDF, is not empty, and is under the configured hard limit. Verify `pdftotext` is installed if you expect embedded-text extraction.

**OCR fallback doesn't work**
Confirm `pdftoppm` and `tesseract` are installed/configured, and that the PDF actually lacks embedded text.

**Queued jobs never complete**
Verify Omeka background jobs are working in the host environment, the configured PHP CLI path is valid, and temp storage is writable for job result JSON.

The current module does not implement a dedicated structured logging layer — troubleshooting is driven by Omeka job status and logs, immediate JSON error responses, and provider error messages surfaced through the UI.

## Roadmap signals

Near-term development priorities (from the current docs snapshot):

1. Add tests for controller responses, provider normalization, and property mapping
2. Improve durability of queued job result storage (move beyond temporary JSON files)
3. Expand apply behavior beyond literal-only Omeka values
4. Strengthen heuristics and confidence reporting for messy OCR input
5. Align repository README and release notes with actual module behavior after each feature change

## Where to go next

- [Repository](https://github.com/mlaify/OmekaRapper) — source, install instructions, issues
- [Open Source portfolio](/docs/projects/) — the rest of the mlaify open-source projects
- [Build principles](/build-principles/) — conventions every mlaify project follows
