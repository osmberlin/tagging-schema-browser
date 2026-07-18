import {
  formatMissingInheritanceOverrideYamlFromStored,
  type MissingInheritanceOverride,
  type MissingInheritanceOverrides,
} from '../../src/components/PagePresets/missingFieldInheritance.ts'
import {
  formatRiskyTypeComboOverrideYamlFromStored,
  type RiskyTypeComboOverride,
  type RiskyTypeComboOverrides,
} from '../../src/components/PagePresets/riskyTypeCombo.ts'

export const OVERRIDE_YAML_PATTERN = /^src\/data\/.*-overrides\.yaml$/

export type SchemaOverrideYamlKind = 'missing-inheritance' | 'risky-typecombo'

export const resolveSchemaOverrideYamlKind = (filename: string): SchemaOverrideYamlKind | null => {
  if (filename === 'src/data/missing-inheritance-overrides.yaml') return 'missing-inheritance'
  if (filename === 'src/data/risky-typecombo-overrides.yaml') return 'risky-typecombo'
  return null
}

export const extractYamlHeader = (content: string): string => {
  const lines = content.split('\n')
  const headerLines: string[] = []
  for (const line of lines) {
    if (/^version:\s*/.test(line)) break
    headerLines.push(line)
  }
  return headerLines.join('\n')
}

const deepEqual = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)

const parseMissingInheritanceOverrides = (content: string): MissingInheritanceOverrides => {
  const parsed = Bun.YAML.parse(content) as MissingInheritanceOverrides
  if (!parsed || parsed.version !== 1) {
    throw new Error('missing-inheritance-overrides.yaml: expected version: 1')
  }
  return { version: 1, presets: parsed.presets ?? {} }
}

const parseRiskyTypeComboOverrides = (content: string): RiskyTypeComboOverrides => {
  const parsed = Bun.YAML.parse(content) as RiskyTypeComboOverrides
  if (!parsed || parsed.version !== 1) {
    throw new Error('risky-typecombo-overrides.yaml: expected version: 1')
  }
  return { version: 1, presets: parsed.presets ?? {} }
}

const serializeMissingInheritanceOverrides = (
  header: string,
  presets: Record<string, MissingInheritanceOverride>,
): string => {
  const sortedKeys = Object.keys(presets).sort((left, right) => left.localeCompare(right))
  const presetBlocks = sortedKeys
    .map((presetId) => formatMissingInheritanceOverrideYamlFromStored(presetId, presets[presetId]))
    .join('')
  const normalizedHeader = header.length > 0 ? `${header.replace(/\n?$/, '\n')}` : ''
  return `${normalizedHeader}version: 1\npresets:\n${presetBlocks || ''}`
}

const serializeRiskyTypeComboOverrides = (
  header: string,
  presets: Record<string, RiskyTypeComboOverride>,
): string => {
  const sortedKeys = Object.keys(presets).sort((left, right) => left.localeCompare(right))
  const presetBlocks = sortedKeys
    .map((presetId) => formatRiskyTypeComboOverrideYamlFromStored(presetId, presets[presetId]))
    .join('')
  const normalizedHeader = header.length > 0 ? `${header.replace(/\n?$/, '\n')}` : ''
  return `${normalizedHeader}version: 1\npresets:\n${presetBlocks || ''}`
}

export const mergeSchemaOverrideYaml = ({
  filename,
  baseContent,
  branchContent,
}: {
  filename: string
  baseContent: string
  branchContent: string
}): string => {
  const kind = resolveSchemaOverrideYamlKind(filename)
  if (!kind) {
    throw new Error(`Unsupported schema override file: ${filename}`)
  }

  const header = extractYamlHeader(baseContent)
  const conflictingKeys: string[] = []

  if (kind === 'missing-inheritance') {
    const base = parseMissingInheritanceOverrides(baseContent)
    const branch = parseMissingInheritanceOverrides(branchContent)
    const mergedPresets: Record<string, MissingInheritanceOverride> = { ...base.presets }

    for (const [presetId, override] of Object.entries(branch.presets)) {
      const existing = mergedPresets[presetId]
      if (existing && !deepEqual(existing, override)) {
        conflictingKeys.push(presetId)
        continue
      }
      mergedPresets[presetId] = override
    }

    if (conflictingKeys.length > 0) {
      throw new Error(
        `Cannot auto-merge ${filename}: conflicting preset keys ${conflictingKeys.join(', ')}`,
      )
    }

    return serializeMissingInheritanceOverrides(header, mergedPresets)
  }

  const base = parseRiskyTypeComboOverrides(baseContent)
  const branch = parseRiskyTypeComboOverrides(branchContent)
  const mergedPresets: Record<string, RiskyTypeComboOverride> = { ...base.presets }

  for (const [presetId, override] of Object.entries(branch.presets)) {
    const existing = mergedPresets[presetId]
    if (existing && !deepEqual(existing, override)) {
      conflictingKeys.push(presetId)
      continue
    }
    mergedPresets[presetId] = override
  }

  if (conflictingKeys.length > 0) {
    throw new Error(
      `Cannot auto-merge ${filename}: conflicting preset keys ${conflictingKeys.join(', ')}`,
    )
  }

  return serializeRiskyTypeComboOverrides(header, mergedPresets)
}
