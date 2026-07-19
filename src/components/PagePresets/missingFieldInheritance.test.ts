import { describe, expect, it } from 'vitest'
import {
  detectMissingFieldInheritance,
  formatMissingInheritanceOverrideYaml,
  missingInheritanceOverrideFromCurrent,
  parentPresetId,
  resolveMissingInheritanceListStatus,
  resolveMissingInheritanceStatus,
} from '@/components/PagePresets/missingFieldInheritance'

describe('missingFieldInheritance', () => {
  it('returns slash parent id', () => {
    expect(parentPresetId('shop/pasta')).toBe('shop')
    expect(parentPresetId('amenity/cafe')).toBe('amenity')
    expect(parentPresetId('amenity')).toBeNull()
  })

  it('skips presets with implicit slash-parent inheritance', () => {
    const presets = {
      'preset/parent': {
        tags: { shop: 'yes' },
        geometry: ['point'],
        fields: ['name', 'operator'],
      },
      'preset/child': {
        tags: { shop: 'convenience' },
        geometry: ['point'],
      },
    }

    expect(
      detectMissingFieldInheritance('preset/child', presets['preset/child'], presets, {}),
    ).toBeNull()
  })

  it('skips when the slash parent is referenced explicitly', () => {
    const presets = {
      'amenity/doctors': {
        tags: { amenity: 'doctors' },
        geometry: ['point'],
        fields: ['name', 'operator'],
      },
      'amenity/doctors/allergology': {
        tags: { amenity: 'doctors', 'healthcare:speciality': 'allergology' },
        geometry: ['point'],
        fields: ['{amenity/doctors}'],
      },
    }

    expect(
      detectMissingFieldInheritance(
        'amenity/doctors/allergology',
        presets['amenity/doctors/allergology'],
        presets,
        {},
      ),
    ).toBeNull()
  })

  it('lists parent field ids missing from an explicit child list', () => {
    const presets = {
      'tourism/information': {
        tags: { tourism: 'information' },
        geometry: ['point'],
        fields: ['information', 'operator', 'address', 'building_area_yes'],
        moreFields: ['level'],
      },
      'tourism/information/terminal': {
        tags: { tourism: 'information', information: 'terminal' },
        geometry: ['point'],
        fields: ['operator'],
        moreFields: ['{tourism/information}'],
      },
    }
    const fields = {
      information: { key: 'information', type: 'combo' },
      operator: { key: 'operator', type: 'text' },
      address: { key: 'addr:full', type: 'text' },
      building_area_yes: { key: 'building', type: 'check' },
      level: { key: 'level', type: 'text' },
    }

    expect(
      detectMissingFieldInheritance(
        'tourism/information/terminal',
        presets['tourism/information/terminal'],
        presets,
        fields,
      ),
    ).toEqual({
      fields: {
        parentId: 'tourism/information',
        missedFieldIds: ['address', 'building_area_yes'],
        explicitPresetRefs: [],
      },
    })
  })

  it('does not flag typeCombo fields the child already fixes via tags', () => {
    const presets = {
      highway: {
        tags: { highway: '*' },
        geometry: ['line', 'vertex'],
        fields: ['name', 'highway'],
      },
      'highway/mini_roundabout': {
        tags: { highway: 'mini_roundabout' },
        geometry: ['vertex'],
        fields: ['name'],
        moreFields: ['direction_clock'],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      highway: { key: 'highway', type: 'typeCombo' },
      direction_clock: { key: 'direction', type: 'combo' },
    }

    expect(
      detectMissingFieldInheritance(
        'highway/mini_roundabout',
        presets['highway/mini_roundabout'],
        presets,
        fields,
      ),
    ).toBeNull()
  })

  it('does not flag combo fields the child already fixes via tags', () => {
    const presets = {
      'man_made/crane': {
        tags: { man_made: 'crane' },
        geometry: ['point'],
        fields: ['name', 'crane/type'],
      },
      'man_made/crane/portal_crane': {
        tags: { man_made: 'crane', 'crane:type': 'portal_crane' },
        geometry: ['point'],
        fields: ['name'],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      'crane/type': { key: 'crane:type', type: 'combo' },
    }

    expect(
      detectMissingFieldInheritance(
        'man_made/crane/portal_crane',
        presets['man_made/crane/portal_crane'],
        presets,
        fields,
      ),
    ).toBeNull()
  })

  it('lists parent field ids missing from crane child without parent ref', () => {
    const presets = {
      'man_made/crane': {
        tags: { man_made: 'crane' },
        geometry: ['point'],
        fields: ['name', 'crane/type'],
      },
      'man_made/crane/untyped_crane': {
        tags: { man_made: 'crane' },
        geometry: ['point'],
        fields: ['name'],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      'crane/type': { key: 'crane:type', type: 'combo' },
    }

    expect(
      detectMissingFieldInheritance(
        'man_made/crane/untyped_crane',
        presets['man_made/crane/untyped_crane'],
        presets,
        fields,
      ),
    ).toEqual({
      fields: {
        parentId: 'man_made/crane',
        missedFieldIds: ['crane/type'],
        explicitPresetRefs: [],
      },
    })
  })

  it('classifies override status from snapshot', () => {
    const current = {
      fields: {
        parentId: 'tourism/information',
        missedFieldIds: ['address', 'building_area_yes'],
        explicitPresetRefs: [],
      },
    }

    expect(
      resolveMissingInheritanceStatus(current, {
        fields: {
          parentId: 'tourism/information',
          missedFieldIds: ['address', 'building_area_yes'],
        },
      }),
    ).toBe('intentional')

    expect(
      resolveMissingInheritanceStatus(current, {
        fields: { parentId: 'tourism/information', missedFieldIds: ['operator'] },
      }),
    ).toBe('stale')

    expect(resolveMissingInheritanceStatus(current, undefined)).toBe('unreviewed')
    expect(
      resolveMissingInheritanceStatus(null, {
        fields: {
          parentId: 'tourism/information',
          missedFieldIds: ['address', 'building_area_yes'],
        },
      }),
    ).toBe('stale')
  })

  it('stays unreviewed until every detected list has a matching override', () => {
    const current = {
      fields: {
        parentId: 'man_made',
        missedFieldIds: ['name'],
        explicitPresetRefs: [],
      },
      moreFields: {
        parentId: 'man_made',
        missedFieldIds: ['material'],
        explicitPresetRefs: [],
      },
    }
    const fieldsOnlyOverride = {
      fields: {
        parentId: 'man_made',
        missedFieldIds: ['name'],
      },
    }

    expect(resolveMissingInheritanceStatus(current, fieldsOnlyOverride)).toBe('unreviewed')
    expect(resolveMissingInheritanceStatus(current, undefined)).toBe('unreviewed')
    expect(resolveMissingInheritanceListStatus(current.fields, fieldsOnlyOverride.fields)).toBe(
      'intentional',
    )
    expect(resolveMissingInheritanceListStatus(current.moreFields, undefined)).toBe('unreviewed')
    expect(
      resolveMissingInheritanceStatus(current, {
        fields: fieldsOnlyOverride.fields,
        moreFields: {
          parentId: 'man_made',
          missedFieldIds: ['material'],
        },
      }),
    ).toBe('intentional')
  })

  it('marks orphaned override lists stale when live detection no longer applies', () => {
    const current = {
      fields: {
        parentId: 'man_made',
        missedFieldIds: ['name'],
        explicitPresetRefs: [],
      },
    }

    expect(
      resolveMissingInheritanceStatus(current, {
        fields: {
          parentId: 'man_made',
          missedFieldIds: ['name'],
        },
        moreFields: {
          parentId: 'man_made',
          missedFieldIds: ['material'],
        },
      }),
    ).toBe('stale')
  })

  it('builds a valid override object without debug-only fields', () => {
    const current = {
      fields: {
        parentId: 'tourism/information',
        missedFieldIds: ['address', 'building_area_yes'],
        explicitPresetRefs: ['other/preset'],
      },
    }

    expect(missingInheritanceOverrideFromCurrent(current)).toEqual({
      fields: {
        parentId: 'tourism/information',
        missedFieldIds: ['address', 'building_area_yes'],
      },
    })
  })

  it('formats a paste-ready yaml block for missing-inheritance-overrides.yaml', () => {
    const current = {
      fields: {
        parentId: 'tourism/information',
        missedFieldIds: ['address', 'building_area_yes'],
        explicitPresetRefs: [],
      },
    }

    expect(formatMissingInheritanceOverrideYaml('tourism/information/terminal', current))
      .toBe(`  tourism/information/terminal:
    fields:
      parentId: tourism/information
      missedFieldIds:
        - address
        - building_area_yes
`)

    const parsed = Bun.YAML.parse(
      `version: 1\npresets:\n${formatMissingInheritanceOverrideYaml('tourism/information/terminal', current)}`,
    ) as { presets: Record<string, unknown> }

    expect(
      resolveMissingInheritanceStatus(current, parsed.presets['tourism/information/terminal']),
    ).toBe('intentional')
  })
})
