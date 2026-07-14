import { SchemaLoadingFloat } from '@/components/ui/LoadingSpinner'
import { useReferencePreloading } from '@/features/data-source/reference-store'
import { useSchema } from '@/hooks/useSchema'

/**
 * Background schema activity while cached data stays visible.
 * Initial loads use each page's `SchemaLoadingPanel` instead — never both at once.
 */
export function SchemaLoadIndicator() {
  const { loading, refetching } = useSchema()
  const referencePreloading = useReferencePreloading()

  if (loading || (!refetching && !referencePreloading)) return null

  const label = referencePreloading ? 'Preparing schema…' : 'Refreshing schema…'

  return <SchemaLoadingFloat label={label} />
}
