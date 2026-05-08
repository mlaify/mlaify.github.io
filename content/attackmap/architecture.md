---
title: "AttackMap architecture"
description: "Deep-dive into the AttackMap pipeline: data models, module responsibilities, the translation gateway, security overlay, MITRE ATT&CK mapping, and the graph model."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 25
toc: true
accent: "attackmap"
lead: "How AttackMap turns raw source code into a prioritized defensive review — stage by stage, model by model."
---

## Module map

| Module | Responsibility |
|---|---|
| `cli.py` | Entry point; argument parsing; orchestrates the pipeline |
| `analyzers.py` | Analyzer discovery (entry points), selection, installation, execution, and merge |
| `scanner.py` | Generic file walker; framework-agnostic route/external-call/db/auth/secret extraction |
| `analyzer.py` | `AttackSurface` construction; attack-surface classification heuristics |
| `recon_to_analysis.py` | Formal translation gateway: auth-hint filtering + parallel translations |
| `threat_model.py` | `Finding` and `AttackPath` generation (heuristic chain-linking) |
| `security_overlay.py` | Cross-cutting asset/control/insight/detection-opportunity layering |
| `defensive_review.py` | Markdown review rendering with prioritization and source-quality weighting |
| `report.py` | JSON and markdown artifact writing |
| `llm_review.py` | Claude-powered narrative review generation |
| `review_prompts.py` | System + user prompt templates for LLM review |
| `context_pack.py` | Evidence pack assembly for LLM and downstream tools |
| `graph.py` | NetworkX-based trust-boundary graph |
| `attack_taxonomy.py` | MITRE ATT&CK technique catalog and insight/finding → technique mapping |
| `insights.py` | Cross-cutting insight detection (11 insight kinds) |
| `control_model.py` | Defensive control detection and strength assessment |
| `asset_model.py` | High-value asset detection |
| `detection_opportunities.py` | Defender-facing runtime signal hints |
| `models.py` | Analysis-level data models (AttackSurface, Finding, AttackPath, etc.) |
| `recon_models.py` | Recon-level data models (Route, DatabaseHint, AuthHint, etc.) |
| `analyzer_contracts.py` | Canonical SDK contract definitions (AnalyzerProtocol, AnalyzerMetadata) |
| `sdk/` | Re-exports for external analyzer authors |

---

## Stage 1: Recon collection

**Module:** `analyzers.py` + individual analyzer packages

Each analyzer satisfies `AnalyzerProtocol` and emits a `ScanResult`. The base scanner (`scanner.py`) provides framework-agnostic file walking that most analyzers call internally.

### ScanResult (the recon container)

```python
@dataclass
class ScanResult:
    root: str                           # repository root path
    languages: list[str]                # detected languages

    # Typed signal collections
    routes: list[Route]
    external_calls: list[ExternalCall]
    databases: list[DatabaseHint]
    auth_hints: list[AuthHint]          # NOTE: temporarily overloaded (see below)
    service_hints: list[ServiceHint]
    edge_hints: list[EdgeHint]
    entrypoint_hints: list[EntrypointHint]
    protocol_hints: list[ProtocolHint]
    framework_hints: list[FrameworkHint]
    secret_hints: list[SecretHint]
    files_scanned: int
```

{{< callout type="note" >}}
**`auth_hints` is temporarily overloaded.** During migration from Phase-1 to Phase-2 signal taxonomy, some analyzers emit non-auth metadata (service names, edges, protocol notes) into `auth_hints`. The translation gateway filters these before constructing attack surfaces. Phase-2 analyzers use the dedicated typed hint fields (`service_hints`, `edge_hints`, `protocol_hints`).
{{< /callout >}}

### Typed signal models

**Route** — Web endpoint
```python
@dataclass
class Route:
    path: str           # e.g., "/api/users"
    method: str         # e.g., "GET", "POST", "ANY"
    file: str           # relative file path
    line: int | None
```

**DatabaseHint** — Data store usage
```python
@dataclass
class DatabaseHint:
    kind: str           # "postgresql" | "mysql" | "mongodb" | "redis" | "sqlite" | "sql"
    file: str
    line: int | None
    evidence_text: str | None
```

**AuthHint** — Authentication / authorization signal
```python
@dataclass
class AuthHint:
    hint: str           # e.g., "jwt", "oauth", "session", "bearer"
    file: str
    line: int | None
    evidence_text: str | None
    confidence: float = 0.7
```

