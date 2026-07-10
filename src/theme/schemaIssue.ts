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
  disclosureProse:
    'prose prose-sm prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-slate-950/70 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.85em] prose-code:font-normal prose-code:text-slate-100 prose-code:ring-1 prose-code:ring-inset prose-code:ring-slate-600/70',
  disclosureBodyInset: 'rounded-md border border-slate-600/80 bg-slate-900/50',
  code: 'rounded bg-slate-950/70 px-1 py-0.5 font-mono text-[0.85em] font-normal text-slate-100 ring-1 ring-inset ring-slate-600/70',
  externalLink:
    'font-mono text-[0.85em] font-medium text-mauve-300 underline decoration-mauve-400/50 underline-offset-2 hover:text-mauve-200 hover:decoration-mauve-200',
  icon: {
    error: 'text-rose-400',
    warning: 'text-amber-400',
  },
} as const
