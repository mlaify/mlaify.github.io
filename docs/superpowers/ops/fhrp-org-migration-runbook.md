# Runbook — matthewd.xyz → fhrp.org, GitHub Pages → InterServer

**Date:** 2026-07-25
**Scope:** Move the Hugo site from GitHub Pages (`matthewd.xyz`) to the InterServer
VPS (`fhrp.org`), move the MkDocs site from `docs.matthewd.xyz` to `docs.fhrp.org`,
and 301 the old hostnames.

**Driver:** Apple/Jamf Declarative Device Management requires a payload served as
`application/json`. GitHub Pages has no MIME mapping for the extension in use and
served it as `application/octet-stream`, with no way to override. InterServer
allows MIME types to be set directly on the host.

**MIME configuration is a host-level concern and lives outside this repo.** There
is no `.htaccess` in `static/`. Nothing in CI asserts Content-Type. Steps 1 and 8
cover configuring and verifying it on the server.

---

## State before cutover

| Host | Cloudflare | Origin |
|---|---|---|
| `matthewd.xyz` | proxied | GitHub Pages (Fastly) |
| `docs.matthewd.xyz` | proxied | GitHub Pages (Fastly) |
| `fhrp.org` | DNS-only, `205.209.109.3` | InterServer `vda6600.is.cc`, LiteSpeed — serving a meta-refresh stub to matthewd.xyz |

Both zones are on the same Cloudflare account (`jen`/`corey.ns.cloudflare.com`).

---

## Prerequisites

- Cloudflare access to the `fhrp.org` and `matthewd.xyz` zones.
- SSH and LiteSpeed admin access to the InterServer VPS.
- Ability to add GitHub Actions secrets on `mlaify/mlaify.github.io` and
  `mlaify/attackmap-docs`.

---

## Step 1: Configure the DDM MIME type on the host

Add the mapping for the DDM payload's extension so LiteSpeed returns
`application/json`. For LiteSpeed this is the MIME table referenced by the server
config, typically `/usr/local/lsws/conf/mime.properties`:

```
<extension> = application/json
```

Then apply it with a graceful restart (`/usr/local/lsws/bin/lswsctrl restart`, or
Actions → Graceful Restart in the WebAdmin console on :7080). Control panels
(cPanel/DirectAdmin) expose their own MIME Types UI that writes the same mapping.

Two things to know:

- **Extension-based only.** A LiteSpeed MIME map keys off the file extension. If
  the payload is ever renamed to something extensionless, the mapping stops
  applying and you are back to `octet-stream` — add the new name explicitly.
- **Not version-controlled.** This config lives on the server, not in the repo, so
  it will not survive a rebuild or migration to a new VPS. Note it wherever you
  keep server state, and re-check it after any panel or LiteSpeed upgrade.

Verify locally on the box before going further:

```bash
curl -sI http://127.0.0.1/<path-to-payload> | grep -i content-type
```

---

## Step 2: Behaviour GitHub Pages gave you for free

Pages handled these implicitly. On LiteSpeed they are host config, and none of
them are set by this repo:

| Behaviour | Notes |
|---|---|
| `404.html` on missing paths | Needs `ErrorDocument 404 /404.html`, or LiteSpeed serves its own error page. Hugo does build `public/404.html`. |
| Directory listings off | Confirm `Options -Indexes` (or the LiteSpeed equivalent) so `/images/` does not enumerate. |
| Dotfile protection | `.well-known/` must stay reachable; other dotfiles should not be. |
| Security headers | `X-Content-Type-Options`, `Referrer-Policy`, etc. Set at Cloudflare or on the host — but only in one place, or clients get duplicates. |

---

## Step 3: Prepare the InterServer docroots

Two docroots are needed. Exact paths depend on the control panel — DirectAdmin
uses `/home/<user>/domains/<domain>/public_html`, cPanel uses
`/home/<user>/public_html` for the primary and `/home/<user>/<subdomain>` for
subdomains.

```bash
ssh <user>@<host>
# Confirm the real paths — do not guess. These feed DEPLOY_PATH.
ls -la /home/*/domains/*/public_html 2>/dev/null || ls -la /home/*/public_html
```

1. Create/confirm the vhost for `fhrp.org` (it already exists — it serves the
   redirect stub today).
2. Create the vhost for `docs.fhrp.org`.

---

## Step 4: Create the deploy SSH key