**SecretHint** — Secret-shaped environment variable usage
```python
@dataclass
class SecretHint:
    name: str           # e.g., "JWT_SECRET", "DB_PASSWORD"
    file: str
    line: int | None
    evidence_text: str | None
    confidence: float = 0.85    # higher default than auth hints
```

**ServiceHint / EdgeHint / EntrypointHint / ProtocolHint / FrameworkHint** — Phase-2 structured metadata, all following the same pattern:
```python
@dataclass
class ServiceHint:
    hint: str           # structured, e.g., "service_name:api-gateway"
    file: str
    line: int | None
    evidence_text: str | None
    confidence: float = 0.7
```

### Merge

`merge_analyzer_results()` deduplicates signals across analyzers:

- Routes deduplicated on `(path, method, file)` tuples
- AuthHints deduplicated on `(hint, file)` tuples
- DatabaseHints deduplicated on `(kind, file)` tuples
- SecretHints deduplicated on `(name, file)` tuples

This means running multiple analyzers on the same repo won't produce duplicate signals, even if they independently detect the same route.

---

## Stage 2: Translation gateway

**Module:** `recon_to_analysis.py`

The gateway is the single formal boundary between recon-level and analysis-level data. It performs:

1. **Auth-hint filtering** — removes hints that carry service/edge/protocol/framework metadata (identified by `service_name:`, `handler_type:`, `edge:`, `entrypoint:`, `atproto_`, `framework:` prefixes) from the `auth_hints` list before passing it to surface/finding generators

2. **Parallel translation** — three independent passes over the merged ScanResult:

```
ScanResult
  │
  ├─→ identify_attack_surfaces(routes, auth_hints_filtered)  → list[AttackSurface]
  ├─→ generate_findings(routes, auth_hints, databases, ...)  → list[Finding]
  └─→ generate_attack_paths(routes, services, externals)     → list[AttackPath]
```

---

## Stage 3: Analysis-level models

### AttackSurface

```python
@dataclass
class AttackSurface:
    route: str
    method: str
    file: str
    line: int | None
    category: Literal["webhook", "admin", "auth", "upload", "internal", "health", "public_api"]
    exposure: Literal["public", "internal", "unknown"] = "public"
    risk: Literal["low", "medium", "high"]
    auth_signals: list[str]             # auth hints relevant to this route
    data_store_interaction: bool        # True if any database present in repo
    outbound_integration: bool          # True if any external calls present
    rationale: list[str]                # human-readable classification reasoning
```

**Classification heuristics** (in `analyzer.py`):

| Pattern | Category | Default risk |
|---|---|---|
| `/webhook`, `/hook`, `/callback`, `/event` | webhook | high |
| `/admin`, `/manage`, `/dashboard`, `/backoffice` | admin | high |
| `/login`, `/logout`, `/auth`, `/token`, `/session` | auth | medium |
| `/upload`, `/file`, `/import`, `/attachment` | upload | high |
| `/health`, `/healthz`, `/ready`, `/ping`, `/metrics` | health | low |
| `/internal`, `/private`, `/_/` | internal | low |
| Everything else | public_api | low → medium (elevated if no auth signals) |

Risk is elevated when:
- No auth signals detected for the route
- External call targets are present
- Data store interactions are present
- Path contains parameters (`{id}`, `:id`)

### Finding

```python
@dataclass
class Finding:
    title: str
    severity: Literal["low", "medium", "high"]
    evidence: list[str]             # supporting facts from source
    mitigation: str                 # remediation advice
    confidence: Literal["low", "medium", "high"] = "medium"
    attack_techniques: list[AttackTechnique]
```

### AttackPath

```python
@dataclass
class AttackPath:
    name: str           # e.g., "Webhook → Admin escalation chain"
    steps: list[str]    # ordered sequence of steps
    impact: str         # potential impact description
```

### Asset

```python
@dataclass
class Asset:
    id: str
    kind: Literal[
        "credentials", "session", "user_pii", "payment",
        "internal_secret", "audit_log", "business_data", "configuration"
    ]
    name: str
    criticality: Literal["critical", "high", "medium", "low"]
    locations: list[str]    # files/routes where asset interacts
    evidence: list[str]
```

### Control

```python
@dataclass
class Control:
    id: str
    kind: Literal[
        "authentication", "authorization", "input_validation",
        "output_encoding", "rate_limiting", "csrf_protection",
        "encryption_at_rest", "encryption_in_transit", "audit_logging",
        "rbac", "mfa", "secret_management", "security_headers"
    ]
    name: str
    strength: Literal["strong", "moderate", "weak", "absent"]
    scope: Literal["global", "module", "route", "service", "asset"]
    placements: list[str]   # where the control was observed
    evidence: list[str]
    notes: str | None
```

