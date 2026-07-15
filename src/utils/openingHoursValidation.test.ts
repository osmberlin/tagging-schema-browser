import { describe, expect, it } from 'vitest'
import { splitWarningValue, validateOpeningHours } from '@/utils/openingHoursValidation'

describe('validateOpeningHours', () => {
  it('accepts empty input', async () => {
    await expect(validateOpeningHours('')).resolves.toEqual({
      valid: true,
      error: null,
      warnings: [],
    })
    await expect(validateOpeningHours('   ')).resolves.toEqual({
      valid: true,
      error: null,
      warnings: [],
    })
  })

  it('parses common opening hours syntax', async () => {
    const result = await validateOpeningHours('Mo-Fr 09:00-17:00')
    expect(result.valid).toBe(true)
    expect(result.error).toBeNull()
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it('returns structured warnings with type, message, value, and position', async () => {
    const result = await validateOpeningHours('Mo 9-17')
    expect(result.valid).toBe(true)
    const warning = result.warnings.find((item) => item.type === 'without_minutes')
    expect(warning).toBeDefined()
    expect(warning?.message.length).toBeGreaterThan(0)
    expect(warning?.value).toBe('Mo 9-17')
    expect(typeof warning?.position).toBe('number')
  })

  it('reports parse errors without custom string parsing', async () => {
    const result = await validateOpeningHours('not valid opening hours syntax !!!')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/./)
    expect(result.warnings).toEqual([])
  })
})

describe('splitWarningValue', () => {
  it('splits at the reported position', () => {
    const parts = splitWarningValue({
      type: 'without_minutes',
      message: 'test',
      value: 'Mo 9-17',
      position: 3,
    })
    expect(parts).toEqual({ before: 'Mo ', marker: '9', after: '-17' })
  })

  it('returns null when position is unknown', () => {
    expect(
      splitWarningValue({
        type: 'vague',
        message: 'test',
        value: '24/7',
        position: null,
      }),
    ).toBeNull()
  })
})
