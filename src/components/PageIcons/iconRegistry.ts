import { useSyncExternalStore } from 'react'
import { collectOptionIconUsages } from '@/utils/fieldOptions'
import type {
  DenormalizedPreset,
  FieldTranslations,
  IconRegistryEntry,
  RawFields,
  RawPresets,
} from '@/utils/types'

export type IconSupplier = 'maki' | 'temaki' | 'roentgen' | 'iD' | 'pinhead' | 'fas' | 'far' | 'fab'

/** All icon sets the browser knows about (shown in the Icons sidebar even when unused). */
export const ICON_SUPPLIERS: readonly IconSupplier[] = [
  'maki',
  'temaki',
  'roentgen',
  'iD',
  'pinhead',
  'fas',
  'far',
  'fab',
] as const

const ALL_ICON_SUPPLIERS: IconSupplier[] = [...ICON_SUPPLIERS]

type SupplierLoader = () => Promise<IconRegistryEntry[]>

const supplierLoaders: Record<IconSupplier, SupplierLoader> = {
  maki: () => import('./suppliers/makiSupplier').then((m) => m.loadMakiEntries()),
  temaki: () => import('./suppliers/temakiSupplier').then((m) => m.loadTemakiEntries()),
  roentgen: () => import('./suppliers/roentgenSupplier').then((m) => m.loadRoentgenEntries()),
  iD: () => import('./suppliers/idSupplier').then((m) => m.loadIdPresetEntries()),
  pinhead: () => import('./suppliers/pinheadCatalogSupplier').then((m) => m.loadPinheadEntries()),
  fas: () => import('./suppliers/fasSupplier').then((m) => m.loadFasEntries()),
  far: () => import('./suppliers/farSupplier').then((m) => m.loadFarEntries()),
  fab: () => import('./suppliers/fabSupplier').then((m) => m.loadFabEntries()),
}

const registryCache = new Map<string, IconRegistryEntry>()
const dataUrlCache = new Map<string, string | null>()
const loadedSuppliers = new Set<IconSupplier>()
const failedSuppliers = new Set<IconSupplier>()
const pendingPinheadIcons = new Set<string>()
const resolvedPinheadIcons = new Set<string>()
const pinheadLoadPromises = new Map<string, Promise<void>>()
const supplierLoadPromises = new Map<IconSupplier, Promise<void>>()
const registryListeners = new Set<() => void>()
let registryEpoch = 0

function notifyRegistryChange(): void {
  registryEpoch += 1
  for (const listener of registryListeners) listener()
}

export function subscribeIconRegistry(listener: () => void): () => void {
  registryListeners.add(listener)
  return () => registryListeners.delete(listener)
}

export function getIconRegistryEpoch(): number {
  return registryEpoch
}

/** Re-render when icon supplier chunks finish loading and SVG URLs become available. */
export function useIconRegistryEpoch(): number {
  return useSyncExternalStore(subscribeIconRegistry, getIconRegistryEpoch, getIconRegistryEpoch)
}

/** SVG data URL for a preset/option icon; re-resolves when async suppliers finish loading. */
export function useIconSvgDataUrl(iconName?: string): string | null {
  return useSyncExternalStore(
    subscribeIconRegistry,
    () => getIconSvgDataUrl(iconName),
    () => getIconSvgDataUrl(iconName),
  )
}

export function iconSupplierFromName(iconName: string): IconSupplier | null {
  const prefix = iconName.split('-')[0]
  if (prefix && ALL_ICON_SUPPLIERS.includes(prefix as IconSupplier)) {
    return prefix as IconSupplier
  }
  return null
}

function suppliersFromIconNames(names: Iterable<string>): Set<IconSupplier> {
  const suppliers = new Set<IconSupplier>()
  for (const name of names) {
    const supplier = iconSupplierFromName(name)
    if (supplier) suppliers.add(supplier)
  }
  return suppliers
}

export function collectPresetIconNames(presets: RawPresets): string[] {
  const names = new Set<string>()
  for (const raw of Object.values(presets)) {
    if (typeof raw.icon === 'string' && raw.icon.trim()) {
      names.add(raw.icon.trim())
    }
  }
  return Array.from(names)
}

/** Preset icons plus field-option icons referenced in the schema. */
export function collectSchemaIconNames(
  presets: RawPresets,
  fields: RawFields,
  denormalizedPresets: DenormalizedPreset[],
  fieldTranslations: FieldTranslations = {},
): string[] {
  const names = new Set(collectPresetIconNames(presets))
  for (const iconName of collectOptionIconUsages(
    fields,
    denormalizedPresets,
    fieldTranslations,
  ).keys()) {
    names.add(iconName)
  }
  return [...names]
}

