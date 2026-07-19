import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { auditEntriesForSlug, auditEntryNeedsAction } from '@/components/PageAudits/auditEntries'
import { AUDIT_META, AUDIT_SLUGS } from '@/components/PageAudits/auditSlugs'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { AreaIcon } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { SchemaLoadingPanel } from '@/components/ui/LoadingSpinner'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'

export function AuditsIndexPage() {
  const { presets, data, loading } = useSchema()

  const counts = useMemo(() => {
    if (!data) return null
    return Object.fromEntries(
      AUDIT_SLUGS.map((slug) => [
        slug,
        auditEntriesForSlug(slug, presets).filter(auditEntryNeedsAction).length,
      ]),
    ) as Record<(typeof AUDIT_SLUGS)[number], number>
  }, [data, presets])

  if (loading && !data) {
    return <SchemaLoadingPanel label="Loading schema…" />
  }

  if (!data) {
    return (
      <p className="text-sm text-slate-500">
        Load schema data from the Presets page first (enter a data URL and click Load).
      </p>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="space-y-2 border-b border-slate-200 pb-4">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Audits</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Review schema issues that need a human decision, then open GitHub issues for override
          batches. Run the <strong>Cursor override automation</strong> workflow manually when you
          are ready for a PR.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {AUDIT_SLUGS.map((slug) => {
          const meta = AUDIT_META[slug]
          const count = counts?.[slug] ?? 0
          return (
            <li key={slug}>
              <Link
                to="/audits/$slug"
                params={{ slug }}
                search={(prev) => ({
                  dataUrl: prev.dataUrl ?? '',
                  locale: prev.locale ?? '',
                  reference: prev.reference,
                  selected: '',
                })}
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
                    <AreaIcon
                      area={meta.area}
                      className={`h-5 w-5 ${areaAccent[meta.area].icon}`}
                    />
                    {meta.title}
                  </h2>
                  <CountPill className="text-sm">{count}</CountPill>
                </div>
                <p className="mt-2 flex-1 text-sm text-slate-600">{meta.description}</p>
                <span className="mt-4 text-sm font-medium text-sky-700">Open audit →</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="text-sm text-slate-500">
        <Link
          to="/"
          search={(prev) => ({
            ...presetSearchDefaults,
            dataUrl: prev.dataUrl ?? '',
            locale: prev.locale ?? '',
          })}
          className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
        >
          Back to presets
        </Link>
      </p>
    </div>
  )
}
