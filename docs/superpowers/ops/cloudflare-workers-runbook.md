# Runbook — matthewd.xyz + docs.matthewd.xyz: InterServer → Cloudflare Workers

**Date:** 2026-07-28
**Scope:** Move both sites off the InterServer VPS onto Cloudflare Workers static
assets, built by Workers Builds. Domains do not change.

| | Before | After |
|---|---|---|
| Build | GitHub Actions | Workers Builds (Cloudflare clones the repo) |
| Transport | `rsync` over SSH | `wrangler deploy` |
| Origin | InterServer VPS (LiteSpeed) | none — Cloudflare serves the assets |
| Deploy secrets | 6 `DEPLOY_*` per repo | none in GitHub |
| Rollback | DNS repoint | one click, or `wrangler rollback` |

The entire class of failure that motivated the previous runbook is gone. There is
no `rsync --delete`, no docroot path, and no shell on a shared account: a
deployment is an immutable upload of a file set, and the worst a bad deploy can do
is serve the wrong site until it is rolled back. The path validation, `.deploy-ok`
sentinel, dry-run deletion gate, and `--max-delete` backstop all existed to
constrain `rsync`, and are deleted with it.

---

## What is different from the InterServer move

There is **no separate origin to prepare and verify before DNS**. On Workers the
deployment exists and is reachable at a preview URL before any DNS change, so the
verify-then-cut order is easier, not harder. The risky step is narrower and
explicit: **swapping the apex A record for a Custom Domain.**

---

## Step 1: Connect each repo to Workers Builds

Requires the dashboard — repo connection cannot be done from `wrangler`.

Workers & Pages → Create → Workers → **Import a repository**. Authorize the
Cloudflare GitHub App for `mlaify/mlaify.github.io` and `mlaify/attackmap-docs`.

Then per project, Settings → Build:

| Setting | `matthewd-xyz` | `docs-matthewd-xyz` |
|---|---|---|
| Build command | `npm run build:cf` | `npm run build:cf` |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy` |
| Non-production deploy command | `npx wrangler versions upload` | `npx wrangler versions upload` |
| Production branch | `main` | `main` |
| Root directory | *(blank)* | *(blank)* |

Ignore Autoconfig's framework guess if it offers one — `wrangler.jsonc` is already
committed and is the source of truth.

### The one build variable that cannot live in the repo

Settings → Build → **Variables and Secrets**, on `matthewd-xyz` only:

```
HUGO_VERSION = 0.162.1
```

Without it the build silently uses the image default (extended 0.147.7) and
succeeds. Nothing fails; the output is just built by the wrong Hugo. Node is
pinned by `.nvmrc` and Python by `.python-version`, both in-repo — Hugo has no
equivalent file.

Confirm in the first build log that it resolved to **extended** 0.162.1.

---

## Step 2: Verify on a preview URL, before touching DNS

Open the migration as a PR on each repo. A non-production branch runs
`wrangler versions upload`, which publishes a preview URL and does **not** touch
production. DNS still points at InterServer throughout.

Check against the preview URL:

```bash
P=https://<version>-matthewd-xyz.<subdomain>.workers.dev

curl -sI "$P/"                          | head -1
curl -sI "$P/writing"                   | grep -i location   # expect 307 -> /writing/
curl -s  "$P/.well-known/security.txt"  | head -3
curl -sI "$P/privacy.json"              | grep -i content-type
curl -sI "$P/pagefind/pagefind.js"      | head -1
curl -so /dev/null -w '404: %{http_code}\n' "$P/nope"         # expect 404, not 200
curl -sI "$P/" | grep -iE 'x-frame|x-content-type|referrer-policy'
curl -sI "$P/_headers" | head -1        # expect 404 — consumed, never served
```

The header checks matter most. Those headers came from LiteSpeed before and now
come only from `_headers`; if they are absent here they will be absent in
production.

Also load the site in a browser and use the search box — Pagefind fetches its
index over HTTP and is the one feature a curl sweep does not really exercise.

---

## Step 3: Cut `docs.matthewd.xyz` first

Do the subdomain before the apex. It is lower traffic, it is not the Bluesky
handle, and it proves the whole mechanism on something recoverable.

`docs.matthewd.xyz` currently has an **A record** → InterServer IP. A Custom
Domain cannot be created while a conflicting record exists, so this is a swap, not
an addition:

1. Merge the PR. The build runs, and `wrangler deploy` **fails** at the custom
   domain step while the A record is still there. This is expected.
2. DNS → delete the `docs` A record.
3. Re-run the deploy (Workers Builds → Retry, or `npx wrangler deploy` locally).
   Cloudflare creates the record and issues the certificate.
4. Verify:

```bash
curl -sI https://docs.matthewd.xyz/ | head -1
curl -sI https://docs.matthewd.xyz/install | grep -i location
curl -so /dev/null -w '404: %{http_code}\n' https://docs.matthewd.xyz/nope
```

Certificate issuance is usually fast but is not instant. Expect a brief window
between step 2 and a working TLS handshake.

If you would rather not have that window, add the Custom Domain from the dashboard
in the same sitting as the record deletion — the ordering constraint is the same,
but the two actions are seconds apart.

---

## Step 4: Cut `matthewd.xyz`

Same swap on the apex, with two extra things to protect.

**Do not touch these records:**

- **`_atproto.matthewd.xyz` TXT** (`did=did:plc:ylabz5pb4axdfwbgcgaba34i`) — the
  Bluesky handle `@matthewd.xyz` depends on it.
- **`MX` records.** Mail is unrelated to this move and was the expensive lesson
  last time.

Only the apex `A` record changes.

1. Merge the PR; expect the same custom-domain failure.
2. DNS → delete the apex `A` record → re-run the deploy.
3. Verify, including the things unique to the apex:

```bash
curl -sI https://matthewd.xyz/ | head -1
curl -s  https://matthewd.xyz/.well-known/security.txt | head -3
curl -sI https://matthewd.xyz/privacy.json | grep -i content-type
curl -sI https://matthewd.xyz/ | grep -iE 'x-frame|x-content-type|referrer-policy'
curl -sI https://www.matthewd.xyz/ | grep -iE '^HTTP|location'   # expect 301 -> apex
```

### `www` must keep redirecting

`www.matthewd.xyz` currently 301s to the apex. `www` is deliberately **not** a
Custom Domain in `wrangler.jsonc` — adding it would serve the site at both
hostnames and create a duplicate-content pair.

The redirect has to survive the loss of the origin. Confirm a Cloudflare
**Redirect Rule** exists:

```
When: (http.host eq "www.matthewd.xyz")
Then: Static redirect to https://matthewd.xyz${http.request.uri.path}, 301, preserve query string
```

If the current 301 was coming from the LiteSpeed vhost rather than Cloudflare, it
disappears the moment the origin does — create the rule **before** Step 4, not
after. Verify with the `curl` above; a 522 or a Worker 404 at `www` means the rule
is missing.

---

## Step 5: Check for duplicated security headers

The origin used to set `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, `X-XSS-Protection`, and `Expect-CT`. Now `_headers` sets the
first three.

