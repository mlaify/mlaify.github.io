---
title: "Aegis release notes"
description: "Version history for the Aegis protocol and all client implementations — what changed, what broke, and what's next."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 60
toc: true
accent: "aegis"
lead: "Changelog for the AMP protocol, aegis-core, aegit-cli, aegis-relay, and all client implementations."
---

{{< callout type="note" >}}
Aegis is in alpha. All versions prior to v1.0 may introduce breaking changes to the wire protocol, key storage format, or relay API. Breaking changes are called out explicitly in each release.
{{< /callout >}}

---

## v0.3.0-alpha — Key lifecycle and forward secrecy (in flight)

**Theme:** End-to-end one-time prekey forward secrecy — from generation through relay enforcement to recipient consumption and local deletion.

### Phase 1: Relay-side prekey enforcement ✅

**aegis-relay:**
- Added `consumed_prekeys` SQLite table `(recipient_id, key_id, consumed_at)`
- `POST /v1/envelopes` now validates `used_prekey_ids` array:
  - Each key must exist in the prekey pool
  - Each key must not already be in `consumed_prekeys`
  - Duplicate `key_id` values within the array are rejected
- Atomic transaction: envelope store + prekey consumption happen together or not at all
- New error codes: `409 prekey_already_used` (includes `key_id`), `400 unknown_prekey`
- Emits audit event: `consume_prekey { identity_id, key_id, outcome }`

### Phase 2: Prekey publish and atomic claim ✅

**aegis-relay:**
- Added `one_time_prekeys` SQLite table `(identity_id, key_id, prekey_json, claimed)`
- New endpoint: `POST /v1/identities/:id/prekeys` — publish signed prekey batch
  - Validates Ed25519 + ML-DSA-65 signatures on the PrekeyBundle
  - Rejects if identity not published, if bundle is empty, or if signature fails
  - `INSERT OR IGNORE` semantics: re-publishing existing keys is idempotent
  - Emits audit event: `publish_prekeys { inserted=N, skipped=M }`
- New endpoint: `GET /v1/identities/:id/prekey` — atomically claim one prekey
  - Reads and sets `claimed=1` in one transaction (no two senders can claim the same key)
  - Returns `404 prekey_pool_empty` when pool is exhausted
  - Emits audit event: `claim_prekey { outcome, key_id }`

**aegis-identity (aegis-core):**
- `generate_prekey_bundle(identity_id, count, key_id_prefix)` → `(PrekeyBundle, PrekeyBundlePrivateMaterial)`
- `sign_prekey_bundle(bundle, ed25519_sk, ml_dsa_65_sk)` → `Result<PrekeyBundle>`
- `verify_prekey_bundle_signature(bundle)` → `Result<()>`
- `publish_prekey_bundle(relay_url, bundle)` → `Result<PublishPrekeysResponse>`
- `claim_one_time_prekey(relay_url, identity_id)` → `Result<ClaimedPrekeyResponse>`

**aegit-cli:**
- New command: `aegit id publish-prekeys --relay URL [--count N]`
  - Generates `count` prekeys (default: 20)
  - Signs batch with Ed25519 + ML-DSA-65
  - Publishes to relay
  - Persists private halves to `~/.aegit/identities/<id>.prekey-secrets.json`

### Phase 3: Send-side integration ✅

**aegit-cli:**
- `aegit msg seal --relay URL` now automatically claims a one-time prekey when a relay is configured and `--no-prekey` is not set
- On successful claim: uses claimed Kyber768 public key instead of long-term key
- Sets `envelope.used_prekey_ids = [claimed_key_id]`
- On `404 prekey_pool_empty`: falls back to long-term key with a stderr warning
- `--no-prekey` flag: explicitly skip prekey claim, use long-term key only

**aegit-cli (open):**
- `aegit msg open` now handles `used_prekey_ids`:
  - Loads the matching `OneTimePrekeySecret` from `~/.aegit/identities/<id>.prekey-secrets.json`
  - Uses the prekey's Kyber768 decapsulation key in place of the long-term key for ML-KEM-768 decapsulation
  - After successful decryption: atomically deletes the used secret from the local file (tmp + rename — ensures single-use even on crash)

**End-to-end forward secrecy realized:** Each message → unique ML-KEM-768 KEM → relay enforces single use → recipient deletes private half → no past message is decryptable even with long-term key compromise.

---

## v0.2.0-alpha — Production hybrid PQ cryptography (2026-05-03)

**Theme:** Replace the demo symmetric-only suite with FIPS-finalized post-quantum hybrid cryptography.

{{< callout type="warn" >}}
**Breaking change.** v0.2 identities and envelopes are not compatible with v0.3. The ML-KEM and ML-DSA secret key storage format changed. Regenerate identities with `aegit id init`.
{{< /callout >}}

### Cryptographic changes

**New production suite:** `AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1`

