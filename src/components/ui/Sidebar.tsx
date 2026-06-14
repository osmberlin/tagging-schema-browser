import { twMerge } from "tailwind-merge";

export function SidebarSection({
  className,
  title,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { title?: string }) {
  return (
    <div className={twMerge("flex flex-col gap-1", className)} {...props}>
      {title ? (
        <h3 className="mb-2 px-1 font-display text-sm font-medium text-slate-900">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}
