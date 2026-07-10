import { describe, expect, it } from 'vitest'
import { formatPrerequisiteTag } from '@/utils/prerequisiteTag'

describe('formatPrerequisiteTag', () => {
  it('formats legacy single-value prerequisites', () => {
    expect(
      formatPrerequisiteTag({
        key: 'internet_access',
        valueNot: 'no',
      }),
    ).toBe('Shown only when internet_access≠no')
  })

  it('formats v7 values and valuesNot arrays', () => {
    expect(
      formatPrerequisiteTag({
        key: 'electrified',
        values: ['contact_line', 'rail'],
      }),
    ).toBe('Shown only when electrified is "contact_line" or "rail"')

    expect(
      formatPrerequisiteTag({
        key: 'electrified',
        valuesNot: ['contact_line', 'rail'],
      }),
    ).toBe('Shown only when electrified is not "contact_line" and not "rail"')
  })
})
