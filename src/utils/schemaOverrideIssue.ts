import type { MissingInheritanceOverride } from '@/components/PagePresets/missingFieldInheritance'
import { formatMissingInheritanceOverrideYaml } from '@/components/PagePresets/missingFieldInheritance'
import { GITHUB_REPO_URL } from '@/utils/constants'

/** Blockquote banner for schema override GitHub issues (submitter vs tool vs agent). */
export const SCHEMA_OVERRIDE_ATTRIBUTION_BANNER = [
  '> **You** — submitted this override from the Tagging Schema Browser.',
  '> **Tagging Schema Browser** — generated this issue body with the YAML snapshot.',
  '> **Cursor agent** — will merge the snapshot into the override file in a separate PR.',
].join('\n')

export type SchemaOverrideKind = 'missing-inheritance' | 'risky-typecombo'

export const SCHEMA_OVERRIDE_KIND_CONFIG = {
  'missing-inheritance': {
    template: 'missing-inheritance-override.md',
    titlePrefix: '[Missing inheritance override] ',
    kindLabel: 'missing-inheritance-override',
    overridesFile: 'src/data/missing-inheritance-overrides.yaml',
    skillPath: '.cursor/skills/apply-schema-override/SKILL.md',
    prTitleSuffix: 'missing inheritance as intentional',
  },
  'risky-typecombo': {
    template: 'risky-typecombo-override.md',
    titlePrefix: '[Risky typeCombo override] ',
    kindLabel: 'risky-typecombo-override',
    overridesFile: 'src/data/risky-typecombo-overrides.yaml',
    skillPath: '.cursor/skills/apply-schema-override/SKILL.md',
    prTitleSuffix: 'risky typeCombo as intentional',
  },
} as const satisfies Record<
  SchemaOverrideKind,
  {
    template: string
    titlePrefix: string
    kindLabel: string
    overridesFile: string
    skillPath: string
    prTitleSuffix: string
  }
>

export type BuildSchemaOverrideIssueUrlParams = {
  kind: SchemaOverrideKind
  presetId: string
  /** YAML block to paste under `presets:` (two-space indent under `presets:`). */
  snapshotYaml: string
  /** Full browser URL for the preset detail page. */
  pageUrl: string
  /** Active schema dist URL (`dataUrl` search param). */
  dataUrl: string
  /** When status is stale, YAML for the stored override entry (same shape as snapshotYaml). */
  staleOverrideYaml?: string
}

function formatStoredOverrideYaml(presetId: string, override: MissingInheritanceOverride): string {
  const lines: string[] = [`  ${presetId}:`]
  for (const fieldListKey of ['fields', 'moreFields'] as const) {
    const section = override[fieldListKey]
    if (!section) continue
    lines.push(`    ${fieldListKey}:`)
    lines.push(`      parentId: ${section.parentId}`)
    lines.push('      missedFieldIds:')
    for (const fieldId of section.missedFieldIds) {
      lines.push(`        - ${fieldId}`)
    }
  }
  return lines.join('\n')
}

export function formatMissingInheritanceStoredOverrideYaml(
  presetId: string,
  override: MissingInheritanceOverride,
): string {
  return formatStoredOverrideYaml(presetId, override)
}

export function formatSchemaOverrideIssueBody({
  kind,
  presetId,
  snapshotYaml,
  pageUrl,
  dataUrl,
  staleOverrideYaml,
}: BuildSchemaOverrideIssueUrlParams): string {
  const config = SCHEMA_OVERRIDE_KIND_CONFIG[kind]
  const skillUrl = `${GITHUB_REPO_URL}/blob/main/${config.skillPath}`

  const lines = [
    `# Schema override — ${presetId}`,
    '',
    SCHEMA_OVERRIDE_ATTRIBUTION_BANNER,
    '',
    `**Preset:** \`${presetId}\``,
    `**Schema dist:** \`${dataUrl}\``,
    `**Browser:** [open preset detail](${pageUrl})`,
    '',
    'Submit this issue to trigger a Cursor cloud agent via GitHub Actions. The agent opens a PR that updates the override YAML and adds the `schema-override` label for auto-merge after CI passes.',
    '',
    '## Agent instructions',
    '',
    `1. Follow [\`${config.skillPath}\`](${skillUrl}) (\`kind: ${kind}\`).`,
    `2. Merge the **YAML snapshot** below into \`${config.overridesFile}\` under \`presets:\` (preserve sort order).`,
    '3. Run `bun run check` (includes `validate-inheritance-overrides` for missing-inheritance).',
    '4. Open a PR titled `Overrides: mark {presetId} {suffix}` with `Closes #<issue-number>` and label `schema-override`.',
    '',
    `Replace \`{suffix}\` with: ${config.prTitleSuffix}.`,
    '',
  ]

  if (staleOverrideYaml) {
    lines.push(
      '## Stale override (stored)',
      '',
      'The stored override no longer matches live detection. Replace or remove this entry:',
      '',
      '```yaml',
      'version: 1',
      'presets:',
      staleOverrideYaml,
      '```',
      '',
      '## YAML snapshot (current detection)',
      '',
    )
  } else {
    lines.push('## YAML snapshot', '', 'Paste verbatim under `presets:` in the override file:', '')
  }

  lines.push('```yaml', 'version: 1', 'presets:', snapshotYaml, '```', '', '---', '')

  return lines.join('\n')
}

export function buildSchemaOverrideIssueUrl(params: BuildSchemaOverrideIssueUrlParams): string {
  const config = SCHEMA_OVERRIDE_KIND_CONFIG[params.kind]
  const search = new URLSearchParams({
    template: config.template,
    title: `${config.titlePrefix}${params.presetId}`,
    body: formatSchemaOverrideIssueBody(params),
  })
  return `${GITHUB_REPO_URL}/issues/new?${search.toString()}`
}

export function buildMissingInheritanceOverrideIssueUrl({
  presetId,
  missingFieldInheritance,
  pageUrl,
  dataUrl,
  storedOverride,
}: {
  presetId: string
  missingFieldInheritance: Parameters<typeof formatMissingInheritanceOverrideYaml>[1]
  pageUrl: string
  dataUrl: string
  storedOverride?: MissingInheritanceOverride
}): string {
  return buildSchemaOverrideIssueUrl({
    kind: 'missing-inheritance',
    presetId,
    snapshotYaml: formatMissingInheritanceOverrideYaml(presetId, missingFieldInheritance),
    pageUrl,
    dataUrl,
    staleOverrideYaml: storedOverride
      ? formatMissingInheritanceStoredOverrideYaml(presetId, storedOverride)
      : undefined,
  })
}
