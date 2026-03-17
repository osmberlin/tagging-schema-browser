import { useSchema } from "@/contexts/SchemaContext";
import { IconCard } from "./IconCard";
import { applyIconFacets, useIconFacetState } from "./useIconFacetState";
import { useIconSearch } from "./useIconSearch";

export function PageIcons() {
  const { data, loading, dataUrl } = useSchema();
  const [facetState] = useIconFacetState();
  const { icons } = useIconSearch(data?.presets ?? []);

  if (!dataUrl && !data) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Load schema data from the Presets page first (enter a data URL and click Load).
      </p>
    );
  }

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        ))}
      </div>
    );
  }

  const filtered = applyIconFacets(icons, facetState);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Icons</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Showing {filtered.length} of {icons.length} icon(s). Reference sizes: 60px (sidebar), 12px
        (map pin).
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          No icons match the current filters.
        </p>
      )}
    </div>
  );
}
