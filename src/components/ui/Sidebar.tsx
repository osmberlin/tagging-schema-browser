import { twMerge } from "tailwind-merge";

export function Sidebar({ className, ...props }: React.ComponentPropsWithoutRef<"nav">) {
  return (
    <nav
      className={twMerge(
        "flex h-full min-h-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarHeader({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={twMerge("border-b border-zinc-200 p-4 dark:border-zinc-700", className)}
      {...props}
    />
  );
}

export function SidebarBody({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={twMerge(
        "flex-1 overflow-y-auto p-4 [&>[data-section]+[data-section]]:mt-6",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarSection({
  className,
  title,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { title?: string }) {
  return (
    <div data-section className={twMerge("flex flex-col gap-1", className)} {...props}>
      {title ? (
        <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}
