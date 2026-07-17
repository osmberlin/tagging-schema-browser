import type { RiskyTypeComboOverrides } from '@/components/PagePresets/riskyTypeCombo'
import parsed from '@/data/risky-typecombo-overrides.yaml'

if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
  throw new Error('risky-typecombo-overrides.yaml: expected version: 1')
}

export const riskyTypeComboOverrides: RiskyTypeComboOverrides = {
  version: 1,
  presets: (parsed.presets ?? {}) as RiskyTypeComboOverrides['presets'],
}
