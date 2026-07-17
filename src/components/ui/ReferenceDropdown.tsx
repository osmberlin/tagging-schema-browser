import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'
import {
  useCurrentPrNumber,
  usePreviousPrNumber,
  usePrPreviewHistory,
  usePrPreviewHistoryActions,
} from '@/features/data-source/pr-preview-history-store'
import { useReference } from '@/features/data-source/reference-store'
import { useCommitSchemaReference } from '@/hooks/useCommitSchemaReference'
import { useComparison } from '@/hooks/useComparison'
import { useSchema } from '@/hooks/useSchema'
import { resolveSchemaReference } from '@/utils/dataUrl'
import { isPrPreviewDataUrl, prNumberFromDataUrl, prPreviewDataUrl } from '@/utils/prPreviewUrl'
import { formatSchemaBuildLabel } from '@/utils/schemaBuildVersion'
import { formatUnreleasedUpdatedAt } from '@/utils/schemaVersion'
import { cn } from '@/utils/tw'

function ChevronDownIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

type ReferenceChoice =
  | 'interim'
  | 'release'
  | 'compare-interim'
  | 'compare-release'
  | `pr:${number}`

function menuItemClass(active: boolean) {
  return cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] font-medium transition',
    active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
  )
}

function MenuSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
      {children}
    </div>
  )
}

/** Prune expired PR history once on mount (localStorage is an external system). */
function usePrunePrPreviewHistoryOnMount() {
  const { pruneExpired } = usePrPreviewHistoryActions()

  useEffect(
    function prunePrPreviewHistoryOnMount() {
      pruneExpired()
    },
    [pruneExpired],
  )
}

/**
 * Record deep-linked PR previews (no user gesture). Event-driven opens call
 * `recordOpen` from the navigation handler instead.
 */
function useRecordDeepLinkedPrPreview(dataUrl: string) {
  const { recordOpen } = usePrPreviewHistoryActions()
  const currentPrNumber = useCurrentPrNumber()

  useEffect(
    function recordDeepLinkedPrPreview() {
      if (!isPrPreviewDataUrl(dataUrl)) return
      const prNumber = prNumberFromDataUrl(dataUrl)
      if (prNumber === null) return
      if (prNumber === currentPrNumber) return
      recordOpen(prNumber)
    },
    [dataUrl, currentPrNumber, recordOpen],
  )
}

/**
 * Schema version picker under the logo: unreleased, release, recent PR previews, and PR ID input.
 */
