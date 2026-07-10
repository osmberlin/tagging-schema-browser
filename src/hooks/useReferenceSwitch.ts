import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useRef } from 'react'
import {
  useReference,
  useReferenceActions,
  usePendingReference,
} from '@/features/data-source/reference-store'
import {
  type SchemaReference,
  dataUrlForReference,
  referenceSearchParam,
  resolveSchemaReference,
} from '@/utils/dataUrl'
import { preloadSchemaData } from '@/utils/schemaCache'

/** Spring pill duration fallback when layout animation callbacks do not fire. */
const PILL_ANIMATION_MS = 420

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Optimistic interem/release switch: animate the toggle immediately, preload schema
 * in the background, then commit URL + persisted reference once the pill animation ends.
 */
export function useReferenceSwitch() {
  const navigate = useNavigate()
  const urlReference = useSearch({ strict: false, select: (s) => s.reference })
  const persistedReference = useReference()
  const {
    setReference: setPersistedReference,
    setPendingReference,
    setReferencePreloading,
  } = useReferenceActions()
  const pendingReference = usePendingReference()

  const committedReference = resolveSchemaReference(urlReference, persistedReference)
  const displayReference = pendingReference ?? committedReference

  const targetRef = useRef<SchemaReference | null>(null)
  const animationDoneRef = useRef(false)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  const tryCommit = useCallback(() => {
    const target = targetRef.current
    if (!target || !animationDoneRef.current) return

    clearFallbackTimer()
    targetRef.current = null
    animationDoneRef.current = false

    // Persist before navigation; keep pendingReference until the URL updates so
    // router sync effects do not overwrite interem or restore release mid-flight.
    setPersistedReference(target)

    void navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        reference: referenceSearchParam(target),
        dataUrl: undefined,
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
  }, [
    clearFallbackTimer,
    navigate,
    setPendingReference,
    setPersistedReference,
    setReferencePreloading,
  ])

  const select = useCallback(
    (next: SchemaReference) => {
      if (next === committedReference && !pendingReference) return
      if (next === pendingReference) return

      clearFallbackTimer()
      targetRef.current = next
      animationDoneRef.current = prefersReducedMotion()
      setPendingReference(next)
      setReferencePreloading(true)

      void preloadSchemaData(dataUrlForReference(next))

      if (prefersReducedMotion()) {
        tryCommit()
      } else {
        fallbackTimerRef.current = setTimeout(() => {
          if (targetRef.current !== next) return
          animationDoneRef.current = true
          tryCommit()
        }, PILL_ANIMATION_MS)
      }
    },
    [
      clearFallbackTimer,
      committedReference,
      pendingReference,
      setPendingReference,
      setReferencePreloading,
      tryCommit,
    ],
  )

  const onPillAnimationComplete = useCallback(() => {
    if (!targetRef.current) return
    animationDoneRef.current = true
    tryCommit()
  }, [tryCommit])

  useEffect(
    function clearReferenceSwitchFallbackOnUnmount() {
      return function stopReferenceSwitchFallbackTimer() {
        clearFallbackTimer()
      }
    },
    [clearFallbackTimer],
  )

  return {
    committedReference,
    displayReference,
    isSwitching: pendingReference !== null,
    select,
    onPillAnimationComplete,
  }
}
