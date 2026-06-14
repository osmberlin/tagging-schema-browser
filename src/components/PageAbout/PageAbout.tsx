import { presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import { Input } from "@/components/ui/Input";
import { deriveDataUrl } from "@/utils/deriveDataUrl";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

const EXAMPLE_PREVIEW =
  "https://pr-2276--ideditor-presets-preview.netlify.app/id/dist/#locale=en&map=18.00/48.84/2.58";

/** Paste any id-tagging-schema preview URL → get the correct `dataUrl` base, with a way to test + load it. */
function DataUrlGenerator() {
  const [input, setInput] = useState("");
  const derived = useMemo(() => deriveDataUrl(input), [input]);

  return (
    <div className="not-prose rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label htmlFor="derive-url" className="block text-sm font-medium text-slate-900">
        Paste an iD preview URL (or any site URL)
      </label>
      <Input
        id="derive-url"
        type="url"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={EXAMPLE_PREVIEW}
        className="mt-2"
      />
      {input && !derived ? (
        <p className="mt-2 text-sm text-amber-700">Enter a valid http(s) URL.</p>
      ) : null}
      {derived ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-slate-500">Generated data URL</p>
          <code className="block overflow-x-auto rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700">
            {derived}
          </code>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              to="/"
              search={(prev) => ({
                ...presetSearchDefaults,
                dataUrl: derived,
                locale: prev.locale ?? "",
              })}
              className="rounded-lg bg-sky-600 px-3 py-1.5 font-medium text-white hover:bg-sky-700"
            >
              Open in browser →
            </Link>
            <a
              href={`${derived}presets.min.json`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-sky-600 hover:underline"
            >
              To test, open <code className="font-mono">presets.min.json</code> ↗
            </a>
          </div>
          <p className="text-xs text-slate-500">
            The test link should show JSON. If it shows an HTML page (starting with{" "}
            <code className="font-mono">&lt;!doctype</code>), the URL points at an app/editor, not a
            schema <code className="font-mono">dist/</code> folder. Hosts that don’t send CORS
            headers (e.g. netlify PR previews) are fetched through a public CORS proxy
            automatically.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function PageAbout() {
  return (
    <article className="prose prose-slate prose-headings:scroll-mt-24 prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline">
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
          >
            id-tagging-schema
          </a>{" "}
          — preset definitions, categories, fields, and published <code>dist/</code> JSON.
        </li>
        <li>
          <a
            href="https://github.com/openstreetmap/schema-builder"
            target="_blank"
            rel="noreferrer"
          >
            schema-builder
          </a>{" "}
          — tooling that builds the schema distribution consumed by editors.
        </li>
      </ul>
      <h2>Pointing at a different build</h2>
      <p>
        Point the app at any compatible <code>dist/</code> base URL via the <code>dataUrl</code>{" "}
        search param to compare branches or PR preview builds. The base URL is the folder that{" "}
        <em>directly contains</em> <code>presets.min.json</code> (alongside{" "}
        <code>fields.min.json</code>, <code>preset_categories.min.json</code>, and{" "}
        <code>translations/en.min.json</code>).
      </p>
      <p>
        A netlify PR-preview link usually points at the bundled iD editor, e.g.{" "}
        <code>https://pr-2276--ideditor-presets-preview.netlify.app/id/dist/#locale=en&map=…</code>.
        That <code>/id/dist/</code> path (and its <code>#…</code> hash) is the editor itself — not
        the schema, which lives at the site's <code>/dist/</code> root. Paste any such URL below to
        generate the right <code>dataUrl</code>:
      </p>
      <DataUrlGenerator />
      <h2>Spotting non-release data</h2>
      <p>
        Whenever you load a custom build,{" "}
        <span className="font-medium text-violet-700">violet</span> is the app-wide signal that
        you’re looking at non-release data: the banner under the header, a{" "}
        <span className="font-medium text-violet-700">Comparison</span> tab in the nav, and a violet
        dot on each preset that was added or modified versus the release. Open{" "}
        <span className="font-medium text-violet-700">Comparison</span> for the full list of added,
        modified, and removed presets.
      </p>
    </article>
  );
}