Generate a **dedicated** key. Do not reuse a personal key.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/fhrp_deploy -C "github-actions-deploy" -N ""
```

Append the public half to the server:

```bash
ssh-copy-id -i ~/.ssh/fhrp_deploy.pub <user>@<host>
```

Capture the host key for pinning (the workflows use
`StrictHostKeyChecking=yes`, so this is required, not optional):

```bash
ssh-keyscan -H <host>
```

Consider restricting the key in `~/.ssh/authorized_keys` with
`command="rrsync <docroot>",restrict` so a leaked key cannot get a shell.

---

## Step 5: Add GitHub Actions secrets

Set these on **both** repos (`mlaify/mlaify.github.io` and
`mlaify/attackmap-docs`). `DEPLOY_PATH` differs per repo.

| Secret | Value |
|---|---|
| `DEPLOY_SSH_KEY` | Contents of `~/.ssh/fhrp_deploy` (private half) |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan -H <host>` |
| `DEPLOY_HOST` | InterServer host or IP |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_PATH` | Absolute docroot. Site repo → `fhrp.org` docroot. Docs repo → `docs.fhrp.org` docroot. |
| `DEPLOY_PORT` | SSH port, if not 22 |

Both workflows split into a `build` job and a `deploy` job. Only `deploy` carries
`environment: production`, so create that environment (Settings → Environments)
or drop the line. Pull requests run `build` only and never touch the environment
or the secrets — so a PR from a fork cannot reach the server.

Adding yourself as a required reviewer on the `production` environment makes every
deploy wait for a click. Worth keeping for the first few runs.

> **`--delete` is live.** Both workflows rsync with `--delete`. A wrong
> `DEPLOY_PATH` will delete files at that path. Dry-run first:
>
> ```bash
> rsync -rlptDvzn --delete public/ <user>@<host>:<docroot>/
> ```
>
> The `n` makes it a no-op. Inspect the deletion list before removing it.

If the DDM payload is served from inside either docroot but **not** committed to
the repo, `--delete` will remove it on the next deploy. Either commit it to
`static/`, or host it on a path outside both docroots.

---

## Step 6: TLS on the origin

Cloudflare must reach the origin over valid TLS. Pick one:

- **Cloudflare Origin CA cert** (simplest): generate in the Cloudflare dashboard,
  install on LiteSpeed, set SSL mode to **Full (strict)**.
- **Let's Encrypt on the server**: issue for `fhrp.org` and `docs.fhrp.org`, then
  set **Full (strict)**.

Do **not** use Flexible — it makes Cloudflare talk to the origin over plaintext
and will cause redirect loops with any origin-side HTTPS redirect.

---

## Step 7: Cut DNS over

In the `fhrp.org` zone:

| Name | Type | Value | Proxy |
|---|---|---|---|
| `fhrp.org` | A | InterServer IP | Proxied |
| `www` | CNAME | `fhrp.org` | Proxied |
| `docs` | A | InterServer IP | Proxied |

`fhrp.org` is currently **DNS-only**, which exposes the origin IP. Switch it to
proxied at the same time.

**Do not touch the `MX` records.** `mdavis@fhrp.org` already works and an A-record
change does not affect mail — but see Step 10 for the new aliases now referenced
in site content.

---

## Step 8: Deploy and verify

Push to `main` on each repo, or run the workflow manually. Each workflow builds,
sanity-checks the output, uploads it as an artifact, then the `deploy` job
downloads that exact artifact, rsyncs it, and curls the live site. Deploying the
artifact rather than rebuilding means the bytes that shipped are the bytes that
passed the checks.

```bash
# Site and docs are up
curl -sI https://fhrp.org/ | head -1
curl -sI https://docs.fhrp.org/ | head -1

# The reason for the migration — must be application/json, exactly once
curl -sI https://fhrp.org/<ddm-payload> | grep -ci '^content-type'
curl -sI https://fhrp.org/<ddm-payload> | grep -i '^content-type'

# Ordinary JSON (LiteSpeed maps .json by default; confirm anyway)
curl -sI https://fhrp.org/privacy.json | grep -i '^content-type'

# Step 2 behaviours
curl -so /dev/null -w '%{http_code}\n' https://fhrp.org/definitely-not-a-page
curl -so /dev/null -w '%{http_code}\n' https://fhrp.org/images/

# Standards files
curl -s https://fhrp.org/.well-known/security.txt | head -5
curl -s https://fhrp.org/humans.txt | head -3

# Search index shipped
curl -sI https://fhrp.org/pagefind/pagefind.js | head -1

