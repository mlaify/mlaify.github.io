---
title: "Aegis protocol"
description: "The AMP wire protocol: relay API endpoints, identity model, prekey lifecycle, error codes, storage model, audit events, and retention policy — all in one reference."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 55
toc: true
accent: "aegis"
lead: "Complete relay API and protocol reference — envelope lifecycle, identity, prekeys, federation, audit."
---

## Protocol overview

AMP (Aegis Messaging Protocol) is an asynchronous, store-and-forward protocol. Senders seal encrypted envelopes and push them to a relay. Recipients fetch and decrypt envelopes from the relay. The relay is explicitly untrusted: it routes ciphertext but has no access to plaintext.

**Base URL (reference relay):** configured via `AEGIS_RELAY_PUBLIC_URL`  
**Protocol version:** v0.3  
**Wire format:** JSON over HTTPS

---

## Relay API

### Envelope endpoints

#### `POST /v1/envelopes`

Store one envelope.

**Request body:**
```json
{
  "envelope": {
    "envelope_id": "uuid-v4",
    "recipient_id": "amp:did:key:...",
    "sender_hint": "alice@example.com",
    "created_at": "2026-05-08T12:00:00Z",
    "expires_at": "2026-06-07T12:00:00Z",
    "content_type": "application/amp-message-v1+json",
    "suite_id": "AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1",
    "used_prekey_ids": ["prekey-key-uuid"],
    "payload": {
      "nonce_b64": "...",
      "ciphertext_b64": "...",
      "eph_x25519_public_key_b64": "...",
      "mlkem_ciphertext_b64": "..."
    },
    "outer_signature_b64": "...",
    "outer_pq_signature_b64": "..."
  }
}
```

**Behavior:**
- Validates envelope shape, required fields, and PQ fields
- If `used_prekey_ids` is non-empty: atomically marks each prekey consumed and stores envelope in a single transaction; returns `409 prekey_already_used` if any key was previously consumed; returns `400 unknown_prekey` if any key is not in the pool
- Emits audit event: `store_envelope`

**Response:** `{ "accepted": true, "relay_id": "relay-id-string" }`

**Auth:** Optional bearer token when `AEGIS_RELAY_REQUIRE_TOKEN_FOR_PUSH=true` (scope: `PushEnvelope`)

---

#### `GET /v1/envelopes/:recipient_id`

Fetch all non-acknowledged, non-expired envelopes for a recipient.

**Response:** `{ "envelopes": [Envelope, ...] }`

**Behavior:**
- Skips envelopes where `acknowledged = true`
- Skips envelopes where `expires_at <= now`
- Opportunistically deletes expired envelopes during fetch
- Does not require auth (recipient_id is a public cryptographic identifier)

---

#### `POST /v1/envelopes/:recipient_id/:envelope_id/ack`

Mark envelope as acknowledged (client has received and processed it).

**Response:** `{ "recipient_id": "...", "envelope_id": "...", "status": "acknowledged" }`

**Auth:** Token required (scope: `LifecycleChange`)

**Behavior:** Marks `acknowledged = true` in database. Acknowledged envelopes are excluded from future fetches and purged during cleanup (when `AEGIS_RELAY_PURGE_ACKED_ON_CLEANUP=true`).

---

#### `DELETE /v1/envelopes/:recipient_id/:envelope_id`

Permanently delete an envelope.

**Response:** `{ "recipient_id": "...", "envelope_id": "...", "status": "deleted" }`

**Auth:** Token required (scope: `LifecycleChange`)

---

### Identity endpoints

#### `PUT /v1/identities/:identity_id`

Publish or replace an identity document.

**Request body:** JSON `IdentityDocument` with Ed25519 + ML-DSA-65 signature populated.

**Behavior:**
- Validates `identity_id` in the URL matches `identity_id` in the document body
- Verifies Ed25519 signature against embedded `signing_keys`
- Verifies ML-DSA-65 signature against embedded `signing_keys`
- Both must pass; rejection returns `400 invalid_signature`
- Stores document; subsequent `GET` returns this document

**Auth:** Optional token when `AEGIS_RELAY_REQUIRE_TOKEN_FOR_IDENTITY_PUT=true` (scope: `IdentityWrite`)

**Response:** `204 No Content`

---

#### `GET /v1/identities/:identity_id`

Fetch identity document by cryptographic identity ID.

**Response:** JSON `IdentityDocument`

**Auth:** None

---

#### `GET /v1/aliases/:alias`

Resolve an alias to an identity document.

**Response:** JSON `IdentityDocument` (the document whose `aliases` array contains the requested alias)

**Auth:** None

**Behavior:** O(1) indexed lookup via `identity_aliases` table. Emits audit event: `resolve_alias`.

---

### Prekey endpoints

#### `POST /v1/identities/:identity_id/prekeys`

