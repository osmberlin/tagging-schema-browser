import { describe, expect, it } from 'vitest'
import {
  parseTagObject,
  stringifyTagObject,
} from '@/components/PagePresetBuilder/presetBuilderUrlCodec'

describe('tag object URL helpers', () => {
  it('round-trips partial tags while editing', () => {
    const raw = stringifyTagObject({ amenity: '' })
    expect(parseTagObject(raw)).toEqual({ amenity: '' })
  })
})
