import { routerBasepath } from '@/utils/routerBasepath'
import { routerSearch } from '@/utils/routerSearch'

function appBase(): string {
  return routerBasepath().replace(/\/$/, '') || ''
}

/** Absolute in-app URL for a field detail page (new tab). */
export function buildFieldPageUrl(fieldId: string, dataUrl: string): string {
  const params = new URLSearchParams()
  if (dataUrl.trim()) params.set('dataUrl', dataUrl.trim())
  const query = params.toString()
  const encodedId = fieldId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${appBase()}/field/${encodedId}${query ? `?${query}` : ''}`
}

/** Absolute in-app URL for presets filtered by field usage (new tab). */
export function buildPresetsFieldFilterUrl(
  fieldId: string,
  dataUrl: string,
  listKind: 'primary' | 'more' | 'any',
): string {
  const search: Record<string, unknown> = {}
  if (dataUrl.trim()) search.dataUrl = dataUrl.trim()
  if (listKind === 'primary') search.primaryFieldIds = [fieldId]
  else if (listKind === 'more') search.moreFieldIds = [fieldId]
  else search.fieldIds = [fieldId]
  const query = routerSearch.stringify(search)
  return `${appBase()}${query.startsWith('?') ? query : `?${query}`}`
}
