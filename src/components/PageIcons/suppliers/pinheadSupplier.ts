import type { IconRegistryEntry } from '@/utils/types'

const PINHEAD_CDN = 'https://pinhead.ink/latest'

export function pinheadIdFromIconName(iconName: string): string | null {
  if (!iconName.startsWith('pinhead-')) return null
  const id = iconName.slice('pinhead-'.length).trim()
  return id || null
}

/** Fetch one Pinhead SVG from pinhead.ink (v7 icon set). */
export async function fetchPinheadIcon(iconName: string): Promise<IconRegistryEntry | null> {
  const id = pinheadIdFromIconName(iconName)
  if (!id) return null

  const response = await fetch(`${PINHEAD_CDN}/${encodeURIComponent(id)}.svg`)
  if (!response.ok) return null

  const svgRaw = await response.text()
  if (!svgRaw.trim().startsWith('<')) return null

  return { name: iconName, prefix: 'pinhead', svgRaw }
}
