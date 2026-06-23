import { clsx } from "clsx";
import { type ReactNode, useState } from "react";

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
          className="inline-flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-900"
        >
          <span aria-hidden className="w-4 shrink-0 text-slate-400">
            {open ? "▾" : "▸"}
          </span>
          <span>{title}</span>
          {subtitle ? <span className="font-normal text-slate-400">{subtitle}</span> : null}
        </button>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {open ? <div className="border-t border-slate-200">{children}</div> : null}
    </section>
  );
}
