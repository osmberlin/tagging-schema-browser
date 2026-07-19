import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import * as z from 'zod'
import type { FieldViewModel } from '@/utils/types'

export { applyFieldFacets } from '@/components/PageFields/fieldFacetFilter'

/** Search params for the fields page (route "/fields"), validated with Zod 4. */
export const fieldFacetSchema = z.object({
  f_q: z.string().catch(''),
  f_type: z.string().catch('all'),
  f_usage: z.enum(['all', 'used', 'unused']).catch('all'),
  f_iconMismatch: z.enum(['all', 'mismatch']).catch('all'),
  f_sort: z.enum(['name', 'label', 'usage_desc', 'usage_asc']).catch('usage_desc'),
  f_optionIcon: z.string().catch(''),
})

export type FieldFacetState = z.infer<typeof fieldFacetSchema>

export const fieldFacetDefaults: FieldFacetState = fieldFacetSchema.parse({})

export function useFieldFacetState() {
  const state = useSearch({ strict: false, select: (raw) => fieldFacetSchema.parse(raw) })
  const navigate = useNavigate()
  const setState = useCallback(
    (patch: Partial<FieldFacetState>) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, ...patch }), replace: true })
    },
    [navigate],
  )
  return [state, setState] as const
}

export function useFieldFacetMeta(fields: FieldViewModel[]) {
  return useMemo(() => {
    const typeCounts = new Map<string, number>()
    let usedCount = 0
    let unusedCount = 0
    let mismatchCount = 0

    for (const field of fields) {
      typeCounts.set(field.type, (typeCounts.get(field.type) ?? 0) + 1)
      if (field.usageCount > 0) usedCount += 1
      else unusedCount += 1
      if (field.iconMismatchCount > 0) mismatchCount += 1
    }

    return { typeCounts, usedCount, unusedCount, mismatchCount }
  }, [fields])
}

/** Navigate to the full-page field detail route (pushes history). */
export function useSetField() {
  const navigate = useNavigate()
  return useCallback(
    (id: string) => {
      void navigate({
        to: '/field/$',
        params: { _splat: id },
        search: (prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' }),
      })
    },
    [navigate],
  )
}
