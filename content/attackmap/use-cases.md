---
title: "AttackMap use cases"
description: "Concrete ways teams use AttackMap: onboarding unknown repos, gating CI/CD, prepping architecture reviews, and security due diligence."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 30
toc: true
accent: "attackmap"
lead: "Three concrete workflows where AttackMap replaces hours of manual work."
---

## 1. Unknown repository onboarding

**Scenario:** You inherit a codebase — a vendor acquisition, a team handoff, a GitHub repo you're about to depend on. You need to understand what it does and where its risk lives, fast.

**What AttackMap does:**

```bash
git clone https://github.com/vendor/their-service.git
cd their-service
pip install attackmap
attackmap analyze . --output security-review
```

In 5–30 seconds (depending on repo size) you have:

- `architecture.md` — what languages and frameworks it uses, how many routes, which data stores, which external services it calls
- `attack-surface.md` — every route classified by category and risk, ordered highest-risk first
- `defensive-review.md` — findings (what's wrong), assets (what's at stake), controls (what's protecting them), and recommendations (what to fix)

**What you learn from `architecture.md`:**

```markdown
## System overview
Languages: python, javascript
Routes: 47 total (12 GET, 18 POST, 7 PUT, 4 DELETE, 6 ANY)
Data stores: postgresql, redis
External calls: api.stripe.com, hooks.slack.com, api.sendgrid.com
Auth signals: jwt, session, bearer
```

Before reading a line of code, you know: this is a Python/JS service with a PostgreSQL database and Redis cache, it takes payments via Stripe and sends email via SendGrid, and it uses JWT + session-based auth.

**What you learn from the attack surface:**

```markdown
## High-risk routes
POST /webhooks/stripe   [webhook, high, no auth signals detected]
POST /admin/users       [admin, high, auth: bearer]
POST /upload/avatar     [upload, high, auth: session]
GET  /api/v1/export     [public_api, medium, no auth signals detected]
```

Two immediate concerns: an unauthenticated Stripe webhook endpoint (attacker could forge payment events) and an unauthenticated data export endpoint.

**With LLM narrative:**

```bash
attackmap analyze . --llm
```

`defensive-review-llm.md` gives you a prose review you can share with a non-technical stakeholder or put directly in a due-diligence report.

---

## 2. CI/CD security gating

**Scenario:** You want to catch regressions — new attack-surface exposure introduced by pull requests — before they merge.

**What AttackMap does:**

It produces a structured `defensive-review.json` with a predictable schema. You compare the current scan to a baseline and fail the build on specific conditions.

### GitHub Actions: basic gate

```yaml
name: AttackMap security gate

on: [pull_request]

jobs:
  attackmap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install AttackMap
        run: pip install attackmap

      - name: Run analysis
        run: attackmap analyze . --output reports --format json

      - name: Check for high-severity findings
        run: |
          python - <<'EOF'
          import json, sys
          with open("reports/defensive-review.json") as f:
              review = json.load(f)
          high = [
              s for s in review.get("attack_surface", [])
              if s.get("risk") == "high" and not s.get("auth_signals")
          ]
          if high:
              print(f"FAIL: {len(high)} high-risk routes with no auth signals")
              for s in high:
                  print(f"  {s['method']} {s['route']} [{s['category']}]")
              sys.exit(1)
          print("OK: no high-risk unauthenticated routes")
          EOF

      - name: Upload review artifacts
        uses: actions/upload-artifact@v4
        with:
          name: security-review-${{ github.sha }}
          path: reports/
```

### GitLab CI

```yaml
attackmap:
  image: python:3.12-slim
  stage: security
  before_script:
    - pip install attackmap
  script:
    - attackmap analyze . --output reports --format json
    - |
      python - <<'EOF'
      import json, sys
      with open("reports/defensive-review.json") as f:
          review = json.load(f)
      findings = [f for f in review.get("attack_surface", []) if f.get("risk") == "high"]
      if findings:
          print(f"High-risk surfaces: {len(findings)}")
          sys.exit(1)
      EOF
  artifacts:
    paths:
      - reports/
    expire_in: 7 days
```

### What to gate on

From `defensive-review.json`:

| Condition | Field path | Gate action |
|---|---|---|
| New unauthenticated high-risk routes | `attack_surface[].risk == "high" AND auth_signals == []` | Block merge |
| New webhooks with no auth | `attack_surface[].category == "webhook" AND auth_signals == []` | Block merge |
| New external calls | count of `raw_structured_signals.external_calls` | Warn, require review |
| New secret hints | count of `raw_structured_signals.secret_hints` | Block merge |
| Trust boundary violations | `notable_observations[].kind == "trust_boundary_violation"` | Require senior review |

### Baseline diffing

For more sophisticated gating, compare the current scan to a baseline stored in your repository:

```bash
# Generate baseline on main branch
git checkout main
attackmap analyze . --output .attackmap-baseline --format json

# On PR branch: run and compare
git checkout feature-branch
attackmap analyze . --output .attackmap-pr --format json

python scripts/compare_attackmap.py \
  --baseline .attackmap-baseline/defensive-review.json \
  --current .attackmap-pr/defensive-review.json
```

---

## 3. Architecture review preparation

**Scenario:** Your team is doing a security architecture review — either internally or with an external consultant. You want reviewers to spend their time on judgment calls, not basic discovery.

**What AttackMap does:**

Generate the factual foundation so reviewers can skip the "what does this system do?" phase and go straight to "is this design safe?"

```bash
attackmap analyze . --output pre-review --llm --llm-effort high
```

**Share `architecture.md` as the system overview.** It answers in one page: what languages, how many routes, which data stores, which external dependencies, what auth signals are present.

**Share `attack-surface.md` as the entry-point inventory.** Reviewers can immediately identify which surfaces need the most attention without reading code.

**Share `defensive-review-llm.md` as the pre-read.** The LLM narrative synthesizes the evidence into a prose review that sets context for the discussion.

**Use the review session for judgment:** which attack paths are realistic given your threat model? Which controls are adequate? Which recommendations are highest priority given your roadmap?

### Sample review agenda (60 minutes)

| Time | Topic | Input |
|---|---|---|
| 0–10 min | System walkthrough | `architecture.md` |
| 10–25 min | Attack surface review | `attack-surface.md` |
| 25–45 min | Findings and controls | `defensive-review.md` |
| 45–55 min | Recommendations prioritization | `defensive-review-llm.md` |
| 55–60 min | Action items | Notes |

**Artifacts to keep:**
- `attackmap-report.json` — attach to the review ticket for compliance record
- MITRE ATT&CK techniques list — link to your threat intelligence tooling
- Detection opportunities — hand to your SIEM/logging team

---

## 4. Security due diligence

**Scenario:** Evaluating a vendor, an open-source dependency, or a target for acquisition. You need a security signal quickly without a full penetration test.

```bash
# Clone target, run analysis, add LLM for narrative
git clone <target-repo>
attackmap analyze <target-repo> --output due-diligence --llm --llm-effort max
```

**What to look for in the output:**

| Signal | What it means |
|---|---|
| Many high-risk routes with no auth signals | Auth model may be inconsistent or absent |
| Secrets in secret_hints | Secrets may be committed or leaked in env var names |
| External calls to unusual domains | Third-party data sharing; supply chain surface |
| Trust boundary violations | Service-to-service calls without enforcement |
| `control_strength_mismatch` insight | Some routes protected, similar routes not |
| Admin routes with weak auth | Privilege escalation surface |

**Attach to due-diligence report:**
- `defensive-review.json` — structured evidence (auditable)
- `defensive-review-llm.md` — narrative summary (executive-readable)
- MITRE ATT&CK technique list — threat intelligence context
