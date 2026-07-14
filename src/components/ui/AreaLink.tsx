import { Link, type LinkProps } from '@tanstack/react-router'
import { AreaIcon, type SchemaArea } from '@/components/ui/areaIcons'
import { areaLinkClass } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'

type AreaLinkProps = {
  area: SchemaArea
  /** Icon area when it should differ from link color (e.g. presets filter with icons icon). */
  iconArea?: SchemaArea
  className?: string
  iconClassName?: string
  children: React.ReactNode
  title?: string
} & Pick<LinkProps, 'to' | 'search' | 'params'>

/** Cross-area navigation link that always shows the destination area icon. */
export function AreaLink({
  area,
  iconArea,
  className,
  iconClassName,
  children,
  title,
  ...linkProps
}: AreaLinkProps) {
  const icon = iconArea ?? area
  return (
    <Link
      {...linkProps}
      title={title}
      className={cn('group inline-flex items-center gap-1.5', areaLinkClass(area), className)}
    >
      <AreaIcon area={icon} className={cn('h-3.5 w-3.5 shrink-0', iconClassName)} />
      <span className="min-w-0">{children}</span>
    </Link>
  )
}
