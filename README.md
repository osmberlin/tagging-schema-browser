# iD Tagging Schema Browser

A URL-driven web app to browse and search the [id-tagging-schema](https://github.com/openstreetmap/id-tagging-schema) preset data. Data is loaded at runtime from a `dataUrl` query parameter (no build-time embedding).

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173/?dataUrl=https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/dist`.
The app treats `dataUrl` as required for reproducible links. If it is missing, the app auto-fills it with the latest tagging-schema dist URL.

## URL mode

- **Query param:** `?dataUrl=<base-url-of-dist-folder>`
- **Example (published schema):**  
  `https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/dist`
- **PR preview:** Use the dist URL of your id-tagging-schema PR preview deployment; the app will fetch `presets.min.json`, `translations/en.min.json`, `preset_categories.min.json`, `fields.min.json`, and `preset_defaults.min.json` from that base.

All search state (query, filters, page, sort) is synced to the URL so you can share exact views.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – typecheck + production build
- `npm run preview` – serve the production build
- `npm run lint` – Biome check
- `npm run format` – Biome format

## Stack

- Vite 8, React 19, TypeScript
- TanStack Router, nuqs (URL state), ItemsJS (faceted search)
- Tailwind CSS v4
