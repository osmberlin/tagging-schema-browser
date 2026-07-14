import { cn } from '@/utils/tw'

/** Lightweight CSS spinner — keeps the main thread free for Motion / UI animations. */
export function LoadingSpinner({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass =
    size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-8 w-8 border-[3px]' : 'h-5 w-5 border-2'
  return (
    <span
      role="status"
      aria-hidden={className?.includes('sr-only') ? undefined : true}
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-slate-200 border-t-sky-600',
        sizeClass,
        className,
      )}
    />
  )
}

function SchemaLoadingCard({
  label,
  spinnerSize = 'lg',
}: {
  label: string
  spinnerSize?: 'md' | 'lg'
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-5 py-4 shadow-lg shadow-slate-900/5">
      <LoadingSpinner size={spinnerSize} />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  )
}

/** Full-page schema load — used when there is no cached data yet. */
export function SchemaLoadingPanel({ label = 'Loading schema…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-[min(70vh,calc(100svh-10rem))] flex-col items-center justify-center px-4"
      aria-live="polite"
    >
      <SchemaLoadingCard label={label} />
    </div>
  )
}

/** Floating schema refresh — used when data is already on screen (refetch / reference switch). */
export function SchemaLoadingFloat({ label }: { label: string }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-50 flex justify-center px-4 sm:top-16"
      aria-live="polite"
      role="status"
    >
      <SchemaLoadingCard label={label} spinnerSize="md" />
    </div>
  )
}