function mergeRegistryEntries(entries: IconRegistryEntry[]): void {
  for (const entry of entries) registryCache.set(entry.name, entry)
  notifyRegistryChange()
}

function clearMissCacheForSupplier(supplier: IconSupplier): void {
  const prefix = `${supplier}-`
  for (const [name, value] of dataUrlCache) {
    if (value === null && name.startsWith(prefix)) {
      dataUrlCache.delete(name)
    }
  }
}

function isSupplierLoadedForIcon(iconName: string): boolean {
  const supplier = iconSupplierFromName(iconName)
  return supplier ? loadedSuppliers.has(supplier) || failedSuppliers.has(supplier) : true
}

/** Loads one icon supplier package on demand (separate JS chunk, cached after first load). */
export function ensureIconSupplier(supplier: IconSupplier): Promise<void> {
  if (loadedSuppliers.has(supplier) || failedSuppliers.has(supplier)) {
    return Promise.resolve()
  }

  let promise = supplierLoadPromises.get(supplier)
  if (!promise) {
    promise = supplierLoaders[supplier]()
      .then((entries) => {
        mergeRegistryEntries(entries)
        loadedSuppliers.add(supplier)
        clearMissCacheForSupplier(supplier)
        notifyRegistryChange()
      })
      .catch(() => {
        failedSuppliers.add(supplier)
        notifyRegistryChange()
      })
      .finally(() => {
        supplierLoadPromises.delete(supplier)
      })
    supplierLoadPromises.set(supplier, promise)
  }
  return promise
}

function pinheadIconNames(names: Iterable<string>): string[] {
  return [...names].filter((name) => name.startsWith('pinhead-'))
}

async function loadPinheadIconSvg(iconName: string): Promise<void> {
  if (registryCache.get(iconName)?.svgRaw) return

  let promise = pinheadLoadPromises.get(iconName)
  if (!promise) {
    pendingPinheadIcons.add(iconName)
    notifyRegistryChange()
    promise = (async () => {
      try {
        const { loadPinheadSvg } = await import('./suppliers/pinheadSvgLoader')
        const entry = await loadPinheadSvg(iconName)
        if (!entry) {
          dataUrlCache.set(iconName, null)
        } else {
          mergeRegistryEntries([entry])
          clearMissCacheForSupplier('pinhead')
        }
      } finally {
        pendingPinheadIcons.delete(iconName)
        resolvedPinheadIcons.add(iconName)
        pinheadLoadPromises.delete(iconName)
        notifyRegistryChange()
      }
    })()
    pinheadLoadPromises.set(iconName, promise)
  }
  await promise
}

async function ensurePinheadIcons(names: Iterable<string>): Promise<void> {
  const iconNames = pinheadIconNames(names)
  if (iconNames.length === 0) return

  await ensureIconSupplier('pinhead')
  await Promise.allSettled(iconNames.map(loadPinheadIconSvg))
}

/** Request one icon SVG when the supplier uses per-icon lazy loading (Pinhead). */
export function ensureIconSvg(iconName: string): void {
  if (iconSupplierFromName(iconName) !== 'pinhead') return
  if (registryCache.get(iconName)?.svgRaw) return
  if (pendingPinheadIcons.has(iconName) || resolvedPinheadIcons.has(iconName)) return
  if (!loadedSuppliers.has('pinhead')) {
    void ensureIconSupplier('pinhead').then(() => {
      if (!registryCache.get(iconName)?.svgRaw && !resolvedPinheadIcons.has(iconName)) {
        void loadPinheadIconSvg(iconName)
      }
    })
    return
  }
  void loadPinheadIconSvg(iconName)
}

/** Loads only the suppliers needed for the given icon names. Partial success is OK. */
export function ensureIconsForNames(names: Iterable<string>): Promise<void> {
  const iconNames = [...names]
  const suppliers = suppliersFromIconNames(iconNames)
  const tasks: Promise<unknown>[] = [...suppliers].map(ensureIconSupplier)
  if (pinheadIconNames(iconNames).length > 0) {
    tasks.push(ensurePinheadIcons(iconNames))
  }
  if (tasks.length === 0) return Promise.resolve()
  return Promise.allSettled(tasks).then(() => {})
}

/** Loads suppliers referenced by preset icons (minimal footprint for Presets pages). */
export function ensureIconsForPresetUsage(presets: RawPresets): Promise<void> {
  return ensureIconsForNames(collectPresetIconNames(presets))
}

