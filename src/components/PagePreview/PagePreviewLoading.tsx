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
        Preview route for the initial schema load. Branded wireframe cube with tracing stroke
        animation — no generic ring spinner. The floating refresh card is not shown during this
        state.
      </PreviewDevBanner>
      <SchemaLoadingPanel label="Loading schema…" />
    </>
  )
}
