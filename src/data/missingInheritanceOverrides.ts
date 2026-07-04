import { parse } from 'yaml'
import type { MissingInheritanceOverrides } from '@/components/PagePresets/missingFieldInheritance'
import overridesSource from '@/data/missing-inheritance-overrides.yaml?raw'

const parsed = parse(overridesSource) as MissingInheritanceOverrides

if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
  throw new Error('missing-inheritance-overrides.yaml: expected version: 1')
}

export const missingInheritanceOverrides: MissingInheritanceOverrides = {
  version: 1,
  presets: parsed.presets ?? {},
}
