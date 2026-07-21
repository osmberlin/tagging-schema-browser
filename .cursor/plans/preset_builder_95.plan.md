---
name: Preset builder
overview: In-app preset authoring form with shareable URL state, live preview, inheritance helpers, and JSON export. Issue #95.
todos:
  - id: route-shell
    content: "Add /preset-builder route with rose-accent layout, nav item, and Zod-validated URL state (shareable, encoded)"
    status: pending
  - id: form-core
    content: "TanStack Form + Zod for required preset fields; derived id/path; main vs sub-preset detection"
    status: pending
  - id: icon-field
    content: "Icon text input with registry validation, icons-page deep link, and already-used notice with usage link"
    status: pending
  - id: location-set
    content: "locationSet include/exclude multi-select using @rapideditor/country-coder borders + nameEn labels"
    status: pending
  - id: inheritance
    content: "Field inheritance warnings, searchable:false filename vs ref convention, preview panel"
    status: pending
  - id: export
    content: "Export preset JSON + translation snippet; optional new-field mini-forms"
    status: pending
isProject: false
---

# Preset builder — implementation plan (updated)

Issue: [#95](https://github.com/osmberlin/tagging-schema-browser/issues/95)

## What we're building

A new route `/preset-builder` where contributors can:

1. Fill in a preset JSON through a guided form.
2. **Share and resume work** — full form state lives in the URL (encoded, like other pages).
3. See a **live preview** (icon, label, geometry, resolved fields, inheritance warnings).
4. Get the correct **file path** from tags (`data/presets/amenity/cafe.json` vs `data/presets/shop/pasta.json`).
5. Understand **main vs sub-preset** behavior and field inheritance (`{shop}` refs).
6. Optionally define **new field files** alongside the preset.
7. **Export** preset JSON (+ translation sidecar snippets) to copy into a PR.

The app is read-only today — this is the first authoring surface.

---

## Navigation, color, icon

Follow the [About page area colors](src/components/PageAbout/PageAbout.tsx):

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Primary accent** | **Rose** (`areaAccent.presets`) | Preset authoring is a presets-area feature — same rose as Presets nav, headings, buttons, focus rings |
| **Nav label** | **Preset builder** | Clear purpose; distinct from browsing "Presets" |
| **Nav icon** | Preset hexagon (`AreaIcon area="presets"`) with a small **+** or pencil badge, or a dedicated builder glyph in the same rose stroke style | Visually tied to presets without duplicating the browse icon exactly |
| **Route** | `/preset-builder` | Short, stable share URL |

Register in `PrimaryNav` and `SchemaArea` only if we need area-specific styling helpers; otherwise treat as a presets sub-area using `area="presets"` on inputs/buttons.

---

## Shareable URL state

**Requirement:** Form state must be in the URL so users can share a link and continue editing.

**Approach:** TanStack Router search params + Zod (same pattern as `/icons`, `/fields`, presets search). Reuse [`routerSearch`](src/utils/routerSearch.ts) pretty-encoding.

```ts
// sketch — individual params for simple fields, encoded blob for nested data
const presetBuilderSearchSchema = z.object({
  dataUrl: z.string().catch(''),
  locale: z.string().catch(''),
  // flat scalars
  pb_name: z.string().catch(''),
  pb_searchable: z.boolean().catch(true),
  // JSON-encoded arrays/objects (pretty-decoded in URL where safe)
  pb_tags: z.string().catch('{}'),        // {"amenity":"cafe"}
  pb_geometry: z.string().catch('[]'),    // ["point","area"]
  pb_fields: z.string().catch('[]'),
  pb_terms: z.string().catch('[]'),
  pb_aliases: z.string().catch('[]'),
  pb_locationSet: z.string().catch(''),   // optional JSON
  // advanced keys in collapsed section follow same pattern
})
```

- **On every meaningful edit:** `navigate({ search: patch, replace: true })` — bookmarkable, back/forward friendly.
- **Share button:** copy current `window.location.href`.
- **Import from existing preset:** `?pb_from=amenity/cafe` pre-fills from loaded schema (phase 5).
- Prefer readable params over one opaque blob where possible; use a single `pb` base64url JSON fallback only if param count explodes.

---

## Schema recap — what the form captures

### Required

| Field | UI control | Notes |
|-------|-----------|-------|
| `name` | text input **or** preset ref `{parent}` | Sub-presets often use `"{shop}"` |
| `geometry` | checkbox group | `point`, `vertex`, `line`, `area`, `relation` |
| `tags` | key-value editor | At least one tag; drives preset id + folder |

### Common (visible by default)

| Field | UI control |
|-------|-----------|
| `icon` | **text input** — see Icon field below |
| `fields` | ordered multi-select + `{preset}` ref chips |
| `terms` | tag-style multi input |
| `aliases` | tag-style multi input |

### Optional / advanced (collapsed)

| Field | Notes |
|-------|-------|
| `addTags` / `removeTags` | Only when they differ from `tags` |
| `moreFields` | Secondary field list |
| `searchable` | Default `true`; see naming convention below |
| `matchScore` | Default `1.0` |
| `reference` | Taginfo documentation link |
| `locationSet` / `locationSetCrossReference` | Regional filtering — see below |
| `relation` / `relationCrossReference` | Relation presets |

### Explicitly out of UI

| Field | Reason |
|-------|--------|
| **`imageURL`** | Reserved for a very specific upstream case only — **never offered** for regular presets in this builder. Icon field covers normal presets. |

---

## `searchable: false` naming convention

**Remember:** filename gets `_` prefix; **refs stay without underscore.**

| Concept | Example |
|---------|---------|
| Preset id | `shop/ice_cream` |
| Repo file (unsearchable) | `data/presets/shop/_ice_cream.json` |
| Field/preset ref in JSON | `{shop/ice_cream}` — **not** `{shop/_ice_cream}` |

Reuse [`schemaRepoPath`](src/utils/githubFileUrl.ts) + [`unsearchablePresetId`](src/utils/githubFileUrl.ts) for the live path display. When `searchable` is unchecked, show both paths side by side:

> File: `data/presets/shop/_ice_cream.json` · refs: `{shop/ice_cream}`

---

## Main vs sub-preset

```
tags: { shop: pasta }   →  id: shop/pasta    →  file: data/presets/shop/pasta.json
tags: { amenity: cafe } →  id: amenity/cafe  →  file: data/presets/amenity/cafe.json
```

- `parentPresetId(id)` — badge "Main preset" vs "Sub-preset of `shop`".
- Inherited fields greyed when lists omitted; amber warning when explicit list lacks `{parent}` (reuse `detectMissingFieldInheritance`).

---

## Icon field — simplified

**No in-form icon combobox/search.** Users pick icons on the existing Icons page.

### UX

```
Icon
┌─────────────────────────────────────────────┐
│ maki-cafe                                   │  ← plain text input
└─────────────────────────────────────────────┘
  [maki-cafe SVG preview when valid]

  ℹ️ Find an icon name on the Icons page (search + facets), then paste it here.
     [Open Icons page ↗]  (new tab, preserves dataUrl)

  ⚠️ Unknown icon name — not in registry.
  — or —
  ℹ️ Already used on 12 presets / 3 field options.
     [View usages on Icons page ↗]  → /icons?i_q=maki-cafe&i_view=usages
```

### Validation

1. **Registry check** — name exists in icon suppliers (`iconRegistry` / loaded catalog).
2. **Usage check** — against loaded schema: count preset + option usages (same data as Icons page).
3. Invalid → red border + error; valid + used → neutral notice with link; valid + unused → green check + preview SVG.

### Deep link to Icons page

Open in **new tab**: `/icons?i_q={typedPrefix}&dataUrl=…` so users can search, facet by supplier, and copy the exact `supplier-name` string.

---

## Regional filtering (`locationSet`)

**Library:** [`@ideditor/location-conflation`](https://github.com/ideditor/location-conflation) (used by schema-builder/iD) accepts country-coder identifiers in `include` / `exclude` arrays.

**Dropdown data:** [`@rapideditor/country-coder`](https://github.com/rapideditor/country-coder) exports `borders` — a `RegionFeatureCollection` where each feature has:

- `properties.id` — lookup key (`de`, `US`, `Q30`, `001`, …)
- `properties.nameEn` — English display name
- `properties.emojiFlag`, `iso1A2`, aliases

**UI:** Two multi-select comboboxes (Include / Exclude):

```
Include regions   [🇩🇪 Germany ×] [🇺🇸 United States ×]  [+ Add…]
Exclude regions   [🇵🇷 Puerto Rico ×]                      [+ Add…]
```

- Searchable dropdown: filter by `nameEn`, ISO code, or id.
- On select: store the **country-coder id** string (what location-conflation expects), display `nameEn`.
- Validate on blur via `location-conflation` `validateLocation` / `validateLocationSet` (dev dependency or dynamic import).
- **`locationSetCrossReference`:** preset/field ref picker (`{presets/man_made/crane}`) instead of manual lists — advanced subsection.

---

## Reference fields — `{preset}` and `{field}`

| Value | Meaning | Picker |
|-------|---------|--------|
| `"{shop}"` in `name` | Inherit label from parent | Preset combobox |
| `"{shop}"` in `fields` | Include parent's field list | Preset ref chip |
| `building` in `fields` | Field id | Field combobox |
| `"{access}"` in field `label` | Field cross-ref | Field combobox |

---

## Layout (Tailwind UI settings-page, light only)

| Left (description) | Right (form card) |
|--------------------|-------------------|
| **Identity** | Tags editor, derived id, file path, main/sub badge, searchable toggle |
| **Labels** | Name (or ref), terms, aliases |
| **Appearance** | Icon input + validation notices (no image URL) |
| **Geometry** | Geometry checkboxes |
| **Fields** | `fields` list + inheritance helper |
| **Advanced** *(collapsed)* | moreFields, addTags, removeTags, matchScore, reference, locationSet, relation… |
| **Preview** | `PresetIconBox`, geometry icons, resolved field list |
| **Export** | JSON tabs: preset file, translation snippet, new field files |

- **Accent:** rose (`areaAccent.presets`)
- **Cards:** `bg-white shadow-xs outline outline-slate-900/5 sm:rounded-xl`

---

## Tech stack

| Piece | Choice |
|-------|--------|
| Form | `@tanstack/react-form` (new) |
| Validation | Zod mirroring schema-builder `preset.json` / `field.json` |
| Cross-field rules | Reuse `detectMissingFieldInheritance`, `resolvePresetFieldList`, `parentPresetId` |
| Translations slice | Parallel `name` / `terms` / `aliases` for export snippet (not in preset JSON) |

---

## Implementation phases

1. **Shell:** Route, nav item (rose), URL state schema, empty form, share link.
2. **Core fields:** Tags → id/path, geometry, name, fields, preview.
3. **Icon input:** Validation, icons-page link, usage notice.
4. **Advanced:** Inheritance warnings, searchable convention, locationSet dropdowns, collapsed section.
5. **Export:** JSON + translation snippet; new-field mini-form.
6. **Polish:** Prefill `?pb_from=`, duplicate-id check, e2e smoke test.

---

## Open questions

1. **v1 scope:** export-only (copy JSON) vs PR integration?
2. **Categories:** assign in `preset_categories.json` in v1?
3. **Draft-invalid states:** allow until export, or block early?
4. **Nav placement:** top-level "Preset builder" tab vs link from Presets page only?

---

## Decisions applied (this revision)

| Topic | Decision |
|-------|----------|
| URL state | Full form in shareable, encoded search params (TanStack Router + Zod) |
| `imageURL` | **Not in UI** — never for regular presets |
| Icon picker | Text input + validation; Icons page in new tab for discovery |
| Icon already used | Notice below input + link to `/icons?…&i_view=usages` |
| `searchable: false` | File `_*` prefix; refs without underscore |
| `locationSet` | Multi-select dropdowns via country-coder `borders` + `nameEn`; validate with location-conflation |
| Primary color | **Rose** (presets area) |
| Nav label | **Preset builder** |
| Nav icon | Preset-area rose icon (hexagon) with builder badge |
