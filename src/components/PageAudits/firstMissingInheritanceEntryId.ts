import type { FieldListKey } from '@/components/PagePresets/missingFieldInheritance'
import { resolveMissingInheritanceListStatus } from '@/components/PagePresets/missingFieldInheritance'
import { missingInheritanceOverrides } from '@/data/missingInheritanceOverrides'
import type { DenormalizedPreset } from '@/utils/types'

export function firstMissingInheritanceAuditEntryId(preset: DenormalizedPreset): string {
  const storedOverride = missingInheritanceOverrides.presets[preset.id]

  for (const fieldListKey of ['fields', 'moreFields'] as const satisfies FieldListKey[]) {
    const section = preset.missingFieldInheritance?.[fieldListKey]
    const listStatus = resolveMissingInheritanceListStatus(section, storedOverride?.[fieldListKey])
    if (listStatus === 'unreviewed' || listStatus === 'stale') {
      return `${preset.id}:${fieldListKey}`
    }
  }

  return preset.id
}
