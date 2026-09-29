export type CompareTab = 'presets' | 'fields' | 'categories'

const TAB_ORDER: CompareTab[] = ['presets', 'fields', 'categories']

/** First tab that has changes; falls back to presets when nothing changed. */
export function defaultComparisonTab(counts: Record<CompareTab, number>): CompareTab {
  return TAB_ORDER.find((tab) => counts[tab] > 0) ?? 'presets'
}
