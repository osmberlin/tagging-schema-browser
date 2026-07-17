import { useLocation } from '@tanstack/react-router'
import { externalActionPillClass } from '@/theme/externalAccent'

/** Full URL for the current preset detail page (for schema override GitHub issues). */
export function usePresetDetailPageUrl(): string {
  const location = useLocation()
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${location.pathname}${location.searchStr}`
}

export function SchemaOverrideCreateIssueAction({
  issueUrl,
  testId,
}: {
  issueUrl: string
  testId: string
}) {
  return (
    <div className="not-prose mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <a
        href={issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={externalActionPillClass('border border-mauve-200 bg-mauve-50/80')}
        data-testid={testId}
      >
        Create GitHub issue ↗
      </a>
      <p className="text-sm text-slate-400">
        Pre-filled issue → Cursor agent opens a PR → CI validates the override.
      </p>
    </div>
  )
}