Rules → Transform Rules → **Modify Response Header**. If a rule there also sets
any of them, remove one side. Two conflicting values for the same security header
is worse than one.

`X-XSS-Protection` and `Expect-CT` were deliberately not carried over —
`Expect-CT` is dead (browsers ignore it) and `X-XSS-Protection` is deprecated and
can itself introduce vulnerabilities. Add them to `_headers` if byte-identical
parity matters more than that.

---

## Step 6: Decommission

Only after both sites are verified and have been live for a day or so.

| Item | Action |
|---|---|
| GitHub repo secrets | Delete `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_PORT` from both repos |
| GitHub `production` environment | No longer gates anything — remove or leave inert |
| InterServer SSH key | Revoke the deploy key from `~/.ssh/authorized_keys` |
| InterServer vhosts | Remove the `matthewd.xyz` and `docs.matthewd.xyz` vhosts and docroots |
| Cloudflare Origin CA cert | Was for the InterServer origin; unused now |
| SSL/TLS mode | Full (strict) is still correct and still applies to anything left on the zone |
| GitHub Pages | Already off from the previous migration — confirm both repos still say None |

### InterServer cannot be cancelled yet

`fhrp.org` still lives there, serving the apex 301 and
`/.well-known/com.apple.remotemanagement` — a different domain and a different
docroot, untouched by this move. See
[`apple-enrollment-file.md`](apple-enrollment-file.md).

That file is also the one thing this move would make *easier* to bring in-repo:
Workers `_headers` can set `Content-Type` on an extensionless file, which is
exactly what GitHub Pages could not do and what the LiteSpeed `ForceType` was
working around. Verified — `_headers` overrides `Content-Type` on a
`.well-known/com.apple.remotemanagement` asset. That is a separate decision
gated on which domain the Managed Apple IDs use, and it still needs the WAF Skip
rule either way.

---

## Behaviour changes to know about

| Behaviour | Before | After |
|---|---|---|
| `/mothers_day_2026.html` | 200 | **307 → `/mothers_day_2026`**, then 200 |
| `/mothers_day_2026` | 404 | 200 |
| Directory listings | `Options -Indexes` | Not possible — nothing to list |
| Dotfiles | Blocked except `.well-known/` | Only what the build emits is uploaded |
| `_headers` / `_redirects` | n/a | Consumed at deploy time, never served (404) |

The `.html` change is inherent to `html_handling: auto-trailing-slash`, which is
also what makes `/writing` → `/writing/` work for the other ~70 pages. The old
URL still resolves via the redirect, so nothing breaks; the canonical form just
loses its extension. Choosing `html_handling: "none"` to avoid it would break
trailing-slash handling site-wide — a bad trade for one file.

---

## Rollback

Far cheaper than the InterServer rollback, and it does not involve DNS.

**Bad content, same hosting:** Workers & Pages → the project → Deployments →
roll back to a previous version, or `npx wrangler rollback`. Takes effect in
seconds.

**Back to InterServer entirely:** the vhosts and docroots are intact until
Step 6, so this is a DNS change plus reverting the migration commit:

1. DNS → delete the Custom Domain, recreate the `A` record → InterServer IP,
   proxied.
2. `git revert` the migration commit in the affected repo and push.
3. Re-add the `DEPLOY_*` secrets.

Once Step 6 is done, that path is gone — which is the point of putting it last.

---

## Must not break

| Thing | Risk | Action |
|---|---|---|
| **Bluesky handle `@matthewd.xyz`** | Handle dies if `_atproto` TXT is dropped while editing the zone | Only the apex `A` record changes |
| **Mail** | Unrelated to this move, but this zone is where it lives | Do not touch `MX` |
| **`www` → apex 301** | Vanishes with the origin if it was a LiteSpeed redirect | Cloudflare Redirect Rule, created before Step 4 |
| **Security headers** | Came from LiteSpeed; no origin means no headers | `_headers`, asserted by `check-build.sh` |
| **Giscus comment threads** | Mapping is `pathname`; domains unchanged | No action |
| **fhrp.org / Apple enrollment** | Different domain and docroot on InterServer | Untouched — do not decommission the account |
| **Pagefind search** | Index is fetched over HTTP and not fingerprinted | `_headers` keeps it on `must-revalidate` |
