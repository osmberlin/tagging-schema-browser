/** Preset id/path reflects `data/presets/` layout (`@templates/...` folders). */
export function isTemplatePresetId(id: string): boolean {
  return id.startsWith('@templates/') || id.includes('@templates')
}

/** Built dist may also mark templates via the `@template` tag key. */
export function isTemplatePresetTags(tags: Record<string, string> | undefined): boolean {
  return Boolean(tags && '@template' in tags)
}

export function isTemplatePreset(
  preset: Pick<{ id: string; tags?: Record<string, string> }, 'id' | 'tags'>,
): boolean {
  return isTemplatePresetId(preset.id) || isTemplatePresetTags(preset.tags)
}
