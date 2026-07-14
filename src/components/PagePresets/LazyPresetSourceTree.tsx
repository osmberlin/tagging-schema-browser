import { Suspense, lazy, useEffect, useState, useTransition } from 'react'
import type { PresetSourceTreeProps } from '@/components/PagePresets/PresetSourceTree'
import {
  isPresetSourceTreeWarm,
  markPresetSourceTreeWarm,
  presetSourceTreeCacheKey,
} from '@/components/PagePresets/presetSourceTreeCache'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSchema } from '@/hooks/useSchema'

const PresetSourceTreeLazy = lazy(() =>
  import('@/components/PagePresets/PresetSourceTree').then((module) => ({
    default: module.PresetSourceTree,
  })),
)

function SourceTreeLoadingPanel() {
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="sm" />
      <span>Loading source JSON…</span>
    </div>
  )
}

/**
 * Defers the heavy source JSON tree until after the detail page paints.
 * Warm entries skip the deferral when revisiting the same field/preset + schema.
 */
export function LazyPresetSourceTree(props: PresetSourceTreeProps) {
  const { dataUrl } = useSchema()
  const cacheKey = presetSourceTreeCacheKey({
    sourceKind: props.sourceKind ?? 'preset',
    entityId: props.presetId,
    dataUrl,
  })
  const warm = isPresetSourceTreeWarm(cacheKey)
  const [ready, setReady] = useState(warm)
  const [, startDeferredMount] = useTransition()

  useEffect(
    function deferPresetSourceTreeMount() {
      if (warm) return
      startDeferredMount(() => setReady(true))
    },
    [warm, cacheKey, startDeferredMount],
  )

  useEffect(
    function rememberWarmPresetSourceTree() {
      if (ready) markPresetSourceTreeWarm(cacheKey)
    },
    [ready, cacheKey],
  )

  if (!ready) return <SourceTreeLoadingPanel />

  return (
    <Suspense fallback={<SourceTreeLoadingPanel />}>
      <PresetSourceTreeLazy {...props} />
    </Suspense>
  )
}
