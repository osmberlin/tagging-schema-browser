import { twMerge } from 'tailwind-merge'

/** Platform-aware label for the "Mod" key (⌘ on Apple, Ctrl elsewhere). */
export function modLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl'
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl'
}

export function Kbd({ className, ...props }: React.ComponentPropsWithoutRef<'kbd'>) {
  return (
    <kbd
      className={twMerge(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1.5 font-sans text-[11px] font-medium text-slate-500 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}
