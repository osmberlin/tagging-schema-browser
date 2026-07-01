import { twMerge } from 'tailwind-merge'

/** Small rounded count badge used wherever a number accompanies a label. */
export function CountPill({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={twMerge(
        'inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold text-slate-500',
        className,
      )}
      {...props}
    />
  )
}
