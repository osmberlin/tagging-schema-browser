/** Encode/decode preset builder list and tag objects for URL search params. */

import type { RawField } from '@/utils/types'

export function parseTagObject(raw: string): Record<string, string> {
  if (!raw.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') result[key] = value
    }
    return result
  } catch {
    return {}
  }
}

export function stringifyTagObject(tags: Record<string, string>): string {
  const entries = Object.entries(tags).filter(([key]) => key.trim())
  if (entries.length === 0) return ''
  return JSON.stringify(Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b))))
}

export function parseStringList(raw: string): string[] {
  if (!raw.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    )
  } catch {
    return []
  }
}

export function stringifyStringList(values: string[]): string {
  const filtered = values.map((value) => value.trim()).filter(Boolean)
  if (filtered.length === 0) return ''
  return JSON.stringify(filtered)
}

export function parseDraftFields(raw: string): Record<string, RawField> {
  if (!raw.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const result: Record<string, RawField> = {}
    for (const [id, value] of Object.entries(parsed)) {
      if (!id.trim() || !value || typeof value !== 'object' || Array.isArray(value)) continue
      result[id] = value as RawField
    }
    return result
  } catch {
    return {}
  }
}

export function stringifyDraftFields(fields: Record<string, RawField>): string {
  const entries = Object.entries(fields).filter(([id]) => id.trim())
  if (entries.length === 0) return ''
  return JSON.stringify(Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b))))
}
