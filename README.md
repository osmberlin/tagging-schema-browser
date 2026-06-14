# Tagging Schema Browser

Browse and search [id-tagging-schema](https://github.com/openstreetmap/id-tagging-schema) `dist/` data via `?dataUrl=…`. The in-app **About** page links the schema and schema-builder repos.

This project is **bun-only** ([bun](https://bun.com) ≥ 1.3).

```bash
bun install && bun run dev
```

Deploy: push to `main` with GitHub Pages enabled; workflow sets `BASE_PATH` to `/<repo>/` per [Vite base](https://vite.dev/guide/build#public-base-path).
