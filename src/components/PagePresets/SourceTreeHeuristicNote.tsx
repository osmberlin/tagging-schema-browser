/** Quiet hint above the source tree: its `{preset}` references are reconstructed, not read. */
export function SourceTreeHeuristicNote() {
  return (
    <details className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
      <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900">
        Why can this differ from the source file?
      </summary>
      <div className="mt-2 max-w-3xl space-y-2">
        <p>
          In the <code>id-tagging-schema</code> source files, a preset can reference another one,
          e.g. <code>{'{building}'}</code> in a field list. The build expands every reference into
          plain field ids and writes only the result to <code>presets.json</code>, the file this
          site loads. It does not record which entries came from a reference.
        </p>
        <p>
          To show a readable tree, this page works the references back out by comparing field lists.
          That is a heuristic, not a clean data model: it can show a <code>{'{preset}'}</code>{' '}
          reference that is not in the source, or show a list spelled out where the source uses a
          reference. Comparisons between versions have the same limit.
        </p>
        <p>The GitHub file linked in the section header is the authoritative version.</p>
      </div>
    </details>
  )
}
