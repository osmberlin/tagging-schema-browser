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
      <p>
        Point the app at any compatible <code>dist/</code> base URL via <code>dataUrl</code> to
        compare branches or PR preview builds.
      </p>
    </article>
  );
}
