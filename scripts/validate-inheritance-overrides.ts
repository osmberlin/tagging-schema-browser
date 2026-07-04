#!/usr/bin/env bun
/**
 * Validates `src/data/missing-inheritance-overrides.yaml` against a schema dist.
 *
 * Fails when an override snapshot no longer matches the live preset (stale).
 * Pass `--schema <url>` to check a release dist; defaults to public/test-schema.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  detectMissingFieldInheritance,
  resolveMissingInheritanceStatus,
  type MissingInheritanceOverrides,
} from '../src/components/PagePresets/missingFieldInheritance.ts'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_SCHEMA_DIR = path.resolve(scriptDir, '../public/test-schema')

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

function loadOverrides(): MissingInheritanceOverrides {
  const yamlPath = path.resolve(scriptDir, '../src/data/missing-inheritance-overrides.yaml')
  const parsed = Bun.YAML.parse(readFileSync(yamlPath, 'utf8')) as MissingInheritanceOverrides
  if (!parsed || parsed.version !== 1) {
    throw new Error(`${yamlPath}: expected version: 1`)
  }
  return { version: 1, presets: parsed.presets ?? {} }
}

function parseArgs(argv: string[]): { schemaUrl?: string; schemaDir: string } {
  let schemaUrl: string | undefined
  let schemaDir = DEFAULT_SCHEMA_DIR
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
const schema = schemaUrl ? await loadSchemaFromUrl(schemaUrl) : loadSchemaFromDir(schemaDir)

const stale: string[] = []
const unknownOverrides: string[] = []

for (const [presetId, override] of Object.entries(overrides.presets)) {
  const preset = schema.presets[presetId]
  if (!preset) {
    unknownOverrides.push(presetId)
    continue
  }

  const current = detectMissingFieldInheritance(
    presetId,
    preset as never,
    schema.presets as never,
    schema.fields as never,
  )
  const status = resolveMissingInheritanceStatus(current, override)
  if (status === 'stale') stale.push(presetId)
}

if (unknownOverrides.length > 0 || stale.length > 0) {
  const lines: string[] = []
  if (unknownOverrides.length > 0) {
    lines.push('Overrides for presets missing from schema:')
    for (const presetId of unknownOverrides) lines.push(`  - ${presetId}`)
  }
  if (stale.length > 0) {
    lines.push('Stale overrides (re-review and update missedFieldIds or remove entry):')
    for (const presetId of stale) lines.push(`  - ${presetId}`)
  }
  console.error(lines.join('\n'))
  process.exit(1)
}

console.log(
  `Validated ${Object.keys(overrides.presets).length} missing-inheritance override(s) against ${
    schemaUrl ?? schemaDir
  }.`,
)
