import { z } from 'zod'

export const presetSwitchSearchSchema = z.object({
  preset1: z.string().catch(''),
  preset2: z.string().catch(''),
})

export type PresetSwitchSearch = z.infer<typeof presetSwitchSearchSchema>

export const presetSwitchSearchDefaults: PresetSwitchSearch = presetSwitchSearchSchema.parse({})
