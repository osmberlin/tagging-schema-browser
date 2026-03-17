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
      className="flex flex-col rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
      data-icon={iconName}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300 [&_svg]:h-10 [&_svg]:w-10 [&_svg]:fill-current"
          title="60px (sidebar ref)"
        >
          {svgDataUrl ? (
            <img src={svgDataUrl} alt="" className="h-10 w-10" />
          ) : (
            <span className="text-center text-[10px] font-mono">60px</span>
          )}
        </div>
        <div
          className="flex h-3 w-3 shrink-0 items-center justify-center rounded bg-zinc-200 text-zinc-500 dark:bg-zinc-600 dark:text-zinc-300 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:fill-current"
          title="12px (map pin ref)"
        >
          {svgDataUrl ? (
            <img src={svgDataUrl} alt="" className="h-3 w-3" />
          ) : (
            <span className="text-[6px] font-mono">12</span>
          )}
        </div>
      </div>
      <p className="mt-2 font-mono text-xs font-medium text-zinc-900 dark:text-white">{iconName}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {prefix} · used by {usageCount} preset{usageCount !== 1 ? "s" : ""}
      </p>
      {presets.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 self-start text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            {expanded ? "Hide" : "Show"} presets
          </button>
          {expanded && (
            <ul className="mt-1 space-y-0.5 text-xs">
              {presets.slice(0, 10).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/"
                    search={{ iconPrefix: [p.iconPrefix ?? ""] }}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
              {presets.length > 10 && (
                <li className="text-zinc-500">+{presets.length - 10} more</li>
              )}
            </ul>
          )}
        </>
      )}
    </article>
  );
}
