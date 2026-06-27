import type { SchemaArea } from "@/components/ui/areaIcons";
import { areaAccent } from "@/theme/areaAccent";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export const Input = forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input"> & { area?: SchemaArea }
>(function Input({ className, area = "presets", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={twMerge(
        "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm",
        "placeholder:text-slate-400",
        areaAccent[area].focus,
        className,
      )}
      {...props}
    />
  );
});
