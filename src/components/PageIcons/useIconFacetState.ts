import type { IconViewModel } from "@/utils/types";
import { useQueryStates } from "nuqs";
import { parseAsString, parseAsStringLiteral } from "nuqs/server";
import { useMemo } from "react";

export const iconFacetParsers = {
  i_q: parseAsString.withDefault(""),
  i_supplier: parseAsString.withDefault("all"),
  i_usage: parseAsStringLiteral(["all", "used", "unused"]).withDefault("all"),
  i_hasSvg: parseAsStringLiteral(["all", "with", "missing"]).withDefault("all"),
  i_sort: parseAsStringLiteral(["name", "usage_desc", "usage_asc"]).withDefault("name"),
};

export type IconFacetState = {
  i_q: string;
  i_supplier: string;
  i_usage: "all" | "used" | "unused";
  i_hasSvg: "all" | "with" | "missing";
  i_sort: "name" | "usage_desc" | "usage_asc";
};

export function useIconFacetState() {
  return useQueryStates(iconFacetParsers, { shallow: true });
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
