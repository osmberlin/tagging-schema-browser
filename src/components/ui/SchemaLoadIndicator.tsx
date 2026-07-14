import { SchemaLoadingFloatPresence } from '@/components/ui/LoadingSpinner'
import { useReferencePreloading } from '@/features/data-source/reference-store'
import { useSchema } from '@/hooks/useSchema'

/**
 * Background schema activity while cached data stays visible.
 * Initial loads use each page's `SchemaLoadingPanel` instead — never both at once.
 */
export function SchemaLoadIndicator() {
  const { loading, refetching } = useSchema()
  const referencePreloading = useReferencePreloading()

  const show = !loading && (refetching || referencePreloading)
  const label = referencePreloading ? 'Preparing schema…' : 'Refreshing schema…'

  return <SchemaLoadingFloatPresence show={show} label={label} />
}
