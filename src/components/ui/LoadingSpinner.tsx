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

export function SchemaLoadingPanel({ label = 'Loading schema…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <LoadingSpinner size="lg" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
