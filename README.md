# mlaify.github.io

ML AI project hub website built with **Hugo** and the **Doks** theme (Thulite).

## Stack

- Hugo (extended)
- Doks (`@thulite/doks-core`)
- Node.js/npm for theme dependencies

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production output:

```bash
npm run build
```

## Content layout

```text
content/
  _index.md
  docs/
    _index.md
    about.md
    projects.md
    project-omekarapper.md
    project-opensift.md
    project-opencontractrx.md
    project-aegis.md
    build-principles.md
    direction.md
    contribute-contact.md
```

## Domain

Custom domain is set with `CNAME` and copied into Hugo output via `static/CNAME`.
