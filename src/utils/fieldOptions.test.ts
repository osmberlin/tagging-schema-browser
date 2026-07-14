import { describe, expect, it } from 'vitest'
import { listFieldOptionIconNames } from '@/utils/fieldOptions'
import type { RawFields } from '@/utils/types'

describe('listFieldOptionIconNames', () => {
  it('only includes icons for actual option values', () => {
    const fields: RawFields = {
      leaf_type: {
        key: 'leaf_type',
        type: 'combo',
        options: ['broadleaved', 'needleleaved'],
        icons: {
          broadleaved: 'maki-park',
          needleleaved: 'maki-tree',
          unused_key: 'maki-waste-basket',
        },
      },
    }

    expect(listFieldOptionIconNames('leaf_type', fields.leaf_type, fields)).toEqual([
      'maki-park',
      'maki-tree',
    ])
  })
})
