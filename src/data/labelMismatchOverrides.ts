import parsed from '@/data/label-mismatch-overrides.yaml'
import type { LabelMismatchOverrides } from '@/utils/labelMismatch'

if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
  throw new Error('label-mismatch-overrides.yaml: expected version: 1')
}

export const labelMismatchOverrides: LabelMismatchOverrides = {
  version: 1,
  fields: (parsed.fields ?? {}) as LabelMismatchOverrides['fields'],
}
