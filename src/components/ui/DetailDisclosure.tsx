import { clsx } from "clsx";
import { type ReactNode, useState } from "react";

function DisclosureChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500"
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
        className={clsx("h-4 w-4 transition-transform duration-150", open && "rotate-90")}
      >
        <title>Toggle section</title>
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export function DetailDisclosure({
  title,
  subtitle,
  actions,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={clsx("rounded-xl border border-slate-200 bg-white", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex min-w-0 flex-1 items-center gap-2.5 text-left text-sm font-semibold text-slate-900"
        >
          <DisclosureChevron open={open} />
          <span>{title}</span>
          {subtitle ? <span className="font-normal text-slate-400">{subtitle}</span> : null}
        </button>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {open ? <div className="border-t border-slate-200">{children}</div> : null}
    </section>
  );
}
