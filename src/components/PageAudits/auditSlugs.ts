export const AUDIT_SLUGS = ['missing-inheritance', 'risky-typecombo', 'label-mismatch'] as const

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
  'label-mismatch': {
    title: 'Option ≠ preset name',
    description:
      'Field options whose English label differs from the name of the preset the option leads to (e.g. option “Dancing School”, preset “Dance School”). Many differences are wanted, like “Pizza” and “Pizza Restaurant”; the audit records those so that later renames stand out.',
    area: 'fields',
    overrideFile: 'src/data/label-mismatch-overrides.yaml',
  },
}
