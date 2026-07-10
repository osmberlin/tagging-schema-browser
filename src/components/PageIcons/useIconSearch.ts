import { useEffect, useMemo } from 'react'
import { collectOptionIconUsages } from '@/utils/fieldOptions'
import type { DenormalizedPreset, FieldTranslations, IconViewModel, RawFields } from '@/utils/types'
import { ensureIconsForNames, getIconRegistry, useIconRegistryEpoch } from './iconRegistry'

export function useIconSearch(
  presets: DenormalizedPreset[],
  fields: RawFields,
  fieldTranslations: FieldTranslations = {},
) {
  const registryEpoch = useIconRegistryEpoch()

  useEffect(() => {
    const presetIconNames = presets
      .map((preset) => preset.icon)
      .filter((icon): icon is string => Boolean(icon))
    if (presetIconNames.length > 0) {
      void ensureIconsForNames(presetIconNames)
    }
  }, [presets])

  return useMemo(() => {
    const registry = getIconRegistry()
    void registryEpoch
    const presetUsage = new Map<string, DenormalizedPreset[]>()
    const optionUsage = collectOptionIconUsages(fields, presets, fieldTranslations)

    for (const preset of presets) {
      if (!preset.icon) continue
      const list = presetUsage.get(preset.icon) ?? []
      list.push(preset)
      presetUsage.set(preset.icon, list)
    }

    const referenced = new Set([...presetUsage.keys(), ...optionUsage.keys()])
    for (const iconName of referenced) {
      if (!registry.has(iconName)) {
        const prefix = iconName.split('-')[0] ?? 'unknown'
        registry.set(iconName, { name: iconName, prefix })
      }
    }

    const icons: IconViewModel[] = Array.from(registry.values()).map((entry) => {
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
  }, [presets, fields, fieldTranslations, registryEpoch])
}
