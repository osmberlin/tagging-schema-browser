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

const KIND_CONFIG = {
  'missing-inheritance': {
    titlePrefix: '[missing-inheritance]',
    defaultTitleSuffix: '— intentional missing inheritance',
    removeStaleTitleSuffix: '— remove stale override',
    overrideFile: 'src/data/missing-inheritance-overrides.yaml',
    skillPath: '.agents/skills/apply-schema-override/SKILL.md',
    prTitleSuffix: 'missing inheritance as intentional',
    removeStalePrTitleSuffix: 'remove stale missing inheritance override',
  },
  'risky-typecombo': {
    titlePrefix: '[risky-typecombo]',
    defaultTitleSuffix: '— intentional risky typeCombo',
    removeStaleTitleSuffix: '— remove stale override',
    overrideFile: 'src/data/risky-typecombo-overrides.yaml',
    skillPath: '.agents/skills/apply-schema-override/SKILL.md',
    prTitleSuffix: 'risky typeCombo as intentional',
    removeStalePrTitleSuffix: 'remove stale risky typeCombo override',
  },
} as const satisfies Record<
  SchemaOverrideKind,
  {
    titlePrefix: string
    defaultTitleSuffix: string
    removeStaleTitleSuffix: string
    overrideFile: string
    skillPath: string
    prTitleSuffix: string
    removeStalePrTitleSuffix: string
  }
>

export type BuildSchemaOverrideIssueUrlInput = {
  kind: SchemaOverrideKind
  presetId: string
  snapshotYaml: string
  pageUrl: string
  dataUrl: string
  /** When updating a stale override, include the stored snapshot for diff context. */
  existingOverrideYaml?: string
  /** Live detection is gone; issue should remove the stored override entry. */
  removeStaleOnly?: boolean
}

function introSection(
  config: (typeof KIND_CONFIG)[SchemaOverrideKind],
  removeStaleOnly: boolean,
): string {
  const purpose = removeStaleOnly
    ? 'remove a stale schema override entry'
    : 'record an intentional schema override'

  return [
    '## About this request',
    '',
    `Opened from the **Tagging Schema Browser** to ${purpose}.`,
    '',
    `**When you submit** (keep the \`${config.titlePrefix}\` title prefix; you may edit the rest of the title):`,
    '',
    '1. GitHub Actions starts a Cursor cloud agent.',
    removeStaleOnly
      ? `2. The agent opens a PR that deletes the stale preset entry from \`${config.overrideFile}\`.`
      : `2. The agent opens a PR that merges the **Snapshot** below into \`${config.overrideFile}\`.`,
    '3. CI validates the change; PRs labeled `schema-override` can auto-merge when green.',
    '',
    'Review the preset links and details below, then submit the issue. No manual YAML editing is required.',
    '',
  ].join('\n')
}

function agentInstructions(
  config: (typeof KIND_CONFIG)[SchemaOverrideKind],
  removeStaleOnly: boolean,
): string {
  const applyStep = removeStaleOnly
    ? `2. **Commit 1:** Delete the \`${'{presetId}'}\` preset key from \`${config.overrideFile}\` (see **Remove stale override** below).`
    : `2. **Commit 1:** Parse the YAML snapshot under **Snapshot** below and merge into \`${config.overrideFile}\` under \`presets:\` (preserve sort order).`

  const prTitleSuffix = removeStaleOnly ? config.removeStalePrTitleSuffix : config.prTitleSuffix

  return [
    '## Agent instructions',
    '',
    `1. Follow [\`${config.skillPath}\`](${GITHUB_REPO_URL}/blob/main/${config.skillPath}).`,
    applyStep,
    '3. **Commit 2 (if needed):** Run `bun run check`. Remove or fix any *other* stale override entries in a separate commit so validation passes.',
    `4. Open a PR (1–2 commits) titled like \`[skip netlify] Overrides: mark {presetId} ${prTitleSuffix}\` with \`Closes #N\` in the body and add the \`schema-override\` label.`,
    '',
  ].join('\n')
}

function removalSection(presetId: string, existingOverrideYaml: string): string {
  return [
    '## Remove stale override',
    '',
    'Live detection no longer applies. Delete this preset entry:',
    '',
    '```yaml',
    'presets:',
    existingOverrideYaml,
    '```',
    '',
    `Remove the \`${presetId}\` key from the override file.`,
    '',
  ].join('\n')
}

function staleDiffSection(existingOverrideYaml: string): string {
  return [
    '## Existing override (stale)',
    '',
    'The stored override no longer matches live detection. Replace with the snapshot below.',
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
  const config = KIND_CONFIG[kind]
  const snapshotSection =
    !removeStaleOnly && snapshotYaml.trim().length > 0
      ? ['## Snapshot', '', '```yaml', 'version: 1', 'presets:', snapshotYaml, '```', ''].join('\n')
      : ''

  const staleSection =
    removeStaleOnly && existingOverrideYaml && existingOverrideYaml.trim().length > 0
      ? removalSection(presetId, existingOverrideYaml)
      : !removeStaleOnly && existingOverrideYaml && existingOverrideYaml.trim().length > 0
        ? staleDiffSection(existingOverrideYaml)
        : ''

  return [
    introSection(config, removeStaleOnly),
    '**Source branch:** `main`',
    '',
    `Preset: \`${presetId}\``,
    `Schema: ${dataUrl}`,
    `Browser: ${pageUrl}`,
    '',
    agentInstructions(config, removeStaleOnly),
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
  return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`
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
    existingOverrideYaml:
      removeStaleOnly || missingFieldInheritance ? storedOverrideYaml : undefined,
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
    existingOverrideYaml: removeStaleOnly || riskyTypeCombo ? storedOverrideYaml : undefined,
  })
}
