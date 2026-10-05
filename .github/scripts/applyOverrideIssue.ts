/**
 * Applies the ```json override-changes block of a schema override issue to the override YAML file.
 * Run by .github/workflows/schema-override-pr.yml; the workflow then opens the PR.
 *
 * Env: ISSUE_TITLE, ISSUE_BODY. Writes `kind` and `file` to $GITHUB_OUTPUT.
 */
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import {
  applyLabelMismatchChanges,
  applyMissingInheritanceChanges,
  applyRiskyTypeComboChanges,
  parseOverrideChangeBlock,
  serializeLabelMismatchYaml,
  serializeMissingInheritanceYaml,
  serializeRiskyTypeComboYaml,
  yamlHeader,
} from '../../src/components/PageAudits/overrideChanges.ts'

const FILES = {
  'missing-inheritance': 'src/data/missing-inheritance-overrides.yaml',
  'risky-typecombo': 'src/data/risky-typecombo-overrides.yaml',
  'label-mismatch': 'src/data/label-mismatch-overrides.yaml',
} as const

const title = process.env.ISSUE_TITLE ?? ''
const changeSet = parseOverrideChangeBlock(process.env.ISSUE_BODY ?? '')
if (!title.startsWith(`[${changeSet.kind}]`)) {
  throw new Error(`Issue title must start with [${changeSet.kind}]`)
}

const file = FILES[changeSet.kind]
const content = readFileSync(file, 'utf8')
const parsed = Bun.YAML.parse(content) as {
  presets?: Record<string, never>
  fields?: Record<string, never>
}
const presets = parsed.presets ?? {}
const header = yamlHeader(content)

const next =
  changeSet.kind === 'label-mismatch'
    ? serializeLabelMismatchYaml(
        header,
        applyLabelMismatchChanges(parsed.fields ?? {}, changeSet.changes),
      )
    : changeSet.kind === 'missing-inheritance'
      ? serializeMissingInheritanceYaml(
          header,
          applyMissingInheritanceChanges(presets, changeSet.changes),
        )
      : serializeRiskyTypeComboYaml(header, applyRiskyTypeComboChanges(presets, changeSet.changes))

writeFileSync(file, next)
console.log(`Applied ${changeSet.changes.length} change(s) to ${file}`)
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `kind=${changeSet.kind}\nfile=${file}\n`)
}
