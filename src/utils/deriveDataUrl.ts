/**
 * Turn an arbitrary id-tagging-schema preview link into the `dataUrl` base that
 * directly contains `presets.min.json`.
 *
 * The common mistake is pasting the bundled iD editor URL
 * (`https://…/id/dist/#locale=…`). That path serves the editor SPA, so fetching
 * `presets.min.json` under it returns `index.html` ("Unexpected token '<'").
 * The schema JSON is published at the site's `/dist/` root instead.
 *
 * Returns null for empty or non-http(s) input.
 */
export function deriveDataUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  // iD editor state lives in the hash/query — never part of the data base.
  url.hash = "";
  url.search = "";

  let path = url.pathname;
  const editorIdx = path.indexOf("/id/dist");
  if (editorIdx !== -1) {
    // `<base>/id/dist/` (the editor) → `<base>/dist/` (the schema).
    path = `${path.slice(0, editorIdx)}/dist/`;
  } else if (/\/dist\/?$/.test(path)) {
    // Already a dist base (e.g. a jsDelivr URL) — just normalise the slash.
    path = path.replace(/\/dist\/?$/, "/dist/");
  } else {
    // Otherwise treat the given path as the site base and append `dist/`.
    path = `${path.replace(/\/+$/, "")}/dist/`;
  }

  return `${url.origin}${path}`;
}
