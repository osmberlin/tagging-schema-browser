import { auditPageHref } from '@/components/PageAudits/auditPageHref'
import { SchemaIssueAction, SchemaIssueAlert } from '@/components/ui/SchemaIssue'
import { schemaIssueStyles } from '@/theme/schemaIssue'

export function BrokenPresetIconsAlert({
  count,
  onShowBroken,
}: {
  count: number
  onShowBroken: () => void
}) {
  if (count <= 0) return null

  return (
    <SchemaIssueAlert variant="error" title="Broken icons">
      <strong>{count}</strong> {count === 1 ? 'preset references' : 'presets reference'} a missing
      preset icon —{' '}
      <SchemaIssueAction onClick={onShowBroken}>show broken preset icons</SchemaIssueAction>.
    </SchemaIssueAlert>
  )
}

export function MissingInheritanceAlerts({
  unreviewedCount,
  staleCount,
  dataUrl = '',
  locale = '',
}: {
  unreviewedCount: number
  staleCount: number
  dataUrl?: string
  locale?: string
}) {
  if (unreviewedCount <= 0 && staleCount <= 0) return null

  return (
    <SchemaIssueAlert variant="warning" title="Missing inheritance">
      {unreviewedCount > 0 ? (
        <>
          <strong>{unreviewedCount}</strong> {unreviewedCount === 1 ? 'preset has' : 'presets have'}{' '}
          unreviewed missing slash-parent field inheritance —{' '}
        </>
      ) : null}
      {staleCount > 0 ? (
        <>
          <strong>{staleCount}</strong> override{staleCount === 1 ? ' is' : 's are'} stale
          {unreviewedCount > 0 ? '; ' : ' — '}
        </>
      ) : null}
      <a
        href={auditPageHref({ slug: 'missing-inheritance', dataUrl, locale })}
        className={schemaIssueStyles.alertLink}
      >
        open audit page
      </a>
      .
    </SchemaIssueAlert>
  )
}

export function RiskyTypeComboAlerts({
  unreviewedCount,
  staleCount,
  dataUrl = '',
  locale = '',
}: {
  unreviewedCount: number
  staleCount: number
  dataUrl?: string
  locale?: string
}) {
  if (unreviewedCount <= 0 && staleCount <= 0) return null

  return (
    <SchemaIssueAlert variant="warning" title="Risky typeCombo">
      {unreviewedCount > 0 ? (
        <>
          <strong>{unreviewedCount}</strong>{' '}
          {unreviewedCount === 1 ? 'preset exposes' : 'presets expose'} a property{' '}
          <code>typeCombo</code> field that can add <code>=yes</code> when left empty —{' '}
        </>
      ) : null}
      {staleCount > 0 ? (
        <>
          <strong>{staleCount}</strong> risky typeCombo override{staleCount === 1 ? ' is' : 's are'}{' '}
          stale{unreviewedCount > 0 ? '; ' : ' — '}
        </>
      ) : null}
      <a
        href={auditPageHref({ slug: 'risky-typecombo', dataUrl, locale })}
        className={schemaIssueStyles.alertLink}
      >
        open audit page
      </a>
      .
    </SchemaIssueAlert>
  )
}

export function FieldIconMismatchAlert({
  count,
  onShowMismatch,
  showAction = true,
}: {
  count: number
  onShowMismatch?: () => void
  showAction?: boolean
}) {
  if (count <= 0) return null

  return (
    <SchemaIssueAlert variant="warning" title="Icon mismatch">
      <strong>{count}</strong> {count === 1 ? 'field has' : 'fields have'} icon mismatches between
      field options and child presets
      {showAction && onShowMismatch ? (
        <>
          {' '}
          — <SchemaIssueAction onClick={onShowMismatch}>show mismatched fields</SchemaIssueAction>.
        </>
      ) : (
        '.'
      )}
    </SchemaIssueAlert>
  )
}

export function FieldRiskyTypeComboAlert({
  count,
  dataUrl = '',
  locale = '',
}: {
  count: number
  dataUrl?: string
  locale?: string
}) {
  if (count <= 0) return null

  return (
    <SchemaIssueAlert variant="warning" title="Risky typeCombo">
      <strong>{count}</strong> {count === 1 ? 'typeCombo field looks' : 'typeCombo fields look'}{' '}
      like a property, not a type selector —{' '}
      <a
        href={auditPageHref({ slug: 'risky-typecombo', dataUrl, locale })}
        className={schemaIssueStyles.alertLink}
      >
        open audit page
      </a>
      .
    </SchemaIssueAlert>
  )
}
