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
