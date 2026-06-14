import { CountPill } from "@/components/ui/CountPill";
import { useSchema } from "@/contexts/SchemaContext";
import { IconCard } from "./IconCard";
import { applyIconFacets, useIconFacetState } from "./useIconFacetState";
import { useIconSearch } from "./useIconSearch";

export function PageIcons() {
  const { data, loading, dataUrl } = useSchema();
  const [facetState, setFacetState] = useIconFacetState();
  const { icons } = useIconSearch(data?.presets ?? []);

  if (!dataUrl && !data) {
    return (
      <p className="text-sm text-slate-500">
        Load schema data from the Presets page first (enter a data URL and click Load).
      </p>
    );
  }

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    );
  }

  const filtered = applyIconFacets(icons, facetState);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-slate-900">
          Icons <CountPill className="text-sm">{filtered.length}</CountPill>
        </h1>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          Sort
          <select
            value={facetState.i_sort}
            onChange={(e) =>
              setFacetState({ i_sort: e.target.value as "name" | "usage_desc" | "usage_asc" })
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          >
            <option value="name">Name</option>
            <option value="usage_desc">Usage (high to low)</option>
            <option value="usage_asc">Usage (low to high)</option>
          </select>
        </label>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {filtered.map((icon) => (
          <li key={icon.name}>
            <IconCard
              iconName={icon.name}
              svgRaw={icon.svgRaw}
              usageCount={icon.usageCount}
              presets={icon.presets}
            />
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No icons match the current filters.
        </p>
      )}
    </div>
  );
}
