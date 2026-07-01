const REPO = "openstreetmap/id-tagging-schema";

/**
 * Best-effort branch/ref for GitHub source links from an id-tagging-schema `dataUrl`.
 * Release CDN → `main`; jsDelivr version spec → tag; Netlify deploy-preview → PR head ref.
 */
export function githubBranchFromDataUrl(dataUrl: string): string {
  const npmMatch = dataUrl.match(/id-tagging-schema@([^/]+)/);
  if (npmMatch) {
    const spec = npmMatch[1];
    if (spec === "latest") return "main";
    return spec;
  }

  try {
    const host = new URL(dataUrl).hostname;
    const prMatch = host.match(/^deploy-preview-(\d+)--/);
    if (prMatch) return `refs/pull/${prMatch[1]}/head`;
  } catch {
    // ignore invalid URLs
  }

  return "main";
}

/** Absolute GitHub URL for a file inside the id-tagging-schema repository. */
export function githubFileUrl(dataUrl: string, repoPath: string): string {
  const branch = githubBranchFromDataUrl(dataUrl);
  const path = repoPath.startsWith("/") ? repoPath.slice(1) : repoPath;
  return `https://github.com/${REPO}/blob/${branch}/${path}`;
}

/**
 * Preset id with underscore filename convention for unsearchable presets
 * (e.g. `amenity/bus_station` → `amenity/_bus_station`).
 */
function unsearchablePresetId(id: string): string {
  const lastSlash = id.lastIndexOf("/");
  if (lastSlash === -1) return `_${id}`;
  return `${id.slice(0, lastSlash)}/_${id.slice(lastSlash + 1)}`;
}

/** Repo-relative path for a preset, field, or nested preset reference. */
export function schemaRepoPath(
  kind: "preset" | "field",
  id: string,
  options?: { searchable?: boolean },
): string {
  if (kind === "field") return `data/fields/${id}.json`;
  const presetId = options?.searchable === false ? unsearchablePresetId(id) : id;
  return `data/presets/${presetId}.json`;
}
