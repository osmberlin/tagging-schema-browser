import type { FieldListKey } from '@/components/PagePresets/missingFieldInheritance'

export function fieldListTitle(fieldListKey: FieldListKey): string {
  return fieldListKey === 'fields' ? 'Primary fields' : 'More fields'
}
