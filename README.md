# Tagging Schema Browser

A standalone web app to **browse, search, and inspect the [OpenStreetMap iD tagging schema](https://github.com/openstreetmap/id-tagging-schema)** — its presets, fields, icons, and the connections between them — for any released or pre-release build.

**Live:** https://osmberlin.github.io/tagging-schema-browser/

## About

The iD tagging schema is the dataset that drives preset and field selection in the [iD editor](https://github.com/openstreetmap/iD) (and other tools). It is large and highly cross-referenced, which makes it hard to review changes or understand how a preset, field, or icon is reused across the dataset.

This app loads a built `dist/` of the schema and makes it explorable in the browser — no build step or checkout required. It is meant both as an everyday reference and as a **review tool for schema pull requests**: point it at a PR's preview build and see exactly what changed.

## Features

- **Presets** — faceted search by category, primary tag, geometry, field, and icon set. Open a preset to see its tags, fields, category, and icon — each with a count that links to everything else using the same value.
- **Icons** — browse the icon sets presets draw from (Maki, Temaki, Roentgen, FontAwesome), filter by supplier / usage / asset status, and spot duplicates.
- **Shareable state** — all search and filter state lives in the URL (TanStack Router + Zod), so any view can be linked. Press <kbd>?</kbd> in the app for keyboard shortcuts.

## Loading a schema build

Use the header toggle or URL params to pick the dataset:

| Goal                                  | URL                                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| Latest staging / unreleased (default) | open the app                                                                      |
| Published release                     | `…/?reference=release`                                                            |
| A specific version                    | `…/?dataUrl=https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@7/dist` |
| A pull-request preview                | `…/?dataUrl=<the PR's built dist/ URL>`                                           |

**Staging** (default) loads the dist built from id-tagging-schema `main` on every push; the toggle shows when `main` last changed and the detected schema version (v7). **Release** loads the published npm package (`@latest`) when you add `?reference=release`. When you open a PR preview via `dataUrl`, the app compares it against staging.

The browser supports **schema v7+** only. Older v6 `dist/` URLs are rejected unless you add `?legacy=1`.

## Develop

This project is **bun-only** ([bun](https://bun.com) ≥ 1.3):

```bash
bun install
bun run dev      # dev server
bun run build    # typecheck (tsc) + production build (vite)
bun run lint     # biome
bun run test:e2e # playwright
```

Tech stack: React 19, Vite 8 (Rolldown), TanStack Router (Zod-validated search params), Tailwind CSS v4, itemsjs (faceted search), Fontsource (self-hosted Inter + Lexend).

## Deploy

Pushing to `main` builds with bun and publishes `dist/` to GitHub Pages via [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). The workflow sets `BASE_PATH` to `/<repo>/` for [Vite's base path](https://vite.dev/guide/build#public-base-path), and the build emits a `404.html` (a copy of `index.html`) so deep links and refreshes resolve client-side on Pages.

## License

[ISC](LICENSE.md) — copied from the [iD editor](https://github.com/openstreetmap/iD).
