import type { SchemaArea } from '@/components/ui/areaIcons'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'

type SortSelectProps = {
  value: string
  onChange: (value: string) => void
  'aria-label': string
  area?: SchemaArea
  className?: string
  children: React.ReactNode
}

/** Header sort dropdown — label-free, matches the icons page control. */
export function SortSelect({
  value,
  onChange,
  'aria-label': ariaLabel,
  area = 'icons',
  className,
  children,
}: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className={cn(
        'min-w-[12.5rem] rounded-lg border border-slate-300 bg-white py-1.5 pr-9 pl-3 text-sm text-slate-900 shadow-sm transition',
        areaAccent[area].focus,
        className,
      )}
    >
      {children}
    </select>
  )
}
