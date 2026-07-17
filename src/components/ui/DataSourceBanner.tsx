import { Link } from '@tanstack/react-router'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { Tooltip } from '@/components/ui/Tooltip'
import { useCommitSchemaReference } from '@/hooks/useCommitSchemaReference'
import { useComparison } from '@/hooks/useComparison'
import { useSchema } from '@/hooks/useSchema'
import { externalLinkClass } from '@/theme/externalAccent'
import { formatSchemaBuildLabel } from '@/utils/schemaBuildVersion'
import { formatUnreleasedUpdatedAt } from '@/utils/schemaVersion'
import { cn } from '@/utils/tw'

/**
 * Violet strip under the header while a PR/custom build is in comparison mode.
 * "Show …" buttons exit compare view and browse canonical unreleased or release.
 * The schema version dropdown also has explicit "Comparing" vs "Browse without compare" sections.
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
  const commitSchemaReference = useCommitSchemaReference()
  const unreleasedAge = formatUnreleasedUpdatedAt(unreleasedUpdatedAt)

  if (!isComparing) return null

  const showUnreleased = () => {
    commitSchemaReference('interim', { clearDataUrl: true })
  }
  const showRelease = () => {
    commitSchemaReference('release', { clearDataUrl: true })
  }

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

  const unreleasedButtonClass = cn(
    'rounded-md px-2.5 py-1 font-medium transition',
    compareMode === 'preview'
      ? 'bg-violet-600 text-white hover:bg-violet-700'
      : 'text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100',
  )
  const releaseButtonClass = cn(
    'rounded-md px-2.5 py-1 font-medium transition',
    compareMode === 'release'
      ? 'bg-violet-600 text-white hover:bg-violet-700'
      : 'text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100',
  )

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
        {changeCount != null ? (
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
              {changeCount} change{changeCount === 1 ? '' : 's'} vs {compareTarget}
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
        <Tooltip
          content="Stop comparing and browse unreleased main"
          placement="bottom"
          openDelay={400}
        >
          <button type="button" onClick={showUnreleased} className={unreleasedButtonClass}>
            Show unreleased{unreleasedAge ? ` · ${unreleasedAge}` : ''}
          </button>
        </Tooltip>
        <Tooltip
          content="Stop comparing and browse the published release"
          placement="bottom"
          openDelay={400}
        >
          <button type="button" onClick={showRelease} className={releaseButtonClass}>
            Show release{releaseVersion ? ` ${releaseVersion}` : ''}
          </button>
        </Tooltip>
      </span>
    </div>
  )
}