# Canonical points at the new domain
curl -s https://fhrp.org/ | grep -o 'rel=canonical[^>]*'
```

A `Content-Type` count of `2` means the host and Cloudflare are both setting it —
remove one. Then test from a Jamf-managed device, not just curl: Apple's client is
stricter about what it accepts.

---

## Step 9: Cloudflare caching for the DDM payload

Cloudflare does not cache `.json` by default, but an unusual extension may fall
into a cached type, and a stale DDM payload is hard to debug. Add a Cache Rule
for the payload path with **Bypass cache**, or confirm `cf-cache-status: DYNAMIC`
on it after cutover.

---

## Step 10: Mail aliases (blocking for the security/privacy pages)

Site content now references three addresses on the new domain:

- `security@fhrp.org` — `content/security.md`, `SECURITY.md`,
  `CODE_OF_CONDUCT.md`, `.well-known/security.txt`
- `privacy@fhrp.org` — `content/privacy-policy.md`, `humans.txt`, `privacy.json`
- `matthewd@fhrp.org` — `content/contribute/_index.md`, `package.json`

Create these as aliases to the real mailbox. A published `security.txt` contact
that bounces is worse than none.

---

## Step 11: Redirect the old hostnames

Upload `cloudflare-redirects-matthewd-xyz.csv` as a Cloudflare Bulk Redirects
list, then bind it with a Bulk Redirect rule.

Because this is a pure 1:1 host swap, one catch-all rule with
`subpath_matching=true` and `preserve_path_suffix=true` covers every path — no
per-path rules needed. This is unlike the mlaify.io case, where five paths
changed and `subpath_matching` had to be `false` (see `phase-3-runbook.md`).

`include_subdomains` is `false` on the apex rule on purpose: with it `true`,
`docs.matthewd.xyz/x` would land on `fhrp.org/x` instead of `docs.fhrp.org/x`.
The docs subdomain gets its own row.

`matthewd.xyz` needs a DNS record for the rule to fire, but no origin — Bulk
Redirects run at the edge before origin. Point it at a proxied dummy
(`192.0.2.1`, the RFC 5737 test address) once GitHub Pages is switched off.

`cloudflare-redirects-mlaify-io.csv` was also retargeted from `matthewd.xyz` to
`fhrp.org` in this change, so `mlaify.io` goes straight to the new domain
instead of chaining through two 301s. Re-upload it.

Old post URLs (`/posts/<slug>/` → `/writing/<slug>/`) and `/me/` → `/about/` are
still handled by Hugo `aliases` on the new domain, so those become two hops:
`matthewd.xyz/posts/x/` → `fhrp.org/posts/x/` → `fhrp.org/writing/x/`. Acceptable.

---

## Step 12: Turn off GitHub Pages

On both repos: Settings → Pages → set source to **None**. The `CNAME` files were
deleted in this change, so a Pages build would otherwise keep serving the old
content and keep the custom-domain claim on `matthewd.xyz`.

The `attackmap-docs` `gh-pages` branch is now dead and can be deleted.

---

## Must not break

| Thing | Why it is at risk | Action |
|---|---|---|
| **Bluesky handle `@matthewd.xyz`** | Verified by the `_atproto.matthewd.xyz` TXT record (`did=did:plc:ylabz5pb4axdfwbgcgaba34i`). Deleting the zone kills the handle. | Keep the `matthewd.xyz` zone and that TXT record. Site links to the Bluesky profile were deliberately **not** rewritten. To move the handle to `fhrp.org`, add `_atproto.fhrp.org` TXT with the same DID and re-verify in the Bluesky app **before** removing the old record. |
| **Giscus comment threads** | Mapping is `pathname`, so threads key off the path, not the host. | Paths are unchanged, so existing threads survive. No action. |
| **`fhrp.org` email** | Already live. | Do not touch MX. Add the Step 10 aliases. |
| **DDM MIME mapping** | Server-side config, not in the repo. Lost on a VPS rebuild or panel migration. | Record it with your server state. Re-verify after LiteSpeed/panel upgrades. |
| **DDM payload file** | If it lives in a docroot but not in the repo, rsync `--delete` removes it. | Commit it to `static/`, or host it outside both docroots. |
| **PGP key URL** | `security.txt` now points at `https://fhrp.org/matthewdxyz.asc`. | The file ships from `static/`. The old `raw.githubusercontent.com/mdavistffhrtporg/...` URL was already broken after the org move and has been replaced. |
| **Cert renewal** | rsync `--delete` would wipe an in-flight ACME challenge. | Both workflows exclude `.well-known/acme-challenge/`. |

---

## Rollback

Nothing is destructive until Step 12.

1. Revert the Cloudflare Bulk Redirect rule (disable it).
2. Point `matthewd.xyz` DNS back at GitHub Pages and re-enable Pages with a
   `CNAME` file containing `matthewd.xyz`.
3. `git revert` the migration commit in both repos and push.

After Step 12, add a step 0: re-enable GitHub Pages and wait for the certificate
to reprovision, which can take up to 24h.

---

## Post-cutover cleanup

- Purge the Cloudflare cache on both zones.
- Update external references to `matthewd.xyz`: GitHub profile, GitLab profile,
  PyPI `attackmap` project URLs, `mlaify/AttackMap` README links.
- `old_sitemap.txt` and the `docs/superpowers/` planning documents were left
  pointing at `matthewd.xyz` on purpose — they are historical records.
