import { describe, expect, it } from 'vitest'
import {
  formatTermsDisplay,
  normalizeAliases,
  normalizeTerms,
  termsToLines,
} from '@/utils/presetStrings'

describe('normalizeTerms', () => {
  it('parses v6 comma-separated strings', () => {
    expect(normalizeTerms('coffee,espresso')).toEqual(['coffee', 'espresso'])
    expect(normalizeTerms('  Tea ,  Green Tea  ')).toEqual(['tea', 'green tea'])
  })

  it('accepts v7 string arrays', () => {
    expect(normalizeTerms(['Coffee', 'Espresso'])).toEqual(['coffee', 'espresso'])
  })

  it('returns empty for missing values', () => {
    expect(normalizeTerms(undefined)).toEqual([])
    expect(normalizeTerms('')).toEqual([])
    expect(normalizeTerms([])).toEqual([])
  })
})

describe('normalizeAliases', () => {
  it('parses v6 newline-separated strings', () => {
    expect(normalizeAliases('Climb\nMountaineering Route')).toEqual([
      'Climb',
      'Mountaineering Route',
    ])
  })

  it('accepts v7 string arrays', () => {
    expect(normalizeAliases(['Climb', 'Mountaineering Route'])).toEqual([
      'Climb',
      'Mountaineering Route',
    ])
  })
})

describe('formatTermsDisplay', () => {
  it('joins arrays with newlines', () => {
    expect(formatTermsDisplay(['a', 'b'])).toBe('a\nb')
  })

  it('returns strings as-is', () => {
    expect(formatTermsDisplay('a,b')).toBe('a,b')
  })
})

describe('termsToLines', () => {
  it('expands arrays and strings', () => {
    expect(termsToLines(['a', 'b'])).toEqual(['a', 'b'])
    expect(termsToLines('a,b')).toEqual(['a,b'])
  })
})
