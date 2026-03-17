import type { IconRegistryEntry } from "@/utils/types";
import { type IconDefinition, icon } from "@fortawesome/fontawesome-svg-core";
import * as faBrands from "@fortawesome/free-brands-svg-icons";
import * as faRegular from "@fortawesome/free-regular-svg-icons";
import * as faSolid from "@fortawesome/free-solid-svg-icons";

type RawGlobMap = Record<string, string>;

function normalizeIconBase(name: string): string {
  // Maki ships some icons with size suffixes, keep canonical names.
  return name.replace(/-(11|15)$/, "");
}

function buildSetEntries(prefix: string, paths: RawGlobMap): IconRegistryEntry[] {
  const byName = new Map<string, IconRegistryEntry>();
  for (const [filepath, raw] of Object.entries(paths)) {
    const file = filepath.split("/").pop() ?? "";
    const base = normalizeIconBase(file.replace(/\.svg$/, ""));
    const name = `${prefix}-${base}`;
    if (!byName.has(name)) {
      byName.set(name, { name, prefix, svgRaw: raw });
    }
  }
  return Array.from(byName.values());
}

const makiSvgs = import.meta.glob("/node_modules/@mapbox/maki/icons/*.svg", {
  eager: true,
  import: "default",
  query: "?raw",
}) as RawGlobMap;

const temakiSvgs = import.meta.glob("/node_modules/@rapideditor/temaki/icons/*.svg", {
  eager: true,
  import: "default",
  query: "?raw",
}) as RawGlobMap;

const roentgenSvgs = import.meta.glob("/node_modules/@enzet/roentgen/icons/*.svg", {
  eager: true,
  import: "default",
  query: "?raw",
}) as RawGlobMap;

function buildFontAwesomeEntries(
  prefix: "fas" | "far" | "fab",
  source: Record<string, unknown>,
): IconRegistryEntry[] {
  const entries: IconRegistryEntry[] = [];
  for (const value of Object.values(source)) {
    if (!value || typeof value !== "object") continue;
    const maybe = value as Partial<IconDefinition>;
    if (!maybe.iconName || !maybe.prefix || !maybe.icon) continue;
    if (
      (prefix === "fas" && maybe.prefix !== "fas") ||
      (prefix === "far" && maybe.prefix !== "far") ||
      (prefix === "fab" && maybe.prefix !== "fab")
    ) {
      continue;
    }
    try {
      const rendered = icon(maybe as IconDefinition).html?.[0];
      if (!rendered) continue;
      entries.push({
        name: `${prefix}-${maybe.iconName}`,
        prefix,
        svgRaw: rendered,
      });
    } catch {
      // Skip invalid exported values.
    }
  }
  return entries;
}

let registryCache: Map<string, IconRegistryEntry> | null = null;
let dataUrlCache: Map<string, string | null> | null = null;

export function getIconRegistry(): Map<string, IconRegistryEntry> {
  if (registryCache) return registryCache;
  const entries = [
    ...buildSetEntries("maki", makiSvgs),
    ...buildSetEntries("temaki", temakiSvgs),
    ...buildSetEntries("roentgen", roentgenSvgs),
    ...buildFontAwesomeEntries("fas", faSolid),
    ...buildFontAwesomeEntries("far", faRegular),
    ...buildFontAwesomeEntries("fab", faBrands),
  ];
  const map = new Map<string, IconRegistryEntry>();
  for (const entry of entries) map.set(entry.name, entry);
  registryCache = map;
  return map;
}

export function getIconSvgDataUrl(iconName?: string): string | null {
  if (!iconName) return null;
  if (!dataUrlCache) dataUrlCache = new Map();
  const cached = dataUrlCache.get(iconName);
  if (cached !== undefined) return cached;

  const entry = getIconRegistry().get(iconName);
  if (!entry?.svgRaw) {
    dataUrlCache.set(iconName, null);
    return null;
  }

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(entry.svgRaw)}`;
  dataUrlCache.set(iconName, dataUrl);
  return dataUrl;
}
