import { type ReactNode, useState } from 'react'
import { AreaIcon, type SchemaArea } from '@/components/ui/areaIcons'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'

function DisclosureChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition group-hover:bg-slate-200"
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
        className={cn('h-4 w-4 transition-transform duration-150', open && 'rotate-90')}
      >
        <title>Toggle section</title>
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  )
}

export function DetailDisclosure({
  title,
  area,
  subtitle,
  actions,
  defaultOpen = false,
  children,
  className,
}: {
  title: string
  area?: SchemaArea
  subtitle?: ReactNode
  actions?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'group flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50',
        )}
      >
        <DisclosureChevron open={open} />
        <span className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5">
            {area ? (
              <AreaIcon area={area} className={cn('h-3.5 w-3.5 shrink-0', areaAccent[area].icon)} />
            ) : null}
            <span>{title}</span>
          </span>
          {subtitle ? <span className="ml-2 font-normal text-slate-400">{subtitle}</span> : null}
        </span>
        {actions ? (
          <span
            className="flex flex-wrap items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {actions}
          </span>
        ) : null}
      </button>
      {open ? <div className="border-t border-slate-200">{children}</div> : null}
    </section>
  )
}
