import { describe, expect, it } from 'vitest'
import { fieldTypeHint, sortFieldTypes } from '@/utils/fieldTypes'

describe('sortFieldTypes', () => {
  it('orders integer and schedule near related numeric types', () => {
    expect(sortFieldTypes(['combo', 'schedule', 'text', 'integer', 'number'])).toEqual([
      'text',
      'number',
      'integer',
      'schedule',
      'combo',
    ])
  })
})

describe('fieldTypeHint', () => {
  it('describes v7 field types', () => {
    expect(fieldTypeHint('integer')).toContain('Whole numbers')
    expect(fieldTypeHint('schedule')).toContain('Opening-hours')
  })
})
