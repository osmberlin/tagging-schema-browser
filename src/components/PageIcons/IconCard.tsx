import { presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import type { DenormalizedPreset } from "@/utils/types";
import { Link } from "@tanstack/react-router";

export function IconCard({
  iconName,
  svgRaw,
  usageCount,
  presets,
}: {
  iconName: string;
  svgRaw?: string;
  usageCount: number;
  presets: DenormalizedPreset[];
}) {
  const svgDataUrl = svgRaw ? `data:image/svg+xml;utf8,${encodeURIComponent(svgRaw)}` : null;
  const names = presets.map((p) => p.name).join(", ");
  return (
    <article
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-2.5 transition duration-200 hover:border-sky-300 hover:shadow-md hover:shadow-slate-900/5"
      data-icon={iconName}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 [&_svg]:h-8 [&_svg]:w-8 [&_svg]:fill-current"
          title="60px reference"
        >
          {svgDataUrl ? (
            <img src={svgDataUrl} alt="" className="h-8 w-8" />
          ) : (
            <span className="font-mono text-[10px]">60</span>
          )}
        </div>
        <div
          className="flex h-3 w-3 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-500 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:fill-current"
          title="12px reference"
        >
          {svgDataUrl ? (
            <img src={svgDataUrl} alt="" className="h-3 w-3" />
          ) : (
            <span className="text-[6px] font-mono">12</span>
          )}
        </div>
      </div>
      <p className="mt-2 truncate font-mono text-xs font-medium text-slate-900" title={iconName}>
        {iconName}
      </p>
      {usageCount > 0 ? (
        <Link
          to="/"
          search={(prev) => ({
            ...presetSearchDefaults,
            dataUrl: prev.dataUrl ?? "",
            iconName: [iconName],
          })}
          title={`Show all ${usageCount} presets using "${iconName}"`}
          className="group/ac relative mt-1 block rounded-md px-1 py-0.5 transition hover:bg-sky-50"
        >
          <span className="line-clamp-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Presets ({usageCount}):</span> {names}
          </span>
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 hidden h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 group-hover/ac:flex"
          >
            ›
          </span>
        </Link>
      ) : (
        <p className="mt-1 px-1 text-xs text-slate-400">Unused</p>
      )}
    </article>
  );
}
