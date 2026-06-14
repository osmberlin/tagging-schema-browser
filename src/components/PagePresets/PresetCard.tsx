import { PresetIconBox } from "@/components/PagePresets/PresetIconBox";
import { useSetPreset } from "@/components/PagePresets/useSearchState";
import { Badge } from "@/components/ui/Badge";
import type { DenormalizedPreset } from "@/utils/types";
import { useState } from "react";

export function PresetCard({ preset }: { preset: DenormalizedPreset }) {
  const [expanded, setExpanded] = useState(false);
  const setPreset = useSetPreset();
  const tags = preset.tags && typeof preset.tags === "object" ? preset.tags : {};
  const tagEntries = Object.entries(tags);
  const aliases = Array.isArray(preset.aliases) ? preset.aliases : [];
  const terms = Array.isArray(preset.terms) ? preset.terms : [];
  const geometry = Array.isArray(preset.geometry) ? preset.geometry : [];
  const categoryNames = Array.isArray(preset.categoryNames) ? preset.categoryNames : [];
  const fields = Array.isArray(preset.fields) ? preset.fields : [];
  const moreFields = Array.isArray(preset.moreFields) ? preset.moreFields : [];
  return (
    <article
      className="group flex min-h-[180px] flex-col rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg hover:shadow-slate-900/5"
      data-preset-id={preset.id}
    >
      <div className="flex items-start gap-3">
        <PresetIconBox preset={preset} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-medium text-slate-900">
            <button
              type="button"
              onClick={() => setPreset(preset.id)}
              className="text-left transition group-hover:text-sky-600 hover:underline"
            >
              {preset.name}
            </button>
          </h3>
          <p className="font-mono text-xs text-slate-500">{preset.id}</p>
        </div>
      </div>
      {(aliases.length > 0 || terms.length > 0) && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600 ">
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
        className="mt-2 self-start text-xs font-medium text-sky-600 hover:underline "
      >
        {expanded ? "Hide details" : "Fields & more"}
      </button>
      {expanded && (
        <div className="mt-2 border-t border-slate-200 pt-2 text-xs ">
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
