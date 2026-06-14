import { presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import { Link } from "@tanstack/react-router";

export function IconCard({
  iconName,
  svgRaw,
  usageCount,
}: {
  iconName: string;
  svgRaw?: string;
  usageCount: number;
}) {
  const svgDataUrl = svgRaw ? `data:image/svg+xml;utf8,${encodeURIComponent(svgRaw)}` : null;
  return (
    <article
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 transition duration-200 hover:border-sky-300 hover:shadow-lg hover:shadow-slate-900/5"
      data-icon={iconName}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 [&_svg]:h-10 [&_svg]:w-10 [&_svg]:fill-current"
          title="60px (sidebar ref)"
        >
          {svgDataUrl ? (
            <img src={svgDataUrl} alt="" className="h-10 w-10" />
          ) : (
            <span className="text-center text-[10px] font-mono">60px</span>
          )}
        </div>
        <div
          className="flex h-3 w-3 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:fill-current"
          title="12px (map pin ref)"
        >
          {svgDataUrl ? (
            <img src={svgDataUrl} alt="" className="h-3 w-3" />
          ) : (
            <span className="text-[6px] font-mono">12</span>
          )}
        </div>
      </div>
      <p className="mt-2 font-mono text-xs font-medium text-slate-900">{iconName}</p>
      {usageCount > 0 ? (
        <Link
          to="/"
          search={(prev) => ({
            ...presetSearchDefaults,
            dataUrl: prev.dataUrl ?? "",
            iconName: [iconName],
          })}
          className="mt-2 inline-flex w-fit items-center rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100 ring-inset transition hover:bg-sky-100"
        >
          Show presets ({usageCount})
        </Link>
      ) : (
        <p className="mt-2 text-xs text-slate-400">Unused</p>
      )}
    </article>
  );
}
