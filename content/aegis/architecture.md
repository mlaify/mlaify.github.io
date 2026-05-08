---
title: "Aegis architecture"
description: "Component-by-component breakdown of the 13 Aegis repositories: aegis-core crates, relay, gateway, FFI, SDK, admin, and deployment stack."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 50
toc: true
accent: "aegis"
lead: "13 repositories, each scoped to a security boundary — how they fit together."
---

## Repository dependency tree

```
aegis-spec   ← protocol truth (RFCs, schemas, conformance matrix)
     │
aegis-core   ← shared Rust crates (crypto, protocol types, identity, API types)
     │
     ├── aegit-cli        ← reference CLI
     ├── aegis-relay      ← store-and-forward HTTP service
     ├── aegis-gateway    ← legacy SMTP/IMAP bridge
     ├── aegis-ffi        ← UniFFI Rust bridge
     │       │
     │       ├── aegis-apple    ← SwiftUI iOS/macOS
     │       └── aegis-android  ← Kotlin/Compose Android
     ├── aegis-web        ← React SPA (uses @noble/post-quantum, not FFI)
     ├── aegis-sdk        ← Rust + TypeScript thin wrappers
     ├── aegis-admin      ← React operator console
     └── aegis-deploy     ← Docker Compose + Cloudflare Tunnel
```

---

## aegis-core (Rust workspace, 5 crates)

The shared cryptographic and protocol foundation. All other Rust components depend on this workspace.

### aegis-proto

**Purpose:** Wire-level protocol objects and JSON serialization.

**Key types:**

| Type | Description |
|---|---|
| `Envelope` | The unit stored and routed by the relay. Contains: `envelope_id`, `recipient_id`, `sender_hint`, `created_at`, `expires_at`, `content_type`, `suite_id`, `used_prekey_ids`, `payload` (EncryptedBlob), `outer_signature_b64`, `outer_pq_signature_b64` |
| `EncryptedBlob` | Ciphertext bundle: `nonce_b64`, `ciphertext_b64`, `eph_x25519_public_key_b64`, `mlkem_ciphertext_b64` |
| `PrivatePayload` | Decrypted message: `private_headers` (PrivateHeaders), `body` (MessageBody), `attachments`, `extensions` |
| `PrivateHeaders` | `subject`, `thread_id`, `in_reply_to` |
| `MessageBody` | `mime_type` + `content` |
| `IdentityDocument` | Identity descriptor: `version`, `identity_id`, `aliases`, `signing_keys`, `encryption_keys`, `supported_suites`, `relay_endpoints`, `signature` |
| `PublicKeyRecord` | `key_id`, `algorithm`, `public_key_b64` |
| `PrekeyBundle` | Signed collection of one-time prekeys |
| `SuiteId` | Enum: `DemoXChaCha20Poly1305`, `HybridX25519MlKem768Ed25519MlDsa65`, others reserved |
| `IdentityId` | Type-wrapped string (`amp:did:key:...`) |

**Serialization:** JSON round-trip via `to_json_pretty()` / `from_json()`. Binary encoding is not defined in v0.1.

### aegis-crypto

**Purpose:** Cryptographic suite implementations and key generation.

**Public modules:**
- `demo` — DemoXChaCha20Poly1305 suite (testing only)
- `hybrid_pq` — HybridPqSuite (production, FIPS 203/204)
- `keygen` — `HybridPqKeyBundle::generate()` (freshly generated identity key material)
- `traits` — `PayloadCipher`, `KeyAgreement`, `EnvelopeSigner`, `EnvelopeVerifier`, `CryptoError`

**HybridPqKeyBundle** (generated per identity):
```rust
pub struct HybridPqKeyBundle {
    pub x25519_private_key_bytes: [u8; 32],
    pub kyber768_secret_key_bytes: Vec<u8>,     // 64-byte FIPS 203 seed
    pub ed25519_signing_seed_bytes: [u8; 32],
    pub dilithium3_secret_key_bytes: Vec<u8>,    // 32-byte FIPS 204 seed
    // + public key accessor methods
}
```

