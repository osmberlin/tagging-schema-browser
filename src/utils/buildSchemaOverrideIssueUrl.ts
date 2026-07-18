import type {
  MissingFieldInheritance,
  MissingInheritanceOverride,
} from '@/components/PagePresets/missingFieldInheritance'
import {
  formatMissingInheritanceOverrideYaml,
  formatMissingInheritanceOverrideYamlFromStored,
} from '@/components/PagePresets/missingFieldInheritance'
import type {
  RiskyTypeCombo,
  RiskyTypeComboOverride,
} from '@/components/PagePresets/riskyTypeCombo'
import {
  formatRiskyTypeComboOverrideYaml,
  formatRiskyTypeComboOverrideYamlFromStored,
} from '@/components/PagePresets/riskyTypeCombo'
import { GITHUB_REPO_URL } from '@/utils/constants'

export type SchemaOverrideKind = 'missing-inheritance' | 'risky-typecombo'

/** Conservative limit for `issues/new?…` query strings in common browsers. */
export const SCHEMA_OVERRIDE_ISSUE_URL_MAX_LENGTH = 7500

const KIND_CONFIG = {
  'missing-inheritance': {
    titlePrefix: '[missing-inheritance]',
    defaultTitleSuffix: '— intentional missing inheritance',
    removeStaleTitleSuffix: '— remove stale override',
    overrideFile: 'src/data/missing-inheritance-overrides.yaml',
  },
  'risky-typecombo': {
    titlePrefix: '[risky-typecombo]',
    defaultTitleSuffix: '— intentional risky typeCombo',
    removeStaleTitleSuffix: '— remove stale override',
    overrideFile: 'src/data/risky-typecombo-overrides.yaml',
  },
} as const satisfies Record<
  SchemaOverrideKind,
  {
    titlePrefix: string
    defaultTitleSuffix: string
    removeStaleTitleSuffix: string
    overrideFile: string
  }
>

export type BuildSchemaOverrideIssueUrlInput = {
  kind: SchemaOverrideKind
  presetId: string
  snapshotYaml: string
  pageUrl: string
  dataUrl: string
  /** Stored override YAML — included for stale removal issues only. */
  existingOverrideYaml?: string
  /** Live detection is gone; issue should remove the stored override entry. */
  removeStaleOnly?: boolean
}

function introSection(
  config: (typeof KIND_CONFIG)[SchemaOverrideKind],
  removeStaleOnly: boolean,
): string {
  const action = removeStaleOnly ? 'Remove stale override' : 'Record intentional override'
  return [
    `${action} from the Tagging Schema Browser.`,
    `Keep the \`${config.titlePrefix}\` title prefix. Submit to enqueue a Cursor cloud agent that opens a PR for this override.`,
    '',
  ].join('\n')
}

function removalSection(existingOverrideYaml: string): string {
  return [
    '## Remove stale override',
    '',
    '```yaml',
    'presets:',
    existingOverrideYaml,
    '```',
    '',
  ].join('\n')
}

export function buildSchemaOverrideIssueBody({
  kind,
  presetId,
  snapshotYaml,
  pageUrl,
  dataUrl,
  existingOverrideYaml,
  removeStaleOnly = false,
}: BuildSchemaOverrideIssueUrlInput): string {
  const snapshotSection =
    !removeStaleOnly && snapshotYaml.trim().length > 0
      ? ['## Snapshot', '', '```yaml', 'version: 1', 'presets:', snapshotYaml, '```', ''].join('\n')
      : ''

  const staleSection =
    removeStaleOnly && existingOverrideYaml && existingOverrideYaml.trim().length > 0
      ? removalSection(existingOverrideYaml)
      : ''

  return [
    introSection(KIND_CONFIG[kind], removeStaleOnly),
    '**Source branch:** `main`',
    '',
    `Preset: \`${presetId}\``,
    `Schema: ${dataUrl}`,
    `Browser: ${pageUrl}`,
    '',
    snapshotSection,
    staleSection,
  ]
    .filter((section) => section.length > 0)
    .join('\n')
}

export function buildSchemaOverrideIssueTitle(
  kind: SchemaOverrideKind,
  presetId: string,
  removeStaleOnly = false,
): string {
  const config = KIND_CONFIG[kind]
  const suffix = removeStaleOnly ? config.removeStaleTitleSuffix : config.defaultTitleSuffix
  return `${config.titlePrefix} ${presetId} ${suffix}`
}

export function buildSchemaOverrideIssueUrl(input: BuildSchemaOverrideIssueUrlInput): string {
  const params = new URLSearchParams()
  params.set(
    'title',
    buildSchemaOverrideIssueTitle(input.kind, input.presetId, input.removeStaleOnly),
  )
  params.set('body', buildSchemaOverrideIssueBody(input))
  const url = `${GITHUB_REPO_URL}/issues/new?${params.toString()}`
  if (url.length > SCHEMA_OVERRIDE_ISSUE_URL_MAX_LENGTH) {
    throw new Error(
      `Schema override issue URL exceeds ${SCHEMA_OVERRIDE_ISSUE_URL_MAX_LENGTH} characters (${url.length}).`,
    )
  }
  return url
}

export function buildMissingInheritanceOverrideIssueUrl({
  presetId,
  missingFieldInheritance,
  pageUrl,
  dataUrl,
  existingOverride,
}: {
  presetId: string
  missingFieldInheritance?: MissingFieldInheritance | null
  pageUrl: string
  dataUrl: string
  existingOverride?: MissingInheritanceOverride
}): string {
  const storedOverride = existingOverride
  const removeStaleOnly = !missingFieldInheritance && storedOverride !== undefined
  const storedOverrideYaml =
    storedOverride !== undefined
      ? formatMissingInheritanceOverrideYamlFromStored(presetId, storedOverride)
      : undefined

  return buildSchemaOverrideIssueUrl({
    kind: 'missing-inheritance',
    presetId,
    snapshotYaml: missingFieldInheritance
      ? formatMissingInheritanceOverrideYaml(presetId, missingFieldInheritance)
      : '',
    pageUrl,
    dataUrl,
    removeStaleOnly,
    existingOverrideYaml: removeStaleOnly ? storedOverrideYaml : undefined,
  })
}

export function buildRiskyTypeComboOverrideIssueUrl({
  presetId,
  riskyTypeCombo,
  pageUrl,
  dataUrl,
  existingOverride,
}: {
  presetId: string
  riskyTypeCombo?: RiskyTypeCombo | null
  pageUrl: string
  dataUrl: string
  existingOverride?: RiskyTypeComboOverride
}): string {
  const storedOverride = existingOverride
  const removeStaleOnly = !riskyTypeCombo && storedOverride !== undefined
  const storedOverrideYaml =
    storedOverride !== undefined
      ? formatRiskyTypeComboOverrideYamlFromStored(presetId, storedOverride)
      : undefined

  return buildSchemaOverrideIssueUrl({
    kind: 'risky-typecombo',
    presetId,
    snapshotYaml: riskyTypeCombo ? formatRiskyTypeComboOverrideYaml(presetId, riskyTypeCombo) : '',
    pageUrl,
    dataUrl,
    removeStaleOnly,
    existingOverrideYaml: removeStaleOnly ? storedOverrideYaml : undefined,
  })
}
