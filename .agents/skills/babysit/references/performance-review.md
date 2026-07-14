# Performance review (React / FMC)

Use alongside skill `react-dev` during babysit code review. The app gets slow when the same work runs in multiple places or recomputes on every render without a single source of truth.

## High-signal smells

| Smell | Why it hurts | Prefer |
| ----- | ------------ | ------ |
| Same transform/filter in render **and** in `useEffect` | Double work + extra render | One derivation during render (or one memoized value) |
| `useState` + `useEffect` to mirror props/other state | Stale frame + cascade re-renders | Derive during render; `key` to reset |
| Broad Zustand selector (`useStore(s => s)`) | Whole-store subscribers re-render | Atomic selectors per field; actions namespace |
| New object/array/function inline in JSX props every render | Child churn (Compiler helps but not magic) | Stable references only when profiling shows need |
| Map child remount on unrelated parent state | Layer teardown/rebuild is expensive | `layer-visibility-vs-unmount` (`react-map-gl` skill) |
| List `.map` with heavy per-row work | O(n) every parent render | Precompute once; virtualize long lists |
| Effect chains (`A` effect sets `B`, `B` effect sets `C`) | Multiple commits per user action | One event handler or one derived value |
| Subscribing whole tree to URL/query changes | Global re-renders | Narrow route/search subscriptions |
| Fetch in `useEffect` without cleanup | Races + duplicate requests | Loaders/React Query; abort/ignore stale |

## Review procedure

1. Read the PR diff; list **hot paths** (map, lists, filters, stores, route loaders).
2. For each hot path, ask: **where is this computed once?** If answer is “in two places” or “on every render,” flag it.
3. Cross-check against `react-dev` anti-patterns ([anti-patterns.md](../../react-dev/references/anti-patterns.md)).
4. For map UI, load `react-map-gl` skill when layers/sources/handlers change.
5. For client global state, load `zustand-state-management` skill.

## Fix patterns (FMC)

- **Derived data:** compute during render; rely on React Compiler before adding `useMemo`.
- **Expensive pure work:** one `useMemo` at the boundary that owns the data — not scattered copies.
- **User-driven updates:** event handlers, not effects watching flags.
- **Store reads:** smallest selector that satisfies the component.
- **Reset on id change:** `key={id}` on the subtree that owns local state.

## Report format

```markdown
### Performance
- 🔴 [file:line] — issue — suggested fix
- 🟡 [file:line] — suggestion
```

Fix 🔴 items before merge unless the user defers. Re-run `bun run check` after fixes (`finish-work`).
