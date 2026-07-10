import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { z } from 'zod'
import { isIconSvgConfirmedMissing } from '@/components/PageIcons/iconRegistry'
import type { IconViewModel } from '@/utils/types'

/** Search params for the icons page (route "/icons"), validated with Zod 4. */
export const iconFacetSchema = z.object({
  i_q: z.string().catch(''),
  i_supplier: z.string().catch('all'),
  i_usage: z.enum(['all', 'unused', 'presets', 'options', 'any']).catch('all'),
  i_hasSvg: z.enum(['all', 'with', 'missing']).catch('all'),
  i_sort: z.enum(['name', 'usage_desc', 'usage_asc']).catch('usage_desc'),
  i_view: z.enum(['cards', 'usages']).catch('cards'),
})

export type IconFacetState = z.infer<typeof iconFacetSchema>

/** Fully-defaulted icon search — used to strip default params from the URL. */
export const iconFacetDefaults: IconFacetState = iconFacetSchema.parse({})

export function useIconFacetState() {
  const state = useSearch({
    strict: false,
    structuralSharing: false,
    select: (raw) => iconFacetSchema.parse(raw),
  })
  const navigate = useNavigate()
  const setState = useCallback(
    (patch: Partial<IconFacetState>) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, ...patch }), replace: true })
    },
    [navigate],
  )
  return [state, setState] as const
}

export function applyIconFacets(icons: IconViewModel[], state: IconFacetState): IconViewModel[] {
  let filtered = icons

  if (state.i_usage === 'unused') {
    filtered = filtered.filter((icon) => icon.presetUsageCount === 0 && icon.optionUsageCount === 0)
  }
  if (state.i_usage === 'presets') {
    filtered = filtered.filter((icon) => icon.presetUsageCount > 0)
  }
  if (state.i_usage === 'options') {
    filtered = filtered.filter((icon) => icon.optionUsageCount > 0)
  }
  if (state.i_usage === 'any') {
    filtered = filtered.filter((icon) => icon.presetUsageCount > 0 || icon.optionUsageCount > 0)
  }

  if (state.i_hasSvg === 'with') filtered = filtered.filter((icon) => Boolean(icon.svgRaw))
  if (state.i_hasSvg === 'missing')
    filtered = filtered.filter((icon) => isIconSvgConfirmedMissing(icon.name))

  if (state.i_supplier !== 'all') {
    filtered = filtered.filter((icon) => icon.prefix === state.i_supplier)
  }

  const query = state.i_q.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter((icon) => icon.name.toLowerCase().includes(query))
  }

  const sorted = [...filtered]
  if (state.i_sort === 'usage_desc')
    sorted.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name))
  else if (state.i_sort === 'usage_asc')
    sorted.sort((a, b) => a.usageCount - b.usageCount || a.name.localeCompare(b.name))
  else sorted.sort((a, b) => a.name.localeCompare(b.name))

  return sorted
}

export function useIconFacetMeta(icons: IconViewModel[]) {
  return useMemo(() => {
    const supplierCounts = new Map<string, number>()
    let withSvg = 0
    let missingSvg = 0
    let presetsCount = 0
    let optionsCount = 0
    let anyCount = 0
    let unusedCount = 0

    let missingPresetRef = 0

    for (const icon of icons) {
      supplierCounts.set(icon.prefix, (supplierCounts.get(icon.prefix) ?? 0) + 1)
      if (icon.svgRaw) withSvg += 1
      if (isIconSvgConfirmedMissing(icon.name)) missingSvg += 1
      if (icon.presetUsageCount > 0 && isIconSvgConfirmedMissing(icon.name)) {
        missingPresetRef += 1
      }
      if (icon.presetUsageCount > 0) presetsCount += 1
      if (icon.optionUsageCount > 0) optionsCount += 1
      if (icon.presetUsageCount > 0 || icon.optionUsageCount > 0) anyCount += 1
      if (icon.presetUsageCount === 0 && icon.optionUsageCount === 0) unusedCount += 1
    }

    return {
      supplierCounts,
      withSvg,
      missingSvg,
      missingPresetRef,
      presetsCount,
      optionsCount,
      anyCount,
      unusedCount,
    }
  }, [icons])
}
