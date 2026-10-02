export type LocationSet = {
  include?: string[]
  exclude?: string[]
}

function normalizeRegion(region: string): string {
  return region.trim().toLowerCase()
}

function normalizeRegions(regions: string[] | undefined): string[] {
  return (regions ?? []).map(normalizeRegion)
}

/** Whether a region code is valid for a location set (simplified iD / location-conflation rules). */
export function regionInLocationSet(region: string, locationSet: LocationSet | undefined): boolean {
  if (!locationSet) return true

  const norm = normalizeRegion(region)
  const include = normalizeRegions(locationSet.include)
  const exclude = normalizeRegions(locationSet.exclude)

  if (exclude.includes(norm)) return false

  if (include.length === 0 || include.includes('planet')) return true
  return include.includes(norm)
}

/** Human-readable summary of where a location set applies. */
export function describeLocationSet(locationSet: LocationSet | undefined): string {
  if (!locationSet) return 'Worldwide'

  const include = locationSet.include ?? []
  const exclude = locationSet.exclude ?? []

  if (include.length === 0 && exclude.length === 0) return 'Worldwide'

  const incLower = include.map(normalizeRegion)
  const excUpper = exclude.map((r) => r.toUpperCase())

  if (incLower.includes('planet')) {
    if (exclude.length === 0) return 'Worldwide'
    return `Everywhere except ${excUpper.join(', ')}`
  }

  if (include.length === 0) {
    if (exclude.length === 0) return 'Worldwide'
    return `Everywhere except ${excUpper.join(', ')}`
  }

  const incUpper = include.map((r) => r.toUpperCase())
  if (exclude.length === 0) return `${incUpper.join(', ')} only`
  return `${incUpper.join(', ')} except ${excUpper.join(', ')}`
}

/** Collect region codes referenced by location sets (for per-region winner breakdown). */
export function collectRegionsFromLocationSets(
  locationSets: (LocationSet | undefined)[],
): string[] {
  const regions = new Set<string>()
  for (const ls of locationSets) {
    if (!ls) continue
    for (const r of ls.include ?? []) {
      if (normalizeRegion(r) !== 'planet') regions.add(normalizeRegion(r))
    }
    for (const r of ls.exclude ?? []) {
      regions.add(normalizeRegion(r))
    }
  }
  return [...regions].sort((a, b) => a.localeCompare(b))
}
