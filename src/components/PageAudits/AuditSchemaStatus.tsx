import { SchemaLoadingPanel } from '@/components/ui/LoadingSpinner'
import { useReferenceHydrated } from '@/features/data-source/reference-store'
import { useSchema } from '@/hooks/useSchema'

export function AuditSchemaLoadingPanel() {
  const hasHydrated = useReferenceHydrated()
  const label = hasHydrated ? 'Loading schema for audits…' : 'Preparing audit view…'
  return <SchemaLoadingPanel label={label} />
}

export function AuditSchemaRefreshBanner() {
  const { refetching } = useSchema()
  if (!refetching) return null

  return (
    <p
      className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2 text-sm text-sky-900"
      role="status"
    >
      Refreshing schema in the background — audit rows may update when this finishes.
    </p>
  )
}