export function ReferenceDropdown() {
  const navigate = useNavigate()
  const commitSchemaReference = useCommitSchemaReference()
  const { recordOpen } = usePrPreviewHistoryActions()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const dataUrl = useSearch({ strict: false, select: (s) => s.dataUrl ?? '' })
  const urlReference = useSearch({ strict: false, select: (s) => s.reference })
  const persistedReference = useReference()
  const { isComparing, compareMode, releaseVersion, unreleasedUpdatedAt } = useComparison()
  const { schemaBuild } = useSchema()
  const history = usePrPreviewHistory()
  const previousPrNumber = usePreviousPrNumber()
  const [prInput, setPrInput] = useState('')

  usePrunePrPreviewHistoryOnMount()
  useRecordDeepLinkedPrPreview(dataUrl)

  useEffect(
    function closeReferenceDropdownOnOutsidePointerOrEscape() {
      if (!open) return

      const onPointerDown = (event: PointerEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
      }
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setOpen(false)
      }

      document.addEventListener('pointerdown', onPointerDown)
      document.addEventListener('keydown', onKeyDown)
      return function removeReferenceDropdownDismissListeners() {
        document.removeEventListener('pointerdown', onPointerDown)
        document.removeEventListener('keydown', onKeyDown)
      }
    },
    [open],
  )

  const trimmedDataUrl = dataUrl.trim()
  const reference = resolveSchemaReference(urlReference, persistedReference, trimmedDataUrl)
  const previewPrNumber = isPrPreviewDataUrl(trimmedDataUrl)
    ? prNumberFromDataUrl(trimmedDataUrl)
    : null

  const unreleasedAge = formatUnreleasedUpdatedAt(unreleasedUpdatedAt)
  const buildLabel = schemaBuild
    ? formatSchemaBuildLabel(schemaBuild, { resolvedReleaseVersion: releaseVersion })
    : null
  const unreleasedLabel = `Unreleased${unreleasedAge ? ` · ${unreleasedAge}` : ''}`
  const releaseLabel = `Release${releaseVersion ? ` ${releaseVersion}` : ''}`

  const comparePreviewLabel =
    previewPrNumber !== null ? `PR #${previewPrNumber} vs unreleased` : 'Preview vs unreleased'
  const compareReleaseLabel =
    previewPrNumber !== null
      ? `PR #${previewPrNumber} vs ${releaseLabel.toLowerCase()}`
      : `Preview vs ${releaseLabel.toLowerCase()}`

  const currentChoice: ReferenceChoice = isComparing
    ? compareMode === 'release'
      ? 'compare-release'
      : 'compare-interim'
    : reference === 'release'
      ? 'release'
      : 'interim'

  const triggerText = (() => {
    if (isComparing) {
      if (compareMode === 'release') {
        return previewPrNumber !== null
          ? `PR #${previewPrNumber} · vs ${releaseLabel.toLowerCase()}`
          : `Preview · vs ${releaseLabel.toLowerCase()}`
      }
      if (previewPrNumber !== null) {
        return `PR #${previewPrNumber} · vs unreleased`
      }
      return `Preview · vs unreleased`
    }
    if (reference === 'release') {
      return releaseLabel
    }
    const parts = ['Unreleased']
    if (unreleasedAge) parts.push(unreleasedAge)
    if (buildLabel) parts.push(buildLabel)
    return parts.join(' · ')
  })()

  const triggerTitle = (() => {
    if (isComparing) {
      if (compareMode === 'release') {
        return previewPrNumber !== null
          ? `Comparing PR #${previewPrNumber} against ${releaseLabel.toLowerCase()}`
          : `Comparing a custom preview against ${releaseLabel.toLowerCase()}`
      }
      return previewPrNumber !== null
        ? `Comparing PR #${previewPrNumber} against unreleased main`
        : 'Comparing a custom preview against unreleased main'
    }
    if (reference === 'release') {
      return buildLabel ?? 'Published npm release'
    }
    return buildLabel ?? 'Latest id-tagging-schema main'
  })()

  const openPrPreview = (prNumber: number) => {
    setOpen(false)
    recordOpen(prNumber)
    void navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        dataUrl: prPreviewDataUrl(prNumber),
        // When already comparing, only swap the PR preview; keep the active baseline.
        reference: isComparing ? prev.reference : undefined,
      }),
    })
  }

  const navigateToChoice = (choice: ReferenceChoice) => {
    setOpen(false)

    if (choice === 'interim' || choice === 'release') {
      commitSchemaReference(choice, { clearDataUrl: true })
      return
    }

    if (choice === 'compare-interim' || choice === 'compare-release') {
      const target = choice === 'compare-interim' ? 'interim' : 'release'
      commitSchemaReference(target, { clearDataUrl: false })
      return
    }

    const prNumber = Number.parseInt(choice.slice(3), 10)
    if (!Number.isFinite(prNumber) || prNumber <= 0) return
    openPrPreview(prNumber)
  }

  const submitPrInput = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const prNumber = Number.parseInt(prInput.trim(), 10)
    if (!Number.isFinite(prNumber) || prNumber <= 0) return
    setPrInput('')
    openPrPreview(prNumber)
  }

  const renderBrowseItems = () => (
    <>
      <button
        type="button"
        role="menuitem"
        onClick={() => navigateToChoice('interim')}
        className={menuItemClass(!isComparing && currentChoice === 'interim')}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate">{unreleasedLabel}</span>
          {!isComparing && buildLabel && currentChoice !== 'interim' ? (
            <span className="block truncate text-[10px] font-normal opacity-80">{buildLabel}</span>
          ) : null}
        </span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => navigateToChoice('release')}
        className={menuItemClass(!isComparing && currentChoice === 'release')}
      >
        <span className="block truncate">{releaseLabel}</span>
      </button>
    </>
  )

  const renderCompareItems = () => (
    <>
      <button
        type="button"
        role="menuitem"
        onClick={() => navigateToChoice('compare-interim')}
        className={menuItemClass(currentChoice === 'compare-interim')}
      >
        <span className="block truncate">{comparePreviewLabel}</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => navigateToChoice('compare-release')}
        className={menuItemClass(currentChoice === 'compare-release')}
      >
        <span className="block truncate">{compareReleaseLabel}</span>
      </button>
    </>
  )

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Schema version"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={triggerTitle}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex max-w-[14rem] shrink-0 items-center gap-0.5 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-900 transition hover:bg-slate-200/80"
      >
        <span className="min-w-0 truncate">{triggerText}</span>
        <ChevronDownIcon className="h-3 w-3 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute top-full left-0 z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
          {isComparing ? (
            <>
              <MenuSectionLabel>Comparing</MenuSectionLabel>
              {renderCompareItems()}
              <div className="my-1 border-t border-slate-100" aria-hidden="true" />
              <MenuSectionLabel>Browse without compare</MenuSectionLabel>
              {renderBrowseItems()}
            </>
          ) : (
            renderBrowseItems()
          )}

          {history.length > 0 ? (
            <>
              <div className="my-1 border-t border-slate-100" aria-hidden="true" />
              <MenuSectionLabel>Compare recent PRs</MenuSectionLabel>
              {history.map((entry) => {
                const choice: ReferenceChoice = `pr:${entry.prNumber}`
                const isPreviousSelection =
                  entry.prNumber === previousPrNumber && entry.prNumber !== previewPrNumber
                const isActive = previewPrNumber === entry.prNumber
                return (
                  <button
                    key={entry.prNumber}
                    type="button"
                    role="menuitem"
                    title={`Use PR #${entry.prNumber} as the compare preview`}
                    onClick={() => navigateToChoice(choice)}
                    className={menuItemClass(isActive)}
                  >
                    <span className="relative min-w-0 flex-1 pl-3">
                      {isPreviousSelection ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute top-1/2 left-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full',
                            isActive ? 'bg-white' : 'bg-violet-500',
                          )}
                        />
                      ) : null}
                      <span className="block truncate">PR #{entry.prNumber}</span>
                    </span>
                  </button>
                )
              })}
            </>
          ) : null}

          <div className="my-1 border-t border-slate-100" aria-hidden="true" />
          <MenuSectionLabel>Compare PR preview</MenuSectionLabel>
          <form className="px-1 pb-1" onSubmit={submitPrInput}>
            <label className="sr-only" htmlFor="reference-dropdown-pr-input">
              GitHub PR number to use as the compare preview
            </label>
            <div className="flex items-center gap-1">
              <span className="shrink-0 pl-1 text-[10px] text-slate-400">PR #</span>
              <input
                id="reference-dropdown-pr-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="2477"
                value={prInput}
                onChange={(event) => setPrInput(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!prInput.trim()}
                className="shrink-0 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white transition enabled:hover:bg-slate-800 disabled:opacity-40"
              >
                Compare
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
