import { useNavigate } from '@tanstack/react-router'
import {
  SUPPORTED_SCHEMA_MAJOR,
  type SchemaBuildInfo,
  formatSchemaBuildLabel,
  unsupportedSchemaBuildMessage,
} from '@/utils/schemaBuildVersion'

type UnsupportedSchemaNoticeProps = {
  build?: SchemaBuildInfo
  message?: string
  dataUrl?: string
}

/** Shown when `?dataUrl=` points at a schema build older than v7. */
export function UnsupportedSchemaNotice({ build, message, dataUrl }: UnsupportedSchemaNoticeProps) {
  const navigate = useNavigate()
  const body = message ?? (build ? unsupportedSchemaBuildMessage(build) : '')
  const label = build ? formatSchemaBuildLabel(build) : 'this version'

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
      role="alert"
    >
      <h2 className="font-semibold text-amber-900">Schema version not supported</h2>
      <p className="mt-2">{body}</p>
      {dataUrl ? (
        <p className="mt-2 text-xs break-all text-amber-800">
          URL: <code className="rounded bg-amber-100 px-1">{dataUrl}</code>
        </p>
      ) : null}
      <p className="mt-3 text-amber-900">
        This browser works with <strong>id-tagging-schema v{SUPPORTED_SCHEMA_MAJOR}+</strong> only.
        Use the default unreleased or release dataset, or point <code>dataUrl</code> at a v
        {SUPPORTED_SCHEMA_MAJOR} build (for example{' '}
        <code className="rounded bg-amber-100 px-1">@openstreetmap/id-tagging-schema@7/dist</code>
        ).
      </p>
      <button
        type="button"
        onClick={() => {
          void navigate({
            to: '.',
            search: (prev) => ({ ...prev, dataUrl: '' }),
          })
        }}
        className="mt-3 font-medium text-amber-900 underline hover:text-amber-950"
      >
        Clear custom URL and use default ({label} cannot be shown)
      </button>
    </div>
  )
}
