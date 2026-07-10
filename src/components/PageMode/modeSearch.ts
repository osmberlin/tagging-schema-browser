import { z } from 'zod'

export const GEOMETRY_OPTIONS = ['point', 'vertex', 'line', 'area', 'relation'] as const

export const modeSearchSchema = z.object({
  tags: z.string().catch(''),
  geometry: z.enum(GEOMETRY_OPTIONS).catch('point'),
  region: z.string().catch(''),
})

export type ModeSearch = z.infer<typeof modeSearchSchema>

export const modeSearchDefaults: ModeSearch = modeSearchSchema.parse({})
