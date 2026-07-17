import { useNavigate } from '@tanstack/react-router'
import { useReferenceActions } from '@/features/data-source/reference-store'
import { type SchemaReference, dataUrlForReference, referenceSearchParam } from '@/utils/dataUrl'
import { preloadSchemaData } from '@/utils/schemaCache'

/**
 * Commit an interim/release preference: set pendingReference so router sync effects
 * cannot overwrite mid-flight, persist, navigate, then clear pending.
 *
 * @param clearDataUrl When true (default), leave custom/PR preview mode.
 *   When false, only change the comparison baseline while keeping `dataUrl`.
 */
export function useCommitSchemaReference() {
  const navigate = useNavigate()
  const {
    setReference: setPersistedReference,
    setPendingReference,
    setReferencePreloading,
  } = useReferenceActions()

  return function commitSchemaReference(
    target: SchemaReference,
    { clearDataUrl = true }: { clearDataUrl?: boolean } = {},
  ) {
    setPendingReference(target)
    setPersistedReference(target)
    setReferencePreloading(true)
    void preloadSchemaData(dataUrlForReference(target))

    void navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        reference: referenceSearchParam(target),
        ...(clearDataUrl ? { dataUrl: undefined } : {}),
      }),
    })
      .then(() => {
        setPendingReference(null)
        setReferencePreloading(false)
      })
      .catch(() => {
        setPendingReference(null)
        setReferencePreloading(false)
      })
  }
}
