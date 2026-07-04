import { describe, expect, it } from 'vitest'
import {
  detectMissingFieldInheritance,
  parentPresetId,
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
        parentId: 'man_made/crane',
        missedFieldIds: ['crane/type'],
        explicitPresetRefs: [],
      },
    }

    expect(
      resolveMissingInheritanceStatus(current, {
        fields: { parentId: 'man_made/crane', missedFieldIds: ['crane/type'] },
      }),
    ).toBe('intentional')

    expect(
      resolveMissingInheritanceStatus(current, {
        fields: { parentId: 'man_made/crane', missedFieldIds: ['operator'] },
      }),
    ).toBe('stale')

    expect(resolveMissingInheritanceStatus(current, undefined)).toBe('unreviewed')
    expect(
      resolveMissingInheritanceStatus(null, {
        fields: { parentId: 'man_made/crane', missedFieldIds: ['crane/type'] },
      }),
    ).toBe('stale')
  })
})
