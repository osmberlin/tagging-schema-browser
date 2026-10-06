#!/usr/bin/env bun
/**
 * Validates `src/data/label-mismatch-overrides.yaml` against a schema dist: every entry must
 * still describe a field option whose label differs from its child preset name, with the same
 * two labels as recorded.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { denormalize } from '../src/components/PagePresets/denormalize.ts'
import { INTERIM_DATA_URL } from '../src/utils/constants.ts'
import {
  collectLabelMismatchPairs,
  labelMismatchKey,
  type LabelMismatchOverrides,
} from '../src/utils/labelMismatch.ts'
import { buildSchemaIndices } from '../src/utils/schemaIndices.ts'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const FILES = {
  presets: 'presets.min.json',
  fields: 'fields.min.json',
  categories: 'preset_categories.min.json',
  translations: 'translations/en.min.json',
} as const

type SchemaFiles = Record<keyof typeof FILES, never>

async function loadSchemaFromUrl(baseUrl: string): Promise<SchemaFiles> {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, file]) => {
      const response = await fetch(`${normalized}${file}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${file} from ${normalized} (${response.status})`)
      }
      return [key, await response.json()]
    }),
  )
  return Object.fromEntries(entries) as SchemaFiles
}

function loadSchemaFromDir(dir: string): SchemaFiles {
  return Object.fromEntries(
    Object.entries(FILES).map(([key, file]) => [
      key,
      JSON.parse(readFileSync(path.join(dir, file), 'utf8')),
    ]),
  ) as SchemaFiles
}

function loadOverrides(): LabelMismatchOverrides {
  const yamlPath = path.resolve(scriptDir, '../src/data/label-mismatch-overrides.yaml')
  const parsed = Bun.YAML.parse(readFileSync(yamlPath, 'utf8')) as LabelMismatchOverrides
  if (!parsed || parsed.version !== 1) {
    throw new Error(`${yamlPath}: expected version: 1`)
  }
  return { version: 1, fields: parsed.fields ?? {} }
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
const schemaSource = schemaDir ?? schemaUrl ?? INTERIM_DATA_URL
const schema = schemaDir
  ? loadSchemaFromDir(schemaDir)
  : await loadSchemaFromUrl(schemaUrl ?? INTERIM_DATA_URL)

const presets = denormalize(schema.presets, schema.translations, schema.categories, schema.fields)
const fieldTranslations =
  (schema.translations as { en?: { presets?: { fields?: never } } }).en?.presets?.fields ?? {}
const { fieldOptionMismatchRows } = buildSchemaIndices(presets, schema.fields, fieldTranslations)
const pairs = collectLabelMismatchPairs(fieldOptionMismatchRows, overrides)

const stale: string[] = []
const renamed: string[] = []
let count = 0

for (const [fieldId, entries] of Object.entries(overrides.fields)) {
  for (const entry of entries) {
    count += 1
    const label = `${fieldId} · ${entry.option} → ${entry.preset}`
    const pair = pairs.get(labelMismatchKey(fieldId, entry.option, entry.preset))
    if (!pair) stale.push(label)
    else if (!pair.reviewed) {
      renamed.push(
        `${label}: recorded "${entry.optionLabel}" ≠ "${entry.presetName}", now "${pair.optionLabel}" ≠ "${pair.childPresetName}"`,
      )
    }
  }
}

if (stale.length > 0 || renamed.length > 0) {
  const lines: string[] = [`Validation schema: ${schemaSource}`]
  if (stale.length > 0) {
    lines.push('Stale overrides (the labels match now, or the option lost its preset; remove):')
    for (const label of stale) lines.push(`  - ${label}`)
  }
  if (renamed.length > 0) {
    lines.push('Renamed since review (review again on /audits/label-mismatch):')
    for (const label of renamed) lines.push(`  - ${label}`)
  }
  console.error(lines.join('\n'))
  process.exit(1)
}

console.log(`Validated ${count} label-mismatch override(s) against ${schemaSource}.`)
