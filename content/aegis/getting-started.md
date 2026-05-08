---
title: "Getting started with Aegis"
description: "Install aegit, create a hybrid post-quantum identity, attach a relay, and complete the seal → push → fetch → open loop end-to-end."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 10
toc: true
accent: "aegis"
lead: "From zero to a working sealed message in under fifteen minutes using the aegit CLI."
---

## Prerequisites

- **Rust toolchain** — `rustup` + `cargo` (stable, 1.75+)
- **A running relay** — use the public dev relay (`http://localhost:8787`) or deploy your own via [aegis-deploy](https://github.com/mlaify/aegis-deploy)
- **Git** — to clone the repos

{{< callout type="note" >}}
aegit is the reference implementation of the AMP protocol. The web, iOS, macOS, and Android clients use the same underlying aegis-core crates and speak the same wire protocol.
{{< /callout >}}

## Install aegit

```bash
git clone https://github.com/mlaify/aegit-cli.git
cd aegit-cli
cargo build --release
# Add to PATH
export PATH="$PWD/target/release:$PATH"
```

Verify:

```bash
aegit --help
```

## Start a local relay (optional)

If you don't have a relay already, run one locally:

```bash
git clone https://github.com/mlaify/aegis-relay.git
cd aegis-relay
cargo run --release
# Relay listens on http://127.0.0.1:8787 by default
```

Or use Docker:

```bash
docker run -p 8787:8787 ghcr.io/mlaify/aegis-relay:latest
```

---

## 1. Create your identity

An identity is a set of cryptographic keys — X25519 + ML-KEM-768 for encryption, Ed25519 + ML-DSA-65 for signing — wrapped in a self-describing `IdentityDocument`.

```bash
aegit id init --alias alice@example.com
```

Output:

```
Generated identity: amp:did:key:z6MkJZ1nH5...
Suite: AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1
Alias: alice@example.com

Files written:
  ~/.aegit/identities/<id>.identity.json   ← public identity document
  ~/.aegit/identities/<id>.pq-key.json     ← private key material (keep safe)
  ~/.aegit/default-identity                ← pointer to default identity
```

View your identity:

```bash
aegit id show
```

List all local identities:

```bash
aegit id list
```

{{< callout type="warn" >}}
`~/.aegit/identities/<id>.pq-key.json` contains your private key material. Back it up securely. Anyone with this file can impersonate you or decrypt your messages.
{{< /callout >}}

## 2. Publish your identity to the relay

Publishing makes your identity document (public keys + relay endpoints) discoverable by others.

```bash
aegit id publish --relay http://localhost:8787
```

The command:
1. Loads your identity document
2. Computes an Ed25519 signature and an ML-DSA-65 signature over the canonical document JSON
3. `PUT /v1/identities/<id>` to the relay
4. The relay verifies both signatures before storing

Verify it published:

```bash
curl http://localhost:8787/v1/identities/$(cat ~/.aegit/default-identity)
```

## 3. Publish one-time prekeys

One-time prekeys enable per-message forward secrecy. Each prekey is a single-use ML-KEM-768 encapsulation key. Senders claim one prekey per message; after use it is consumed and never reused.

```bash
# Generate and publish a batch of 20 prekeys
aegit id publish-prekeys --relay http://localhost:8787 --count 20
```

Output:

```
Generated 20 one-time prekeys
Signed batch with Ed25519 + ML-DSA-65
Published: 20 inserted, 0 skipped
Private halves stored: ~/.aegit/identities/<id>.prekey-secrets.json
```

{{< callout type="note" >}}
Replenish your prekey pool before it runs dry. If a sender tries to claim a prekey and the pool is exhausted, they fall back to your long-term ML-KEM-768 key (still secure, but no per-message forward secrecy for that message).
{{< /callout >}}

## 4. Create a second identity (the recipient)

For this walkthrough, create a second identity to receive messages:

```bash
aegit id init --alias bob@example.com
# note the identity ID printed — you'll use it as the recipient
aegit id publish --relay http://localhost:8787
aegit id publish-prekeys --relay http://localhost:8787 --count 10
```

---

## 5. Seal a message

Sealing encrypts and signs a message to the recipient.

```bash
aegit msg seal \
  --to bob@example.com \
  --subject "Hello from Alice" \
  --body "This message is sealed with post-quantum hybrid encryption." \
  --relay http://localhost:8787 \
  --out sealed.json
```

What happens internally:

1. Resolve Bob's `IdentityDocument` from the relay (`GET /v1/aliases/bob@example.com`)
2. Check that Bob supports `AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1`
3. Claim one of Bob's one-time prekeys (`GET /v1/identities/<bob>/prekey`) — the relay atomically marks it claimed
4. Generate an ephemeral X25519 keypair
5. `X25519(eph_sk, bob_x25519_pk)` → `ss_x25519`
6. `ML-KEM-768.Encaps(claimed_prekey_pk)` → `(mlkem_ct, ss_mlkem)`
7. `HKDF-SHA-256(ss_x25519 ‖ ss_mlkem, nonce_24, "aegis-v2-hybrid-encrypt")` → `key`
8. `XChaCha20-Poly1305.Encrypt(key, nonce_24, payload_json)` → `ciphertext`
9. Serialize to `EncryptedBlob` (nonce, ciphertext, ephemeral X25519 pk, ML-KEM ciphertext)
10. Build `Envelope` with `used_prekey_ids: [<claimed_key_id>]`
11. Sign with Alice's `Ed25519` and `ML-DSA-65`
12. Write envelope JSON to `sealed.json`

Inspect the sealed envelope — note that the payload is opaque ciphertext:

```bash
cat sealed.json | python3 -m json.tool | head -30
```

## 6. Push to the relay

```bash
aegit relay push \
  --relay http://localhost:8787 \
  --input sealed.json
```

Output:

```
Pushed envelope abc123... to relay
Recipient: amp:did:key:z6Mk...
Status: accepted
```

The relay:
- Validates the envelope shape and PQ fields
- Verifies that the `used_prekey_ids` key exists in the prekey pool
- Atomically stores the envelope **and** marks the prekey consumed (single transaction — both succeed or both fail)

## 7. Fetch Bob's messages

Switch to Bob's identity and fetch:

```bash
# List Bob's identities to get his ID
aegit id list

# Fetch all envelopes addressed to Bob
aegit relay fetch \
  --relay http://localhost:8787 \
  --recipient amp:did:key:<bob_id> \
  --out ~/.aegit/fetched/bob/
```

Output:

```
Fetched 1 envelope(s) → ~/.aegit/fetched/bob/
  abc123....json
```

## 8. Open the message

```bash
aegit msg open \
  --input ~/.aegit/fetched/bob/abc123....json
```

What happens internally:

1. Load the `Envelope`
2. Resolve Alice's `IdentityDocument` from the relay (or local cache)
3. Verify `outer_signature_b64` with Alice's Ed25519 key — **must pass**
4. Verify `outer_pq_signature_b64` with Alice's ML-DSA-65 key — **must pass**
5. Extract `nonce_24`, `ciphertext`, `eph_x25519_pk`, `mlkem_ct` from the `EncryptedBlob`
6. `X25519(bob_x25519_sk, eph_x25519_pk)` → `ss_x25519`
7. Load the one-time prekey secret matching `used_prekey_ids[0]` from `~/.aegit/identities/<bob>.prekey-secrets.json`
8. `ML-KEM-768.Decaps(prekey_dk, mlkem_ct)` → `ss_mlkem`
9. `HKDF-SHA-256(ss_x25519 ‖ ss_mlkem, nonce_24, "aegis-v2-hybrid-encrypt")` → `key`
10. `XChaCha20-Poly1305.Decrypt(key, nonce_24, ciphertext)` → `payload_json`
11. **Atomically delete** the used prekey secret from `prekey-secrets.json` (tmp + rename — single-use enforced locally)
12. Print the `PrivatePayload` (subject + body)

Output:

```
Subject: Hello from Alice
From: alice@example.com

This message is sealed with post-quantum hybrid encryption.
```

## 9. Acknowledge the envelope

Mark the envelope as consumed so the relay knows it can be cleaned up:

```bash
aegit relay ack \
  --relay http://localhost:8787 \
  --recipient amp:did:key:<bob_id> \
  --envelope-id abc123...
```

---

## Full command reference

### Identity management

```bash
aegit id init [--alias ALIAS] [--include-demo-key]
aegit id show [--identity ID]
aegit id list
aegit id publish --relay URL [--identity ID]
aegit id publish-prekeys --relay URL [--identity ID] [--count N]
```

### Messaging

```bash
aegit msg seal \
  --to ID_OR_ALIAS \
  --body TEXT \
  [--from ID] \
  [--subject SUBJECT] \
  [--relay URL] \
  [--out FILE] \
  [--no-prekey]

aegit msg open \
  --input FILE \
  [--out FILE]

aegit msg list --recipient ID
```

### Relay operations

```bash
aegit relay push --relay URL --input FILE [--token TOKEN]
aegit relay fetch --relay URL --recipient ID [--out DIR]
aegit relay ack --relay URL --recipient ID --envelope-id UUID [--token TOKEN]
aegit relay delete --relay URL --recipient ID --envelope-id UUID [--token TOKEN]
aegit relay cleanup --relay URL [--token TOKEN]
```

---

## Next steps

- [Architecture](/aegis/architecture/) — all 13 repositories, the relay protocol, and the full component breakdown
- [Security model](/aegis/security/) — cryptographic construction, threat model, and what Aegis does and does not guarantee
- [Apps](/aegis/apps/) — web, iOS, macOS, and Android clients
- [Protocol deep-dive](/aegis/protocol/) — relay API, identity model, prekey lifecycle, federation
- [Release notes](/aegis/release-notes/) — v0.1, v0.2, v0.3 changelog