Publish a signed batch of one-time prekeys.

**Request body:** JSON `PrekeyBundle` signed with Ed25519 + ML-DSA-65.

**Behavior:**
- Verifies bundle signature against the identity's published signing keys
- Rejects if the identity document is not yet published
- Rejects if the bundle's `one_time_prekeys` array is empty
- `INSERT OR IGNORE` on `(identity_id, key_id)` — re-publishing is idempotent (skipped count reflects duplicates)
- Emits audit event: `publish_prekeys { inserted=N, skipped=M }`

**Response:** `{ "identity_id": "...", "inserted": 20, "skipped": 0 }`

**Auth:** Token required (scope: `IdentityWrite`)

---

#### `GET /v1/identities/:identity_id/prekey`

Atomically claim one unclaimed one-time prekey for the given identity.

**Response:** `{ "identity_id": "...", "key_id": "...", "algorithm": "AMP-MLKEM768-V1", "public_key_b64": "..." }`

**Behavior:**
- Finds the first prekey where `claimed = 0`
- Sets `claimed = 1` in the **same transaction** as the read (atomic — no two senders can claim the same key)
- If no unclaimed keys remain: returns `404 prekey_pool_empty`
- Emits audit event: `claim_prekey { outcome: "ok" | "exhausted", key_id }`

**Auth:** None (future: rate limiting)

---

### Maintenance endpoints

#### `POST /v1/cleanup`

Trigger a cleanup pass.

**Response:** `{ "expired_removed": 5, "orphan_ack_removed": 2, "old_removed": 0 }`

**Behavior:**
- Removes envelopes where `expires_at <= now`
- Optionally removes envelopes older than `AEGIS_RELAY_MAX_MESSAGE_AGE_DAYS` days
- Optionally removes acknowledged envelopes (when `AEGIS_RELAY_PURGE_ACKED_ON_CLEANUP=true`)
- Removes orphaned `.ack` marker files (file store only)

**Auth:** Token required (scope: `LifecycleChange`)

---

#### `GET /v1/status`

Relay operational metrics.

**Response:** `{ "envelopes_total": 42, "envelopes_acknowledged": 10, "envelopes_active": 32, "identities_total": 8, "auth_mode": "token", "require_token_for_push": false, "require_token_for_identity_put": true }`

**Auth:** None

---

#### `GET /healthz`

Liveness probe. Returns `200 OK` with body `ok`.

---

#### `GET /.well-known/aegis-config`

Discovery document for DNS SRV and `/.well-known` discovery. Returns relay metadata: `relay_id`, `public_url`, `supported_suites`, federation info.

---

## Error codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `invalid_envelope` | Malformed envelope or missing required fields |
| 400 | `unknown_prekey` | Sender claimed a prekey that doesn't exist in the pool |
| 400 | `invalid_envelope` | Duplicate prekey IDs in `used_prekey_ids` array |
| 400 | `identity_id_mismatch` | URL path identity_id ≠ document body identity_id |
| 400 | `empty_bundle` | `one_time_prekeys` array is empty |
| 400 | `invalid_signature` | Identity document or prekey bundle signature verification failed |
| 400 | `identity_not_published` | Attempted to publish prekeys for an unpublished identity |
| 401 | `unauthorized` | Token required but not provided |
| 403 | `forbidden` | Token provided but invalid |
| 404 | `not_found` | Envelope not found (ack/delete on missing envelope) |
| 404 | `prekey_pool_empty` | No unclaimed one-time prekeys available for recipient |
| 409 | `prekey_already_used` | Prekey was already consumed (replay attempt) — includes `key_id` in message |
| 500 | `storage_error` | SQLite or filesystem error |

---

## Authentication

**Token configuration:**
```bash
AEGIS_RELAY_AUTH_TOKENS=token1,token2,...     # comma-separated list
AEGIS_RELAY_CAPABILITY_TOKEN=single_token     # legacy single-token fallback
```

**Request headers (either accepted):**
```
Authorization: Bearer <token>
X-Aegis-Relay-Token: <token>
```

**Scope enforcement:**

| Scope | Condition | Endpoints |
|---|---|---|
| `PushEnvelope` | `AEGIS_RELAY_REQUIRE_TOKEN_FOR_PUSH=true` | `POST /v1/envelopes` |
| `IdentityWrite` | `AEGIS_RELAY_REQUIRE_TOKEN_FOR_IDENTITY_PUT=true` | `PUT /v1/identities/:id`, `POST /v1/identities/:id/prekeys` |
| `LifecycleChange` | Always required | Ack, delete, cleanup |

---

## Identity model

### IdentityId format

`amp:did:key:<identifier>`

Example: `amp:did:key:z6MkJZ1nH5...`

Local development: `amp:did:key:local-<UUID>`

### IdentityDocument structure

