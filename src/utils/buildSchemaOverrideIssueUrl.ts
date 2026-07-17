import type { MissingInheritanceOverride } from '@/components/PagePresets/missingFieldInheritance'
import { formatMissingInheritanceOverrideYaml } from '@/components/PagePresets/missingFieldInheritance'
import type {
  RiskyTypeCombo,
  RiskyTypeComboOverride,
} from '@/components/PagePresets/riskyTypeCombo'
import { formatRiskyTypeComboOverrideYaml } from '@/components/PagePresets/riskyTypeCombo'
import { GITHUB_REPO_URL } from '@/utils/constants'

export type SchemaOverrideKind = 'missing-inheritance' | 'risky-typecombo'

const KIND_CONFIG = {
  'missing-inheritance': {
    titlePrefix: '[missing-inheritance]',
    defaultTitleSuffix: '— intentional missing inheritance',
    overrideFile: 'src/data/missing-inheritance-overrides.yaml',
    skillPath: '.agents/skills/apply-schema-override/SKILL.md',
    prTitleSuffix: 'missing inheritance as intentional',
  },
  'risky-typecombo': {
    titlePrefix: '[risky-typecombo]',
    defaultTitleSuffix: '— intentional risky typeCombo',
    overrideFile: 'src/data/risky-typecombo-overrides.yaml',
    skillPath: '.agents/skills/apply-schema-override/SKILL.md',
    prTitleSuffix: 'risky typeCombo as intentional',
  },
} as const satisfies Record<
  SchemaOverrideKind,
  {
    titlePrefix: string
    defaultTitleSuffix: string
    overrideFile: string
    skillPath: string
    prTitleSuffix: string
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
}

function introSection(config: (typeof KIND_CONFIG)[SchemaOverrideKind]): string {
  return [
    '## About this request',
    '',
    'Opened from the **Tagging Schema Browser** to record an intentional schema override.',
    '',
    `**When you submit** (keep the \`${config.titlePrefix}\` title prefix; you may edit the rest of the title):`,
    '',
    '1. GitHub Actions starts a Cursor cloud agent.',
    `2. The agent opens a PR that merges the **Snapshot** below into \`${config.overrideFile}\`.`,
    '3. CI validates the change; PRs labeled `schema-override` can auto-merge when green.',
    '',
    'Review the preset links and snapshot below, then submit the issue. No manual YAML editing is required.',
    '',
  ].join('\n')
}

function agentInstructions(config: (typeof KIND_CONFIG)[SchemaOverrideKind]): string {
  return [
    '## Agent instructions',
    '',
    `1. Follow [\`${config.skillPath}\`](${GITHUB_REPO_URL}/blob/main/${config.skillPath}).`,
    `2. **Commit 1:** Parse the YAML snapshot under **Snapshot** below and merge into \`${config.overrideFile}\` under \`presets:\` (preserve sort order).`,
    '3. **Commit 2 (if needed):** Run `bun run check`. Remove or fix any *other* stale override entries in a separate commit so validation passes.',
    `4. Open a PR (1–2 commits) titled like \`[skip netlify] Overrides: mark {presetId} ${config.prTitleSuffix}\` with \`Closes #N\` in the body and add the \`schema-override\` label.`,
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
}: BuildSchemaOverrideIssueUrlInput): string {
  const config = KIND_CONFIG[kind]
  const staleSection =
    existingOverrideYaml && existingOverrideYaml.trim().length > 0
      ? [
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
      : ''

  return [
    introSection(config),
    '**Source branch:** `main`',
    '',
    `Preset: \`${presetId}\``,
    `Schema: ${dataUrl}`,
    `Browser: ${pageUrl}`,
    '',
    agentInstructions(config),
    '## Snapshot',
    '',
    '```yaml',
    'version: 1',
    'presets:',
    snapshotYaml,
    '```',
    '',
    staleSection,
  ]
    .filter((section) => section.length > 0)
    .join('\n')
}

export function buildSchemaOverrideIssueTitle(kind: SchemaOverrideKind, presetId: string): string {
  const config = KIND_CONFIG[kind]
  return `${config.titlePrefix} ${presetId} ${config.defaultTitleSuffix}`
}

export function buildSchemaOverrideIssueUrl(input: BuildSchemaOverrideIssueUrlInput): string {
  const params = new URLSearchParams()
  params.set('title', buildSchemaOverrideIssueTitle(input.kind, input.presetId))
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
  missingFieldInheritance: Parameters<typeof formatMissingInheritanceOverrideYaml>[1]
  pageUrl: string
  dataUrl: string
  existingOverride?: MissingInheritanceOverride
}): string {
  return buildSchemaOverrideIssueUrl({
    kind: 'missing-inheritance',
    presetId,
    snapshotYaml: formatMissingInheritanceOverrideYaml(presetId, missingFieldInheritance),
    pageUrl,
    dataUrl,
    existingOverrideYaml:
      existingOverride !== undefined
        ? formatMissingInheritanceOverrideYaml(presetId, {
            fields: existingOverride.fields
              ? {
                  parentId: existingOverride.fields.parentId,
                  missedFieldIds: existingOverride.fields.missedFieldIds,
                  explicitPresetRefs: [],
                }
              : undefined,
            moreFields: existingOverride.moreFields
              ? {
                  parentId: existingOverride.moreFields.parentId,
                  missedFieldIds: existingOverride.moreFields.missedFieldIds,
                  explicitPresetRefs: [],
                }
              : undefined,
          })
        : undefined,
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
  riskyTypeCombo: RiskyTypeCombo
  pageUrl: string
  dataUrl: string
  existingOverride?: RiskyTypeComboOverride
}): string {
  return buildSchemaOverrideIssueUrl({
    kind: 'risky-typecombo',
    presetId,
    snapshotYaml: formatRiskyTypeComboOverrideYaml(presetId, riskyTypeCombo),
    pageUrl,
    dataUrl,
    existingOverrideYaml:
      existingOverride !== undefined
        ? formatRiskyTypeComboOverrideYaml(presetId, {
            fields: existingOverride.fieldIds.map((fieldId) => ({
              fieldId,
              fieldKey: fieldId,
              listKey: 'fields' as const,
            })),
          })
        : undefined,
  })
}
