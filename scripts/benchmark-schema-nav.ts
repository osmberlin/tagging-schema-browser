/**
 * Benchmark schema navigation hot paths (issue #109).
 *
 * Usage: bun scripts/benchmark-schema-nav.ts [dataUrl]
 * Default: local public/test-schema fixture (offline).
 * Pass a dist URL for production-scale numbers (requires network).
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadSchemaData, type RawSchemaPayload } from '@/components/PagePresets/dataLoader'
import { denormalize } from '@/components/PagePresets/denormalize'
import { getFieldOptionMismatchRows } from '@/utils/fieldOptions'
import { buildSchemaIndices } from '@/utils/schemaIndices'

async function loadLocalTestSchema(): Promise<RawSchemaPayload> {
  const base = join(process.cwd(), 'public/test-schema')
  const read = async (file: string) => JSON.parse(await readFile(join(base, file), 'utf8'))
  return {
    presets: await read('presets.min.json'),
    translations: await read('translations/en.min.json'),
    categories: await read('preset_categories.min.json'),
    fields: await read('fields.min.json'),
    loadErrors: [],
  }
}

function ms(start: number): string {
  return `${(performance.now() - start).toFixed(1)}ms`
}

function bench(label: string, iterations: number, fn: () => void): void {
  fn()
  const start = performance.now()
  for (let i = 0; i < iterations; i++) fn()
  const elapsed = performance.now() - start
  console.log(`${label}: ${(elapsed / iterations).toFixed(3)}ms avg (${iterations} runs)`)
}

async function main() {
  const useLocalFixture = !process.argv[2]
  const dataUrl = process.argv[2] ?? 'local-fixture'
  console.log(`Loading schema from ${useLocalFixture ? 'public/test-schema (fixture)' : dataUrl}…`)
  const loadStart = performance.now()
  const raw = useLocalFixture ? await loadLocalTestSchema() : await loadSchemaData(dataUrl)
  console.log(`  fetch + parse: ${ms(loadStart)}`)

  const processStart = performance.now()
  const presets = denormalize(raw.presets, raw.translations, raw.categories, raw.fields)
  const fieldTranslations = raw.translations.en?.presets?.fields ?? {}
  const indices = buildSchemaIndices(presets, raw.fields, fieldTranslations)
  console.log(`  denormalize + indices: ${ms(processStart)}`)

  const data = { presets, fields: raw.fields, fieldTranslations, indices }

  console.log(`  presets: ${data.presets.length}, fields: ${Object.keys(data.fields).length}`)

  const fieldId = Object.keys(data.fields).includes('highway')
    ? 'highway'
    : Object.keys(data.fields)[0]
  if (!fieldId) {
    console.error('No fields in schema')
    process.exit(1)
  }

  console.log(`\nField detail hot path for "${fieldId}":`)
  bench('getFieldOptionMismatchRows (legacy)', 50, () => {
    getFieldOptionMismatchRows(fieldId, data.fields, data.fieldTranslations, data.presets)
  })
  bench('indices.fieldOptionMismatchRows.get', 5000, () => {
    data.indices.fieldOptionMismatchRows.get(fieldId)
  })
  bench('presets.filter primary field (legacy)', 200, () => {
    data.presets.filter((p) => p.fields.includes(fieldId))
  })
  bench('indices.presetsByPrimaryField.get', 5000, () => {
    data.indices.presetsByPrimaryField.get(fieldId)
  })

  console.log('\nOne-time index rebuild:')
  const indexStart = performance.now()
  buildSchemaIndices(data.presets, data.fields, data.fieldTranslations)
  console.log(`  rebuild indices: ${ms(indexStart)}`)

  const childPresetId =
    data.presets.find((p) => p.id.includes('/'))?.id ?? data.presets[0]?.id ?? ''
  if (childPresetId) {
    console.log(`\nPreset detail hot path for child "${childPresetId}":`)
    const { getChildPresetIconMismatchRefs } = await import('@/utils/iconMismatch')
    bench('getChildPresetIconMismatchRefs (legacy scan)', 5, () => {
      getChildPresetIconMismatchRefs(
        childPresetId,
        data.fields,
        data.fieldTranslations,
        data.presets,
      )
    })
    bench('indices.childIconMismatchRefsByPresetId.get', 5000, () => {
      data.indices.childIconMismatchRefsByPresetId.get(childPresetId)
    })
  }
}

void main()
