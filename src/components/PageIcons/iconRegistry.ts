import type { IconRegistryEntry } from "@/utils/types";
import { type IconDefinition, icon } from "@fortawesome/fontawesome-svg-core";
import * as faBrands from "@fortawesome/free-brands-svg-icons";
import * as faRegular from "@fortawesome/free-regular-svg-icons";
import * as faSolid from "@fortawesome/free-solid-svg-icons";

type RawGlobMap = Record<string, string>;

/** Icons used in docs/examples that no longer exist in current Maki; map to iD/schema equivalents. */
export const PRESET_ICON_ALIASES: Record<string, string> = {
  "maki-bench": "temaki-bench",
};

export function resolvePresetIconName(iconName: string): string {
  return PRESET_ICON_ALIASES[iconName] ?? iconName;
}

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

const idPresetSvgs = import.meta.glob("../../icons/id-sprite-presets/*.svg", {
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
      let rendered = icon(maybe as IconDefinition).html?.[0];
      if (!rendered) continue;
      // FontAwesome renders inline SVG without the xmlns namespace, which makes
      // the resulting `data:image/svg+xml` URL an invalid standalone document
      // (the <img> renders broken). Inject the namespace so it loads.
      if (!rendered.includes("xmlns")) {
        rendered = rendered.replace(/^<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
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
    ...buildSetEntries("iD", idPresetSvgs),
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
  const canonical = resolvePresetIconName(iconName);
  if (!dataUrlCache) dataUrlCache = new Map();
  const cached = dataUrlCache.get(canonical);
  if (cached !== undefined) return cached;

  const entry = getIconRegistry().get(canonical);
  if (!entry?.svgRaw) {
    dataUrlCache.set(canonical, null);
    return null;
  }

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(entry.svgRaw)}`;
  dataUrlCache.set(canonical, dataUrl);
  return dataUrl;
}
