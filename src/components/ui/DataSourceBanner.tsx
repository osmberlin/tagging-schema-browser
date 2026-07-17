import { Link, useNavigate } from '@tanstack/react-router'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { Tooltip } from '@/components/ui/Tooltip'
import { useComparison } from '@/hooks/useComparison'
import { useSchema } from '@/hooks/useSchema'
import { externalLinkClass } from '@/theme/externalAccent'
import { formatSchemaBuildLabel } from '@/utils/schemaBuildVersion'
import { formatUnreleasedUpdatedAt } from '@/utils/schemaVersion'

/**
 * Full-width strip under the header, shown only on a custom/PR build — the
 * app-wide violet signal that you're looking at non-release data. The release
 * / unreleased toggle is under the logo (see SidebarLayout). Left: which build +
 * how many changes; right: buttons back to unreleased or release.
 */
export function DataSourceBanner() {
  const {
    isComparing,
    compareMode,
    compareLabel,
    domain,
    presetsUrl,
    unreleasedUpdatedAt,
    releaseVersion,
    changeCount,
    loading,
  } = useComparison()
  const { schemaBuild } = useSchema()
  const navigate = useNavigate()
  const unreleasedAge = formatUnreleasedUpdatedAt(unreleasedUpdatedAt)

  if (!isComparing) return null

  const showUnreleased = () => {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, reference: undefined }),
    })
  }
  const showRelease = () => {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, reference: 'release' }),
    })
  }
  const changeCountFromResult = changeCount

  const versionLabel =
    compareMode === 'release'
      ? `Release${releaseVersion ? ` ${releaseVersion}` : ''}`
      : schemaBuild
        ? formatSchemaBuildLabel(schemaBuild, { resolvedReleaseVersion: releaseVersion })
        : domain
  const compareTarget =
    compareMode === 'release'
      ? `${compareLabel}${compareLabel === 'unreleased' && unreleasedAge ? ` · ${unreleasedAge}` : ''}`
      : `unreleased${unreleasedAge ? ` · ${unreleasedAge}` : ''}`
  const loadingLabel =
    compareMode === 'release' && compareLabel !== 'unreleased'
      ? 'comparing to PR preview…'
      : 'comparing to unreleased…'

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-violet-100 bg-violet-50 px-4 py-1.5 text-xs text-violet-700 sm:px-6 lg:px-8">
      <span className="flex flex-wrap items-center gap-x-2">
        <span>
          Data for version{' '}
          <Tooltip content="Open this build's presets.min.json" placement="bottom">
            <a
              href={presetsUrl}
              target="_blank"
              rel="noreferrer"
              className={externalLinkClass('font-medium')}
            >
              {versionLabel}
            </a>
          </Tooltip>
        </span>
        {changeCountFromResult != null ? (
          <>
            <span className="text-violet-300">·</span>
            <Link
              to="/comparison"
              search={(prev) => ({
                ...presetSearchDefaults,
                dataUrl: prev.dataUrl ?? '',
                locale: prev.locale ?? '',
                reference: prev.reference,
              })}
              className="font-medium hover:underline"
            >
              {changeCountFromResult} change{changeCountFromResult === 1 ? '' : 's'} vs{' '}
              {compareTarget}
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
          onClick={showUnreleased}
          className="rounded-md bg-violet-600 px-2.5 py-1 font-medium text-white transition hover:bg-violet-700"
        >
          Show unreleased{unreleasedAge ? ` · ${unreleasedAge}` : ''}
        </button>
        <button
          type="button"
          onClick={showRelease}
          className="rounded-md px-2.5 py-1 font-medium text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100"
        >
          Show release{releaseVersion ? ` ${releaseVersion}` : ''}
        </button>
      </span>
    </div>
  )
}
