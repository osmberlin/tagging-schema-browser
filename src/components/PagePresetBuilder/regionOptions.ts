import { borders } from '@rapideditor/country-coder'

export type RegionOption = {
  id: string
  nameEn: string
  emojiFlag?: string
  iso1A2?: string
}

type RegionProperties = {
  id?: string
  nameEn?: string
  emojiFlag?: string
  iso1A2?: string
}

type RegionFeature = {
  properties?: RegionProperties | null
}

let cachedRegions: RegionOption[] | undefined

function buildRegionOptions(): RegionOption[] {
  return borders.features
    .map((feature: RegionFeature) => {
      const props = feature.properties
      if (!props?.id || !props.nameEn) return null
      return {
        id: props.id,
        nameEn: props.nameEn,
        emojiFlag: props.emojiFlag,
        iso1A2: props.iso1A2,
      }
    })
    .filter((option: RegionOption | null): option is RegionOption => option !== null)
    .sort((a: RegionOption, b: RegionOption) => a.nameEn.localeCompare(b.nameEn))
}

/** Country-coder regions for locationSet include/exclude pickers. */
export function listRegionOptions(): RegionOption[] {
  if (!cachedRegions) {
    cachedRegions = buildRegionOptions()
  }
  return cachedRegions
}

export function regionLabel(id: string): string {
  const match = listRegionOptions().find((option) => option.id === id)
  return match ? match.nameEn : id
}

export function filterRegionOptions(query: string, limit = 40): RegionOption[] {
  const q = query.trim().toLowerCase()
  const all = listRegionOptions()
  if (!q) return all.slice(0, limit)
  return all
    .filter((option) => {
      const haystack = [option.nameEn, option.id, option.iso1A2 ?? ''].join(' ').toLowerCase()
      return haystack.includes(q)
    })
    .slice(0, limit)
}
