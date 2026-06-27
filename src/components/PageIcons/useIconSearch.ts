import { collectOptionIconUsages } from "@/utils/fieldOptions";
import type { DenormalizedPreset, IconViewModel, RawFields } from "@/utils/types";
import { useEffect, useMemo, useState } from "react";
import { areAllIconSuppliersLoaded, ensureAllIconSuppliers, getIconRegistry } from "./iconRegistry";

export function useIconSearch(presets: DenormalizedPreset[], fields: RawFields) {
  const [suppliersReady, setSuppliersReady] = useState(areAllIconSuppliersLoaded());

  useEffect(() => {
    if (suppliersReady) return;
    let cancelled = false;
    void ensureAllIconSuppliers().finally(() => {
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
    const presetUsage = new Map<string, DenormalizedPreset[]>();
    const optionUsage = collectOptionIconUsages(fields, presets);

    for (const preset of presets) {
      if (!preset.icon) continue;
      const list = presetUsage.get(preset.icon) ?? [];
      list.push(preset);
      presetUsage.set(preset.icon, list);
    }

    const referenced = new Set([...presetUsage.keys(), ...optionUsage.keys()]);
    for (const iconName of referenced) {
      if (!registry.has(iconName)) {
        const prefix = iconName.split("-")[0] ?? "unknown";
        registry.set(iconName, { name: iconName, prefix });
      }
    }

    const icons: IconViewModel[] = Array.from(registry.values()).map((entry) => {
      const presetsForIcon = presetUsage.get(entry.name) ?? [];
      const optionsForIcon = optionUsage.get(entry.name) ?? [];
      const presetUsageCount = presetsForIcon.length;
      const optionUsageCount = optionsForIcon.length;
      return {
        ...entry,
        presetUsageCount,
        optionUsageCount,
        usageCount: presetUsageCount + optionUsageCount,
        presets: presetsForIcon,
        optionUsages: optionsForIcon,
      };
    });

    const prefixes = Array.from(new Set(icons.map((i) => i.prefix))).sort((a, b) =>
      a.localeCompare(b),
    );

    return { icons, prefixes };
  }, [presets, fields, suppliersReady]);
}
