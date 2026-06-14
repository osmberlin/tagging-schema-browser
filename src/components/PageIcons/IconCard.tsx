import { presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import type { DenormalizedPreset } from "@/utils/types";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

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
  const [expanded, setExpanded] = useState(false);
  const prefix = iconName.split("-")[0] ?? "";
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
      <p className="mt-2 font-mono text-xs font-medium text-slate-900 ">{iconName}</p>
      <p className="text-xs text-slate-500 ">
        {prefix} · used by {usageCount} preset{usageCount !== 1 ? "s" : ""}
      </p>
      {presets.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 self-start text-xs text-sky-600 hover:underline "
          >
            {expanded ? "Hide" : "Show"} presets
          </button>
          {expanded && (
            <ul className="mt-1 space-y-0.5 text-xs">
              {presets.slice(0, 10).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/"
                    search={(prev) => ({
                      ...presetSearchDefaults,
                      dataUrl: prev.dataUrl ?? "",
                      iconPrefix: [p.iconPrefix ?? ""],
                    })}
                    className="text-sky-600 hover:underline "
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
              {presets.length > 10 && (
                <li className="text-slate-500">+{presets.length - 10} more</li>
              )}
            </ul>
          )}
        </>
      )}
    </article>
  );
}
