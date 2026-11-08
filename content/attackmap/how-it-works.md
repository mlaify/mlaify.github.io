---
title: "How it works"
description: "What happens between attackmap analyze and the report: the analyzers, the whole-repo passes, scoring, the outputs, and the optional AI review."
weight: 10
---

AttackMap is static analysis: it reads files and never runs them. A scan has four
stages, and only the last one, which is optional, involves a language model.

## 1. Analyzers read the repository

The scanner walks the repository once. Each **analyzer module** that recognises the
code (its `detect()` matches) reads the files it owns and returns structured signals:
routes and entry points, outbound calls, data stores, auth hints, secrets and
frameworks. Every signal carries a `file:line` citation, an evidence snippet and a
confidence level.

Four broad analyzers are built in (Python web, JavaScript web, config files, and a
fallback for everything else). Deeper ecosystem coverage comes from 15 official
plugin packages, one repository each, that register themselves through a Python
entry point. Analyzers run in `(priority, name)` order and their results are merged;
one that fails is skipped and reported, not fatal. You can write your own against the
[analyzer SDK](https://docs.mlaify.io/attackmap/sdk/).

The same per-file pass looks for weaknesses that need no route context: hard-coded
secrets, insecure crypto and weak randomness, web-hardening gaps (CORS, CSRF,
cookies, CSP, debug modes), JWT and OAuth/session mistakes, prototype pollution, XXE
and similar. Test and vendored code is skipped for these by default.

## 2. Whole-repo passes

Once every analyzer's output is merged, passes that need the full route list run
once over the whole repository:

| Pass | What it does |
|---|---|
| **Taint / data flow** | Seeds untrusted input at each route handler and follows it source → variable → sink inside the handler, then across files through a call-graph-refined import walk. Sinks come from a plugin-extensible registry (`taint_sinks.yaml`): SQL, shell, eval and expression injection, SSRF, SSTI, NoSQL, LDAP, XPath, path traversal, deserialization, open redirect and more. A chain through a known sanitizer is downgraded, not reported as-is. |
| **Dependencies** | A software bill of materials from the manifests and lockfiles, plus offline supply-chain risk checks. With `--cve`, the packages are matched against OSV.dev. |
| **CI workflows** | `.github/workflows`: unpinned actions, `pull_request_target` checkouts, secrets or injectable context in `run` steps, over-broad permissions, self-hosted runners on PR triggers. |
| **Authorization** | Routes with an id parameter that reach a data store with no ownership check nearby (BOLA/IDOR), and field-level mass assignment. |
| **Anomalies** | The odd one out among sibling routes, and signature-free invariant mining: a handler that reaches a dangerous sink without the guard its peers apply. |

Routes become **attack surfaces** with an exposure and an auth state. An analyzer's
own per-route auth decision wins over the fallback, which looks for auth code within
a few lines of the handler.

## 3. Graph, findings and scores

Surfaces, assets, data stores and external calls form a graph of the system. Findings
are built from the evidence above, mapped to MITRE ATT&CK, and ranked by a
deterministic 0–100 **exploitability score** that combines sink danger, exposure,
route auth, reachability, data sensitivity and known CVEs on the path. Nothing in the
score is learned or random: the same code gives the same ranking, and each finding
explains its score.

The precision limits are deliberate. Taint follows local assignments within one
function and the import graph across files; it doesn't follow a value into a helper
it's passed to, and it doesn't distinguish branches. `--recall` widens the walk and
marks the extra reach as speculative, so it stays out of gating until a reviewer (or
the verifier below) confirms it.

## 4. Outputs, and the optional AI passes

Every run writes:

- `defensive-review.md`, the prioritized review to start from;
- `attackmap-report.json` and **SARIF 2.1.0** for tools and code scanning;
- Mermaid and Graphviz diagrams of the attack surface and attack paths;
- generated Sigma detection rules, as leads for a detection team.

With `--baseline`, AttackMap diffs against an earlier report and `--fail-on-new-high`
fails a pull request only on new risk. Several repositories in one run
(`attackmap analyze svc-a svc-b gw`) are linked into a fleet graph: one service's
outbound calls are matched to another's routes, which surfaces confused-deputy flows
and the service that skips a control its siblings enforce.

The LLM passes are opt-in and work from the evidence pack, not from free-form code
reading: `--llm` writes a narrative review in which every claim must cite evidence
IDs, `--hunt` proposes exploit-chain hypotheses, `--verify` adjudicates each one
against the cited source (as a majority-vote jury if you ask), and `--triage` and
`--remediate` cluster findings and suggest fixes. Claude and OpenAI are supported,
through their APIs or their CLIs. Without these flags, nothing leaves your machine.

## Where to go next

- [Install](../install/) AttackMap.
- The [docs](https://docs.mlaify.io/attackmap/) cover every command, the
  [analyzers](https://docs.mlaify.io/attackmap/analyzers/) and the
  [AI review](https://docs.mlaify.io/attackmap/llm/).
- Architecture notes for contributors are in the
  [wiki](https://github.com/mlaify/AttackMap/wiki).