**Core traits:**
```rust
pub trait PayloadCipher {
    fn suite_id(&self) -> SuiteId;
    fn encrypt(&self, payload: &PrivatePayload) -> Result<EncryptedBlob, CryptoError>;
    fn decrypt(&self, encrypted: &EncryptedBlob) -> Result<PrivatePayload, CryptoError>;
}

pub trait EnvelopeSigner {
    fn sign_envelope(&self, canonical_bytes: &[u8]) -> Result<String, CryptoError>;
}

pub trait EnvelopeVerifier {
    fn verify_envelope(&self, canonical_bytes: &[u8], signature_b64: &str) -> Result<(), CryptoError>;
}
```

**Cryptographic dependencies:**

| Primitive | Crate | Version |
|---|---|---|
| ML-KEM-768 (FIPS 203) | `ml-kem` | v0.3 |
| ML-DSA-65 (FIPS 204) | `ml-dsa` | v0.1.0-rc.9 |
| Ed25519 | `ed25519-dalek` | v2 |
| X25519 | `x25519-dalek` | v2 |
| XChaCha20-Poly1305 | `chacha20poly1305` | v0.10 |
| HKDF-SHA-256 | `hkdf` + `sha2` | v0.12 / v0.10 |
| BLAKE3 | `blake3` | v1 |
| RNG | `rand` | v0.8 |

### aegis-identity

**Purpose:** Identity document lifecycle, key material management, resolver interfaces.

**Algorithm constants:**
```rust
pub const ALG_X25519:    &str = "AMP-X25519-V1";
pub const ALG_MLKEM768:  &str = "AMP-MLKEM768-V1";
pub const ALG_ED25519:   &str = "AMP-ED25519-V1";
pub const ALG_MLDSA65:   &str = "AMP-MLDSA65-V1";
pub const SUITE_HYBRID_PQ: &str = "AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1";
```

**Key functions:**
```rust
// Identity document signing (Ed25519 + ML-DSA-65)
fn sign_identity_document(doc, ed25519_sk_seed, ml_dsa_65_sk) -> Result<IdentityDocument>
fn verify_identity_document_signature(doc) -> Result<()>

// Prekey lifecycle
fn generate_prekey_bundle(identity_id, count, key_id_prefix) -> (PrekeyBundle, PrekeyBundlePrivateMaterial)
fn sign_prekey_bundle(bundle, ed25519_sk, ml_dsa_65_sk) -> Result<PrekeyBundle>
fn verify_prekey_bundle_signature(bundle) -> Result<()>

// Relay HTTP client
fn resolve_identity(relay_url, identity_id) -> Result<IdentityDocument>
fn publish_identity_document(relay_url, doc) -> Result<()>
fn resolve_alias(relay_url, alias) -> Result<IdentityDocument>
fn publish_prekey_bundle(relay_url, bundle) -> Result<PublishPrekeysResponse>
fn claim_one_time_prekey(relay_url, identity_id) -> Result<ClaimedPrekeyResponse>
```

### aegis-api-types

**Purpose:** Relay HTTP request/response types — the codegen target for SDKs.

| Type | Description |
|---|---|
| `StoreEnvelopeRequest` | `{ envelope: Envelope }` |
| `StoreEnvelopeResponse` | `{ accepted: bool, relay_id: String }` |
| `FetchEnvelopeResponse` | `{ envelopes: Vec<Envelope> }` |
| `PublishPrekeysResponse` | `{ identity_id, inserted: usize, skipped: usize }` |
| `ClaimedPrekeyResponse` | `{ identity_id, key_id, algorithm, public_key_b64 }` |
| `RelayStatusResponse` | `{ envelopes_total, envelopes_acknowledged, envelopes_active, identities_total, auth_mode, ... }` |
| `RelayError` | `{ code: String, message: String }` |

### aegis-testkit

**Purpose:** Test fixtures and helpers shared across the workspace.

---

## aegis-relay

**Language:** Rust
**Purpose:** Store-and-forward HTTP service — the zero-trust message infrastructure.

