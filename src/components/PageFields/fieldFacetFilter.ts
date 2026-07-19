import type { FieldViewModel } from '@/utils/types'

export type FieldFacetFilterState = {
  f_q: string
  f_type: string
  f_usage: 'all' | 'used' | 'unused'
  f_iconMismatch: 'all' | 'mismatch'
  f_sort: 'name' | 'label' | 'usage_desc' | 'usage_asc'
  f_optionIcon: string
}

export function applyFieldFacets(
  fields: FieldViewModel[],
  state: FieldFacetFilterState,
): FieldViewModel[] {
  let filtered = fields

  if (state.f_usage === 'used') filtered = filtered.filter((field) => field.usageCount > 0)
  if (state.f_usage === 'unused') filtered = filtered.filter((field) => field.usageCount === 0)

  if (state.f_type !== 'all') {
    filtered = filtered.filter((field) => field.type === state.f_type)
  }

  if (state.f_iconMismatch === 'mismatch') {
    filtered = filtered.filter((field) => field.iconMismatchCount > 0)
  }

  if (state.f_optionIcon) {
    filtered = filtered.filter(
      (field) => field.usageCount > 0 && field.optionIconNames.includes(state.f_optionIcon),
    )
  }

  const query = state.f_q.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      (field) =>
        field.id.toLowerCase().includes(query) ||
        field.key.toLowerCase().includes(query) ||
        field.label.toLowerCase().includes(query) ||
        field.type.toLowerCase().includes(query),
    )
  }

  const sorted = [...filtered]
  if (state.f_sort === 'usage_desc')
    sorted.sort((a, b) => b.usageCount - a.usageCount || a.id.localeCompare(b.id))
  else if (state.f_sort === 'usage_asc')
    sorted.sort((a, b) => a.usageCount - b.usageCount || a.id.localeCompare(b.id))
  else if (state.f_sort === 'label')
    sorted.sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id))
  else sorted.sort((a, b) => a.id.localeCompare(b.id))

  return sorted
}
