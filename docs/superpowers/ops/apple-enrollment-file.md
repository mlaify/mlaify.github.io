# Ops — Apple account-driven enrollment discovery file

**Date:** 2026-07-25
**Status:** Hosted on the InterServer VPS, deliberately **not** in this repo.

## Why it is not in this repo

Apple requires `/.well-known/com.apple.remotemanagement` to be served as
`application/json`. The file is **extensionless**, and GitHub Pages has no MIME
mapping for it, so Pages serves it as `application/octet-stream` and Apple
rejects it. Pages offers no way to override `Content-Type`.

This site is served by GitHub Pages, so shipping the file from `static/` would
only publish a copy with the wrong `Content-Type`. It lives on the InterServer
host instead.

## Why it cannot move to a subdomain

Apple derives the discovery URL from the **Managed Apple ID's email domain**. A
user entering `you@fhrp.org` during enrollment makes the device fetch:

```
https://fhrp.org/.well-known/com.apple.remotemanagement
```

So the file must sit at the apex of whichever domain the Managed Apple IDs use.
It cannot be relocated to `mdm.example.com`, and a 301 from the apex is not a
safe assumption — serve it directly at the well-known path.

**Confirm which domain your Managed Apple IDs use.** The file is currently set
up for `fhrp.org`. If the Managed Apple IDs are `@matthewd.xyz` instead, the
file has to be served from `matthewd.xyz` — which means Pages cannot host it,
and the Cloudflare Snippet approach below becomes necessary.

## File contents

```json
{
  "Servers": [
    {
      "Version": "mdm-adde",
      "BaseURL": "https://mlaify.jamfcloud.com/servicediscoveryenrollment/v1/deviceenroll"
    }
  ]
}
```

> **The version briefly committed to this repo had `mlaify.jamfcloud.com.com`**
> — a doubled suffix. That is not a hostname that fails safe: `com.com` is a
> registered domain (GoDaddy, registrant behind Domains By Proxy), and
> `*.com.com` resolves to a third party. That file would have pointed
> account-driven enrollment — including the Managed Apple ID authentication
> prompt — at a host controlled by someone else. Verify this hostname against
> your Jamf Pro instance URL before deploying, and re-check the
> `/servicediscoveryenrollment/v1/deviceenroll` path against current Jamf docs.

## fhrp.org configuration

`fhrp.org` otherwise 301s to `matthewd.xyz`, so the redirect must exempt this
path. The tested `.htaccess` for the `fhrp.org` docroot:

```apache
<Files "com.apple.remotemanagement">
  ForceType application/json
  <IfModule mod_expires.c>
    ExpiresActive Off
  </IfModule>
  <IfModule mod_headers.c>
    Header always set Content-Type "application/json; charset=utf-8"
    Header always set Cache-Control "no-transform, max-age=0, must-revalidate"
    Header always set X-Content-Type-Options "nosniff"
  </IfModule>
</Files>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^\.well-known/com\.apple\.remotemanagement$ - [L]
  RewriteRule ^\.well-known/acme-challenge/ - [L]
  RewriteRule ^(.*)$ https://matthewd.xyz/$1 [R=301,L]
</IfModule>
```

`ExpiresActive Off` is inside the `<Files>` block because `mod_expires` will
otherwise emit a second, conflicting `Cache-Control` next to the one set here.

Verified locally against Apache 2.4.66:

| Request | Result |
|---|---|
| `/.well-known/com.apple.remotemanagement` | `200`, `application/json; charset=utf-8`, single `Cache-Control`, not redirected |
| `/` | `301` → `https://matthewd.xyz/` |
| `/writing/` | `301` → `https://matthewd.xyz/writing/` |
| `/.well-known/acme-challenge/<token>` | `200`, not redirected |

If you would rather do the redirect at Cloudflare, the same exemption is needed
in the rule expression — otherwise the edge will redirect the enrollment path
before the origin is ever consulted.

## Cloudflare: the challenge will block Apple's client

This is the non-obvious one. `fhrp.org` is proxied through Cloudflare, and
Cloudflare currently issues a **JS challenge** to non-browser clients —
confirmed via `cf-mitigated: challenge` and a `403` to both `curl` and GitHub
Actions runners.

**Apple's MDM client is not a browser and cannot solve a JS challenge.** Add a
WAF custom rule with the **Skip** action for that exact path, or enrollment will
fail with a correct file and correct MIME type:

```
(http.host eq "fhrp.org" and http.request.uri.path eq "/.well-known/com.apple.remotemanagement")
```

Also confirm the response is not cached as something else — check for
`cf-cache-status: DYNAMIC`, or add a Cache Rule with **Bypass cache** on that
path. A stale enrollment payload is painful to debug.

## Verification

`curl` alone is not sufficient — it will hit the same challenge. Verify from a
device Jamf manages, and check the origin directly to isolate Cloudflare:

```bash
# Origin, bypassing Cloudflare (substitute the InterServer IP)
curl -sI --resolve fhrp.org:443:<INTERSERVER_IP> \
  https://fhrp.org/.well-known/com.apple.remotemanagement | grep -i content-type

# Through Cloudflare — must not be a challenge
curl -sI https://fhrp.org/.well-known/com.apple.remotemanagement \
  | grep -iE '^(HTTP|content-type|cf-mitigated)'
```

Expect `application/json`, exactly one `Content-Type`, and no `cf-mitigated`
header.

## Not version-controlled

This file and its MIME configuration live on the server, so they will not
survive a VPS rebuild or a control-panel migration, and a LiteSpeed or panel
upgrade can silently revert the MIME mapping. The failure surfaces as Jamf
enrollment breaking, not as a website error. Record it with your server state
and re-check after upgrades.
