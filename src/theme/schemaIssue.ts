export type SchemaIssueVariant = 'error' | 'warning'

export const schemaIssueStyles = {
  alert: 'rounded-lg bg-slate-900 px-3 py-2.5 text-sm text-slate-50',
  alertTitle: 'font-semibold text-white',
  alertDivider: 'text-slate-400',
  alertLink:
    'font-medium text-white underline decoration-slate-400/60 underline-offset-2 hover:decoration-white',
  disclosure: 'overflow-hidden rounded-lg bg-slate-900 text-slate-50',
  disclosureHeader:
    'flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 text-left text-sm text-slate-50 transition hover:bg-slate-800',
  disclosureTitle: 'font-semibold text-white',
  disclosureSummary: 'min-w-0 text-slate-50',
  disclosureChevron: 'text-slate-400',
  disclosureBody: 'border-t border-slate-700 bg-slate-800 px-3 py-3 text-sm text-slate-200',
  disclosureBodyInset: 'rounded-md border border-slate-600/80 bg-slate-900/50',
  icon: {
    error: 'text-rose-400',
    warning: 'text-amber-400',
  },
} as const
