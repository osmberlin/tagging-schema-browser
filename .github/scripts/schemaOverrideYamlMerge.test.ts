import { describe, expect, it } from 'vitest'
import { mergeSchemaOverrideYaml } from './schemaOverrideYamlMerge.ts'

const baseFixture = `version: 1
presets:
  man_made/beehive:
    fields:
      parentId: man_made
      missedFieldIds:
        - name
  waterway/ditch:
    fields:
      parentId: waterway
      missedFieldIds:
        - name
  historic/castle:
    fields:
      parentId: historic
      missedFieldIds:
        - inscription
`

describe('schemaOverrideYamlMerge', () => {
  it('merges additive preset entries from parallel override PRs', () => {
    const branchContent = `${baseFixture}  historic/memorial/blue_plaque-GB-IE:
    fields:
      parentId: historic/memorial
      missedFieldIds:
        - material
    moreFields:
      parentId: historic/memorial
      missedFieldIds:
        - gnis/feature_id-US
`

    const merged = mergeSchemaOverrideYaml({
      filename: 'src/data/missing-inheritance-overrides.yaml',
      baseContent: baseFixture,
      branchContent,
    })

    expect(merged).toContain('historic/memorial/blue_plaque-GB-IE:')
    expect(merged).toContain('man_made/beehive:')
    expect(merged).toContain('waterway/ditch:')
    expect(merged.indexOf('historic/castle')).toBeLessThan(
      merged.indexOf('historic/memorial/blue_plaque-GB-IE'),
    )
  })

  it('merges risky-typecombo override files', () => {
    const baseContent = `version: 1
presets:
  shop/trade:
    fieldIds:
      - trade
`
    const branchContent = `${baseContent}  highway/residential:
    fieldIds:
      - highway
`

    const merged = mergeSchemaOverrideYaml({
      filename: 'src/data/risky-typecombo-overrides.yaml',
      baseContent,
      branchContent,
    })

    expect(merged).toContain('shop/trade:')
    expect(merged).toContain('highway/residential:')
  })

  it('throws when the same preset key differs between base and branch', () => {
    const branchContent = baseFixture.replace(
      `  man_made/beehive:
    fields:
      parentId: man_made
      missedFieldIds:
        - name`,
      `  man_made/beehive:
    fields:
      parentId: man_made
      missedFieldIds:
        - renamed`,
    )

    expect(() =>
      mergeSchemaOverrideYaml({
        filename: 'src/data/missing-inheritance-overrides.yaml',
        baseContent: baseFixture,
        branchContent,
      }),
    ).toThrow(/conflicting preset keys/)
  })
})
