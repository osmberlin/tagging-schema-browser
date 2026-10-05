import type { LabelDiffPart, LabelMismatchKind } from '@/utils/labelMismatch'
import { cn } from '@/utils/tw'

const CHANGED_CLASS = {
  light: 'rounded bg-amber-100 px-1 text-amber-950',
  dark: 'rounded bg-amber-400/25 px-1 text-amber-100',
} as const

/** One side of `diffLabelWords`: the words that differ from the other label are marked. */
export function LabelDiff({
  parts,
  tone = 'light',
}: {
  parts: LabelDiffPart[]
  tone?: keyof typeof CHANGED_CLASS
}) {
  return (
    <span>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 ? ' ' : null}
          <span className={cn(part.changed && CHANGED_CLASS[tone])}>{part.text}</span>
        </span>
      ))}
    </span>
  )
}

const KIND_PILL = {
  differs: {
    label: 'different wording',
    title: 'The two labels name the same thing in different words.',
    light: 'bg-amber-100 text-amber-900',
    dark: 'bg-amber-400/20 text-amber-200',
  },
  extends: {
    label: 'adds words',
    title: 'One label is the other plus extra words, usually the feature type. Mostly wanted.',
    light: 'bg-slate-100 text-slate-600',
    dark: 'bg-slate-600/60 text-slate-200',
  },
} as const

/** How the two labels of a pair differ, see `classifyLabelMismatch`. */
export function LabelMismatchKindPill({
  kind,
  tone = 'light',
}: {
  kind: LabelMismatchKind
  tone?: 'light' | 'dark'
}) {
  const pill = KIND_PILL[kind]
  return (
    <span
      title={pill.title}
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        pill[tone],
      )}
    >
      {pill.label}
    </span>
  )
}
