import { SchemaIssueAction, SchemaIssueAlert } from '@/components/ui/SchemaIssue'

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
  onShowUnreviewed,
  onShowStale,
  showUnreviewed = true,
  showStale = true,
}: {
  unreviewedCount: number
  staleCount: number
  onShowUnreviewed: () => void
  onShowStale: () => void
  showUnreviewed?: boolean
  showStale?: boolean
}) {
  return (
    <>
      {showUnreviewed && unreviewedCount > 0 ? (
        <SchemaIssueAlert variant="warning" title="Missing inheritance">
          <strong>{unreviewedCount}</strong> {unreviewedCount === 1 ? 'preset has' : 'presets have'}{' '}
          unreviewed missing slash-parent field inheritance —{' '}
          <SchemaIssueAction onClick={onShowUnreviewed}>show unreviewed</SchemaIssueAction>.
        </SchemaIssueAlert>
      ) : null}
      {showStale && staleCount > 0 ? (
        <SchemaIssueAlert variant="error" title="Stale override">
          <strong>{staleCount}</strong> {staleCount === 1 ? 'override is' : 'overrides are'} stale —{' '}
          <SchemaIssueAction onClick={onShowStale}>show stale overrides</SchemaIssueAction>.
        </SchemaIssueAlert>
      ) : null}
    </>
  )
}

export function RiskyTypeComboAlerts({
  unreviewedCount,
  staleCount,
  onShowUnreviewed,
  onShowStale,
  showUnreviewed = true,
  showStale = true,
}: {
  unreviewedCount: number
  staleCount: number
  onShowUnreviewed: () => void
  onShowStale: () => void
  showUnreviewed?: boolean
  showStale?: boolean
}) {
  return (
    <>
      {showUnreviewed && unreviewedCount > 0 ? (
        <SchemaIssueAlert variant="warning" title="Risky typeCombo">
          <strong>{unreviewedCount}</strong>{' '}
          {unreviewedCount === 1 ? 'preset exposes' : 'presets expose'} a property{' '}
          <code>typeCombo</code> field that can add <code>=yes</code> when left empty —{' '}
          <SchemaIssueAction onClick={onShowUnreviewed}>show affected presets</SchemaIssueAction>.
        </SchemaIssueAlert>
      ) : null}
      {showStale && staleCount > 0 ? (
        <SchemaIssueAlert variant="error" title="Stale typeCombo override">
          <strong>{staleCount}</strong> risky typeCombo{' '}
          {staleCount === 1 ? 'override is' : 'overrides are'} stale —{' '}
          <SchemaIssueAction onClick={onShowStale}>show stale overrides</SchemaIssueAction>.
        </SchemaIssueAlert>
      ) : null}
    </>
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
  onShowRisky,
}: {
  count: number
  onShowRisky: () => void
}) {
  if (count <= 0) return null

  return (
    <SchemaIssueAlert variant="warning" title="Risky typeCombo">
      <strong>{count}</strong> {count === 1 ? 'typeCombo field looks' : 'typeCombo fields look'}{' '}
      like a property, not a type selector —{' '}
      <SchemaIssueAction onClick={onShowRisky}>show fields</SchemaIssueAction>.
    </SchemaIssueAlert>
  )
}