```json
{
  "version": 1,
  "identity_id": "amp:did:key:...",
  "aliases": ["alice@example.com"],
  "signing_keys": [
    { "key_id": "sig-ed25519-1",  "algorithm": "AMP-ED25519-V1",  "public_key_b64": "..." },
    { "key_id": "sig-mldsa65-1",  "algorithm": "AMP-MLDSA65-V1",  "public_key_b64": "..." }
  ],
  "encryption_keys": [
    { "key_id": "enc-x25519-1",   "algorithm": "AMP-X25519-V1",   "public_key_b64": "..." },
    { "key_id": "enc-mlkem768-1", "algorithm": "AMP-MLKEM768-V1", "public_key_b64": "..." }
  ],
  "supported_suites": ["AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1"],
  "relay_endpoints": ["https://relay.example.com"],
  "signature": "ed25519:<b64>|dilithium3:<b64>"
}
```

### Alias semantics

- Aliases are **convenience labels**, not security roots
- Trust decisions anchor in the cryptographic `identity_id`
- Relay indexes aliases for O(1) resolution (`GET /v1/aliases/:alias`)
- Clients must surface the `identity_id` for security-sensitive displays

### Key continuity (deferred)

Key rotation and continuity tracking are deferred to v0.4+. Per RFC-0002 §11, abrupt key changes in a published identity document are treated as a potential security concern. Clients should prompt users when a published identity document's keys change unexpectedly.

---

## Prekey lifecycle

```
1. Identity creation
   └── generate_hybrid_pq_key_bundle() → HybridPqKeyBundle

2. Prekey generation (aegit id publish-prekeys / client)
   └── generate_prekey_bundle(identity_id, count=20)
       ├── PrekeyBundle         (public halves — signed with Ed25519 + ML-DSA-65)
       └── PrekeyBundlePrivateMaterial  (private halves — stored locally)

3. Publish
   └── POST /v1/identities/:id/prekeys
       └── Relay: INSERT OR IGNORE (idempotent re-publish)

4. Claim (by sender, each message)
   └── GET /v1/identities/:id/prekey
       └── Relay: atomic claimed=0 → claimed=1

5. Seal (by sender)
   └── ML-KEM-768.Encaps(claimed_prekey_public_key) → (ct, ss_mlkem)
       envelope.used_prekey_ids = [claimed_key_id]

6. Store (by relay, during POST /v1/envelopes)
   └── Atomic:
       ├── consumed_prekeys INSERT (identity_id, key_id, consumed_at)
       └── envelopes INSERT (envelope JSON)
       Either both succeed or neither does.

7. Open (by recipient)
   └── ML-KEM-768.Decaps(local_prekey_secret, mlkem_ct) → ss_mlkem
       ├── Decrypt message
       └── Atomically delete prekey secret from local file (tmp + rename)

8. Prekey is gone
   └── Relay: consumed (cannot be reused)
       Recipient: private half deleted
       → Forward secrecy realized
```

---

## Audit log

**Format:** Append-only JSONL (one JSON object per line) at `AEGIS_RELAY_AUDIT_LOG_PATH`

**Events:**

| Event | Fields |
|---|---|
| `store_envelope` | `envelope_id`, `recipient_id` |
| `acknowledge_envelope` | `envelope_id`, `recipient_id` |
| `delete_envelope` | `envelope_id`, `recipient_id` |
| `store_identity` | `identity_id` |
| `resolve_alias` | `alias`, `resolved_identity_id` |
| `cleanup` | `expired_removed`, `old_removed`, `ack_removed` |
| `publish_prekeys` | `identity_id`, `inserted`, `skipped` |
| `claim_prekey` | `identity_id`, `key_id`, `outcome` (`ok` | `exhausted`) |
| `consume_prekey` | `identity_id`, `key_id`, `outcome` |
| `federation_deliver` | `target_relay_id`, `envelope_id` |

---

## Retention policy

| Setting | Default | Effect |
|---|---|---|
| `AEGIS_RELAY_MAX_MESSAGE_AGE_DAYS` | unset | Remove envelopes older than N days during cleanup |
| `AEGIS_RELAY_PURGE_ACKED_ON_CLEANUP` | `true` | Remove acknowledged envelopes during cleanup |

Envelopes with `expires_at <= now` are **always** removed, regardless of configuration.

---

## Federation (planned)

Multi-relay federation is designed but not yet implemented. The planned model:

1. Sender's relay looks up recipient's relay via DNS SRV or configured peer list
2. Sender's relay forwards envelope to recipient's relay via `POST /v1/envelopes`
3. Recipient's relay verifies delivery authenticity and stores
4. Audit event: `federation_deliver`

Federation routing does not affect encryption — the envelope is sealed to the recipient's public key before leaving the sender's device, regardless of which relay it traverses.
