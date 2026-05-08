---
title: "AttackMap analyzers"
description: "Complete reference for all 13 AttackMap ecosystem analyzer plugins — what each detects, what frameworks it covers, and how to install it."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 20
toc: true
accent: "attackmap"
lead: "13 ecosystem-specific analyzer plugins, each a standalone pip package discovered at runtime via Python entry points."
---

## How analyzers work

AttackMap discovers plugins via the Python **entry point group** `attackmap.analyzers`. Any package that registers an entry point in this group — and exports a class satisfying `AnalyzerProtocol` — is automatically available.

When you run `attackmap analyze .`, the engine:

1. Discovers all installed `attackmap.analyzers` entry points
2. Calls `analyzer.detect(root)` on each — returning `True` means "this analyzer is relevant to this repo"
3. Runs `analyzer.analyze(root)` on relevant analyzers in priority order
4. Merges all `ScanResult` objects by deduplicating signals on `(key, file)` tuples
5. Passes the merged result through the translation gateway

### Installing analyzers

```bash
# Install one
pip install git+https://github.com/mlaify/attackmap-analyzer-python.git

# Install all known analyzers at once (development)
attackmap modules  # shows what's available
pip install git+https://github.com/mlaify/attackmap-analyzer-<NAME>.git

# Auto-install via --module flag
attackmap analyze . --module go       # installs attackmap-analyzer-go if missing
attackmap analyze . --module java_spring
```

### AnalyzerProtocol

Every analyzer must satisfy:

```python
class AnalyzerProtocol(Protocol):
    metadata: AnalyzerMetadata

    @property
    def name(self) -> str: ...

    def detect(self, root: str | Path) -> bool: ...
    def analyze(self, root: str | Path) -> ScanResult: ...
```

`AnalyzerMetadata` fields:

| Field | Type | Description |
|---|---|---|
| `name` | `str` | kebab-case identifier (entry point key) |
| `display_name` | `str` | Human-readable name |
| `version` | `str` | Semver string |
| `description` | `str` | What the analyzer detects |
| `scope` | `str` | Ecosystem scope description |
| `targets` | `list[str]` | Frameworks/platforms (e.g., `["fastapi", "flask"]`) |
| `languages` | `list[str]` | Languages (e.g., `["python"]`) |
| `priority` | `int` | Execution order (lower = runs first) |
| `experimental` | `bool` | Whether output should be treated as stable |
| `enabled_by_default` | `bool` | Whether the analyzer runs without `--module` |

---

## Built-in analyzers

These ship with the core `attackmap` package and always run:

| Entry point | Scope | Description |
|---|---|---|
| `python-web` | Python web frameworks | FastAPI + Flask route extraction, basic scanner |
| `javascript-web` | JavaScript/TypeScript web | Express route extraction, basic scanner |
| `default` | Compiled / generic | Fallback for TypeScript and unrecognized stacks |

---

## Python

**Package:** `attackmap-analyzer-python`
**Entry point:** `python`
**Languages:** Python
**Targets:** Django, Django REST Framework, FastAPI, Flask, Starlette, AIOHTTP, Sanic, Litestar

### What it detects

**Routes:** Framework-specific patterns:
- `path()`, `re_path()`, `url()` — Django URL dispatcher
- `@app.get/post/put/delete/patch` — FastAPI, Flask, Starlette decorators
- `router.add_route()` — AIOHTTP
- `@app.route()` — Sanic

**Databases:** SQLAlchemy dialect inspection (`postgresql`, `mysql`, `sqlite`, `mongodb`, generic `sql`)

**Auth signals:** `passlib`, `bcrypt`, `argon2`, `PyJWT`, `python-jose`, `authlib`, session keys, `LOGIN_URL`, `AUTH_USER_MODEL`

**External calls:** `httpx`, `aiohttp.ClientSession`, `requests`

**Secrets:** Environment variable names matching patterns like `JWT_SECRET`, `DB_PASSWORD`, `SECRET_KEY`, `API_KEY`

**Service hints:** Service name from `pyproject.toml` `[project]` name, `__service_name__` attributes

**Framework hints:** Detected framework name

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-python.git
```

---

## Node.js / TypeScript (Service)

**Package:** `attackmap-analyzer-node-service`
**Entry point:** `node_service`
**Languages:** JavaScript, TypeScript
**Targets:** Distributed Node service patterns (not Express routing)

### What it detects

Oriented toward multi-service Node.js architectures rather than single-app Express routing:

**Service identity:** Service name from `package.json`, handler type classification (internal vs. external-facing)

**External calls:** HTTP URLs in TypeScript source (outbound service calls)

**Databases:** Connection string patterns (`postgres://`, `mongodb://`, `redis://`)

