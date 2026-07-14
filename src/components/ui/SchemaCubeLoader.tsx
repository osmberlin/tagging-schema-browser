import { motion, useReducedMotion } from 'motion/react'
import { loadingCardSpring, loadingInstant } from '@/components/ui/loadingMotion'
import { brandAccent } from '@/theme/brandAccent'
import { cn } from '@/utils/tw'

/** Wireframe cube paths — same geometry as the header logo / favicon. */
const CUBE_SHELL = 'M3 7.5 11 3l8 4.5v9L11 21l-8-4.5v-9Z'
const CUBE_RIBS = 'M11 3v18M3 7.5 11 12l8-4.5'

/**
 * Branded full-page loader: mist logo tile with a tracing wireframe cube and orbiting accent.
 */
export function SchemaCubeLoader({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion()
  const traceTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 1.7, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <div className={cn('relative', className)}>
      {!reducedMotion ? (
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
          aria-hidden
        >
          <span className="absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-sky-300 shadow-sm shadow-sky-400/60" />
        </motion.div>
      ) : null}

      <motion.div
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-xl text-white shadow-lg',
          brandAccent.logo,
        )}
        initial={reducedMotion ? false : { scale: 0.96 }}
        animate={{ scale: 1 }}
        transition={reducedMotion ? loadingInstant : loadingCardSpring}
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          aria-hidden
          animate={reducedMotion ? undefined : { rotate: [0, 6, 0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.path
            d={CUBE_SHELL}
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0.4, opacity: 0.6 }}
            animate={
              reducedMotion
                ? { pathLength: 1, opacity: 1 }
                : { pathLength: [0.4, 1, 0.4], opacity: [0.6, 1, 0.6] }
            }
            transition={traceTransition}
          />
          <motion.path
            d={CUBE_RIBS}
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0.25, opacity: 0.5 }}
            animate={
              reducedMotion
                ? { pathLength: 1, opacity: 0.9 }
                : { pathLength: [0.25, 0.95, 0.25], opacity: [0.5, 1, 0.5] }
            }
            transition={{ ...traceTransition, delay: reducedMotion ? 0 : 0.18 }}
          />
        </motion.svg>
      </motion.div>
    </div>
  )
}
