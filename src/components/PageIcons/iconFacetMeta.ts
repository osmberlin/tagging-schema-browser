import { isIconSvgConfirmedMissing } from '@/components/PageIcons/iconRegistry'
import type { IconViewModel } from '@/utils/types'

export function buildIconFacetMeta(icons: IconViewModel[]) {
  const supplierCounts = new Map<string, number>()
  let withSvg = 0
  let missingSvg = 0
  let presetsCount = 0
  let optionsCount = 0
  let anyCount = 0
  let unusedCount = 0

  let missingPresetRef = 0

  for (const icon of icons) {
    supplierCounts.set(icon.prefix, (supplierCounts.get(icon.prefix) ?? 0) + 1)
    if (icon.svgRaw) withSvg += 1
    if (isIconSvgConfirmedMissing(icon.name)) missingSvg += 1
    if (icon.presetUsageCount > 0 && isIconSvgConfirmedMissing(icon.name)) {
      missingPresetRef += 1
    }
    if (icon.presetUsageCount > 0) presetsCount += 1
    if (icon.optionUsageCount > 0) optionsCount += 1
    if (icon.presetUsageCount > 0 || icon.optionUsageCount > 0) anyCount += 1
    if (icon.presetUsageCount === 0 && icon.optionUsageCount === 0) unusedCount += 1
  }

  return {
    supplierCounts,
    withSvg,
    missingSvg,
    missingPresetRef,
    presetsCount,
    optionsCount,
    anyCount,
    unusedCount,
  }
}
