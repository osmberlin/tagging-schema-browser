export const NETLIFY_PREVIEW_SITE = "ideditor-presets-preview.netlify.app";

export function prPreviewDataUrl(prNumber: number): string {
  return `https://pr-${prNumber}--${NETLIFY_PREVIEW_SITE}/dist/`;
}

export function prPreviewEditorUrl(prNumber: number): string {
  return `https://pr-${prNumber}--${NETLIFY_PREVIEW_SITE}/id/dist/`;
}
