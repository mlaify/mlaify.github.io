# Runbook — matthewd.xyz: GitHub Pages → InterServer

**Date:** 2026-07-26
**Scope:** Move `matthewd.xyz` and `docs.matthewd.xyz` from GitHub Pages to the
InterServer VPS. The domain does not change — only the origin.

This is the fhrp.org migration applied to the existing domain. The earlier
fhrp.org attempt was reverted; the deploy machinery it produced is reused here
and is known to work — rsync succeeded on the first real run.

---

## What is different from the fhrp.org attempt

| | fhrp.org attempt | This move |
|---|---|---|
| Domain | changed to fhrp.org | **unchanged** — matthewd.xyz |
| Content edits | ~30 files (domain rename) | **none** — nothing in `content/` or `config/` changes |
| DNS | new records | **repoint existing** A record off Pages |
| Risk | low (unused domain) | **higher** — this is the live site |
| Live-site verify step | present, gave false failures | **removed** |

Because the domain is unchanged, `baseurl`, canonical URLs, JSON-LD,
`security.txt`, `privacy.json`, and every content reference are already correct.
This is purely a hosting change.

The hosting *statements* in `README.md`, `static/humans.txt`,
`static/privacy.json`, `content/privacy-policy.md`, and the footer already name
InterServer — they were missed when the fhrp.org migration was reverted, so they
were briefly wrong and are correct again now.

---

## Order matters: deploy before repointing DNS

Unlike the fhrp.org move, there is no spare domain to test against. Do **not**
repoint DNS first, or the site is down until the first deploy lands.

1. Prepare the docroot and TLS.
2. Deploy to it while DNS still points at Pages.
3. Verify by talking to the origin directly (`--resolve`).
4. Only then repoint DNS.

---

## Step 1: Docroots

Two are needed, and neither is the fhrp.org docroot — that one keeps serving the
redirect and the Apple enrollment file.

```bash
ssh <user>@<host>
# Confirm real paths — these feed DEPLOY_PATH. Do not guess.
ls -la /home/*/domains/*/public_html 2>/dev/null || ls -la /home/*/public_html
```

Create vhosts for `matthewd.xyz` and `docs.matthewd.xyz`.

---

## Step 2: Behaviour GitHub Pages gave for free

Pages handled these implicitly and nothing in the repo sets them:

| Behaviour | Action |
|---|---|
| `404.html` on missing paths | `ErrorDocument 404 /404.html`. Hugo does build `public/404.html`. |
| Directory listings off | `Options -Indexes`, or the LiteSpeed equivalent |
| Dotfile protection | Block dotfiles, but keep `.well-known/` reachable |
| Security headers | Set at Cloudflare **or** the host, never both |
| Trailing-slash handling | Pages redirects `/path` → `/path/`. Confirm `DirectorySlash` behaves, and that the `Location` header is not leaking an internal hostname or port. |

---

## Step 3: TLS on the origin

Install a **Cloudflare Origin CA** certificate for `matthewd.xyz`,
`*.matthewd.xyz` and set the SSL mode to **Full (strict)**.

Do **not** use Flexible — it makes Cloudflare talk to the origin in plaintext
and loops against any origin-side HTTPS redirect.

---

## Step 4: Secrets

The `DEPLOY_*` secrets already exist on both repos from the fhrp.org attempt.
**`DEPLOY_PATH` must be repointed** — it currently targets the fhrp.org
docroots.

| Repo | New `DEPLOY_PATH` |
|---|---|
| `mlaify/mlaify.github.io` | `matthewd.xyz` docroot |
| `mlaify/attackmap-docs` | `docs.matthewd.xyz` docroot |

`DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_USER`, and
`DEPLOY_PORT` carry over unchanged.

> **`--delete` is live.** A stale `DEPLOY_PATH` pointing at the fhrp.org docroot
> would overwrite it and delete the Apple enrollment file and redirect config.
> Dry-run each repo before the first real deploy:
>
> ```bash
> rsync -rlptDvzn --delete public/ <user>@<host>:<docroot>/
> ```

---

## Step 5: Deploy while DNS still points at Pages

Push to `main`, or run the workflow manually. Both workflows build,
sanity-check, upload an artifact, then rsync it.

The workflows no longer curl the live site. Cloudflare issues a JS challenge to
non-browser clients (`cf-mitigated: challenge`) and returns 403 to Actions
runners — that produced a red X on an fhrp.org deploy that had actually
succeeded. rsync's exit status is the real signal.

