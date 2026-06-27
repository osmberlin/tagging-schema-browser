import type { DenormalizedPreset, IconViewModel } from "@/utils/types";
import { useEffect, useMemo, useState } from "react";
import { areAllIconSuppliersLoaded, ensureAllIconSuppliers, getIconRegistry } from "./iconRegistry";

export function useIconSearch(presets: DenormalizedPreset[]) {
  const [suppliersReady, setSuppliersReady] = useState(areAllIconSuppliersLoaded());

  useEffect(() => {
    if (suppliersReady) return;
    let cancelled = false;
    void ensureAllIconSuppliers().then(() => {
      if (!cancelled) setSuppliersReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [suppliersReady]);

  return useMemo(() => {
    const registry = getIconRegistry();
    // Recompute when icon suppliers finish loading into the shared registry map.
    void suppliersReady;
    const usage = new Map<string, DenormalizedPreset[]>();

    for (const preset of presets) {
      if (!preset.icon) continue;
      const list = usage.get(preset.icon) ?? [];
      list.push(preset);
      usage.set(preset.icon, list);
    }

    // Include icons used by presets even if not found in local package assets.
    for (const iconName of usage.keys()) {
      if (!registry.has(iconName)) {
        const prefix = iconName.split("-")[0] ?? "unknown";
        registry.set(iconName, { name: iconName, prefix });
      }
    }

    const icons: IconViewModel[] = Array.from(registry.values()).map((entry) => ({
      ...entry,
      usageCount: usage.get(entry.name)?.length ?? 0,
      presets: usage.get(entry.name) ?? [],
    }));

    const prefixes = Array.from(new Set(icons.map((i) => i.prefix))).sort((a, b) =>
      a.localeCompare(b),
    );

    return { icons, prefixes };
  }, [presets, suppliersReady]);
}
