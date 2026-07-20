---
title: "AttackMap FAQ"
description: "Common questions about AttackMap: how it differs from SAST, what it costs, what languages it supports, and how to extend it."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-07-06T00:00:00-05:00
draft: false
weight: 40
toc: true
accent: "attackmap"
lead: "Common questions answered."
---

## What is AttackMap, exactly?

AttackMap is a local-first, open-source defensive security analysis engine. It reads a source code repository, reconstructs the attack surface (routes, data stores, external calls, auth signals), and produces a prioritized defensive review — all without sending your code anywhere.

It is not a linter, not a SAST tool, and not a fuzzer. It is closer to what a security engineer does manually at the start of an engagement: understand the system architecture, locate the attack surface, and flag the highest-priority risks.

---

## How is it different from SAST tools (Semgrep, Bandit, CodeQL)?

| | AttackMap | SAST tools |
|---|---|---|
| **Unit of analysis** | Whole system (routes, trust boundaries, attack chains) | Individual code patterns (line-level findings) |
| **Output** | Prioritized defensive review with attack paths and ATT&CK mapping | Finding list (vulnerability X at line Y) |
| **Coverage** | Architectural risk, missing controls, asset exposure, request-to-sink injection reachability, novel vuln classes, BOLA/IDOR, crypto/web-hardening, anomaly outliers, ranked exploitability, dependency CVEs | Code-level bugs, known-vulnerable patterns |
| **False positives** | Lower (system-level evidence) | Higher (pattern matching without context) |
| **Complements** | Both — use SAST for code bugs, AttackMap for architectural risk |

They are complementary. Run SAST for "is there SQL injection on line 412?" Run AttackMap for "given everything in this repo, what's the realistic attack path?"

---

## Does it send my code anywhere?

No. AttackMap runs entirely on your machine. No code, no file contents, and no signal data leave your device unless you explicitly use `--llm`.

When `--llm` is used, the LLM backend receives only a structured evidence pack (assets, controls, findings, insights — **not** raw source). It never receives your actual code.

---

## What languages and frameworks does it support?

14 ecosystem-specific analyzer plugins are available:

| Language / target | Frameworks |
|---|---|
| Python | Django, FastAPI, Flask, Starlette, AIOHTTP, Sanic, Litestar |
| JavaScript/TypeScript | Node.js services, distributed architectures |
| Go | chi, gin, echo, fiber, gorilla/mux, stdlib |
| Java / Kotlin | Spring Boot, Spring MVC, JAX-RS, Ktor |
| C# | ASP.NET Core, Minimal APIs, Razor Pages |
| Rust | axum, actix-web, rocket |
| PHP | Generic PHP web, Laminas / Zend MVC, Omeka-S |
| HCL | Terraform (AWS, Azure, GCP) |
| IaC | Dockerfile, docker-compose, GitHub Actions, `.env` templates, shell installers |
| C | microhttpd, mongoose |
| C++ | Crow, Pistache, Drogon |
| AT Protocol | Bluesky PDS, ATProto relay, AppView |

Beyond ecosystem recon, the core engine adds cross-file **data-flow / injection
detection** (SSRF, SSTI, NoSQL, unsafe deserialization, code/command execution,
open redirect) — with import-graph taint now spanning **Python, JS/TS, Go
(module-path resolution), and PHP (PSR-4 autoload)** — plus **novel vuln-class
detectors** (prototype pollution, mass assignment, JWT, XXE, ReDoS, insecure
upload, GraphQL exposure), **BOLA/IDOR** authorization checks,
**insecure-crypto and web-hardening** detection, **anomaly/outlier** detection,
a deterministic **exploitability score** (with known-CVE-on-path amplification),
an **SBOM + CVE** dependency scan (`--cve`, via OSV.dev), an **`--hunt`** LLM
vulnerability-hypothesis mode (`--hunt --verify` adjudicates each lead against
the source), **`--remediate`** fix proposals, and a GitHub **Action + PR bot**.
Across whatever languages your installed analyzers cover.

See the [Analyzers reference](/attackmap/analyzers/) for details on each.

---

## What does it cost?

AttackMap core is free and open-source (MIT license). The analyzer plugins are also open-source.

