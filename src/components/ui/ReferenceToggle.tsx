import { useSearch } from '@tanstack/react-router'
import { LayoutGroup, motion } from 'motion/react'
import { useComparison } from '@/hooks/useComparison'
import { useReferenceSwitch } from '@/hooks/useReferenceSwitch'
import { formatStagingUpdatedAt } from '@/utils/schemaVersion'
import { cn } from '@/utils/tw'

function ToggleSegment({
  active,
  onClick,
  onPillAnimationComplete,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  onPillAnimationComplete?: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      title={title}
      onClick={onClick}
      className={cn(
        'relative rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
        active ? 'text-slate-900' : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-800',
      )}
    >
      {active ? (
        <motion.span
          layoutId="reference-toggle-pill"
          className="absolute inset-0 rounded-md bg-white shadow-sm"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          onLayoutAnimationComplete={onPillAnimationComplete}
        />
      ) : null}
      <span className="relative z-10 whitespace-nowrap">{children}</span>
    </button>
  )
}

/**
 * Staging / release toggle under the logo. Staging is the default; release is opt-in.
 * Hidden while a custom `dataUrl` (PR preview) is active.
 */
export function ReferenceToggle() {
  const { releaseVersion, stagingUpdatedAt } = useComparison()
  const stagingAge = formatStagingUpdatedAt(stagingUpdatedAt)
  const dataUrl = useSearch({ strict: false, select: (s) => s.dataUrl ?? '' })
  const { displayReference, select, onPillAnimationComplete, isSwitching } = useReferenceSwitch()

  if (dataUrl.trim()) return null

  return (
    <LayoutGroup id="reference-toggle">
      <div
        role="tablist"
        aria-label="Schema reference"
        aria-busy={isSwitching}
        className="inline-flex shrink-0 rounded-lg bg-slate-100 p-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <ToggleSegment
          active={displayReference === 'interem'}
          onClick={() => select('interem')}
          onPillAnimationComplete={
            isSwitching && displayReference === 'interem' ? onPillAnimationComplete : undefined
          }
          title={
            stagingUpdatedAt
              ? `Staging — last change on main: ${new Date(stagingUpdatedAt).toLocaleString()}`
              : 'Staging — unreleased build from main'
          }
        >
          Staging{stagingAge ? ` · ${stagingAge}` : ''}
        </ToggleSegment>
        <ToggleSegment
          active={displayReference === 'release'}
          onClick={() => select('release')}
          onPillAnimationComplete={
            isSwitching && displayReference === 'release' ? onPillAnimationComplete : undefined
          }
        >
          Release{releaseVersion ? ` ${releaseVersion}` : ''}
        </ToggleSegment>
      </div>
    </LayoutGroup>
  )
}
