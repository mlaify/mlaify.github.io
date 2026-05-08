---
title: "Custom analyzer SDK"
description: "Build, package, and publish your own AttackMap ecosystem analyzer — full SDK reference with AnalyzerProtocol, AnalyzerMetadata, ScanResult, and entry point registration."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 35
toc: true
accent: "attackmap"
lead: "Build an AttackMap analyzer for any language, framework, or platform — and have it auto-discovered by the engine."
---

## Overview

An AttackMap analyzer is a Python package that:

1. Implements the `AnalyzerProtocol` interface (two methods: `detect` and `analyze`)
2. Registers itself under the `attackmap.analyzers` Python entry point group
3. Returns a `ScanResult` from `analyze()`

That's it. The engine discovers your package automatically, calls `detect()` to check if it applies, and calls `analyze()` if it does. You don't need to modify the core package.

---

## SDK imports

All public SDK types are importable from `attackmap.sdk`:

```python
from attackmap.sdk import (
    # Protocol + metadata
    AnalyzerProtocol,
    AnalyzerMetadata,

    # Result type
    ScanResult,

    # Signal types
    Route,
    ExternalCall,
    DatabaseHint,
    AuthHint,
    ServiceHint,
    EdgeHint,
    EntrypointHint,
    ProtocolHint,
    FrameworkHint,
    SecretHint,
)
```

---

## AnalyzerProtocol

```python
from typing import Protocol
from pathlib import Path

class AnalyzerProtocol(Protocol):
    metadata: AnalyzerMetadata

    @property
    def name(self) -> str: ...

    def detect(self, root: str | Path) -> bool:
        """Return True if this analyzer applies to the repo at `root`."""
        ...

    def analyze(self, root: str | Path) -> ScanResult:
        """Analyze the repo at `root` and return a ScanResult."""
        ...
```

**`detect(root)`** should be fast — file existence checks, presence of a config file, etc. It is called for every installed analyzer on every run.

**`analyze(root)`** does the heavy work. Walk files, extract signals, return `ScanResult`.

---

## AnalyzerMetadata

```python
@dataclass
class AnalyzerMetadata:
    name: str                       # kebab-case, e.g., "ruby-rails"
    display_name: str = ""          # e.g., "Ruby on Rails"
    version: str = "0.1.0"
    description: str = ""
    scope: str = ""                 # e.g., "Ruby web frameworks"
    targets: list[str] = field(default_factory=list)    # ["rails", "sinatra"]
    languages: list[str] = field(default_factory=list)  # ["ruby"]
    priority: int = 100             # lower runs first
    experimental: bool = True
    enabled_by_default: bool = False
```

---

## ScanResult and signal types

```python
@dataclass
class ScanResult:
    root: str
    languages: list[str] = field(default_factory=list)
    routes: list[Route] = field(default_factory=list)
    external_calls: list[ExternalCall] = field(default_factory=list)
    databases: list[DatabaseHint] = field(default_factory=list)
    auth_hints: list[AuthHint] = field(default_factory=list)
    service_hints: list[ServiceHint] = field(default_factory=list)
    edge_hints: list[EdgeHint] = field(default_factory=list)
    entrypoint_hints: list[EntrypointHint] = field(default_factory=list)
    protocol_hints: list[ProtocolHint] = field(default_factory=list)
    framework_hints: list[FrameworkHint] = field(default_factory=list)
    secret_hints: list[SecretHint] = field(default_factory=list)
    files_scanned: int = 0
```

**Emit only what you observe.** Leave lists empty if not applicable. The merge stage handles combining results from multiple analyzers.

---

## Complete example: Ruby on Rails analyzer

