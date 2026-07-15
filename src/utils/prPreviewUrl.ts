export const NETLIFY_PREVIEW_SITE = 'ideditor-presets-preview.netlify.app'

/** True when `dataUrl` points at an id-tagging-schema Netlify PR preview dist. */
export function isPrPreviewDataUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    return new URL(trimmed).hostname.endsWith(NETLIFY_PREVIEW_SITE)
  } catch {
    return false
  }
}

export function prPreviewDataUrl(prNumber: number): string {
  return `https://pr-${prNumber}--${NETLIFY_PREVIEW_SITE}/dist/`
}

export function prPreviewEditorUrl(prNumber: number): string {
  return `https://pr-${prNumber}--${NETLIFY_PREVIEW_SITE}/id/dist/`
}
