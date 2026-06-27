import type { DenormalizedPreset, IconViewModel } from "@/utils/types";
import { useEffect, useMemo, useState } from "react";
import { ensureFontAwesomeRegistry, getIconRegistry } from "./iconRegistry";

export function useIconSearch(presets: DenormalizedPreset[]) {
  const [fontAwesomeReady, setFontAwesomeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensureFontAwesomeRegistry().then(() => {
      if (!cancelled) setFontAwesomeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const registry = getIconRegistry();
    // Recompute when Font Awesome finishes loading into the shared registry map.
    void fontAwesomeReady;
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
  }, [presets, fontAwesomeReady]);
}
