import { AreaIcon, type SchemaArea } from "@/components/ui/areaIcons";
import { Link, type LinkProps } from "@tanstack/react-router";
import { clsx } from "clsx";

type AreaLinkProps = {
  area: SchemaArea;
  className?: string;
  iconClassName?: string;
  children: React.ReactNode;
  title?: string;
} & Pick<LinkProps, "to" | "search" | "params">;

/** Cross-area navigation link that always shows the destination area icon. */
export function AreaLink({
  area,
  className,
  iconClassName,
  children,
  title,
  ...linkProps
}: AreaLinkProps) {
  return (
    <Link
      {...linkProps}
      title={title}
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium text-sky-600 transition hover:text-sky-700 hover:underline",
        className,
      )}
    >
      <AreaIcon area={area} className={clsx("h-3.5 w-3.5", iconClassName)} />
      <span>{children}</span>
    </Link>
  );
}
