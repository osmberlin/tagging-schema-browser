#!/usr/bin/env bun
/**
 * Validates `src/data/risky-typecombo-overrides.yaml` against a schema dist.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolvePresetFieldList } from '../src/components/PagePresets/presetFieldInheritance.ts'
import {
  detectRiskyTypeCombo,
  resolveRiskyTypeComboStatus,
  type RiskyTypeComboOverrides,
} from '../src/components/PagePresets/riskyTypeCombo.ts'
import { RELEASE_DATA_URL } from '../src/utils/constants.ts'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
type SchemaFiles = {
  presets: Record<string, unknown>
  fields: Record<string, unknown>
}

async function loadSchemaFromUrl(baseUrl: string): Promise<SchemaFiles> {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const [presetsRes, fieldsRes] = await Promise.all([
    fetch(`${normalized}presets.min.json`),
    fetch(`${normalized}fields.min.json`),
  ])
  if (!presetsRes.ok) {
    throw new Error(`Failed to fetch presets.min.json from ${normalized} (${presetsRes.status})`)
  }
  if (!fieldsRes.ok) {
    throw new Error(`Failed to fetch fields.min.json from ${normalized} (${fieldsRes.status})`)
  }
  return {
    presets: (await presetsRes.json()) as Record<string, unknown>,
    fields: (await fieldsRes.json()) as Record<string, unknown>,
  }
}

function loadSchemaFromDir(dir: string): SchemaFiles {
  return {
    presets: JSON.parse(readFileSync(path.join(dir, 'presets.min.json'), 'utf8')) as Record<
      string,
      unknown
    >,
    fields: JSON.parse(readFileSync(path.join(dir, 'fields.min.json'), 'utf8')) as Record<
      string,
      unknown
    >,
  }
}

function loadOverrides(): RiskyTypeComboOverrides {
  const yamlPath = path.resolve(scriptDir, '../src/data/risky-typecombo-overrides.yaml')
  const parsed = Bun.YAML.parse(readFileSync(yamlPath, 'utf8')) as RiskyTypeComboOverrides
  if (!parsed || parsed.version !== 1) {
    throw new Error(`${yamlPath}: expected version: 1`)
  }
  return { version: 1, presets: parsed.presets ?? {} }
}

function parseArgs(argv: string[]): { schemaUrl?: string; schemaDir?: string } {
  let schemaUrl: string | undefined
  let schemaDir: string | undefined
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--schema') {
      schemaUrl = argv[index + 1]
      index += 1
    } else if (arg === '--dir') {
      schemaDir = path.resolve(argv[index + 1] ?? '')
      index += 1
    }
  }
  return { schemaUrl, schemaDir }
}

const { schemaUrl, schemaDir } = parseArgs(process.argv.slice(2))
const overrides = loadOverrides()
const schemaSource = schemaDir ?? schemaUrl ?? RELEASE_DATA_URL
const schema = schemaDir
  ? loadSchemaFromDir(schemaDir)
  : await loadSchemaFromUrl(schemaUrl ?? RELEASE_DATA_URL)

const stale: string[] = []
const unknownOverrides: string[] = []

for (const [presetId, override] of Object.entries(overrides.presets)) {
  const preset = schema.presets[presetId]
  if (!preset) {
    unknownOverrides.push(presetId)
    continue
  }

  const resolvedFields = resolvePresetFieldList(
    presetId,
    preset as never,
    'fields',
    schema.presets as never,
    schema.fields as never,
  )
  const resolvedMoreFields = resolvePresetFieldList(
    presetId,
    preset as never,
    'moreFields',
    schema.presets as never,
    schema.fields as never,
  )
  const current = detectRiskyTypeCombo(
    preset as never,
    resolvedFields,
    resolvedMoreFields,
    schema.fields as never,
  )
  const status = resolveRiskyTypeComboStatus(current, override)
  if (status === 'stale') stale.push(presetId)
}

if (unknownOverrides.length > 0 || stale.length > 0) {
  const lines: string[] = []
  if (unknownOverrides.length > 0) {
    lines.push(
      `Override entries reference presets that are absent from the validation schema (${schemaSource}):`,
    )
    for (const presetId of unknownOverrides) lines.push(`  - ${presetId}`)
  }
  if (stale.length > 0) {
    lines.push('Stale overrides (re-review and update fieldIds or remove entry):')
    for (const presetId of stale) lines.push(`  - ${presetId}`)
  }
  console.error(lines.join('\n'))
  process.exit(1)
}

console.log(
  `Validated ${Object.keys(overrides.presets).length} risky-typecombo override(s) against ${schemaSource}.`,
)