**Auth/signing:** JWT library imports, OAuth patterns, HMAC signing keys

**Edge hints:** Service-to-service dependency edges derived from import analysis

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-node-service.git
```

---

## Go

**Package:** `attackmap-analyzer-go`
**Entry point:** `go`
**Languages:** Go
**Targets:** chi, gin, echo, fiber, gorilla/mux, stdlib `net/http`

### What it detects

**Routes:** Framework-aware extraction:
- `chi.Router` — `r.Get/Post/Put/Delete/Patch`
- `gin.Engine` — `r.GET/POST/PUT/DELETE`
- `echo.Echo` — `e.GET/POST/PUT/DELETE`
- `fiber.App` — `app.Get/Post/Put/Delete`
- `gorilla/mux.Router` — `r.HandleFunc` with method matching
- `http.HandleFunc` / `http.Handle` — stdlib patterns

**Databases:** GORM dialect awareness (`gorm.io/driver/postgres`, `mysql`, `sqlite`), direct `database/sql` usage

**Auth signals:** `golang-jwt/jwt`, `lestrrat-go/jwx`, OAuth2 (`golang.org/x/oauth2`), `casbin`, session packages

**External calls:** `net/http.Get/Post`, `resty.Client`, AWS SDK endpoint patterns

**Secrets:** `os.Getenv` calls with secret-shaped variable names (`DB_PASSWORD`, `JWT_SECRET`, `API_KEY`)

**Cache/KV:** `go-redis`, `bbolt` data stores

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-go.git
```

---

## Java / Spring

**Package:** `attackmap-analyzer-java-spring`
**Entry point:** `java_spring`
**Languages:** Java, Kotlin
**Targets:** Spring Boot, Spring MVC, JAX-RS, Ktor

### What it detects

**Routes:** Annotation-based routing:
- `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`
- `@RequestMapping(method = ...)`
- JAX-RS: `@Path`, `@GET`, `@POST`, etc.
- Ktor: `get { }`, `post { }` routing DSL

**Databases:** Spring Data repositories (`JpaRepository`, `MongoRepository`, `RedisRepository`), EF Core (Kotlin), JDBC templates

**Auth signals:** Spring Security (`@Secured`, `@PreAuthorize`, `SecurityFilterChain`), JJWT (`io.jsonwebtoken`), OAuth2 resource server configuration

**External calls:** `RestTemplate`, `WebClient`, `OkHttpClient`, `HttpClient` (Java 11+)

**Secrets:** `@Value("${secret.*}")`, `environment.getProperty("*password*")`, `System.getenv("*KEY*")`

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-java-spring.git
```

---

## .NET / ASP.NET Core

**Package:** `attackmap-analyzer-dotnet`
**Entry point:** `dotnet`
**Languages:** C#
**Targets:** ASP.NET Core Minimal APIs, attribute routing, .NET 6+

### What it detects

**Routes:**
- Minimal API: `app.MapGet/MapPost/MapPut/MapDelete/MapPatch`
- Attribute routing: `[HttpGet]`, `[HttpPost]`, `[Route]`, `[ApiController]`
- Razor Pages: `OnGet`, `OnPost` handlers

**Databases:** Entity Framework Core (`DbContext` subclasses, `context.SaveChanges()`, database provider detection)

**Auth signals:** ASP.NET Core Identity (`AddIdentity`, `RequireAuthorization`), JWT Bearer middleware (`AddAuthentication().AddJwtBearer()`), `[Authorize]` attributes, policy names

**Secrets:** `IConfiguration["SecretKey"]`, `Environment.GetEnvironmentVariable("*PASSWORD*")`, connection strings containing `Password=`

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-dotnet.git
```

---

## Rust

**Package:** `attackmap-analyzer-rust`
**Entry point:** `rust`
**Languages:** Rust
**Targets:** axum, actix-web, rocket

### What it detects

**Routes:**
- axum: `.route("/path", get(...))`, `.route("/path", post(...))`, `Router::new().route(...)`
- actix-web: `web::get()`, `web::post()`, `#[get("/path")]`, `#[post("/path")]`
- rocket: `#[get("/path")]`, `#[post("/path")]`

**Databases:** `sqlx` (with dialect detection from connection string), `diesel`, `sea-orm`, `rusqlite`, `mongodb`