```python
# src/attackmap_analyzer_ruby_rails/analyzer.py
import re
from pathlib import Path
from dataclasses import dataclass, field
from attackmap.sdk import (
    AnalyzerMetadata, ScanResult, Route,
    DatabaseHint, AuthHint, SecretHint, FrameworkHint,
)


@dataclass
class RubyRailsAnalyzer:
    metadata: AnalyzerMetadata = field(default_factory=lambda: AnalyzerMetadata(
        name="ruby-rails",
        display_name="Ruby on Rails",
        version="0.1.0",
        description="Extracts routes, database usage, and auth signals from Rails apps",
        scope="Ruby web frameworks",
        targets=["rails", "sinatra"],
        languages=["ruby"],
        priority=80,
        experimental=True,
        enabled_by_default=False,
    ))

    @property
    def name(self) -> str:
        return self.metadata.name

    def detect(self, root: str | Path) -> bool:
        root = Path(root)
        # Rails apps have a Gemfile and config/routes.rb
        return (root / "Gemfile").exists() and (root / "config" / "routes.rb").exists()

    def analyze(self, root: str | Path) -> ScanResult:
        root = Path(root)
        routes = []
        databases = []
        auth_hints = []
        secret_hints = []
        files_scanned = 0

        # Extract routes from config/routes.rb
        routes_file = root / "config" / "routes.rb"
        if routes_file.exists():
            files_scanned += 1
            content = routes_file.read_text(errors="replace")
            for i, line in enumerate(content.splitlines(), 1):
                # Match: get '/path', to: 'controller#action'
                m = re.search(r"\b(get|post|put|patch|delete)\s+['\"]([^'\"]+)['\"]", line)
                if m:
                    routes.append(Route(
                        path=m.group(2),
                        method=m.group(1).upper(),
                        file="config/routes.rb",
                        line=i,
                    ))

        # Walk model files for database hints
        models_dir = root / "app" / "models"
        if models_dir.exists():
            for rb_file in models_dir.rglob("*.rb"):
                files_scanned += 1
                content = rb_file.read_text(errors="replace")
                if "ApplicationRecord" in content or "ActiveRecord::Base" in content:
                    databases.append(DatabaseHint(
                        kind="sql",  # Rails defaults to SQL; refine from database.yml
                        file=str(rb_file.relative_to(root)),
                        line=None,
                        evidence_text="ActiveRecord model",
                    ))
                    break  # one hint per repo is enough

        # Check for auth libraries in Gemfile
        gemfile = root / "Gemfile"
        if gemfile.exists():
            content = gemfile.read_text(errors="replace")
            if "devise" in content:
                auth_hints.append(AuthHint(
                    hint="devise",
                    file="Gemfile",
                    line=None,
                    evidence_text="gem 'devise'",
                    confidence=0.9,
                ))
            if "jwt" in content.lower():
                auth_hints.append(AuthHint(
                    hint="jwt",
                    file="Gemfile",
                    line=None,
                    evidence_text="JWT gem present",
                    confidence=0.8,
                ))

        # Check for secret-shaped env vars in config
        credentials_file = root / "config" / "credentials.yml.enc"
        if credentials_file.exists():
            secret_hints.append(SecretHint(
                name="RAILS_MASTER_KEY",
                file="config/credentials.yml.enc",
                line=None,
                evidence_text="Encrypted credentials file",
                confidence=0.9,
            ))

        return ScanResult(
            root=str(root),
            languages=["ruby"],
            routes=routes,
            databases=databases,
            auth_hints=auth_hints,
            secret_hints=secret_hints,
            framework_hints=[],
            files_scanned=files_scanned,
        )
```

---

## Packaging and entry point registration

### pyproject.toml

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "attackmap-analyzer-ruby-rails"
version = "0.1.0"
description = "AttackMap analyzer for Ruby on Rails"
requires-python = ">=3.11"
dependencies = ["attackmap>=0.1.0"]