**Encryption:**
- Added X25519 ephemeral key agreement (classical)
- Added ML-KEM-768 key encapsulation (NIST FIPS 203, post-quantum)
- Hybrid KEM combine: `HKDF-SHA-256(ss_x25519 ‖ ss_mlkem, nonce_24, "aegis-v2-hybrid-encrypt")`
- AEAD: XChaCha20-Poly1305 with 24-byte random nonce (unchanged)

**Signing:**
- Added ML-DSA-65 signatures on all envelopes and identity documents (NIST FIPS 204, post-quantum)
- Ed25519 signatures retained (classical)
- Both must be present and valid on production envelopes

**Implementation:**
- Migrated `pqcrypto-kyber` → `ml-kem v0.3` (FIPS 203 final, RustCrypto)
- Migrated `pqcrypto-dilithium` → `ml-dsa v0.1.0-rc.9` (FIPS 204 final, RustCrypto)
- Secret key storage shrinkage:
  - Kyber: ~2400 bytes → 64-byte seed (FIPS 203 seed-based generation)
  - Dilithium: ~4032 bytes → 32-byte seed (FIPS 204 seed-based generation)

### Wire format changes

**Envelope:**
- `outer_pq_signature_b64` field added (ML-DSA-65 signature, required for hybrid PQ suite)
- `used_prekey_ids: []` field added (empty in v0.2; populated in v0.3)

**EncryptedBlob:**
- `eph_x25519_public_key_b64` field added (ephemeral X25519 public key)
- `mlkem_ciphertext_b64` field added (ML-KEM-768 ciphertext, 1088 bytes encoded)

**IdentityDocument:**
- Two new entries in `signing_keys`: `AMP-MLDSA65-V1`
- Two new entries in `encryption_keys`: `AMP-MLKEM768-V1`
- `signature` field format: `"ed25519:<b64>|dilithium3:<b64>"` (previously only Ed25519)

### aegis-relay changes

- Validates `outer_pq_signature_b64` is present for hybrid PQ envelopes
- Validates `eph_x25519_public_key_b64` and `mlkem_ciphertext_b64` are present
- Identity document publishing: validates both Ed25519 and ML-DSA-65 signatures

### aegis-core changes

- New crate: `aegis-crypto` split from monolithic crypto module
- `HybridPqKeyBundle::generate()` generates all four keypairs in one call
- `HybridPqSuite` implements `PayloadCipher`, `EnvelopeSigner`, `EnvelopeVerifier`

---

## v0.1.0-alpha — Public alpha baseline (2026-04-29)

**Theme:** Minimal working protocol implementation. Demo crypto only, single-relay, no prekeys.

### What shipped

**Protocol:**
- Basic envelope format with `DemoXChaCha20Poly1305` suite
- Identity document format (v1) with Ed25519 signing (no PQ)
- Relay store-and-forward: push, fetch, ack, delete
- Identity publish and fetch
- Alias resolution

**aegis-relay:**
- SQLite storage (WAL mode)
- File store (dev/test)
- Token auth with scope model (`PushEnvelope`, `IdentityWrite`, `LifecycleChange`)
- Audit logging (tracing + optional JSONL file)
- Cleanup endpoint

**aegit-cli:**
- `aegit id init` — demo suite only
- `aegit msg seal` — BLAKE3-passphrase symmetric encryption
- `aegit msg open` — symmetric decryption + BLAKE3 signature verification
- `aegit relay push/fetch/ack/delete/cleanup`

**aegis-web:**
- Basic React SPA: setup, compose, inbox
- `DemoXChaCha20Poly1305` only (passphrase-based)

### Known limitations at v0.1

- Demo crypto only — BLAKE3 passphrase-derived key, no public-key cryptography
- No forward secrecy
- No post-quantum protection
- Single relay only (no federation)
- No key continuity tracking

---

## Roadmap

### v0.4.0-alpha (planned)

- End-user client applications feature-complete (web, iOS, macOS, Android)
- Attachment blob transport protocol
- Thread model (thread_id routing, reply threading)
- Key rotation and continuity tracking
- Full MIME transformation

### v1.0.0 (planned — production target)

- Third-party security audit
- NIST Known Answer Test (KAT) validation for ML-KEM-768 and ML-DSA-65
- Performance benchmarks (keygen, encrypt/decrypt, sign/verify)
- Relay federation (multi-relay delivery, routing, failover)
- Rate limiting and abuse controls
- Production deployment hardening guide
- Monitoring and alerting integration

### Deferred / out of scope

| Item | Reason |
|---|---|
| Server-side message search | Incompatible with zero-trust relay (relay cannot index plaintext) |
| Full metadata privacy | Relay needs `recipient_id` and timestamps for routing and cleanup |
| Demo suite in production | Intentionally limited to testing |
| `HybridPqPlaceholder` suite | Reserved ID, no production semantics |
| Passphrase-based production encryption | Replaced by public-key hybrid PQ |