**Auth signals:** `jsonwebtoken`, `jwt-simple`, `argon2`, `bcrypt`, `sha2` (in auth context), session middleware patterns

**External calls:** `reqwest::Client`, `hyper::Client`, `awc::Client` (actix)

**Secrets:** `std::env::var("*SECRET*")`, `std::env::var("*PASSWORD*")`, `.env` file references

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-rust.git
```

---

## PHP (Generic Web)

**Package:** `attackmap-analyzer-php-web`
**Entry point:** `php_web`
**Languages:** PHP
**Targets:** Laravel, Symfony, custom routing, generic PHP

### What it detects

**Routes:** Laravel (`Route::get/post/put/delete`, `router->get/post`), Symfony routing attributes, `$app->get/post` (Slim), custom `$router` patterns

**Databases:** PDO connection strings, Laravel Eloquent (`Model::find`, `DB::table`), Doctrine patterns

**Auth signals:** Laravel Auth (`Auth::attempt`, `auth()->user()`), Symfony security, `session_start()`, JWT library imports

**Secrets:** `$_ENV['SECRET']`, `env('DB_PASSWORD')`, `.env` file references

**Detection:** Detects PHP repos via `index.php`, `composer.json` with PHP dependencies, or `*.php` file prevalence

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-php-web.git
```

---

## PHP Laminas

**Package:** `attackmap-analyzer-php-laminas`
**Entry point:** `php_laminas` (implied)
**Languages:** PHP
**Targets:** Laminas (formerly Zend Framework), Laminas API Tools

### What it detects

Specialized for Laminas module-based architecture:

**Routes:** Laminas `module.config.php` route definitions, `['type' => 'segment']`, `['type' => 'literal']` route types

**Service identity:** Module name from `Module.php`, service manager factory registrations

**Databases:** Laminas db adapter configurations (`Laminas\Db\Adapter\Adapter`)

**Auth signals:** `Laminas\Authentication`, `Laminas\Permissions\Acl`, `Laminas\Permissions\Rbac`

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-php-laminas.git
```

---

## Terraform

**Package:** `attackmap-analyzer-terraform`
**Entry point:** `terraform`
**Languages:** HCL
**Targets:** AWS, Azure, GCP Terraform configurations

### What it detects

Unlike code analyzers, this one surfaces **infrastructure risk patterns**:

**IAM misconfigurations:**
- `"Action": "*"` wildcard IAM policies
- `"Resource": "*"` wildcard resource grants
- Over-broad `"Effect": "Allow"` in policies

**Network exposure:**
- Security groups with `0.0.0.0/0` on non-80/443 ports
- Open ingress on sensitive ports (22/SSH, 3389/RDP, 5432/Postgres, etc.)

**Secret exposure:**
- `aws_secretsmanager_secret` / `azurerm_key_vault_secret` resources (high-value assets)
- Secrets passed as string literals (hardcoded credentials in Terraform)
- `sensitive = false` overrides on sensitive variables

**Cloud-specific signals:**
- S3 buckets with `acl = "public-read"` or `block_public_acls = false`
- RDS instances with `publicly_accessible = true`
- Lambda with `*` resource IAM roles

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-terraform.git
```

---

## AT Protocol

**Package:** `attackmap-analyzer-atproto`
**Entry point:** `atproto`
**Languages:** TypeScript, JavaScript (AT Protocol implementations)
**Targets:** Bluesky PDS, ATProto relay, AppView, custom Lexicon implementations

### What it detects

Specialized for AT Protocol ecosystem codebases:

**Routes:** XRPC namespace inference from Lexicon JSON files (`/lexicons/**/*.json`). Converts Lexicon NSIDs (e.g., `com.atproto.server.createSession`) to route paths and HTTP methods.

**Protocol signals:** AT Protocol-specific auth patterns (DID auth, JWT with `aud=did:*`, app passwords), event stream endpoints (`subscribeRepos`, `subscribeLabels`)

**Service identity:** PDS vs. Relay vs. AppView classification from `package.json` service name and Lexicon namespace patterns

**External calls:** `AtpAgent`, `BskyAgent`, `com.atproto.*` cross-service calls

