import pinheadIndex from '@waysidemapping/pinhead/dist/icons/index.json'
import type { IconRegistryEntry } from '@/utils/types'

export function pinheadIdFromIconName(iconName: string): string | null {
  if (!iconName.startsWith('pinhead-')) return null
  const id = iconName.slice('pinhead-'.length).trim()
  return id || null
}

/**
 * Pick the bundled SVG id for a schema icon id. Pinhead majors rename icons and ship
 * `dist/id_upgrades.json` (old id → new id), so schema data still on old names keeps rendering.
 */
export function resolvePinheadId(
  id: string,
  available: ReadonlySet<string>,
  upgrades: Readonly<Record<string, string>>,
): string | null {
  if (available.has(id)) return id
  const upgraded = upgrades[id]
  return upgraded && available.has(upgraded) ? upgraded : null
}

/** Name stubs for every bundled Pinhead icon (SVGs load per icon on request). */
export async function loadPinheadEntries(): Promise<IconRegistryEntry[]> {
  return Object.keys(pinheadIndex.icons).map((id) => ({
    name: `pinhead-${id}`,
    prefix: 'pinhead',
  }))
}
