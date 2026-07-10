import { useSchemaIssueDisclosureOpen } from '@/features/schema-issue/schema-issue-disclosure-store'
import type { SchemaIssueVariant } from '@/theme/schemaIssue'
import { schemaIssueStyles } from '@/theme/schemaIssue'
import { cn } from '@/utils/tw'

export function SchemaIssueIcon({
  variant,
  className,
}: {
  variant: SchemaIssueVariant
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={cn('h-4 w-4 shrink-0', schemaIssueStyles.icon[variant], className)}
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5.75ZM10.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function SchemaIssueAlert({
  variant,
  title,
  children,
  className,
}: {
  variant: SchemaIssueVariant
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        schemaIssueStyles.alert,
        'flex flex-wrap items-center gap-x-2 gap-y-1',
        className,
      )}
    >
      <SchemaIssueIcon variant={variant} />
      <span className={schemaIssueStyles.alertTitle}>{title}</span>
      <span className={schemaIssueStyles.alertDivider} aria-hidden>
        —
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  )
}

export function SchemaIssueAction({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className={schemaIssueStyles.alertLink}>
      {children}
    </button>
  )
}

function DisclosureChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={cn(
        'h-4 w-4 shrink-0 transition-transform',
        schemaIssueStyles.disclosureChevron,
        open && 'rotate-90',
      )}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function SchemaIssueDisclosure({
  disclosureId,
  variant,
  title,
  summary,
  children,
  className,
  bodyClassName,
}: {
  disclosureId: string
  variant: SchemaIssueVariant
  title: string
  summary?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  const [open, setOpen] = useSchemaIssueDisclosureOpen(disclosureId)
  const proseDisabled = bodyClassName?.includes('not-prose')

  return (
    <section className={cn(schemaIssueStyles.disclosure, className)} aria-label={title}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={schemaIssueStyles.disclosureHeader}
      >
        <DisclosureChevron open={open} />
        <SchemaIssueIcon variant={variant} />
        <span className={schemaIssueStyles.disclosureTitle}>{title}</span>
        {summary ? (
          <>
            <span className={schemaIssueStyles.alertDivider} aria-hidden>
              —
            </span>
            <span className={schemaIssueStyles.disclosureSummary}>{summary}</span>
          </>
        ) : null}
      </button>
      {open ? (
        <div
          className={cn(
            schemaIssueStyles.disclosureBody,
            !proseDisabled && schemaIssueStyles.disclosureProse,
            bodyClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  )
}
