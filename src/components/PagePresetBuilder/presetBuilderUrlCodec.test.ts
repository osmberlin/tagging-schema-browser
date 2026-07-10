import { describe, expect, it } from 'vitest'
import { draftToRawField } from '@/components/PagePresetBuilder/NewFieldModal'
import {
  parseDraftFields,
  parseTagObject,
  stringifyDraftFields,
  stringifyTagObject,
} from '@/components/PagePresetBuilder/presetBuilderUrlCodec'

describe('draft field URL helpers', () => {
  it('round-trips draft field objects', () => {
    const fields = { 'test/foo': { key: 'foo', type: 'text', label: 'Foo' } }
    const raw = stringifyDraftFields(fields)
    expect(parseDraftFields(raw)).toEqual(fields)
  })
})

describe('draftToRawField', () => {
  it('builds a minimal field definition', () => {
    expect(
      draftToRawField({
        id: 'amenity',
        key: 'amenity',
        type: 'combo',
        label: 'Type',
        placeholder: '',
        universal: false,
        geometry: [],
        optionsText: 'yes\nno',
        prerequisiteKey: '',
        prerequisiteValuesText: '',
        addToFields: true,
      }),
    ).toEqual({
      type: 'combo',
      label: 'Type',
      options: ['yes', 'no'],
    })
  })
})

describe('tag object URL helpers', () => {
  it('round-trips partial tags while editing', () => {
    const raw = stringifyTagObject({ amenity: '' })
    expect(parseTagObject(raw)).toEqual({ amenity: '' })
  })
})
