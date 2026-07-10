export type SchemaIssueVariant = 'error' | 'warning'

export const schemaIssueStyles = {
  alert: 'rounded-lg bg-slate-900 px-3 py-2.5 text-sm text-slate-50',
  alertTitle: 'font-semibold text-white',
  alertDivider: 'text-slate-400',
  alertLink:
    'font-medium text-white underline decoration-slate-400/60 underline-offset-2 hover:decoration-white',
  disclosure: 'overflow-hidden rounded-lg border border-slate-200 bg-slate-50',
  disclosureHeader:
    'flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 text-left text-sm text-slate-900 transition hover:bg-slate-100/80',
  disclosureTitle: 'font-semibold text-slate-950',
  disclosureBody: 'border-t border-slate-200 px-3 py-3 text-sm text-slate-800',
  icon: {
    error: 'text-rose-400',
    warning: 'text-amber-400',
  },
} as const