---

## Step 6: Verify against the origin, before DNS

DNS still points at Pages, so reach the new origin directly:

```bash
IP=<INTERSERVER_IP>

curl -sI --resolve matthewd.xyz:443:$IP https://matthewd.xyz/ | head -1
curl -sI --resolve docs.matthewd.xyz:443:$IP https://docs.matthewd.xyz/ | head -1

# Standards files and search index
curl -s  --resolve matthewd.xyz:443:$IP https://matthewd.xyz/.well-known/security.txt | head -3
curl -sI --resolve matthewd.xyz:443:$IP https://matthewd.xyz/privacy.json | grep -i content-type
curl -sI --resolve matthewd.xyz:443:$IP https://matthewd.xyz/pagefind/pagefind.js | head -1

# Step 2 behaviours
curl -so /dev/null -w '404 page: %{http_code}\n' --resolve matthewd.xyz:443:$IP https://matthewd.xyz/nope
curl -so /dev/null -w 'listing: %{http_code}\n'  --resolve matthewd.xyz:443:$IP https://matthewd.xyz/images/
```

Spot-check a few real pages in a browser via a hosts-file override before
cutting DNS.

---

## Step 7: Repoint DNS

| Name | Type | Value | Proxy |
|---|---|---|---|
| `matthewd.xyz` | A | InterServer IP | Proxied |
| `www` | CNAME | `matthewd.xyz` | Proxied |
| `docs` | A | InterServer IP | Proxied |

Remove the GitHub Pages A/AAAA records (`185.199.108–111.153`) and any
`CNAME` to `mlaify.github.io`.

**Do not touch:**

- **`_atproto.matthewd.xyz` TXT** (`did=did:plc:ylabz5pb4axdfwbgcgaba34i`) — the
  Bluesky handle `@matthewd.xyz` depends on it.
- **`MX` records.**

Purge the Cloudflare cache afterwards.

---

## Step 8: Turn off GitHub Pages

Settings → Pages → **None**, on both repos. The `CNAME` files were deleted in
this change, so leaving Pages on means it keeps serving stale content and
holding the custom-domain claim.

Delete the `attackmap-docs` `gh-pages` branch — it is no longer the source.

---

## Step 9: The Apple enrollment file — a decision this move unlocks

`matthewd.xyz` on InterServer means it can now serve an extensionless file as
`application/json`, which GitHub Pages could not.

Apple derives the discovery URL from the **Managed Apple ID's email domain**:

- Managed Apple IDs are **`@fhrp.org`** → the file stays at
  `https://fhrp.org/.well-known/com.apple.remotemanagement`. Nothing changes;
  see `apple-enrollment-file.md`.
- Managed Apple IDs are **`@matthewd.xyz`** → the file belongs at
  `https://matthewd.xyz/.well-known/com.apple.remotemanagement`, and it can now
  be committed to `static/.well-known/` and shipped by this deploy.

Either way it needs a **Cloudflare WAF Skip rule** on that path — Apple's client
cannot solve a JS challenge:

```
(http.host eq "<domain>" and http.request.uri.path eq "/.well-known/com.apple.remotemanagement")
```

And the `BaseURL` typo (`mlaify.jamfcloud.com.com`, which resolves to a
third-party domain) must be corrected before the file goes anywhere.

---

## Must not break

| Thing | Risk | Action |
|---|---|---|
| **Bluesky handle `@matthewd.xyz`** | Handle dies if the `_atproto` TXT record is dropped while editing the zone | Leave that record alone |
| **Giscus comment threads** | Mapping is `pathname`; the domain is unchanged | No action — threads survive |
| **fhrp.org docroot** | A stale `DEPLOY_PATH` would overwrite it, deleting the enrollment file and redirect | Repoint `DEPLOY_PATH` before deploying; dry-run first |
| **Cert renewal** | `--delete` would wipe an in-flight ACME challenge | Both workflows exclude `.well-known/acme-challenge/` |
| **Downtime** | Repointing DNS before the first successful deploy takes the live site down | Deploy and verify against the origin first (Steps 5–6) |

---

## Rollback

Pages stays enabled until Step 8, so rollback is a DNS change:

1. Repoint `matthewd.xyz` / `docs` back at the GitHub Pages IPs.
2. Restore the `CNAME` files and re-enable Pages if Step 8 was already done —
   the certificate can take up to 24h to reprovision.
3. `git revert` the migration commit in both repos and push.
