import { describe, expect, it } from 'vitest'
import {
  presetBuilderSearchSchema,
  searchToBuilderState,
} from '@/components/PagePresetBuilder/presetBuilderSearch'
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

describe('presetBuilderSearch', () => {
  it('parses router JSON object tags', () => {
    const search = presetBuilderSearchSchema.parse({ pb_tags: { amenity: 'cafe' } })
    expect(searchToBuilderState(search).tags).toEqual({ amenity: 'cafe' })
  })

  it('defaults advanced section to closed', () => {
    const search = presetBuilderSearchSchema.parse({})
    expect(search.pb_advanced).toBe('0')
  })
})
