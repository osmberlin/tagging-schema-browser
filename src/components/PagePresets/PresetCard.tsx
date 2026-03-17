import { getIconSvgDataUrl } from "@/components/PageIcons/iconRegistry";
import { Badge } from "@/components/ui/Badge";
import type { DenormalizedPreset } from "@/utils/types";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export function PresetCard({ preset }: { preset: DenormalizedPreset }) {
  const [expanded, setExpanded] = useState(false);
  const tags = preset.tags && typeof preset.tags === "object" ? preset.tags : {};
  const tagEntries = Object.entries(tags);
  const aliases = Array.isArray(preset.aliases) ? preset.aliases : [];
  const terms = Array.isArray(preset.terms) ? preset.terms : [];
  const geometry = Array.isArray(preset.geometry) ? preset.geometry : [];
  const categoryNames = Array.isArray(preset.categoryNames) ? preset.categoryNames : [];
  const fields = Array.isArray(preset.fields) ? preset.fields : [];
  const moreFields = Array.isArray(preset.moreFields) ? preset.moreFields : [];
  const iconSrc = getIconSvgDataUrl(preset.icon);
  return (
    <article
      className="group flex min-h-[180px] flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:ring-zinc-600"
      data-preset-id={preset.id}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-lg text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
          title={preset.icon ?? "No icon"}
        >
          {iconSrc ? (
            <img src={iconSrc} alt="" className="h-6 w-6" />
          ) : preset.icon ? (
            <span className="font-mono text-[10px] leading-tight">
              {preset.iconPrefix ?? preset.icon.slice(0, 8)}
            </span>
          ) : (
            <span aria-hidden>—</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-white dark:group-hover:text-zinc-100">
            <Link to="/presets/$presetId" params={{ presetId: preset.id }}>
              {preset.name}
            </Link>
          </h3>
          <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{preset.id}</p>
        </div>
      </div>
      {(aliases.length > 0 || terms.length > 0) && (
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
          {aliases.length ? `Aliases: ${aliases.join(", ")}. ` : ""}
          {terms.length
            ? `Terms: ${terms.slice(0, 5).join(", ")}${terms.length > 5 ? "…" : ""}`
            : ""}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {tagEntries.map(([k, v]) => (
          <Badge key={k} variant="zinc">
            {k}={v === "*" ? "*" : v}
          </Badge>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {geometry.map((g) => (
          <Badge key={g} variant="sky">
            {g}
          </Badge>
        ))}
        {categoryNames.map((c) => (
          <Badge key={c} variant="emerald">
            {c}
          </Badge>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-2 self-start text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        {expanded ? "Hide details" : "Fields & more"}
      </button>
      {expanded && (
        <div className="mt-2 border-t border-zinc-200 pt-2 text-xs dark:border-zinc-700">
          <p>
            <strong>Fields:</strong> {fields.join(", ") || "—"}
          </p>
          <p className="mt-1">
            <strong>More fields:</strong> {moreFields.join(", ") || "—"}
          </p>
        </div>
      )}
    </article>
  );
}
