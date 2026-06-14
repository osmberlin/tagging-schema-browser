import { twMerge } from "tailwind-merge";

type BadgeProps = React.ComponentPropsWithoutRef<"span"> & {
  variant?: "zinc" | "emerald" | "sky" | "amber";
};

export function Badge({ className, variant = "zinc", ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
        variant === "zinc" && "bg-slate-100 text-slate-700 ring-1 ring-slate-200 ",
        variant === "emerald" && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 ",
        variant === "sky" && "bg-sky-50 text-sky-700 ring-1 ring-sky-200 ",
        variant === "amber" && "bg-amber-50 text-amber-700 ring-1 ring-amber-200 ",
        className,
      )}
      {...props}
    />
  );
}
