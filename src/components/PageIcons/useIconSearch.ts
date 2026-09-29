import { useEffect, useMemo } from 'react'
import { collectOptionIconUsages } from '@/utils/fieldOptions'
import type { DenormalizedPreset, FieldTranslations, IconViewModel, RawFields } from '@/utils/types'
import { ensureIconsForNames, useIconRegistryEntries } from './iconRegistry'

export function useIconSearch(
  presets: DenormalizedPreset[],
  fields: RawFields,
  fieldTranslations: FieldTranslations = {},
) {
  const registryEntries = useIconRegistryEntries()

  useEffect(() => {
    const presetIconNames = presets
      .map((preset) => preset.icon)
      .filter((icon): icon is string => Boolean(icon))
    const optionIconNames = [...collectOptionIconUsages(fields, presets, fieldTranslations).keys()]
    const iconNames = [...new Set([...presetIconNames, ...optionIconNames])]
    if (iconNames.length > 0) {
      void ensureIconsForNames(iconNames)
    }
  }, [presets, fields, fieldTranslations])

  return useMemo(() => {
    const presetUsage = new Map<string, DenormalizedPreset[]>()
    const optionUsage = collectOptionIconUsages(fields, presets, fieldTranslations)

    for (const preset of presets) {
      if (!preset.icon) continue
      const list = presetUsage.get(preset.icon) ?? []
      list.push(preset)
      presetUsage.set(preset.icon, list)
    }

    // Referenced icons without a registry entry (unknown name / supplier) still get a card.
    const entries = new Map(registryEntries.map((entry) => [entry.name, entry]))
    for (const iconName of [...presetUsage.keys(), ...optionUsage.keys()]) {
      if (!entries.has(iconName)) {
        const prefix = iconName.split('-')[0] ?? 'unknown'
        entries.set(iconName, { name: iconName, prefix })
      }
    }

    const icons: IconViewModel[] = Array.from(entries.values()).map((entry) => {
      const presetsForIcon = presetUsage.get(entry.name) ?? []
      const optionsForIcon = optionUsage.get(entry.name) ?? []
      const presetUsageCount = presetsForIcon.length
      const optionUsageCount = optionsForIcon.length
      return {
        ...entry,
        presetUsageCount,
        optionUsageCount,
        usageCount: presetUsageCount + optionUsageCount,
        presets: presetsForIcon,
        optionUsages: optionsForIcon,
      }
    })

    return { icons }
  }, [presets, fields, fieldTranslations, registryEntries])
}
