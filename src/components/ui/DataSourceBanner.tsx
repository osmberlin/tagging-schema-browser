import { presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import { useComparison } from "@/contexts/ComparisonContext";
import { externalLinkClass } from "@/theme/externalAccent";
import { formatStagingUpdatedAt } from "@/utils/schemaVersion";
import { Link, useNavigate } from "@tanstack/react-router";

/**
 * Full-width strip under the header, shown only on a custom/PR build — the
 * app-wide violet signal that you're looking at non-release data. The release
 * / staging toggle is under the logo (see SidebarLayout). Left: which build +
 * how many changes; right: buttons back to staging or release.
 */
export function DataSourceBanner() {
  const {
    isComparing,
    compareMode,
    compareLabel,
    domain,
    presetsUrl,
    stagingUpdatedAt,
    releaseVersion,
    result,
    loading,
  } = useComparison();
  const navigate = useNavigate();
  const stagingAge = formatStagingUpdatedAt(stagingUpdatedAt);

  if (!isComparing) return null;

  const showStaging = () => {
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, dataUrl: undefined, reference: undefined }),
    });
  };
  const showRelease = () => {
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, dataUrl: undefined, reference: "release" }),
    });
  };
  const changeCount = result
    ? result.added.length + result.removed.length + result.modified.length
    : null;

  const versionLabel =
    compareMode === "release" ? `Release${releaseVersion ? ` ${releaseVersion}` : ""}` : domain;
  const compareTarget =
    compareMode === "release"
      ? `${compareLabel}${compareLabel === "staging" && stagingAge ? ` · ${stagingAge}` : ""}`
      : `staging${stagingAge ? ` · ${stagingAge}` : ""}`;
  const loadingLabel =
    compareMode === "release" && compareLabel !== "staging"
      ? "comparing to PR preview…"
      : "comparing to staging…";

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
            {versionLabel}
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
                reference: prev.reference,
              })}
              className="font-medium hover:underline"
            >
              {changeCount} change{changeCount === 1 ? "" : "s"} vs {compareTarget}
            </Link>
          </>
        ) : loading ? (
          <>
            <span className="text-violet-300">·</span>
            <span className="text-violet-400">{loadingLabel}</span>
          </>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={showStaging}
          className="rounded-md bg-violet-600 px-2.5 py-1 font-medium text-white transition hover:bg-violet-700"
        >
          Show staging{stagingAge ? ` · ${stagingAge}` : ""}
        </button>
        <button
          type="button"
          onClick={showRelease}
          className="rounded-md px-2.5 py-1 font-medium text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100"
        >
          Show release{releaseVersion ? ` ${releaseVersion}` : ""}
        </button>
      </span>
    </div>
  );
}
