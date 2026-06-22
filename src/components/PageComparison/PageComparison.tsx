import { PresetIconBox } from "@/components/PagePresets/PresetIconBox";
import { useSetPreset } from "@/components/PagePresets/useSearchState";
import { CountPill } from "@/components/ui/CountPill";
import { useComparison } from "@/contexts/ComparisonContext";
import { useSchema } from "@/contexts/SchemaContext";
import type { FieldDiff } from "@/utils/presetDiff";
import type { DenormalizedPreset } from "@/utils/types";

function PresetRow({
  preset,
  diffs,
  onOpen,
}: {
  preset: DenormalizedPreset;
  diffs?: FieldDiff[];
  onOpen?: (id: string) => void;
}) {
  const head = (
    <>
      <PresetIconBox preset={preset} size="sm" />
      <div className="min-w-0">
        <div className="font-medium text-slate-900">{preset.name}</div>
        <div className="font-mono text-[11px] text-slate-400">{preset.id}</div>
      </div>
    </>
  );
  return (
    <li className="rounded-xl border border-slate-200 bg-white">
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(preset.id)}
          className="flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-violet-50"
          title="Show details of preset"
        >
          {head}
        </button>
      ) : (
        <div className="flex items-start gap-2 px-3 py-2" title="Only in the release">
          {head}
        </div>
      )}
      {diffs && diffs.length > 0 ? (
        <dl className="border-t border-slate-100 px-3 py-2 text-xs">
          {diffs.map((d) => (
            <div key={d.label} className="grid grid-cols-[5rem_1fr] gap-x-3 py-0.5">
              <dt className="font-semibold tracking-wide text-slate-500 uppercase">{d.label}</dt>
              <dd className="min-w-0">
                <span className="text-rose-600 line-through">{d.before || "—"}</span>
                <span className="mx-1 text-slate-300">→</span>
                <span className="text-emerald-700">{d.after || "—"}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${accent}`} aria-hidden />
        {title} <CountPill className="text-sm">{count}</CountPill>
      </h2>
      {count === 0 ? (
        <p className="text-sm text-slate-400">None.</p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  );
}

export function PageComparison() {
  const { isRelease, result, loading, error, domain, releaseVersion } = useComparison();
  const { dataUrl, data } = useSchema();
  const setPreset = useSetPreset();

  if (!dataUrl && !data) {
    return <p className="text-sm text-slate-500">Load schema data from the Presets page first.</p>;
  }

  if (isRelease) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Comparison</h1>
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          You're viewing the published release, so there's nothing to compare. Load a custom build
          (a PR preview <code className="font-mono">dataUrl</code>) to see what changed against the
          release.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Comparison</h1>
        <p className="text-sm text-slate-500">
          <span className="font-mono text-violet-700">{domain}</span> vs release
          {releaseVersion ? ` ${releaseVersion}` : ""}.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading the release to compare…</p>
      ) : error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Could not load the release for comparison: {error}
        </p>
      ) : result ? (
        <div className="space-y-8">
          <Section title="Added" count={result.added.length} accent="bg-emerald-500">
            {result.added.map((p) => (
              <PresetRow key={p.id} preset={p} onOpen={setPreset} />
            ))}
          </Section>
          <Section title="Modified" count={result.modified.length} accent="bg-violet-500">
            {result.modified.map((m) => (
              <PresetRow key={m.current.id} preset={m.current} diffs={m.diffs} onOpen={setPreset} />
            ))}
          </Section>
          <Section title="Removed" count={result.removed.length} accent="bg-rose-500">
            {result.removed.map((p) => (
              <PresetRow key={p.id} preset={p} />
            ))}
          </Section>
        </div>
      ) : null}
    </div>
  );
}