### Insight

```python
@dataclass
class Insight:
    id: str
    kind: Literal[
        "shared_secret_blast_radius",
        "sensitive_asset_reachability",
        "control_bypass",
        "defense_gap_in_chain",
        "asymmetric_protection",
        "trust_boundary_violation",
        "audit_gap",
        "control_strength_mismatch",
        "single_point_of_failure",
        "stale_or_contradictory_signal",
        "admin_action_without_auth",
    ]
    title: str
    narrative: str
    severity: Literal["critical", "high", "medium", "low", "informational"]
    confidence: Literal["high", "medium", "low"]
    evidence: list[str]
    related_assets: list[str]
    related_controls: list[str]
    related_routes: list[str]
    suggested_action: str | None
    attack_techniques: list[AttackTechnique]
```

### DetectionOpportunity

```python
@dataclass
class DetectionOpportunity:
    id: str
    title: str
    rationale: str
    signal_kind: Literal["log", "metric", "trace", "network", "config_audit"]
    suggested_rule: str         # Sigma/KQL/Splunk-style rule sketch
    related_insight_ids: list[str]
    related_finding_titles: list[str]
    attack_techniques: list[AttackTechnique]
```

---

## Stage 4: Security overlay

**Module:** `security_overlay.py`, `insights.py`, `control_model.py`, `asset_model.py`, `detection_opportunities.py`

The overlay synthesizes a cross-cutting view from all prior stages:

```
ScanResult + AttackSurfaces + Findings + AttackPaths
    │
    ├─→ detect_assets()                → list[Asset]
    ├─→ detect_controls()              → list[Control]  (present + expected-but-absent)
    ├─→ generate_insights()            → list[Insight]  (11 insight kinds)
    ├─→ generate_detection_opportunities() → list[DetectionOpportunity]
    └─→ annotate findings with ATT&CK techniques
```

**SecurityOverlay** (the result):
```python
@dataclass
class SecurityOverlay:
    assets: list[Asset]
    controls: list[Control]
    insights: list[Insight]
    detection_opportunities: list[DetectionOpportunity]
    annotated_findings: list[Finding]   # findings with ATT&CK mapped
```

---

## MITRE ATT&CK mapping

**Module:** `attack_taxonomy.py`

AttackMap maps findings and insights to ATT&CK techniques using a curated catalog — conservative mappings only, no speculative associations.

**Curated technique catalog:**

| ID | Name | Tactic |
|---|---|---|
| T1190 | Exploit Public-Facing Application | Initial Access |
| T1078 | Valid Accounts | Defense Evasion / Persistence / Initial Access |
| T1199 | Trusted Relationship | Initial Access |
| T1212 | Exploitation for Credential Access | Credential Access |
| T1552 | Unsecured Credentials | Credential Access |
| T1110 | Brute Force | Credential Access |
| T1528 | Steal Application Access Token | Credential Access |
| T1068 | Exploitation for Privilege Escalation | Privilege Escalation |
| T1098 | Account Manipulation | Persistence / Privilege Escalation |
| T1562 | Impair Defenses | Defense Evasion |
| T1565 | Data Manipulation | Impact |
| T1485 | Data Destruction | Impact |
| T1041 | Exfiltration Over C2 Channel | Exfiltration |
| T1071 | Application Layer Protocol | Command and Control |
| T1059 | Command and Scripting Interpreter | Execution |
| T1556 | Modify Authentication Process | Defense Evasion / Persistence |

**Insight → technique mapping:**

| Insight kind | ATT&CK techniques |
|---|---|
| `shared_secret_blast_radius` | T1552, T1528, T1078 |
| `sensitive_asset_reachability` | T1190, T1041 |
| `control_bypass` | T1562, T1190 |
| `defense_gap_in_chain` | T1190, T1212 |
| `asymmetric_protection` | T1190, T1078 |
| `trust_boundary_violation` | T1199, T1190 |
| `audit_gap` | T1562 |
| `control_strength_mismatch` | T1110, T1552 |
| `single_point_of_failure` | T1552, T1528, T1556 |
| `admin_action_without_auth` | T1078, T1068, T1098 |

**Finding → technique mapping** (keyword-based fallback when no explicit mapping):

