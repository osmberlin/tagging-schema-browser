/**
 * Stable key order for preset JSON in the source tree.
 *
 * Based on schema-builder docs and `schemas/preset.json`, with `name` and `icon`
 * prioritized for discoverability in the browser UI.
 *
 * @see https://github.com/ideditor/schema-builder/blob/main/schemas/preset.json
 */
export const PRESET_KEY_ORDER = [
  'name',
  'aliases',
  'terms',
  'icon',
  'imageURL',
  'tags',
  'addTags',
  'removeTags',
  'geometry',
  'fields',
  'moreFields',
  'searchable',
  'suggestion',
  'matchScore',
  'reference',
  'replacement',
  'locationSet',
  'locationSetCrossReference',
  'relation',
  'relationCrossReference',
] as const

const TAG_OBJECT_KEYS = new Set(['tags', 'addTags', 'removeTags'])

const NESTED_KEY_ORDER: Record<string, readonly string[]> = {
  reference: ['key', 'value'],
  locationSet: ['include', 'exclude'],
}

export type KeySortMode = 'preset' | 'alpha'

function sortByOrder(entries: [string, unknown][], order: readonly string[]): [string, unknown][] {
  const rank = new Map(order.map((key, index) => [key, index]))
  return [...entries].sort(([a], [b]) => {
    const rankA = rank.get(a)
    const rankB = rank.get(b)
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB
    if (rankA !== undefined) return -1
    if (rankB !== undefined) return 1
    return a.localeCompare(b)
  })
}

export function sortObjectEntries(
  entries: [string, unknown][],
  opts: { parentKey?: string; sortMode?: KeySortMode },
): [string, unknown][] {
  const { parentKey, sortMode = 'alpha' } = opts

  if (parentKey && TAG_OBJECT_KEYS.has(parentKey)) {
    return [...entries].sort(([a], [b]) => a.localeCompare(b))
  }

  const nestedOrder = parentKey ? NESTED_KEY_ORDER[parentKey] : undefined
  if (nestedOrder) {
    return sortByOrder(entries, nestedOrder)
  }

  // Preset key order applies only to the preset root (and expanded preset refs),
  // not to arbitrary nested objects that happen to share property names.
  if (sortMode === 'preset' && parentKey === undefined) {
    return sortByOrder(entries, PRESET_KEY_ORDER)
  }

  return [...entries].sort(([a], [b]) => a.localeCompare(b))
}
