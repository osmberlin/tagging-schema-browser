import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { PrPreviewList } from '@/components/PageAbout/PrPreviewList'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { Input } from '@/components/ui/Input'
import { areaAccent } from '@/theme/areaAccent'
import { externalLinkClass } from '@/theme/externalAccent'
import { INTEREM_DATA_URL } from '@/utils/constants'
import { deriveDataUrl } from '@/utils/deriveDataUrl'

function ColorDot({ halo, dot }: { halo: string; dot: string }) {
  return (
    <span className={`flex-none rounded-full p-1 ${halo}`}>
      <span className={`block size-1.5 rounded-full ${dot}`} />
    </span>
  )
}

function ColorLegendItem({ halo, dot, text }: { halo: string; dot: string; text: string }) {
  return (
    <li className="flex items-center gap-x-2">
      <ColorDot halo={halo} dot={dot} />
      <span className="text-sm text-slate-600">{text}</span>
    </li>
  )
}

/** Staging URL in the input → open release compared against that baseline. */
function ReleaseStagingCompare() {
  const [input, setInput] = useState(INTEREM_DATA_URL)
  const baselineUrl = useMemo(() => deriveDataUrl(input), [input])

  return (
    <div className="not-prose rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label htmlFor="staging-compare-url" className="block text-sm font-medium text-slate-900">
        Staging data URL
      </label>
      <p className="mt-1 text-xs text-slate-500">
        Compared against the published release when you open the browser. Edit to point at another
        build (e.g. a PR preview URL).
      </p>
      <Input
        id="staging-compare-url"
        type="url"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="mt-2 font-mono text-xs"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {baselineUrl ? (
          <Link
            to="/"
            search={(prev) => ({
              ...presetSearchDefaults,
              dataUrl: baselineUrl,
              reference: 'release',
              locale: prev.locale ?? '',
            })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${areaAccent.presets.button}`}
          >
            Compare against release →
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-400"
          >
            Compare against release →
          </button>
        )}
        {baselineUrl ? (
          <a
            href={`${baselineUrl}presets.min.json`}
            target="_blank"
            rel="noreferrer"
            className={externalLinkClass('text-sm')}
          >
            Test <code className="font-mono">presets.min.json</code> ↗
          </a>
        ) : null}
      </div>
      {input && !baselineUrl ? (
        <p className="mt-2 text-sm text-amber-700">Enter a valid http(s) URL.</p>
      ) : null}
    </div>
  )
}

export function PageAbout() {
  return (
    <article className="prose prose-slate prose-headings:scroll-mt-24">
      <h1>About</h1>
      <p>
        <strong>Tagging Schema Browser</strong> loads OpenStreetMap preset data from an
        id-tagging-schema <code>dist/</code> URL and lets you search presets, explore facets, and
        browse icons—useful for reviewing schema PRs and releases.
      </p>
      <h2>Upstream projects</h2>
      <ul>
        <li>
          <a
            href="https://github.com/openstreetmap/id-tagging-schema"
            target="_blank"
            rel="noreferrer"
            className={externalLinkClass()}
          >
            id-tagging-schema
          </a>{' '}
          — preset definitions, categories, fields, and published <code>dist/</code> JSON.
        </li>
        <li>
          <a
            href="https://github.com/openstreetmap/schema-builder"
            target="_blank"
            rel="noreferrer"
            className={externalLinkClass()}
          >
            schema-builder
          </a>{' '}
          — tooling that builds the schema distribution consumed by editors.
        </li>
      </ul>
      <h2>Schema version</h2>
      <p>
        The browser targets <strong>id-tagging-schema v7+</strong> (current npm release and
        staging). When you load a custom <code>dataUrl</code>, the app shows the detected build
        version in the header toggle or comparison banner. Version is read from the npm tag in
        jsDelivr URLs when present; otherwise it is inferred from the dist JSON (v7 uses array{' '}
        <code>terms</code>).
      </p>
      <p>
        Older v6 <code>dist/</code> URLs are not supported. If you open one via{' '}
        <code>?dataUrl=</code>, the app shows a notice and keeps the default staging or release
        dataset instead.
      </p>
      <h2>Release vs staging</h2>
      <p>
        Use the toggle under the logo to switch between <strong>staging</strong> — the default,
        latest unreleased build from id-tagging-schema <code>main</code> (labeled with when{' '}
        <code>main</code> last changed) — and the published <strong>release</strong> (npm{' '}
        <code>@latest</code>, with its version number). Deep-link the release with{' '}
        <code>?reference=release</code>. Your last choice is remembered in the browser.
      </p>
      <h2>Pointing at a different build</h2>
      <p>
        Point the app at any compatible <code>dist/</code> base URL via the <code>dataUrl</code>{' '}
        search param. The base URL is the folder that <em>directly contains</em>{' '}
        <code>presets.min.json</code> (alongside <code>fields.min.json</code>,{' '}
        <code>preset_categories.min.json</code>, and <code>translations/en.min.json</code>).
      </p>
      <p>
        Each id-tagging-schema pull request gets a Netlify preview at{' '}
        <code>https://pr-{'{N}'}--ideditor-presets-preview.netlify.app/</code>. The schema JSON is
        served from <code>/dist/</code>; GitHub bot comments usually link to the bundled iD editor
        at <code>/id/dist/</code> instead. Pick a PR from the list below — when its preview is
        ready, <strong>Open in browser</strong> loads that build compared against staging.
      </p>
      <PrPreviewList />
      <h3>Compare release vs staging</h3>
      <p>
        Open the published release with staging as the comparison reference — useful for seeing what
        will ship in the next npm version. You can swap the staging URL for a PR preview if you want
        to compare release against a specific pull request instead.
      </p>
      <ReleaseStagingCompare />
      <h2>Area colors</h2>
      <div className="not-prose space-y-2">
        <p className="text-sm text-slate-600">
          Each browsing area has its own accent color in the nav, page headings, links, and buttons:
        </p>
        <ul className="space-y-1.5">
          <ColorLegendItem halo="bg-rose-500/20" dot="bg-rose-500" text="rose for Presets" />
          <ColorLegendItem halo="bg-sky-500/20" dot="bg-sky-500" text="sky for Icons" />
          <ColorLegendItem
            halo="bg-emerald-500/20"
            dot="bg-emerald-500"
            text="emerald for Fields"
          />
          <ColorLegendItem
            halo="bg-yellow-500/20"
            dot="bg-yellow-500"
            text="yellow for Translations"
          />
          <ColorLegendItem
            halo="bg-amber-500/20"
            dot="bg-amber-500"
            text="amber for Preset switch"
          />
        </ul>
        <ul className="space-y-1.5 pt-1">
          <ColorLegendItem halo="bg-mist-500/20" dot="bg-mist-500" text="mist for the logo" />
          <ColorLegendItem
            halo="bg-mauve-500/20"
            dot="bg-mauve-500"
            text="mauve for outbound links (GitHub, test URLs)"
          />
        </ul>
      </div>
      <h2>Spotting PR preview data</h2>
      <p>
        Whenever you load a custom build via <code>dataUrl</code>,{' '}
        <span className="font-medium text-violet-700">violet</span> is the app-wide signal: the
        banner under the header, a <span className="font-medium text-violet-700">Comparison</span>{' '}
        tab in the nav, and a violet dot on each preset that was added or modified versus staging.
        Open <span className="font-medium text-violet-700">Comparison</span> for the full list of
        added, modified, and removed presets.
      </p>
    </article>
  )
}
