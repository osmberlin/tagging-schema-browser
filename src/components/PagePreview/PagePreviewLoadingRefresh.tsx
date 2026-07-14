import { SchemaLoadingFloat } from '@/components/ui/LoadingSpinner'

function PreviewDevBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
      {children}
    </p>
  )
}

/** Dev/preview route: floating background refresh indicator. */
export function PagePreviewLoadingRefresh() {
  return (
    <>
      <PreviewDevBanner>
        Preview route for background schema activity. This floating card appears when switching
        release/unreleased or refetching while data is already on screen — never together with the
        full-page loader.
      </PreviewDevBanner>
      <div className="space-y-4 opacity-70">
        <h1 className="font-display text-xl font-semibold text-slate-900">Sample presets list</h1>
        <p className="text-sm text-slate-600">
          Existing content stays visible underneath while the schema reloads in the background.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Preset</th>
                <th className="px-4 py-3">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 font-medium text-slate-900">Bench</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">amenity=bench</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-slate-900">Crane</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">man_made=crane</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <SchemaLoadingFloat label="Refreshing schema…" />
    </>
  )
}
