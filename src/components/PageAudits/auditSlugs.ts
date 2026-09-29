export const AUDIT_SLUGS = ['missing-inheritance', 'risky-typecombo'] as const

export type AuditSlug = (typeof AUDIT_SLUGS)[number]

export function isAuditSlug(value: string): value is AuditSlug {
  return (AUDIT_SLUGS as readonly string[]).includes(value)
}

export const AUDIT_META: Record<
  AuditSlug,
  {
    title: string
    description: string
    area: 'fields' | 'presets'
    overrideFile: string
  }
> = {
  'missing-inheritance': {
    title: 'Missing inheritance',
    description:
      'Presets with explicit field lists that do not inherit every field from their parent preset (the preset one path segment up, e.g. building for building/hangar).',
    area: 'fields',
    overrideFile: 'src/data/missing-inheritance-overrides.yaml',
  },
  'risky-typecombo': {
    title: 'Risky typeCombo',
    description:
      'Presets where a property typeCombo can silently add =yes tags when a mapper backs out of the dropdown.',
    area: 'fields',
    overrideFile: 'src/data/risky-typecombo-overrides.yaml',
  },
}
