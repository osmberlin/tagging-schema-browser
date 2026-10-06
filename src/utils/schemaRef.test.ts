import { describe, expect, it } from 'vitest'
import { isSchemaRef, schemaRefTarget } from './schemaRef'

describe('schemaRefTarget', () => {
  it('returns the id inside braces', () => {
    expect(schemaRefTarget('{amenity/cafe}')).toBe('amenity/cafe')
    expect(isSchemaRef('{amenity/cafe}')).toBe(true)
  })

  it('returns null for anything that is not a reference', () => {
    for (const value of ['amenity/cafe', '{}', '{a}{b}', 'x {a}', '{a} x', undefined, 12, null]) {
      expect(schemaRefTarget(value)).toBeNull()
      expect(isSchemaRef(value)).toBe(false)
    }
  })

  it('ignores invisible bidi and zero-width characters', () => {
    expect(schemaRefTarget('{presets/amenity/bicycle_parking/shed‎}')).toBe(
      'presets/amenity/bicycle_parking/shed',
    )
    expect(schemaRefTarget('﻿{a​/b}')).toBe('a/b')
  })
})
