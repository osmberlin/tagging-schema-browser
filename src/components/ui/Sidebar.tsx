import { AreaIcon, type SchemaArea } from "@/components/ui/areaIcons";
import { areaAccent } from "@/theme/areaAccent";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function SidebarSection({
  className,
  title,
  area,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { title?: string; area?: SchemaArea }) {
  return (
    <div className={twMerge("flex flex-col gap-1", className)} {...props}>
      {title ? (
        <h3 className="mb-2 flex items-center gap-1.5 px-1 font-display text-sm font-medium text-slate-900">
          {area ? (
            <AreaIcon
              area={area}
              className={clsx("h-3.5 w-3.5 shrink-0", areaAccent[area].iconSection)}
            />
          ) : null}
          <span>{title}</span>
        </h3>
      ) : null}
      {children}
    </div>
  );
}
