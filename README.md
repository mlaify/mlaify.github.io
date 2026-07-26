# matthewd.xyz

Personal website and blog for Matt D., built with Hugo and deployed to InterServer.

This site contains long-form writing, technical notes, and personal pages. It was previously served at `matthewd.xyz`, which now 301-redirects here.

## License

- Code and configuration are licensed under the MIT License.
- Written content and original media are licensed under CC BY-NC-SA 4.0 unless otherwise noted.

---

## ✨ Overview

- **Framework:** Hugo (static site generator)
- **Theme:** Custom Tailwind theme (in-repo, no submodule)
- **Search:** Pagefind
- **Hosting:** InterServer VPS (LiteSpeed), deployed by rsync from GitHub Actions
- **DNS / CDN:** Cloudflare
- **Comments:** Giscus (GitHub Discussions)
- **Analytics:** None
- **License:** MIT (code), CC BY-NC-SA 4.0 (content)

The site is intentionally static for performance, security, and longevity.

---

## 🚀 Deploy

Pushing to `main` runs [`.github/workflows/hugo.yml`](.github/workflows/hugo.yml),
which builds with Hugo + Pagefind and rsyncs `public/` to the InterServer docroot
for `matthewd.xyz` over SSH.

Pull requests run the build only — no secrets, no server access.

### Required secrets

Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `DEPLOY_SSH_KEY` | Private half of an SSH keypair authorized on the InterServer account |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan -H <host>` — pins the host key |
| `DEPLOY_HOST` | InterServer hostname or IP |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_PATH` | Absolute docroot path for `matthewd.xyz` |
| `DEPLOY_PORT` | SSH port (optional, defaults to `22`) |

A `production` environment must exist, or remove `environment: production` from
the deploy job.

### Required: mark the docroot

The deploy refuses to run unless the destination contains a sentinel file. Run
once, on the server:

```bash
touch <docroot>/.deploy-ok
```

Server-side only — never committed, never shipped, and excluded from `--delete`
so it survives deploys.

### Deletion limit

`rsync --delete` is capped. If a deploy would delete more than 100 paths it
aborts **before deleting anything** and prints the list. For a legitimate large
restructure, raise the `MAX_DELETIONS` repository variable (Settings → Secrets
and variables → Actions → Variables).

### Why these guards exist

On 2026-07-26 `DEPLOY_PATH` was empty. `"${DEPLOY_PATH}/"` expanded to `/`, and
`rsync --delete` ran against the account root, deleting 6679 paths including all
server-side mail. The deploy job now has four independent layers:

1. `DEPLOY_PATH` must be non-empty, absolute, free of `..`, not a system
   directory, and at least three levels deep.
2. The destination must contain `.deploy-ok`.
3. A dry run must report no more than `MAX_DELETIONS` deletions — checked before
   any real transfer, so an over-limit run deletes nothing.
4. The real `rsync` carries `--max-delete` as a backstop.

Layer 3 is the one that matters most: `--max-delete` alone still deletes up to
its cap before aborting.

Cutover steps, including the DNS change and the behaviours GitHub Pages used to
provide implicitly, are in
[`docs/superpowers/ops/matthewd-xyz-to-interserver-runbook.md`](docs/superpowers/ops/matthewd-xyz-to-interserver-runbook.md).

---

## 📁 Repository Structure

```text
.
├── content/            # Blog posts, pages, and written content
│   ├── writing/        # Blog posts
│   └── ...             # Project and standalone pages
├── static/             # Images, favicon, humans.txt, etc.
├── layouts/            # Templates (the theme lives here)
├── assets/             # CSS, JS, processed assets
├── config/_default/    # Site configuration
├── .github/            # GitHub Actions, CODEOWNERS
└── README.md