**Auth signals:** AT Protocol application passwords, DID document signing keys

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-atproto.git
```

---

## C

**Package:** `attackmap-analyzer-c`
**Entry point:** `c` (implied)
**Languages:** C
**Targets:** C applications with network surface

### What it detects

**Routes:** HTTP handler patterns in common C web frameworks (`microhttpd`, `libmicrohttpd`, `mongoose`)

**External calls:** `curl_easy_setopt(CURLOPT_URL, ...)`, socket connection targets

**Secrets:** `getenv("SECRET_KEY")`, hardcoded credential strings

**Databases:** `sqlite3_open`, `mysql_connect`, `PQconnectdb` patterns

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-c.git
```

---

## C++

**Package:** `attackmap-analyzer-cpp`
**Entry point:** `cpp` (implied)
**Languages:** C++
**Targets:** C++ applications with network surface

### What it detects

Similar surface to the C analyzer, extended for:

**Routes:** Crow (`CROW_ROUTE`), Pistache (`router.get`, `router.post`), Drogon (`ADD_METHOD_TO`, `ADD_ROUTE_TO`)

**External calls:** `cpr::Get()`, `cpr::Post()`, `boost::beast` HTTP client patterns

**Secrets:** `std::getenv("*KEY*")`, `std::getenv("*SECRET*")`

**Install:**

```bash
pip install git+https://github.com/mlaify/attackmap-analyzer-cpp.git
```

---

## Omeka-S

**Package:** `attack-map-analyzer-omeka-s`
**Entry point:** `omeka_s` (implied)
**Languages:** PHP
**Targets:** Omeka-S digital collections platform and its module ecosystem

### What it detects

Specialized for Omeka-S module-based architecture:

**Routes:** Omeka-S module route configuration (`['type' => 'segment']` in module config), admin and API route registration

**Service identity:** Module name from `Module.php` class, service factory registrations in `module.config.php`

**Extensions:** Omeka-S extension/plugin detection (`OmekaExtensionService`, adapter imports)

**Admin surface:** `AdminController` route patterns (elevated privilege)

**Sync services:** Background sync service patterns (`SyncService`)

**Install:**

```bash
pip install git+https://github.com/mlaify/attack-map-analyzer-omeka-s.git
```

---

## Summary table

| Analyzer | Entry point | Language | Key frameworks | Source |
|---|---|---|---|---|
| Python | `python` | Python | Django, FastAPI, Flask, Starlette, AIOHTTP, Sanic, Litestar | [GitHub](https://github.com/mlaify/attackmap-analyzer-python) |
| Node/TS service | `node_service` | JS/TS | Distributed Node services | [GitHub](https://github.com/mlaify/attackmap-analyzer-node-service) |
| Go | `go` | Go | chi, gin, echo, fiber, gorilla/mux, stdlib | [GitHub](https://github.com/mlaify/attackmap-analyzer-go) |
| Java/Spring | `java_spring` | Java, Kotlin | Spring Boot, Spring MVC, JAX-RS, Ktor | [GitHub](https://github.com/mlaify/attackmap-analyzer-java-spring) |
| .NET | `dotnet` | C# | ASP.NET Core, Minimal APIs, Razor Pages | [GitHub](https://github.com/mlaify/attackmap-analyzer-dotnet) |
| Rust | `rust` | Rust | axum, actix-web, rocket | [GitHub](https://github.com/mlaify/attackmap-analyzer-rust) |
| PHP web | `php_web` | PHP | Laravel, Symfony, Slim, generic | [GitHub](https://github.com/mlaify/attackmap-analyzer-php-web) |
| PHP Laminas | `php_laminas` | PHP | Laminas, Laminas API Tools | [GitHub](https://github.com/mlaify/attackmap-analyzer-php-laminas) |
| Terraform | `terraform` | HCL | AWS, Azure, GCP | [GitHub](https://github.com/mlaify/attackmap-analyzer-terraform) |
| AT Protocol | `atproto` | JS/TS | Bluesky PDS, ATProto relay, AppView | [GitHub](https://github.com/mlaify/attackmap-analyzer-atproto) |
| C | `c` | C | microhttpd, mongoose, libcurl | [GitHub](https://github.com/mlaify/attackmap-analyzer-c) |
| C++ | `cpp` | C++ | Crow, Pistache, Drogon | [GitHub](https://github.com/mlaify/attackmap-analyzer-cpp) |
| Omeka-S | `omeka_s` | PHP | Omeka-S platform | [GitHub](https://github.com/mlaify/attack-map-analyzer-omeka-s) |

---

## Writing a custom analyzer

See the [Custom Analyzer SDK guide](/attackmap/sdk/) for step-by-step instructions on implementing `AnalyzerProtocol`, registering the entry point, and packaging your analyzer as a pip-installable plugin.