/** Loads every icon supplier (Icons browse page). Partial success is OK. */
export function ensureAllIconSuppliers(): Promise<void> {
  return Promise.allSettled(ALL_ICON_SUPPLIERS.map(ensureIconSupplier)).then(() => {})
}

export function isIconSupplierLoaded(supplier: IconSupplier): boolean {
  return loadedSuppliers.has(supplier)
}

export function areAllIconSuppliersLoaded(): boolean {
  return ALL_ICON_SUPPLIERS.every(
    (supplier) => loadedSuppliers.has(supplier) || failedSuppliers.has(supplier),
  )
}

/** True when every supplier referenced by the given icon names has finished loading. */
export function areSuppliersLoadedForNames(names: Iterable<string>): boolean {
  for (const supplier of suppliersFromIconNames(names)) {
    if (!loadedSuppliers.has(supplier) && !failedSuppliers.has(supplier)) return false
  }
  return true
}

/** True when missing-SVG checks can run without unknown pending pinhead or supplier loads. */
export function areIconsReadyForMissingSvgCheck(names: Iterable<string>): boolean {
  for (const name of names) {
    const supplier = iconSupplierFromName(name)
    if (supplier === 'pinhead') {
      if (pendingPinheadIcons.has(name)) return false
      if (!resolvedPinheadIcons.has(name) && !failedSuppliers.has('pinhead')) return false
      continue
    }
    if (supplier && !loadedSuppliers.has(supplier) && !failedSuppliers.has(supplier)) return false
  }
  return true
}

/** @deprecated Use ensureIconSupplier("fas") or ensureIconsForNames instead. */
export function ensureFontAwesomeRegistry(): Promise<void> {
  return Promise.all([
    ensureIconSupplier('fas'),
    ensureIconSupplier('far'),
    ensureIconSupplier('fab'),
  ]).then(() => {})
}

/** @deprecated Use isIconSupplierLoaded("fas") instead. */
export function isFontAwesomeRegistryLoaded(): boolean {
  return loadedSuppliers.has('fas') && loadedSuppliers.has('far') && loadedSuppliers.has('fab')
}

export function getIconRegistry(): Map<string, IconRegistryEntry> {
  return registryCache
}

/** @deprecated Use isIconSvgConfirmedMissing after icons have loaded. */
export function isPresetIconBroken(iconName?: string): boolean {
  return isIconSvgConfirmedMissing(iconName)
}

/** True only after the icon's supplier has loaded and the name has no SVG asset. */
export function isIconSvgConfirmedMissing(iconName?: string): boolean {
  if (!iconName) return false
  const supplier = iconSupplierFromName(iconName)
  if (supplier === 'pinhead') {
    if (pendingPinheadIcons.has(iconName)) return false
    if (!resolvedPinheadIcons.has(iconName)) return false
    return !registryCache.get(iconName)?.svgRaw
  }
  if (!supplier || !loadedSuppliers.has(supplier)) return false
  const entry = registryCache.get(iconName)
  return !entry?.svgRaw
}

/** Missing SVG, or supplier still loading so missing status is not yet known. */
export function isIconSvgMissingOrPending(iconName?: string): boolean {
  if (!iconName) return false
  const supplier = iconSupplierFromName(iconName)
  if (supplier === 'pinhead') {
    if (isIconSvgConfirmedMissing(iconName)) return true
    if (pendingPinheadIcons.has(iconName)) return true
    if (!resolvedPinheadIcons.has(iconName)) return !failedSuppliers.has('pinhead')
    return false
  }
  if (isIconSvgConfirmedMissing(iconName)) return true
  if (!supplier) return false
  return !loadedSuppliers.has(supplier) && !failedSuppliers.has(supplier)
}

export function getIconSvgDataUrl(iconName?: string): string | null {
  if (!iconName) return null
  const cached = dataUrlCache.get(iconName)
  if (cached !== undefined) return cached

  const supplier = iconSupplierFromName(iconName)
  const entry = registryCache.get(iconName)
  if (!entry?.svgRaw) {
    if (!isSupplierLoadedForIcon(iconName)) return null
    if (supplier === 'pinhead' && !resolvedPinheadIcons.has(iconName)) {
      ensureIconSvg(iconName)
      return null
    }
    dataUrlCache.set(iconName, null)
    return null
  }

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(entry.svgRaw)}`
  dataUrlCache.set(iconName, dataUrl)
  return dataUrl
}