| Keywords in finding title | ATT&CK techniques |
|---|---|
| webhook, callback | T1190, T1199 |
| admin, manage, privileged | T1078, T1068, T1098 |
| upload | T1190, T1059 |
| auth, login, session | T1078, T1110, T1556 |
| secret, token, key | T1552, T1528 |
| public route, external | T1190 |
| exfil | T1041 |
| command, rce, exec | T1059 |
| data store, database | T1565 |

---

## Network graph

**Module:** `graph.py` (NetworkX `DiGraph`)

A lightweight trust-boundary graph is constructed for topology visualization and chain reasoning:

**Nodes:**
- `repo` (kind: `system`) — root node
- `web` (kind: `service`) — web/API layer (added if routes exist)
- `database_{kind}` (kind: `database`) — one per unique database kind
- `external_{i}` (kind: `external`) — one per unique external call target

**Edges:**
- `repo → web`: `contains`
- `web → database_{kind}`: `uses`
- `web → external_{i}`: `calls`
- `repo → database_{kind}`: `uses` (when no web layer present)
- `repo → external_{i}`: `calls` (when no web layer present)

---

## Stage 5: Reporting

**Module:** `report.py`, `defensive_review.py`

### JSON schemas

**`defensive-review.json`** — top-level structure:
```json
{
  "schema_version": "2.0",
  "target_metadata": { "root": "...", "files_scanned": 0 },
  "system_overview": "...",
  "attack_surface": [...],
  "assets": [...],
  "controls": [...],
  "notable_observations": [...],
  "detection_opportunities": [...],
  "attack_techniques_observed": [...],
  "strengths": [...],
  "weaknesses_risk_hotspots": [...],
  "evidence_chains": [...],
  "recommendations": [...],
  "raw_structured_signals": {
    "routes": [...],
    "external_calls": [...],
    "databases": [...],
    "auth_hints": [...],
    "secret_hints": [...]
  },
  "limitations_meta": { ... }
}
```

**`review-context-pack.json`** — LLM and downstream tool context:
```json
{
  "analyzer_metadata": { "name": "...", "version": "...", "scope": "..." },
  "source_quality_rules": { "low_quality_path_segments": [...] },
  "output_hints": { "audience": "...", "style": "...", "prioritization": "..." },
  "domain_hints": { "tags": ["atproto", "bluesky"] },
  "rag_expansion": { "enabled": false },
  "limitations_metadata": { ... }
}
```

### Source quality weighting

Signals from low-quality path segments are tracked but down-ranked:

Low-quality segments: `/tests/`, `/__tests__/`, `/fixtures/`, `/mocks/`, `/examples/`

Signals from these paths:
- Appear in `raw_structured_signals` with `evidence_class: "low_quality"` label
- Are **not** used to raise severity of recommendations
- Generate explicit warnings in `limitations_meta` if they are the only source of a signal

---

## LLM integration

**Module:** `llm_review.py`, `review_prompts.py`

### Evidence pack structure

The LLM never sees raw source code. It receives a structured evidence pack assembled from the security overlay:

```json
{
  "assets": [{ "kind": "credentials", "criticality": "critical", "locations": [...] }],
  "controls": [{ "kind": "authentication", "strength": "weak", "scope": "route" }],
  "notable_observations": [{ "kind": "trust_boundary_violation", "severity": "high" }],
  "attack_techniques_observed": [{ "technique_id": "T1190", "name": "..." }],
  "detection_opportunities": [{ "signal_kind": "log", "suggested_rule": "..." }]
}
```

### System prompt design

The system prompt instructs Claude to act as an "AttackMap Review Analyst" with these constraints:

- Evidence-first reasoning — only cite what's in the evidence pack
- Distinguish `OBSERVED` (from source signals) vs. `INFERRED` (derived)
- Defensive and remediation-oriented — no offensive guidance
- Cite evidence IDs: `surface:N`, `finding:N`, `asset:*`, `insight:*`, `control:*`
- Output structure: System Overview, Notable Observations (top 3), Asset/Control Map, Detection Opportunities (top 3), Strengths, Weaknesses, Evidence Chains, Recommendations, Analyst Confidence

### Auth resolution chain

```
1. ANTHROPIC_API_KEY env      → Anthropic SDK (per-token billing)
2. ANTHROPIC_AUTH_TOKEN env   → Anthropic SDK (OAuth bearer)
3. `claude` binary on PATH    → shell out (uses subscription)
```

Override with `--llm-backend api|cli|auto`.

Default model: `claude-opus-4-7`  
Default effort: `high`  
Max tokens: 32,000
