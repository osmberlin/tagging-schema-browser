import { describe, expect, it } from 'vitest'
import {
  presetBuilderSearchSchema,
  searchToBuilderState,
} from '@/components/PagePresetBuilder/presetBuilderSearch'

describe('presetBuilderSearch', () => {
  it('parses router JSON object tags', () => {
    const search = presetBuilderSearchSchema.parse({ pb_tags: { amenity: 'cafe' } })
    expect(searchToBuilderState(search).tags).toEqual({ amenity: 'cafe' })
  })
})