# This is the critical part — registers your analyzer with AttackMap
[project.entry-points."attackmap.analyzers"]
ruby_rails = "attackmap_analyzer_ruby_rails.analyzer:RubyRailsAnalyzer"
```

The entry point key (`ruby_rails`) becomes the value you pass to `--module ruby_rails`. By convention, use underscores (not hyphens) in the entry point key.

### Directory structure

```
attackmap-analyzer-ruby-rails/
├── pyproject.toml
├── README.md
├── src/
│   └── attackmap_analyzer_ruby_rails/
│       ├── __init__.py
│       └── analyzer.py
└── tests/
    ├── fixtures/
    │   └── rails_app/
    │       ├── Gemfile
    │       └── config/
    │           └── routes.rb
    └── test_ruby_rails_analyzer.py
```

### Installing for development

```bash
pip install -e .
```

After install, AttackMap discovers your analyzer automatically:

```bash
attackmap modules          # should list ruby_rails
attackmap analyze . --module ruby_rails
```

---

## Testing your analyzer

### Fixture-based tests

Use a minimal fixture repository to test `detect()` and `analyze()`:

```python
# tests/test_ruby_rails_analyzer.py
from pathlib import Path
from attackmap_analyzer_ruby_rails.analyzer import RubyRailsAnalyzer

FIXTURE = Path(__file__).parent / "fixtures" / "rails_app"

def test_detect():
    analyzer = RubyRailsAnalyzer()
    assert analyzer.detect(FIXTURE) is True

def test_no_detect_on_python_repo(tmp_path):
    (tmp_path / "setup.py").write_text("")
    analyzer = RubyRailsAnalyzer()
    assert analyzer.detect(tmp_path) is False

def test_routes_extracted():
    analyzer = RubyRailsAnalyzer()
    result = analyzer.analyze(FIXTURE)
    paths = {r.path for r in result.routes}
    assert "/users" in paths
    assert "/sessions" in paths

def test_auth_hints_present():
    analyzer = RubyRailsAnalyzer()
    result = analyzer.analyze(FIXTURE)
    hints = {h.hint for h in result.auth_hints}
    assert "devise" in hints

def test_scan_result_is_valid():
    analyzer = RubyRailsAnalyzer()
    result = analyzer.analyze(FIXTURE)
    assert result.root == str(FIXTURE)
    assert "ruby" in result.languages
    assert result.files_scanned > 0
```

---

## Best practices

**`detect()` should be cheap.** Check for a Gemfile, a `*.csproj`, a `go.mod` — don't walk the whole tree.

**Emit evidence text.** Always populate `evidence_text` with a short snippet: the import line, the route declaration, the connection string. Evidence text appears in the defensive review and helps reviewers trust the signal.

**Use confidence accurately.** `0.9+` for definitive signals (an import statement). `0.7` for heuristic signals (a file name pattern). `0.5` for weak inferences.

**Be specific about database kinds.** Use `"postgresql"`, `"mysql"`, `"sqlite"`, `"mongodb"`, `"redis"` — not just `"sql"`. The generic `"sql"` is a fallback.

**Prefer typed hint fields.** Use `service_hints` for service identity, `edge_hints` for service-to-service connections, `protocol_hints` for protocol surfaces. Avoid stuffing non-auth data into `auth_hints`.

**Test against real fixture repos.** The fixture approach (a minimal app in `tests/fixtures/`) catches regressions far better than mocks.

**Use `files_scanned`.** Set this to the actual number of files your analyzer read. It appears in the architecture summary and helps users understand scan coverage.

---

## Publishing

Once your analyzer works locally:

```bash
# Build
pip install build
python -m build

# Publish to PyPI
pip install twine
twine upload dist/*
```

After publishing, users can install it directly:

```bash
pip install attackmap-analyzer-ruby-rails
```

Or via the `--module` flag with auto-install (from GitHub, if the repo is under the `mlaify` org):

```bash
attackmap analyze . --module ruby_rails
```

To have your analyzer listed in `attackmap modules`, open a pull request to [mlaify/AttackMap](https://github.com/mlaify/AttackMap) adding your repo to the known-analyzers list.
