import pinheadIndex from '@waysidemapping/pinhead/dist/icons/index.json'
import type { IconRegistryEntry } from '@/utils/types'

export function pinheadIdFromIconName(iconName: string): string | null {
  if (!iconName.startsWith('pinhead-')) return null
  const id = iconName.slice('pinhead-'.length).trim()
  return id || null
}

/** Name stubs for every bundled Pinhead icon (SVGs load per icon on request). */
export async function loadPinheadEntries(): Promise<IconRegistryEntry[]> {
  return Object.keys(pinheadIndex.icons).map((id) => ({
    name: `pinhead-${id}`,
    prefix: 'pinhead',
  }))
}