### HTTP API summary

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/v1/envelopes` | POST | Optional | Store one envelope |
| `/v1/envelopes/:recipient_id` | GET | None | Fetch all active envelopes |
| `/v1/envelopes/:rid/:eid/ack` | POST | Token | Acknowledge envelope |
| `/v1/envelopes/:rid/:eid` | DELETE | Token | Delete envelope |
| `/v1/identities/:identity_id` | PUT | Optional | Publish identity document |
| `/v1/identities/:identity_id` | GET | None | Fetch identity document |
| `/v1/aliases/:alias` | GET | None | Resolve alias → identity |
| `/v1/identities/:id/prekeys` | POST | Token | Publish prekey batch |
| `/v1/identities/:id/prekey` | GET | None | Claim one prekey (atomic) |
| `/v1/cleanup` | POST | Token | Trigger cleanup pass |
| `/v1/status` | GET | None | Relay operational metrics |
| `/healthz` | GET | None | Liveness probe |
| `/.well-known/aegis-config` | GET | None | Discovery document |

**Auth scopes:**
- `PushEnvelope` — `POST /v1/envelopes` (when `AEGIS_RELAY_REQUIRE_TOKEN_FOR_PUSH=true`)
- `IdentityWrite` — `PUT /v1/identities/:id`, `POST /v1/identities/:id/prekeys`
- `LifecycleChange` — ack, delete, cleanup

**Storage (production):** SQLite (WAL mode) at `AEGIS_DB_PATH`.

**Tables:**
- `envelopes` — envelope_id, recipient_id, created_at, expires_at, envelope_json, acknowledged
- `identities` — identity_id, identity_json
- `identity_aliases` — alias, identity_id (O(1) indexed lookup)
- `one_time_prekeys` — identity_id, key_id, prekey_json, claimed
- `consumed_prekeys` — recipient_id, key_id, consumed_at

**Audit log:** Structured events emitted to tracing logger + optional append-only JSONL file at `AEGIS_RELAY_AUDIT_LOG_PATH`.

**Audit events:** `store_envelope`, `acknowledge_envelope`, `delete_envelope`, `store_identity`, `resolve_alias`, `cleanup`, `publish_prekeys`, `claim_prekey`, `consume_prekey`, `federation_deliver`

**Key configuration variables:**

```bash
AEGIS_DB_PATH=aegis-relay.db
AEGIS_RELAY_PUBLIC_URL=https://relay.example.com
AEGIS_RELAY_AUTH_TOKENS=token1,token2
AEGIS_RELAY_REQUIRE_TOKEN_FOR_PUSH=false
AEGIS_RELAY_REQUIRE_TOKEN_FOR_IDENTITY_PUT=true
AEGIS_RELAY_MAX_MESSAGE_AGE_DAYS=30
AEGIS_RELAY_PURGE_ACKED_ON_CLEANUP=true
AEGIS_RELAY_AUDIT_LOG_PATH=/data/aegis-relay-audit.jsonl
```

---

## aegis-gateway

**Language:** Rust
**Purpose:** Interoperability bridge between AMP and legacy SMTP/IMAP.

**Downgrade policy:**
```rust
pub enum DowngradeMode {
    Reject,                       // Hard block — never send via legacy SMTP
    AllowWithWarning,             // Permit + signal warning to sender's UI
    RequireUserConfirmation,      // Prompt for explicit user approval
}
```

**Inbound SMTP flow:** External SMTP → gateway → wrap in AMP envelope → push to relay → recipient inbox

**Outbound flow:** Client submits message → gateway resolves recipient:
- AMP identity resolvable → AMP seal path (no downgrade)
- Legacy email only → apply downgrade policy before SMTP delivery

**Admin API:** Token-gated CRUD for policy, SMTP relay settings, domain claims, metrics.

**Headers on outbound:**
- `X-Aegis-Suite` — identifies the AMP suite used
- `X-Aegis-Downgrade-Confirmed` — `true` when user approved security reduction
- `X-Aegis-Identity` — routing hint (internal use)

---

## aegis-ffi

**Language:** Rust (cdylib + staticlib)
**Purpose:** UniFFI 0.28 bridge giving native clients (Swift, Kotlin) access to Aegis crypto.

**Compile targets:**
- iOS/iPadOS: `aarch64-apple-ios`, `aarch64-apple-ios-sim` → `.xcframework`
- macOS: `aarch64-apple-darwin`, `x86_64-apple-darwin` → `.xcframework`
- Android: `aarch64-linux-android`, `armv7-linux-android`, `x86_64-linux-android` → `.so`

**Public surface:**
```rust
pub fn generate_hybrid_pq_key_bundle() -> Result<String, FfiError>
pub fn seal_message(recipient_doc_json, sender_key_material_json, payload_json, sender_hint) -> Result<String, FfiError>
pub fn open_message(envelope_json, own_key_material_json, sender_doc_json) -> Result<String, FfiError>
pub fn sign_identity_document(identity_doc_json, ed25519_seed_b64, ml_dsa_65_secret_b64) -> Result<String, FfiError>
pub fn verify_identity_document(identity_doc_json) -> Result<(), FfiError>
pub fn claim_one_time_prekey_secret(claimed_prekey_json, own_prekey_secrets_json) -> Result<String, FfiError>
```

**Error type:** `FfiError` enum — `InvalidInput`, `InvalidKeyMaterial`, `Encryption`, `Decryption`, `SignatureVerificationFailed`, `Serialization`, `Identity`, `Internal`

**Bindings generation:** `uniffi-bindgen` CLI built as a binary target. Run once; output committed alongside platform source.

---

## aegis-sdk

**Rust SDK (`rust/`):** Re-exports `HybridPqSuite`, `HybridPqKeyBundle`, `Envelope`, `PrivatePayload` for developers building on aegis-core without learning the full workspace layout. Includes `examples/seal_open.rs`.

**TypeScript SDK (`typescript/`):** Type definitions for all protocol objects (`IdentityDocument`, `Envelope`, `PrivatePayload`, `SuiteId`), relay API request/response types, and algorithm ID constants. Used by aegis-web and any TypeScript consumer of the relay API.

---

## aegis-web

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS
**Deployment:** Cloudflare Workers (Worker Static Assets)
**Crypto:** `@noble/post-quantum` (pure JS ML-KEM-768 + ML-DSA-65), `@noble/curves` (X25519, Ed25519), `@noble/ciphers` (XChaCha20-Poly1305), `@noble/hashes` (HKDF, SHA-256)

**Key source files:**
- `src/lib/crypto.ts` — hybrid PQ encrypt/decrypt (mirrors aegis-ffi interface)
- `src/lib/relay.ts` — HTTP client for relay API (typed with aegis-sdk types)
- `src/lib/passkey.ts` — WebAuthn credential creation/verification
- `src/lib/storage.ts` — IndexedDB vault (encrypted at rest)
- `src/pages/Setup.tsx` — identity creation / import
- `src/pages/Compose.tsx` — message sealing
- `src/pages/Inbox.tsx` — fetch, decrypt, display messages
- `src/pages/Identity.tsx` — identity management
- `src/components/VaultSessionPanel.tsx` — vault unlock / session management

---

## aegis-deploy

**Stack:** Docker Compose + Cloudflare Tunnel

**Services:**

| Service | Image | Port | Role |
|---|---|---|---|
| `relay` | `aegis-relay:0.2.0` | 8787 (internal) | Envelope store + identity + admin |
| `gateway` | `aegis-gateway:0.2.0` | 25/993 (internal) | SMTP/IMAP bridge |
| `cloudflared` | `cloudflare/cloudflared:latest` | outbound only | Tunnel daemon |

**Bootstrap:**
```bash
./scripts/bootstrap.sh   # prompts for domain + CF token → writes .env
docker compose up -d
cd ../aegis-admin && npm run deploy
cd ../aegis-web && npm run deploy
```

**Persistent volume:** `relay-data` — contains `aegis-relay.db`, `aegis-relay-runtime.json`, `aegis-relay-audit.jsonl`

**Backup:**
```bash
docker run --rm \
  -v aegis-deploy_relay-data:/data \
  -v "$PWD":/backup alpine \
  tar czf /backup/aegis-relay-$(date +%F).tar.gz -C /data .
```

---

## aegis-admin

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS
**Deployment:** Cloudflare Workers
**Purpose:** Operator console for relay and gateway management

**Key pages:** Connection setup, dashboard, identities, prekey pool monitor, user provisioning, cleanup policy, audit log viewer, gateway policy editor, domain claiming

**API clients:** `src/lib/relay-admin.ts` (typed relay admin API), `src/lib/gateway-admin.ts` (typed gateway admin API)

---

## aegis-spec

**Purpose:** Protocol truth — RFCs, JSON schemas, and conformance matrix.

**Contents:**
- `rfcs/` — six RFCs (0001–0006) covering protocol overview, identity, crypto suites, relay API, prekey management, and gateway behavior
- `schemas/` — JSON Schema definitions for `IdentityDocument`, `Envelope`, `PrekeyBundle`, and relay API types
- `docs/` — conformance matrix, protocol change policy

All implementations (relay, gateway, FFI, web, CLI) are expected to conform to the RFC specifications. The RFCs are the authoritative source of truth when implementation and documentation conflict.
