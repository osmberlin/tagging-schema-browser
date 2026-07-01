import { useCallback } from 'react'
import { downloadJson } from '@/utils/download'
import { cn } from '@/utils/tw'

const TOOLTIP = 'Download JSON'

const secondaryButtonClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50'

function DownloadIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5M5 18h14"
      />
    </svg>
  )
}

type DownloadButtonProps = {
  filename: string
  data: unknown
  disabled?: boolean
  className?: string
}

export function DownloadButton({
  filename,
  data,
  disabled = false,
  className,
}: DownloadButtonProps) {
  const onDownload = useCallback(() => {
    downloadJson(filename, data)
  }, [data, filename])

  return (
    <button
      type="button"
      onClick={onDownload}
      disabled={disabled}
      className={cn(secondaryButtonClass, className)}
      aria-label={TOOLTIP}
      title={TOOLTIP}
    >
      <DownloadIcon className="h-4 w-4" />
    </button>
  )
}