The only optional cost is the `--llm` flag, which uses the Anthropic Claude API. If you run Claude via the claude CLI (your Pro/Max subscription), there is no additional per-token cost.

---

## Does it require an internet connection?

No — except for two optional operations:

1. `--llm` — sends the evidence pack to the Anthropic API (not your code)
2. `attackmap modules` — queries the GitHub API to list available analyzer repos
3. `attackmap analyze . --module <name>` with an uninstalled analyzer — fetches from GitHub

All analysis runs offline.

---

## How accurate is it?

AttackMap operates on static evidence, not dynamic execution. It will miss:

- Routes registered at runtime (dynamically built route tables)
- Auth checks implemented in middleware that isn't statically detectable
- Data stores accessed through abstraction layers the analyzer doesn't recognize
- Security controls enforced at the infrastructure level (WAF, API gateway)

It may produce false positives for:

- Routes in test/fixture code (explicitly labeled low-quality)
- Auth signals from commented-out code
- External calls in utility/mock files

**The tool is designed to be conservative:** it surfaces what it can observe, explicitly labels confidence and evidence quality, and flags its own limitations in `limitations_meta`.

---

## What is the `auth_hints` overloading issue I see mentioned?

In early versions, analyzers stuffed non-auth metadata (service names, edge descriptions, protocol notes) into the `auth_hints` field because the typed hint fields (`service_hints`, `edge_hints`, etc.) didn't exist yet.

Current analyzers use the dedicated typed fields. The translation gateway still filters defensively before building attack surfaces — stripping any hint with a `service_name:`, `handler_type:`, `edge:`, `entrypoint:`, `atproto_`, or `framework:` prefix from the auth_hints list before classification — so route-scoped auth attribution stays accurate. No action is required from users.

---

## Can I use the JSON output in my own tooling?

Yes. The `defensive-review.json` has a published JSON Schema (in `schemas/defensive-review.schema.json` in the repo). All fields are stable within a minor version. The `review-context-pack.json` carries domain hints and source-quality context for downstream tools and LLM integrations.

The `attackmap-report.json` is the monolithic artifact — everything in one file — if you only want to ingest one file.

---

## Can I write my own analyzer?

Yes. See the [Custom Analyzer SDK guide](/attackmap/sdk/). An analyzer is a Python package that:

1. Implements `AnalyzerProtocol` (`detect()` + `analyze()`)
2. Registers a `attackmap.analyzers` entry point in `pyproject.toml`
3. Returns a `ScanResult`

After `pip install -e .`, AttackMap discovers your analyzer automatically.

---

## What is the eval harness?

AttackMap includes a local evaluation harness for testing review quality without running a full LLM call:

```bash
python -m attackmap.review_eval \
  --fixture evals/fixtures/node-service-review-v1.json \
  --review reports/defensive-review.json
```

The harness compares a review against a fixture (expected findings, chains, techniques) and reports match/miss/extra. Used internally to track review quality across code changes and to validate new analyzer output.

---

## What version is current?

**v0.4.10** is the current release (beta) — published to PyPI, Homebrew, and GHCR. The 0.4.x line covers four languages (Python, JS/TS, Go, PHP) with import-graph taint, precise front-end extraction (routes, auth-middleware awareness, parameterized-SQL), dependency-CVE fusion into the exploitability score, a **GitHub PR bot + Action**, **`--remediate`**, and **`--hunt --verify`**. The most recent releases add **finding suppression** (a `.attackmap-suppress.yaml` baseline plus inline `# attackmap:ignore` directives), a **GitHub Actions / CI workflow security scanner**, **taint sanitizer/validator awareness** (chains that pass through an escaper/validator are downgraded, not flagged), and **unauthenticated state-changing route** synthesis. The project is in active development. See [GitHub releases](https://github.com/mlaify/AttackMap/releases) and the [CHANGELOG](https://github.com/mlaify/AttackMap/blob/main/CHANGELOG.md).

---

## Where can I get help or report a bug?

- [GitHub Issues](https://github.com/mlaify/AttackMap/issues) — bug reports and feature requests
- [GitHub Discussions](https://github.com/mlaify/AttackMap/discussions) — questions and ideas
- Security vulnerabilities: see [SECURITY.md](https://github.com/mlaify/AttackMap/blob/main/SECURITY.md)
