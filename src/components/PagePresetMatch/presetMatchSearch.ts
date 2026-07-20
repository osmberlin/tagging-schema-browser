import { z } from 'zod'

export const GEOMETRY_OPTIONS = ['point', 'vertex', 'line', 'area', 'relation'] as const

export const presetMatchSearchSchema = z.object({
  tags: z.string().catch(''),
  geometry: z.enum(GEOMETRY_OPTIONS).catch('point'),
  region: z.string().catch(''),
})

export type PresetMatchSearch = z.infer<typeof presetMatchSearchSchema>

export const presetMatchSearchDefaults: PresetMatchSearch = presetMatchSearchSchema.parse({})
