import { presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import { useComparison } from "@/contexts/ComparisonContext";
import { externalLinkClass } from "@/theme/externalAccent";
import { Link, useNavigate } from "@tanstack/react-router";

/**
 * Full-width strip under the header, shown only on a custom/PR build — the
 * app-wide violet signal that you're looking at non-release data. The release
 * version itself is shown under the logo (see SidebarLayout), not here. Left:
 * which build + how many changes; right: a button back to the release.
 */
export function DataSourceBanner() {
  const { isRelease, domain, presetsUrl, releaseVersion, result, loading } = useComparison();
  const navigate = useNavigate();

  if (isRelease) return null;

  const showRelease = () => {
    void navigate({ to: ".", search: (prev) => ({ ...prev, dataUrl: undefined }) });
  };
  const changeCount = result
    ? result.added.length + result.removed.length + result.modified.length
    : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-violet-100 bg-violet-50 px-4 py-1.5 text-xs text-violet-700 sm:px-6 lg:px-8">
      <span className="flex flex-wrap items-center gap-x-2">
        <span>
          Data for version{" "}
          <a
            href={presetsUrl}
            target="_blank"
            rel="noreferrer"
            className={externalLinkClass("font-medium")}
            title="Open this build's presets.min.json"
          >
            {domain}
          </a>
        </span>
        {changeCount != null ? (
          <>
            <span className="text-violet-300">·</span>
            <Link
              to="/comparison"
              search={(prev) => ({
                ...presetSearchDefaults,
                dataUrl: prev.dataUrl ?? "",
                locale: prev.locale ?? "",
              })}
              className="font-medium hover:underline"
            >
              {changeCount} change{changeCount === 1 ? "" : "s"} vs release
              {releaseVersion ? ` ${releaseVersion}` : ""}
            </Link>
          </>
        ) : loading ? (
          <>
            <span className="text-violet-300">·</span>
            <span className="text-violet-400">comparing to release…</span>
          </>
        ) : null}
      </span>
      <button
        type="button"
        onClick={showRelease}
        className="shrink-0 rounded-md bg-violet-600 px-2.5 py-1 font-medium text-white transition hover:bg-violet-700"
      >
        Show release{releaseVersion ? ` ${releaseVersion}` : ""}
      </button>
    </div>
  );
}
