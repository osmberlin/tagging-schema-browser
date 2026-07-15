import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { useLocale } from '@/hooks/useLocale'
import { schemaIssueStyles } from '@/theme/schemaIssue'
import {
  splitWarningValue,
  validateOpeningHours,
  type opening_hours_warning,
} from '@/utils/openingHoursValidation'
import { cn } from '@/utils/tw'

function WarningItem({ warning }: { warning: opening_hours_warning }) {
  const parts = splitWarningValue(warning)

  return (
    <li className="space-y-1">
      {parts ? (
        <p className="overflow-x-auto font-mono text-xs text-slate-100">
          <span>{parts.before}</span>
          <span className="rounded bg-amber-400/25 px-0.5 text-amber-200 underline decoration-amber-300 decoration-wavy underline-offset-2">
            {parts.marker}
          </span>
          <span>{parts.after}</span>
        </p>
      ) : (
        <p className="overflow-x-auto font-mono text-xs text-slate-300">{warning.value}</p>
      )}
      <p className="text-sm text-slate-200">{warning.message}</p>
      <p className="font-mono text-[11px] text-slate-500">{warning.type}</p>
    </li>
  )
}

export function OpeningHoursChecker({
  fieldKey,
  initialValue = '',
}: {
  fieldKey: string
  initialValue?: string
}) {
  const { locale } = useLocale()
  const [value, setValue] = useState(initialValue)
  const deferredValue = useDeferredValue(value)
  const trimmedValue = deferredValue.trim()

  const validationQuery = useQuery({
    queryKey: ['opening-hours-validation', trimmedValue, fieldKey, locale],
    queryFn: () =>
      validateOpeningHours(trimmedValue, {
        locale: locale || undefined,
        tagKey: fieldKey,
      }),
    enabled: trimmedValue.length > 0,
    staleTime: 0,
  })

  const result = validationQuery.data
  const warningCount = result?.warnings.length ?? 0

  return (
    <div className="space-y-3 px-4 py-4">
      <p className="text-sm text-slate-600">
        Paste an opening-hours value to validate it with{' '}
        <a
          href="https://github.com/opening-hours/opening_hours.js"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800"
        >
          opening_hours.js
        </a>{' '}
        3.14 (<code className="font-mono text-xs">getStructuredWarnings()</code>).
      </p>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Value</span>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Mo-Fr 09:00-17:00"
          spellCheck={false}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
      </label>

      {!trimmedValue ? (
        <p className="text-sm text-slate-500">Enter a value to validate.</p>
      ) : validationQuery.isFetching && !result ? (
        <p className="text-sm text-slate-500">Validating…</p>
      ) : validationQuery.isError ? (
        <p className={cn(schemaIssueStyles.alert, 'text-rose-100')}>
          <span className={schemaIssueStyles.alertTitle}>Validation failed</span>
          <span className={schemaIssueStyles.alertDivider} aria-hidden>
            —
          </span>
          <span>
            {validationQuery.error instanceof Error
              ? validationQuery.error.message
              : 'Could not validate opening hours.'}
          </span>
        </p>
      ) : result?.valid ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700">Syntax is valid.</p>
          {warningCount > 0 ? (
            <div className={cn(schemaIssueStyles.disclosureBodyInset, 'px-3 py-3')}>
              <p className="mb-2 text-sm font-medium text-amber-200">
                {warningCount} warning{warningCount === 1 ? '' : 's'}
              </p>
              <ul className="space-y-3">
                {result.warnings.map((warning, index) => (
                  <WarningItem key={`${warning.type}-${index}`} warning={warning} />
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No warnings.</p>
          )}
        </div>
      ) : (
        <p className={cn(schemaIssueStyles.alert, 'text-rose-100')}>
          <span className={schemaIssueStyles.alertTitle}>Parse error</span>
          <span className={schemaIssueStyles.alertDivider} aria-hidden>
            —
          </span>
          <span>{result?.error}</span>
        </p>
      )}
    </div>
  )
}
