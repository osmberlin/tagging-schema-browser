import { useState } from 'react'
import { cn } from '@/utils/tw'

function DisclosureChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 transition group-hover:bg-rose-100"
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

type BuilderSectionDisclosureProps = {
  title: string
  description: string
  /** When true the section is always expanded and cannot be collapsed. */
  alwaysOpen?: boolean
  /** Expand on mount when the section has non-default committed values. */
  openWhen?: boolean
  children: React.ReactNode
}

export function BuilderSectionDisclosure({
  title,
  description,
  alwaysOpen = false,
  openWhen = false,
  children,
}: BuilderSectionDisclosureProps) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null)
  const isOpen = alwaysOpen || (userOpen ?? openWhen)

  if (alwaysOpen) {
    return (
      <section className="overflow-hidden rounded-xl bg-white shadow-xs outline outline-slate-900/5">
        <div className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-8">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <div>{children}</div>
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-xs outline outline-slate-900/5">
      <button
        type="button"
        onClick={() => setUserOpen((value) => !(value ?? openWhen))}
        aria-expanded={isOpen}
        className="group flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50/80"
      >
        <DisclosureChevron open={isOpen} />
        <span className="min-w-0 flex-1">
          <span className="font-display text-base font-semibold text-slate-900">{title}</span>
          <span className="mt-1 block text-sm font-normal text-slate-600">{description}</span>
        </span>
      </button>
      {isOpen ? <div className="border-t border-slate-100 px-5 py-5">{children}</div> : null}
    </section>
  )
}
