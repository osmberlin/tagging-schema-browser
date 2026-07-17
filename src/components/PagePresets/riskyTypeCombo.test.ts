import { describe, expect, it } from 'vitest'
import {
  detectRiskyTypeCombo,
  formatRiskyTypeComboOverrideYaml,
  resolveRiskyTypeComboStatus,
  riskyTypeComboOverrideFromCurrent,
} from '@/components/PagePresets/riskyTypeCombo'

describe('riskyTypeCombo', () => {
  it('flags property typeCombo on presets with a fixed primary tag', () => {
    const presets = {
      'shop/trade': {
        tags: { shop: 'trade' },
        geometry: ['point'],
        fields: ['name', 'trade'],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      trade: { key: 'trade', type: 'typeCombo' },
    }

    const current = detectRiskyTypeCombo(presets['shop/trade'], ['name', 'trade'], [], fields)

    expect(current?.fields).toEqual([{ fieldId: 'trade', fieldKey: 'trade', listKey: 'fields' }])
  })

  it('skips the primary typeCombo selector on specific presets', () => {
    const presets = {
      'traffic_calming/mini_bumps': {
        tags: { traffic_calming: 'mini_bumps' },
        geometry: ['vertex'],
        fields: ['traffic_calming'],
      },
    }
    const fields = {
      traffic_calming: { key: 'traffic_calming', type: 'typeCombo' },
    }

    expect(
      detectRiskyTypeCombo(presets['traffic_calming/mini_bumps'], ['traffic_calming'], [], fields),
    ).toBeNull()
  })

  it('flags supplemental moreFields typeCombo fields', () => {
    const presets = {
      'highway/residential': {
        tags: { highway: 'residential' },
        geometry: ['line'],
        fields: ['name'],
        moreFields: ['traffic_calming'],
      },
    }
    const fields = {
      name: { key: 'name', type: 'text' },
      traffic_calming: { key: 'traffic_calming', type: 'typeCombo' },
    }

    const current = detectRiskyTypeCombo(
      presets['highway/residential'],
      ['name'],
      ['traffic_calming'],
      fields,
    )

    expect(current?.fields).toEqual([
      { fieldId: 'traffic_calming', fieldKey: 'traffic_calming', listKey: 'moreFields' },
    ])
  })

  it('resolves override status from field id snapshots', () => {
    const current = {
      fields: [{ fieldId: 'trade', fieldKey: 'trade', listKey: 'fields' as const }],
    }

    expect(resolveRiskyTypeComboStatus(current, undefined)).toBe('unreviewed')
    expect(
      resolveRiskyTypeComboStatus(current, {
        fieldIds: ['trade'],
      }),
    ).toBe('intentional')
    expect(
      resolveRiskyTypeComboStatus(current, {
        fieldIds: ['other'],
      }),
    ).toBe('stale')
    expect(resolveRiskyTypeComboStatus(null, { fieldIds: ['trade'] })).toBe('stale')
  })

  it('formats override yaml', () => {
    const yaml = formatRiskyTypeComboOverrideYaml('shop/trade', {
      fields: [{ fieldId: 'trade', fieldKey: 'trade', listKey: 'fields' }],
    })

    expect(yaml).toContain('shop/trade:')
    expect(yaml).toContain('- trade')
    expect(
      riskyTypeComboOverrideFromCurrent({
        fields: [{ fieldId: 'trade', fieldKey: 'trade', listKey: 'fields' }],
      }),
    ).toEqual({ fieldIds: ['trade'] })
  })
})
