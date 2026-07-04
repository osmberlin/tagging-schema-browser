import type { MissingInheritanceOverrides } from '@/components/PagePresets/missingFieldInheritance'
import parsed from '@/data/missing-inheritance-overrides.yaml'

if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
  throw new Error('missing-inheritance-overrides.yaml: expected version: 1')
}

export const missingInheritanceOverrides: MissingInheritanceOverrides = {
  version: 1,
  presets: (parsed.presets ?? {}) as MissingInheritanceOverrides['presets'],
}
