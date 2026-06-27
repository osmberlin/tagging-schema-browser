import type { IconRegistryEntry, RawPresets } from "@/utils/types";

/** Icons used in docs/examples that no longer exist in current Maki; map to iD/schema equivalents. */
export const PRESET_ICON_ALIASES: Record<string, string> = {
  "maki-bench": "temaki-bench",
};

export type IconSupplier = "maki" | "temaki" | "roentgen" | "iD" | "fas" | "far" | "fab";

const ALL_ICON_SUPPLIERS: IconSupplier[] = [
  "maki",
  "temaki",
  "roentgen",
  "iD",
  "fas",
  "far",
  "fab",
];

type SupplierLoader = () => Promise<IconRegistryEntry[]>;

const supplierLoaders: Record<IconSupplier, SupplierLoader> = {
  maki: () => import("./suppliers/makiSupplier").then((m) => m.loadMakiEntries()),
  temaki: () => import("./suppliers/temakiSupplier").then((m) => m.loadTemakiEntries()),
  roentgen: () => import("./suppliers/roentgenSupplier").then((m) => m.loadRoentgenEntries()),
  iD: () => import("./suppliers/idSupplier").then((m) => m.loadIdPresetEntries()),
  fas: () => import("./suppliers/fasSupplier").then((m) => m.loadFasEntries()),
  far: () => import("./suppliers/farSupplier").then((m) => m.loadFarEntries()),
  fab: () => import("./suppliers/fabSupplier").then((m) => m.loadFabEntries()),
};

const registryCache = new Map<string, IconRegistryEntry>();
const dataUrlCache = new Map<string, string | null>();
const loadedSuppliers = new Set<IconSupplier>();
const failedSuppliers = new Set<IconSupplier>();
const supplierLoadPromises = new Map<IconSupplier, Promise<void>>();

export function resolvePresetIconName(iconName: string): string {
  return PRESET_ICON_ALIASES[iconName] ?? iconName;
}

export function iconSupplierFromName(iconName: string): IconSupplier | null {
  const prefix = iconName.split("-")[0];
  if (prefix && ALL_ICON_SUPPLIERS.includes(prefix as IconSupplier)) {
    return prefix as IconSupplier;
  }
  return null;
}

function suppliersFromIconNames(names: Iterable<string>): Set<IconSupplier> {
  const suppliers = new Set<IconSupplier>();
  for (const name of names) {
    const supplier = iconSupplierFromName(resolvePresetIconName(name));
    if (supplier) suppliers.add(supplier);
  }
  return suppliers;
}

export function collectPresetIconNames(presets: RawPresets): string[] {
  const names = new Set<string>();
  for (const raw of Object.values(presets)) {
    if (typeof raw.icon === "string" && raw.icon.trim()) {
      names.add(resolvePresetIconName(raw.icon.trim()));
    }
  }
  return Array.from(names);
}

function mergeRegistryEntries(entries: IconRegistryEntry[]): void {
  for (const entry of entries) registryCache.set(entry.name, entry);
}

function clearMissCacheForSupplier(supplier: IconSupplier): void {
  const prefix = `${supplier}-`;
  for (const [name, value] of dataUrlCache) {
    if (value === null && name.startsWith(prefix)) {
      dataUrlCache.delete(name);
    }
  }
}

function isSupplierLoadedForIcon(iconName: string): boolean {
  const supplier = iconSupplierFromName(iconName);
  return supplier ? loadedSuppliers.has(supplier) || failedSuppliers.has(supplier) : true;
}

/** Loads one icon supplier package on demand (separate JS chunk, cached after first load). */
export function ensureIconSupplier(supplier: IconSupplier): Promise<void> {
  if (loadedSuppliers.has(supplier) || failedSuppliers.has(supplier)) {
    return Promise.resolve();
  }

  let promise = supplierLoadPromises.get(supplier);
  if (!promise) {
    promise = supplierLoaders[supplier]()
      .then((entries) => {
        mergeRegistryEntries(entries);
        loadedSuppliers.add(supplier);
        clearMissCacheForSupplier(supplier);
      })
      .catch(() => {
        failedSuppliers.add(supplier);
      })
      .finally(() => {
        supplierLoadPromises.delete(supplier);
      });
    supplierLoadPromises.set(supplier, promise);
  }
  return promise;
}

/** Loads only the suppliers needed for the given icon names. Partial success is OK. */
export function ensureIconsForNames(names: Iterable<string>): Promise<void> {
  const suppliers = suppliersFromIconNames(names);
  if (suppliers.size === 0) return Promise.resolve();
  return Promise.allSettled([...suppliers].map(ensureIconSupplier)).then(() => {});
}

/** Loads suppliers referenced by preset icons (minimal footprint for Presets pages). */
export function ensureIconsForPresetUsage(presets: RawPresets): Promise<void> {
  return ensureIconsForNames(collectPresetIconNames(presets));
}

/** Loads every icon supplier (Icons browse page). Partial success is OK. */
export function ensureAllIconSuppliers(): Promise<void> {
  return Promise.allSettled(ALL_ICON_SUPPLIERS.map(ensureIconSupplier)).then(() => {});
}

export function isIconSupplierLoaded(supplier: IconSupplier): boolean {
  return loadedSuppliers.has(supplier);
}

export function areAllIconSuppliersLoaded(): boolean {
  return ALL_ICON_SUPPLIERS.every(
    (supplier) => loadedSuppliers.has(supplier) || failedSuppliers.has(supplier),
  );
}

/** @deprecated Use ensureIconSupplier("fas") or ensureIconsForNames instead. */
export function ensureFontAwesomeRegistry(): Promise<void> {
  return Promise.all([
    ensureIconSupplier("fas"),
    ensureIconSupplier("far"),
    ensureIconSupplier("fab"),
  ]).then(() => {});
}

/** @deprecated Use isIconSupplierLoaded("fas") instead. */
export function isFontAwesomeRegistryLoaded(): boolean {
  return loadedSuppliers.has("fas") && loadedSuppliers.has("far") && loadedSuppliers.has("fab");
}

export function getIconRegistry(): Map<string, IconRegistryEntry> {
  return registryCache;
}

/** True when an icon name is not in the bundled icon library. */
export function isPresetIconBroken(iconName?: string): boolean {
  if (!iconName) return false;
  return getIconSvgDataUrl(iconName) === null;
}

/**
 * True only after the icon's supplier has loaded and the name has no SVG asset.
 * Avoids false positives while supplier chunks are still loading (option icons on Presets).
 */
export function isIconSvgConfirmedMissing(iconName?: string): boolean {
  if (!iconName) return false;
  const canonical = resolvePresetIconName(iconName);
  const supplier = iconSupplierFromName(canonical);
  if (!supplier || !loadedSuppliers.has(supplier)) return false;
  const entry = registryCache.get(canonical);
  return !entry?.svgRaw;
}

export function getIconSvgDataUrl(iconName?: string): string | null {
  if (!iconName) return null;
  const canonical = resolvePresetIconName(iconName);
  const cached = dataUrlCache.get(canonical);
  if (cached !== undefined) return cached;

  const entry = registryCache.get(canonical);
  if (!entry?.svgRaw) {
    // Avoid caching a miss while the supplier chunk is still loading.
    if (!isSupplierLoadedForIcon(canonical)) return null;
    dataUrlCache.set(canonical, null);
    return null;
  }

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(entry.svgRaw)}`;
  dataUrlCache.set(canonical, dataUrl);
  return dataUrl;
}
