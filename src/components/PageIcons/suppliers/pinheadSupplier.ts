import pinheadIndex from '@waysidemapping/pinhead/dist/icons/index.json'
import type { IconRegistryEntry } from '@/utils/types'

const pinheadSvgLoaders = import.meta.glob<string>(
  '/node_modules/@waysidemapping/pinhead/dist/icons/*.svg',
  { eager: false, import: 'default', query: '?raw' },
)

const loaderById = new Map<string, () => Promise<string>>()
for (const [path, loader] of Object.entries(pinheadSvgLoaders)) {
  const file = path.split('/').pop() ?? ''
  const id = file.replace(/\.svg$/, '')
  if (id) loaderById.set(id, loader)
}

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

/** Load one Pinhead SVG from the bundled package (separate Vite chunk per file). */
export async function loadPinheadSvg(iconName: string): Promise<IconRegistryEntry | null> {
  const id = pinheadIdFromIconName(iconName)
  if (!id) return null

  const loader = loaderById.get(id)
  if (!loader) return null

  const svgRaw = await loader()
  if (!svgRaw.trim().startsWith('<')) return null

  return { name: iconName, prefix: 'pinhead', svgRaw }
}
