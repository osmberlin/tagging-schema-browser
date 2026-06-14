import type { IconViewModel } from "@/utils/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { z } from "zod";

/** Search params for the icons page (route "/icons"), validated with Zod 4. */
export const iconFacetSchema = z.object({
  i_q: z.string().catch(""),
  i_supplier: z.string().catch("all"),
  i_usage: z.enum(["all", "used", "unused"]).catch("all"),
  i_hasSvg: z.enum(["all", "with", "missing"]).catch("all"),
  i_sort: z.enum(["name", "usage_desc", "usage_asc"]).catch("name"),
});

export type IconFacetState = z.infer<typeof iconFacetSchema>;

/** Fully-defaulted icon search — used to strip default params from the URL. */
export const iconFacetDefaults: IconFacetState = iconFacetSchema.parse({});

export function useIconFacetState() {
  // Non-strict (the bar/sidebar render in the root layout, so a strict route
  // match isn't guaranteed mid-navigation), and parsed through the schema so
  // default-stripped params come back with their defaults.
  const state = useSearch({ strict: false, select: (raw) => iconFacetSchema.parse(raw) });
  const navigate = useNavigate();
  const setState = useCallback(
    (patch: Partial<IconFacetState>) => {
      void navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }), replace: true });
    },
    [navigate],
  );
  return [state, setState] as const;
}

export function applyIconFacets(icons: IconViewModel[], state: IconFacetState): IconViewModel[] {
  let filtered = icons;

  if (state.i_usage === "used") filtered = filtered.filter((icon) => icon.usageCount > 0);
  if (state.i_usage === "unused") filtered = filtered.filter((icon) => icon.usageCount === 0);

  if (state.i_hasSvg === "with") filtered = filtered.filter((icon) => Boolean(icon.svgRaw));
  if (state.i_hasSvg === "missing") filtered = filtered.filter((icon) => !icon.svgRaw);

  if (state.i_supplier !== "all") {
    filtered = filtered.filter((icon) => icon.prefix === state.i_supplier);
  }

  const query = state.i_q.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((icon) => icon.name.toLowerCase().includes(query));
  }

  const sorted = [...filtered];
  if (state.i_sort === "usage_desc") sorted.sort((a, b) => b.usageCount - a.usageCount);
  else if (state.i_sort === "usage_asc") sorted.sort((a, b) => a.usageCount - b.usageCount);
  else sorted.sort((a, b) => a.name.localeCompare(b.name));

  return sorted;
}

export function useIconFacetMeta(icons: IconViewModel[]) {
  return useMemo(() => {
    const supplierCounts = new Map<string, number>();
    let withSvg = 0;
    let missingSvg = 0;
    let usedCount = 0;
    let unusedCount = 0;

    for (const icon of icons) {
      supplierCounts.set(icon.prefix, (supplierCounts.get(icon.prefix) ?? 0) + 1);
      if (icon.svgRaw) withSvg += 1;
      else missingSvg += 1;
      if (icon.usageCount > 0) usedCount += 1;
      else unusedCount += 1;
    }

    return {
      supplierCounts,
      withSvg,
      missingSvg,
      usedCount,
      unusedCount,
    };
  }, [icons]);
}
