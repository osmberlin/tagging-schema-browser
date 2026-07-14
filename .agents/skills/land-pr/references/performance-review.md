# Performance review (land PR)

Load with `react-dev` during the review lane. **Extra lens for this app:** work must happen in **one place** — not duplicated across render, effects, and siblings.

Ask on each hot path (maps, lists, filters, stores): **where is this computed once?** If the answer is “everywhere” or “twice,” fix it.

Smells worth a second look beyond `react-dev`: same transform in render **and** an effect; broad Zustand selectors; map layers remounting when visibility would suffice (`react-map-gl` skill).

Fix → `finish-work` → push.
