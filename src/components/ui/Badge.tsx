import { twMerge } from "tailwind-merge";

type BadgeProps = React.ComponentPropsWithoutRef<"span"> & {
  variant?: "zinc" | "emerald" | "sky" | "amber";
};

export function Badge({ className, variant = "zinc", ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
        variant === "zinc" &&
          "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
        variant === "emerald" &&
          "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
        variant === "sky" &&
          "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400",
        variant === "amber" &&
          "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        className,
      )}
      {...props}
    />
  );
}
