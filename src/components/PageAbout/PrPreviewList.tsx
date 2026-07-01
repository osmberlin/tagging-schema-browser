import { Link } from '@tanstack/react-router'
import { twMerge } from 'tailwind-merge'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { externalLinkClass } from '@/theme/externalAccent'
import { prPreviewDataUrl, prPreviewEditorUrl } from '@/utils/prPreviewUrl'
import type { PrPreviewRow } from './prPreviewQueries'
import { type PreviewStatus, usePrPreviews } from './usePrPreviews'

function formatRelativeUpdated(isoDate: string): string {
  const updated = new Date(isoDate).getTime()
  const diffMs = updated - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (Math.abs(diffDays) >= 1) {
    return rtf.format(diffDays, 'day')
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  if (Math.abs(diffHours) >= 1) {
    return rtf.format(diffHours, 'hour')
  }

  const diffMinutes = Math.round(diffMs / (1000 * 60))
  return rtf.format(diffMinutes, 'minute')
}

function PrStateBadge({ state }: { state: PrPreviewRow['state'] }) {
  if (state === 'open') {
    return <Badge variant="emerald">open</Badge>
  }
  if (state === 'merged') {
    return (
      <Badge className="bg-violet-50 text-violet-700 ring-violet-200" variant="zinc">
        merged
      </Badge>
    )
  }
  return <Badge variant="zinc">closed</Badge>
}

function PreviewStatusBadge({ status }: { status: PreviewStatus | undefined }) {
  if (!status || status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <LoadingSpinner size="sm" />
        Checking…
      </span>
    )
  }

  if (status === 'ready') {
    return <Badge variant="sky">Preview ready</Badge>
  }

  return <Badge variant="amber">No preview</Badge>
}

function PrPreviewRowItem({
  pr,
  previewStatus,
}: {
  pr: PrPreviewRow
  previewStatus: PreviewStatus | undefined
}) {
  const dataUrl = prPreviewDataUrl(pr.number)
  const previewReady = previewStatus === 'ready'

  return (
    <li className="flex flex-col gap-2 border-b border-slate-200 px-3 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={pr.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className={twMerge(externalLinkClass(), 'font-medium')}
          >
            #{pr.number}
          </a>
          <PrStateBadge state={pr.state} />
          <PreviewStatusBadge status={previewStatus} />
        </div>
        <p className="truncate text-sm text-slate-900" title={pr.title}>
          {pr.title}
        </p>
        <p className="text-xs text-slate-500">Updated {formatRelativeUpdated(pr.updatedAt)}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm">
        {previewReady ? (
          <Link
            to="/"
            search={(prev) => ({
              ...presetSearchDefaults,
              dataUrl,
              locale: prev.locale ?? '',
            })}
            className="rounded-lg bg-sky-600 px-3 py-1.5 font-medium text-white hover:bg-sky-700"
          >
            Open in browser →
          </Link>
        ) : null}
        <a
          href={prPreviewEditorUrl(pr.number)}
          target="_blank"
          rel="noreferrer"
          className={externalLinkClass()}
        >
          iD preview ↗
        </a>
      </div>
    </li>
  )
}

export function PrPreviewList() {
  const { pulls, previewStatusByNumber, isLoading, isError, error, refetch } = usePrPreviews()

  return (
    <div className="not-prose mt-4">
      <h3 className="text-base font-semibold text-slate-900">Recent PR previews</h3>
      <p className="mt-1 text-sm text-slate-600">
        30 most recently updated PRs on{' '}
        <a
          href="https://github.com/openstreetmap/id-tagging-schema/pulls"
          target="_blank"
          rel="noreferrer"
          className={externalLinkClass()}
        >
          id-tagging-schema
        </a>
        , fetched from GitHub. Reload the page to refresh the list.
      </p>

      {isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <LoadingSpinner size="sm" />
          Loading pull requests…
        </div>
      ) : null}

      {isError ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>{error instanceof Error ? error.message : 'Failed to load pull requests.'}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 font-medium text-amber-800 underline hover:text-amber-950"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && pulls.length > 0 ? (
        <ul className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {pulls.map((pr) => (
            <PrPreviewRowItem
              key={pr.number}
              pr={pr}
              previewStatus={previewStatusByNumber.get(pr.number)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  )
}
