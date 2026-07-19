import type { AuditSlug } from '@/components/PageAudits/auditSlugs'

export function auditPageHref({
  slug,
  dataUrl = '',
  locale = '',
  selected = '',
  reference,
}: {
  slug: AuditSlug
  dataUrl?: string
  locale?: string
  selected?: string
  reference?: 'release' | 'interim'
}): string {
  const params = new URLSearchParams()
  if (dataUrl.trim()) params.set('dataUrl', dataUrl)
  else if (reference) params.set('reference', reference)
  if (locale.trim()) params.set('locale', locale)
  if (selected.trim()) params.set('selected', selected)
  const query = params.toString()
  return `/audits/${slug}${query ? `?${query}` : ''}`
}

export function auditPageAbsoluteHref(params: Parameters<typeof auditPageHref>[0]): string {
  const path = auditPageHref(params)
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export function presetDetailAbsoluteHref(presetId: string, dataUrl: string): string {
  const params = new URLSearchParams()
  if (dataUrl.trim()) params.set('dataUrl', dataUrl)
  const query = params.toString()
  const path = `/preset/${presetId}${query ? `?${query}` : ''}`
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}
