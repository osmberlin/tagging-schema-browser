import type { MissingInheritanceOverride } from '@/components/PagePresets/missingFieldInheritance'
import { formatMissingInheritanceOverrideYaml } from '@/components/PagePresets/missingFieldInheritance'
import { GITHUB_REPO_URL } from '@/utils/constants'

export type SchemaOverrideKind = 'missing-inheritance' | 'risky-typecombo'

const KIND_CONFIG = {
  'missing-inheritance': {
    template: 'missing-inheritance-override.md',
    labels: ['cursor-override', 'missing-inheritance-override'],
    overrideFile: 'src/data/missing-inheritance-overrides.yaml',
    skillPath: '.agents/skills/apply-schema-override/SKILL.md',
    titlePrefix: 'Overrides: mark',
    titleSuffix: 'missing inheritance as intentional',
  },
  'risky-typecombo': {
    template: 'risky-typecombo-override.md',
    labels: ['cursor-override', 'risky-typecombo-override'],
    overrideFile: 'src/data/risky-typecombo-overrides.yaml',
    skillPath: '.agents/skills/apply-schema-override/SKILL.md',
    titlePrefix: 'Overrides: mark',
    titleSuffix: 'risky typeCombo as intentional',
  },
} as const satisfies Record<
  SchemaOverrideKind,
  {
    template: string
    labels: string[]
    overrideFile: string
    skillPath: string
    titlePrefix: string
    titleSuffix: string
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

function attributionBanner(): string {
  return [
    '> **You** — submitted from the Tagging Schema Browser (see links below).',
    '> **Tagging Schema Browser** — generated this issue body with the YAML snapshot.',
    '> **Cursor agent** — will merge the snapshot into the override file via PR.',
    '',
  ].join('\n')
}

function agentInstructions(config: (typeof KIND_CONFIG)[SchemaOverrideKind]): string {
  return [
    '## Agent instructions',
    '',
    `1. Follow [\`${config.skillPath}\`](${GITHUB_REPO_URL}/blob/main/${config.skillPath}).`,
    `2. Parse the YAML snapshot under **Snapshot** below and merge into \`${config.overrideFile}\` under \`presets:\` (preserve sort order).`,
    '3. Run `bun run check` (includes override validation).',
    `4. Open a PR titled like \`${config.titlePrefix} {presetId} ${config.titleSuffix}\` with \`Closes #N\` in the body and add the \`schema-override\` label.`,
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
    attributionBanner(),
    '**Source branch:** `main`',
    '',
    `Preset: \`${presetId}\``,
    `Schema: ${dataUrl}`,
    `Browser: ${pageUrl}`,
    '',
    agentInstructions(config),
    '## Snapshot',
    '',
    'Paste this block verbatim under `presets:` in the override file:',
    '',
    '```yaml',
    'version: 1',
    'presets:',
    snapshotYaml,
    '```',
    '',
    staleSection,
    `Submit with labels \`${config.labels.join('`, `')}\` to trigger a Cursor cloud agent via GitHub Actions.`,
  ]
    .filter((section) => section.length > 0)
    .join('\n')
}

export function buildSchemaOverrideIssueUrl(input: BuildSchemaOverrideIssueUrlInput): string {
  const config = KIND_CONFIG[input.kind]
  const params = new URLSearchParams()
  params.set('template', config.template)
  params.set('title', `${config.titlePrefix} ${input.presetId} ${config.titleSuffix}`)
  params.set('labels', config.labels.join(','))
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
