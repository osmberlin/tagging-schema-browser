import { describe, expect, it } from 'vitest'
import {
  classifyLabelMismatch,
  collectLabelMismatchPairs,
  diffLabelWords,
  labelMismatchKey,
  staleLabelMismatchOverrides,
  type LabelMismatchOverrides,
} from '@/utils/labelMismatch'
import type { FieldOptionMismatchRow } from '@/utils/types'

function row(
  optionValue: string,
  labelEn: string,
  child: { id: string; name: string },
  parentId = 'amenity/restaurant',
): FieldOptionMismatchRow {
  return {
    optionValue,
    labelEn,
    iconMismatch: false,
    iconMissing: false,
    labelMismatch: classifyLabelMismatch(labelEn, child.name),
    parentPreset: { id: parentId, name: parentId },
    childPreset: child,
  }
}

const noOverrides: LabelMismatchOverrides = { version: 1, fields: {} }

describe('classifyLabelMismatch', () => {
  it('ignores case, punctuation and "&" vs "and"', () => {
    expect(classifyLabelMismatch('Fish & Chips', 'fish and chips')).toBeNull()
    expect(classifyLabelMismatch('Street-Side', 'Street Side')).toBeNull()
    expect(classifyLabelMismatch(' Pizza ', 'Pizza')).toBeNull()
  })

  it('does not compare missing labels', () => {
    expect(classifyLabelMismatch(undefined, 'Pizza')).toBeNull()
    expect(classifyLabelMismatch('Pizza', '')).toBeNull()
  })

  it('calls a label that only adds words an extension', () => {
    expect(classifyLabelMismatch('Pizza', 'Pizza Restaurant')).toBe('extends')
    expect(classifyLabelMismatch('Climbing Frame', 'Play Climbing Frame')).toBe('extends')
    expect(classifyLabelMismatch('Parking Tickets', 'Parking Ticket Vending Machine')).toBe(
      'extends',
    )
    expect(classifyLabelMismatch('Indoor Riding Arena', 'Riding Arena')).toBe('extends')
  })

  it('calls different wording a difference', () => {
    expect(classifyLabelMismatch('Dancing School', 'Dance School')).toBe('differs')
    expect(classifyLabelMismatch('Boom Gate', 'Boom Barrier')).toBe('differs')
    expect(classifyLabelMismatch('Steak House', 'Steakhouse')).toBe('differs')
    expect(classifyLabelMismatch('Cardiology', 'Cardiologist')).toBe('differs')
  })
})

describe('diffLabelWords', () => {
  it('marks the words between the shared start and end', () => {
    expect(diffLabelWords('Dancing School', 'Dance School')).toEqual({
      left: [
        { text: 'Dancing', changed: true },
        { text: 'School', changed: false },
      ],
      right: [
        { text: 'Dance', changed: true },
        { text: 'School', changed: false },
      ],
    })
  })

  it('marks only the added words of an extension', () => {
    expect(diffLabelWords('Pizza', 'Pizza Restaurant')).toEqual({
      left: [{ text: 'Pizza', changed: false }],
      right: [
        { text: 'Pizza', changed: false },
        { text: 'Restaurant', changed: true },
      ],
    })
  })
})

describe('collectLabelMismatchPairs', () => {
  const pizza = { id: 'amenity/restaurant/pizza', name: 'Pizza Restaurant' }
  const rows = new Map([
    [
      'cuisine',
      [
        row('pizza', 'Pizza', pizza, 'b/parent'),
        row('pizza', 'Pizza', pizza, 'a/parent'),
        row('sushi', 'Sushi', { id: 'amenity/restaurant/sushi', name: 'Sushi' }),
      ],
    ],
  ])
  const key = labelMismatchKey('cuisine', 'pizza', pizza.id)
  const override = (presetName: string): LabelMismatchOverrides => ({
    version: 1,
    fields: {
      cuisine: [{ option: 'pizza', preset: pizza.id, optionLabel: 'Pizza', presetName }],
    },
  })

  it('keeps one pair per option and preset, with all parents sorted', () => {
    const pairs = collectLabelMismatchPairs(rows, noOverrides)
    expect([...pairs.keys()]).toEqual([key])
    expect(pairs.get(key)).toMatchObject({
      kind: 'extends',
      reviewed: false,
      parentPresets: [{ id: 'a/parent' }, { id: 'b/parent' }],
    })
  })

  it('treats a pair as reviewed only while both labels match the snapshot', () => {
    expect(collectLabelMismatchPairs(rows, override('Pizza Restaurant')).get(key)).toMatchObject({
      reviewed: true,
    })
    const renamed = collectLabelMismatchPairs(rows, override('Pizzeria')).get(key)
    expect(renamed?.reviewed).toBe(false)
    expect(renamed?.previous).toEqual({ optionLabel: 'Pizza', presetName: 'Pizzeria' })
  })

  it('reports override entries whose pair no longer differs', () => {
    const overrides: LabelMismatchOverrides = {
      version: 1,
      fields: {
        cuisine: [
          { option: 'pizza', preset: pizza.id, optionLabel: 'Pizza', presetName: 'Pizzeria' },
          {
            option: 'sushi',
            preset: 'amenity/restaurant/sushi',
            optionLabel: 'Sushi',
            presetName: 'Sushi Bar',
          },
        ],
      },
    }
    const pairs = collectLabelMismatchPairs(rows, overrides)
    expect(staleLabelMismatchOverrides(pairs, overrides)).toEqual([
      { fieldId: 'cuisine', ...overrides.fields.cuisine![1] },
    ])
  })
})
