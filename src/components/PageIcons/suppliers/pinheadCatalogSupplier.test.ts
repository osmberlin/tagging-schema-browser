import { describe, expect, it } from 'vitest'
import { resolvePinheadId } from './pinheadCatalogSupplier'

describe('resolvePinheadId', () => {
  const available = new Set(['bagel_with_seeds', 'people_running', 'a_frame_tent'])
  const upgrades = {
    bagel_seeded: 'bagel_with_seeds',
    person_running_after_person: 'people_running',
    old_removed: 'also_removed',
  }

  it('keeps ids the bundled package ships', () => {
    expect(resolvePinheadId('a_frame_tent', available, upgrades)).toBe('a_frame_tent')
  })

  it('maps ids renamed in a newer Pinhead version via id_upgrades', () => {
    expect(resolvePinheadId('bagel_seeded', available, upgrades)).toBe('bagel_with_seeds')
    expect(resolvePinheadId('person_running_after_person', available, upgrades)).toBe(
      'people_running',
    )
  })

  it('returns null for unknown ids and upgrades without a bundled SVG', () => {
    expect(resolvePinheadId('does_not_exist', available, upgrades)).toBeNull()
    expect(resolvePinheadId('old_removed', available, upgrades)).toBeNull()
  })

  it('returns null for renamed ids when the upgrade map is empty', () => {
    expect(resolvePinheadId('bagel_seeded', available, {})).toBeNull()
  })
})
