import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { loadingCardSpring, loadingInstant } from '@/components/ui/loadingMotion'
import { SchemaCubeLoader } from '@/components/ui/SchemaCubeLoader'
import { cn } from '@/utils/tw'

function useLoadingTransitions() {
  const reducedMotion = useReducedMotion()
  return {
    reducedMotion,
    card: reducedMotion ? loadingInstant : loadingCardSpring,
    label: reducedMotion ? loadingInstant : { ...loadingCardSpring, delay: 0.08 },
  }
}

/** Compact ring spinner for inline / floating refresh states. */
export function LoadingSpinner({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const reducedMotion = useReducedMotion()
  const sizeClass =
    size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-8 w-8 border-[3px]' : 'h-5 w-5 border-2'

  return (
    <span
      role="status"
      aria-hidden={className?.includes('sr-only') ? undefined : true}
      className={cn(
        'inline-block shrink-0 rounded-full border-slate-200 border-t-sky-600',
        !reducedMotion && 'animate-spin',
        sizeClass,
        className,
      )}
    />
  )
}

function SchemaLoadingCardContent({
  label,
  spinnerSize = 'md',
  labelDelay = false,
}: {
  label: string
  spinnerSize?: 'sm' | 'md'
  labelDelay?: boolean
}) {
  const { reducedMotion, label: labelTransition } = useLoadingTransitions()

  const labelNode = <p className="text-sm font-medium text-slate-600">{label}</p>

  return (
    <div className="flex items-center gap-3 rounded-xl border border-l-2 border-slate-200/80 border-l-mist-400 bg-white/95 px-5 py-3.5 shadow-lg shadow-slate-900/5 backdrop-blur-sm">
      <LoadingSpinner size={spinnerSize} />
      {labelDelay && !reducedMotion ? (
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={labelTransition}
        >
          {labelNode}
        </motion.div>
      ) : (
        labelNode
      )}
    </div>
  )
}

function SchemaLoadingCard({
  label,
  spinnerSize = 'md',
  animated = true,
}: {
  label: string
  spinnerSize?: 'sm' | 'md'
  animated?: boolean
}) {
  const { reducedMotion, card } = useLoadingTransitions()

  if (!animated || reducedMotion) {
    return (
      <SchemaLoadingCardContent label={label} spinnerSize={spinnerSize} labelDelay={animated} />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -8 }}
      transition={card}
    >
      <SchemaLoadingCardContent label={label} spinnerSize={spinnerSize} labelDelay />
    </motion.div>
  )
}

/** Full-page schema load — branded cube loader when there is no cached data yet. */
export function SchemaLoadingPanel({ label = 'Loading schema…' }: { label?: string }) {
  const { reducedMotion, label: labelTransition } = useLoadingTransitions()

  return (
    <div
      role="status"
      className="flex min-h-[min(70vh,calc(100svh-10rem))] flex-col items-center justify-center gap-5 px-4"
      aria-live="polite"
    >
      <SchemaCubeLoader />
      <motion.p
        className="text-sm font-medium text-slate-600"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={labelTransition}
      >
        {label}
      </motion.p>
    </div>
  )
}

/** Floating schema refresh — used when data is already on screen (refetch / reference switch). */
export function SchemaLoadingFloat({ label }: { label: string }) {
  const { reducedMotion, card } = useLoadingTransitions()

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-50 flex justify-center px-4 sm:top-16"
      aria-live="polite"
      role="status"
      initial={reducedMotion ? false : { opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
      transition={card}
    >
      <SchemaLoadingCard label={label} spinnerSize="sm" animated={false} />
    </motion.div>
  )
}

/** Wraps a floating loader with enter/exit transitions (for live schema refresh). */
export function SchemaLoadingFloatPresence({ show, label }: { show: boolean; label: string }) {
  return (
    <AnimatePresence>
      {show ? <SchemaLoadingFloat key="schema-loading-float" label={label} /> : null}
    </AnimatePresence>
  )
}
