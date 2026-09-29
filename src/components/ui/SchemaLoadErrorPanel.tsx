import { getExpectedFilesHelp } from '@/components/PagePresets/dataLoader'

/** Shown when the schema dist could not be fetched (404, CORS, network, invalid JSON). */
export function SchemaLoadErrorPanel({
  error,
  dataUrl,
  onRetry,
  onUseDefault,
}: {
  error: string
  dataUrl: string
  onRetry: () => void
  onUseDefault: () => void
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
      <h2 className="font-semibold text-red-800">Could not load schema data</h2>
      <p className="mt-1 text-sm text-red-700">
        Source: <code className="break-all">{dataUrl}</code>
      </p>
      <p className="mt-1 text-sm break-words text-red-700">{error}</p>
      <p className="mt-2 text-xs text-red-600">
        The URL may be wrong (404), or the host may block cross-origin requests (CORS).{' '}
        {getExpectedFilesHelp()}
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-red-700">
        <button type="button" onClick={onRetry} className="underline">
          Try again
        </button>
        <button type="button" onClick={onUseDefault} className="underline">
          Use the default data source
        </button>
      </div>
    </div>
  )
}
