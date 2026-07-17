import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'
import {
  useLastUsedPrNumber,
  usePrPreviewHistory,
  usePrPreviewHistoryActions,
} from '@/features/data-source/pr-preview-history-store'
import { useReference, useReferenceActions } from '@/features/data-source/reference-store'
import { useComparison } from '@/hooks/useComparison'
import { useSchema } from '@/hooks/useSchema'
import { isReleaseCompareMode, referenceSearchParam, resolveSchemaReference } from '@/utils/dataUrl'
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

type ReferenceChoice = 'interim' | 'release' | `pr:${number}`

function menuItemClass(active: boolean) {
  return cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] font-medium transition',
    active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
  )
}

/** Record PR preview opens and prune expired history entries. */
function usePrPreviewHistorySync(dataUrl: string) {
  const { recordOpen, pruneExpired } = usePrPreviewHistoryActions()

  useEffect(
    function prunePrPreviewHistoryOnMount() {
      pruneExpired()
    },
    [pruneExpired],
  )

  useEffect(
    function recordActivePrPreview() {
      if (!isPrPreviewDataUrl(dataUrl)) return
      const prNumber = prNumberFromDataUrl(dataUrl)
      if (prNumber === null) return
      recordOpen(prNumber)
    },
    [dataUrl, recordOpen],
  )
}

/**
 * Schema version picker under the logo: unreleased, release, recent PR previews, and PR ID input.
 */
export function ReferenceDropdown() {
  const navigate = useNavigate()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const dataUrl = useSearch({ strict: false, select: (s) => s.dataUrl ?? '' })
  const urlReference = useSearch({ strict: false, select: (s) => s.reference })
  const persistedReference = useReference()
  const { setReference: setPersistedReference } = useReferenceActions()
  const { releaseVersion, unreleasedUpdatedAt } = useComparison()
  const { schemaBuild } = useSchema()
  const history = usePrPreviewHistory()
  const lastUsedPrNumber = useLastUsedPrNumber()
  const [prInput, setPrInput] = useState('')

  usePrPreviewHistorySync(dataUrl)

  useEffect(
    function closeReferenceDropdownOnOutsideClick() {
      if (!open) return
      const onPointerDown = (event: PointerEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
      }
      document.addEventListener('pointerdown', onPointerDown)
      return () => document.removeEventListener('pointerdown', onPointerDown)
    },
    [open],
  )

  const trimmedDataUrl = dataUrl.trim()
  const reference = resolveSchemaReference(urlReference, persistedReference, trimmedDataUrl)
  const releaseCompare = isReleaseCompareMode(trimmedDataUrl, reference)
  const activePrNumber =
    trimmedDataUrl && isPrPreviewDataUrl(trimmedDataUrl) && !releaseCompare
      ? prNumberFromDataUrl(trimmedDataUrl)
      : null

  const unreleasedAge = formatUnreleasedUpdatedAt(unreleasedUpdatedAt)
  const buildLabel = schemaBuild
    ? formatSchemaBuildLabel(schemaBuild, { resolvedReleaseVersion: releaseVersion })
    : null

  const currentChoice: ReferenceChoice =
    activePrNumber !== null
      ? `pr:${activePrNumber}`
      : reference === 'release'
        ? 'release'
        : 'interim'

  const triggerLabel =
    activePrNumber !== null
      ? `PR #${activePrNumber}`
      : reference === 'release'
        ? `Release${releaseVersion ? ` ${releaseVersion}` : ''}`
        : `Unreleased${unreleasedAge ? ` · ${unreleasedAge}` : ''}`

  const triggerDetail =
    activePrNumber !== null
      ? 'PR preview'
      : reference === 'release'
        ? (buildLabel ?? 'Published npm')
        : (buildLabel ?? 'Latest main')

  const navigateToChoice = (choice: ReferenceChoice) => {
    setOpen(false)

    queueMicrotask(() => {
      if (choice === 'interim') {
        setPersistedReference('interim')
        void navigate({
          to: '.',
          search: (prev) => ({
            ...prev,
            reference: referenceSearchParam('interim'),
            dataUrl: undefined,
          }),
        })
        return
      }

      if (choice === 'release') {
        setPersistedReference('release')
        void navigate({
          to: '.',
          search: (prev) => ({
            ...prev,
            reference: referenceSearchParam('release'),
            dataUrl: undefined,
          }),
        })
        return
      }

      const prNumber = Number.parseInt(choice.slice(3), 10)
      if (!Number.isFinite(prNumber) || prNumber <= 0) return
      void navigate({
        to: '.',
        search: (prev) => ({
          ...prev,
          dataUrl: prPreviewDataUrl(prNumber),
          reference: undefined,
        }),
      })
    })
  }

  const submitPrInput = () => {
    const prNumber = Number.parseInt(prInput.trim(), 10)
    if (!Number.isFinite(prNumber) || prNumber <= 0) return
    setPrInput('')
    navigateToChoice(`pr:${prNumber}`)
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Schema version"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Switch schema version or open a PR preview"
        onClick={() => setOpen(true)}
        className="inline-flex max-w-[11rem] items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-left transition hover:bg-slate-200/80"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] leading-tight font-medium text-slate-900">
            {triggerLabel}
          </span>
          <span className="block truncate text-[10px] leading-tight text-slate-500">
            {triggerDetail}
          </span>
        </span>
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute top-full left-0 z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => navigateToChoice('interim')}
            className={menuItemClass(currentChoice === 'interim')}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate">
                Unreleased{unreleasedAge ? ` · ${unreleasedAge}` : ''}
              </span>
              {buildLabel && currentChoice !== 'interim' ? (
                <span className="block truncate text-[10px] font-normal opacity-80">
                  {buildLabel}
                </span>
              ) : null}
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => navigateToChoice('release')}
            className={menuItemClass(currentChoice === 'release')}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate">
                Release{releaseVersion ? ` ${releaseVersion}` : ''}
              </span>
            </span>
          </button>

          {history.length > 0 ? (
            <>
              <div className="my-1 border-t border-slate-100" aria-hidden="true" />
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                Recent PR previews
              </div>
              {history.map((entry) => {
                const choice: ReferenceChoice = `pr:${entry.prNumber}`
                const isLastUsed = entry.prNumber === lastUsedPrNumber
                return (
                  <button
                    key={entry.prNumber}
                    type="button"
                    role="menuitem"
                    onClick={() => navigateToChoice(choice)}
                    className={menuItemClass(currentChoice === choice)}
                  >
                    <span className="relative min-w-0 flex-1 pl-3">
                      {isLastUsed ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute top-1/2 left-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full',
                            currentChoice === choice ? 'bg-white' : 'bg-violet-500',
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
          <form
            className="px-1 pb-1"
            onSubmit={(event) => {
              event.preventDefault()
              submitPrInput()
            }}
          >
            <label className="sr-only" htmlFor="reference-dropdown-pr-input">
              GitHub PR number
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
                Open
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
