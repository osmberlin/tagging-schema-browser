import { SchemaLoadingPanel } from '@/components/ui/LoadingSpinner'

function PreviewDevBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
      {children}
    </p>
  )
}

/** Dev/preview route: full-page schema loading state. */
export function PagePreviewLoading() {
  return (
    <>
      <PreviewDevBanner>
        Preview route for the initial schema load. This card appears when JSON is fetched for the
        first time (no cached data). The header strip is not shown during this state.
      </PreviewDevBanner>
      <SchemaLoadingPanel label="Loading schema…" />
    </>
  )
}
