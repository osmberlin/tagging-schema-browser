import type { ReactNode } from 'react'
import { cn } from '@/utils/tw'

/** Grid columns for translation attribute tables (label + English [+ locale]). */
export function translationGridClass(showLocale: boolean) {
  return showLocale ? 'grid-cols-[9rem_1fr] sm:grid-cols-[10rem_1fr_1fr]' : 'grid-cols-[9rem_1fr]'
}

export const translationLabelClass =
  'min-w-0 break-words text-xs font-semibold tracking-wide text-slate-500 uppercase'

export function TranslationAttrRow({
  label,
  english,
  localized,
  showLocale,
}: {
  label: string
  english: ReactNode
  localized?: ReactNode
  showLocale: boolean
}) {
  return (
    <div
      className={cn(
        'grid items-start gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-2',
        translationGridClass(showLocale),
      )}
    >
      <div className={translationLabelClass}>{label}</div>
      <div className="min-w-0 text-sm text-slate-900 sm:col-start-2">{english}</div>
      {showLocale ? (
        <div className="col-start-2 min-w-0 text-sm text-slate-900 sm:col-start-3">{localized}</div>
      ) : null}
    </div>
  )
}

export function TranslationColumnHeader({
  showLocale,
  locale,
  englishHeader,
}: {
  showLocale: boolean
  locale?: string
  englishHeader: ReactNode
}) {
  return (
    <div
      className={cn(
        'grid gap-x-4 px-4 pt-2 text-[11px] font-medium text-slate-400',
        translationGridClass(showLocale),
      )}
    >
      <div />
      <div className="min-w-0 sm:col-start-2">{englishHeader}</div>
      {showLocale && locale ? (
        <div className="col-start-2 min-w-0 font-mono sm:col-start-3">{locale}</div>
      ) : null}
    </div>
  )
}
