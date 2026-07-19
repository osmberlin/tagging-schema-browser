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
