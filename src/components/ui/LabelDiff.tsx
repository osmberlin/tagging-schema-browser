import type { LabelDiffPart } from '@/utils/labelMismatch'
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
