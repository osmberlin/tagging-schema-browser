import type { SchemaOverrideKind } from '@/utils/buildSchemaOverrideIssueUrl'

export const AUDIT_SLUGS = ['missing-inheritance', 'risky-typecombo'] as const

export type AuditSlug = (typeof AUDIT_SLUGS)[number]

export function auditSlugToKind(slug: AuditSlug): SchemaOverrideKind {
  return slug
}

export function isAuditSlug(value: string): value is AuditSlug {
  return (AUDIT_SLUGS as readonly string[]).includes(value)
}

export const AUDIT_META: Record<
  AuditSlug,
  {
    title: string
    description: string
    area: 'fields' | 'presets'
  }
> = {
  'missing-inheritance': {
    title: 'Missing inheritance',
    description:
      'Presets with explicit field lists that do not inherit every field from their slash parent.',
    area: 'fields',
  },
  'risky-typecombo': {
    title: 'Risky typeCombo',
    description:
      'Presets where a property typeCombo can silently add =yes tags when a mapper backs out of the dropdown.',
    area: 'fields',
  },
}
