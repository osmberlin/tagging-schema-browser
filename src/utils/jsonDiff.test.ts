import { describe, expect, it } from 'vitest'
import {
  diffOrderedLists,
  diffRecords,
  diffSortedLists,
  diffUnorderedListDimension,
} from './jsonDiff'

describe('diffSortedLists', () => {
  it('returns null when multisets match', () => {
    expect(diffSortedLists(['a', 'b'], ['b', 'a'])).toBeNull()
  })

  it('classifies removed, added, and unchanged items', () => {
    expect(diffSortedLists(['a', 'b', 'c'], ['a', 'c', 'd'])).toEqual({
      removed: ['b'],
      added: ['d'],
      unchangedCount: 2,
    })
  })
})

describe('diffOrderedLists', () => {
  it('returns null when sequences match exactly', () => {
    expect(diffOrderedLists(['a', 'b', 'c'], ['a', 'b', 'c'])).toBeNull()
  })

  it('detects insertions and removals', () => {
    expect(
      diffOrderedLists(['brand', 'fhrs/id-GB', 'phone'], ['address', 'brand', 'phone']),
    ).toEqual({
      removed: ['fhrs/id-GB'],
      added: ['address'],
      moved: [],
      unchangedCount: 1,
    })
  })

  it('detects pure reordering without add/remove', () => {
    expect(diffOrderedLists(['a', 'b', 'c'], ['c', 'a', 'b'])).toEqual({
      removed: [],
      added: [],
      moved: [
        { item: 'a', fromIndex: 0, toIndex: 1 },
        { item: 'b', fromIndex: 1, toIndex: 2 },
        { item: 'c', fromIndex: 2, toIndex: 0 },
      ],
      unchangedCount: 0,
    })
  })

  it('detects option list append', () => {
    expect(diffOrderedLists(['clay'], ['clay', 'laterite'])).toEqual({
      removed: [],
      added: ['laterite'],
      moved: [],
      unchangedCount: 1,
    })
  })
})

describe('diffRecords', () => {
  it('ignores key order', () => {
    expect(diffRecords({ b: '2', a: '1' }, { a: '1', b: '2' })).toBeNull()
  })

  it('detects tag key changes', () => {
    expect(diffRecords({ highway: 'track' }, { highway: 'path' })).toEqual({
      removed: [],
      added: [],
      modified: [{ key: 'highway', before: 'track', after: 'path' }],
    })
  })
})

describe('diffUnorderedListDimension', () => {
  it('treats terms order as irrelevant', () => {
    expect(
      diffUnorderedListDimension('Terms', ['coffee', 'espresso'], ['espresso', 'coffee']),
    ).toBeNull()
  })
})
