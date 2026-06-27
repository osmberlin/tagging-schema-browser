import { presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import { CountPill } from "@/components/ui/CountPill";
import { AreaIcon } from "@/components/ui/areaIcons";
import type { FieldViewModel } from "@/utils/types";
import { Link } from "@tanstack/react-router";

export function FieldCard({ field }: { field: FieldViewModel }) {
  const names = field.presets.map((p) => p.name).join(", ");

  const body = (
    <>
      <div className="flex items-start gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <AreaIcon area="fields" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900" title={field.label}>
            {field.label}
          </p>
          <p className="truncate font-mono text-xs text-slate-500" title={field.id}>
            {field.id}
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
          {field.type}
        </span>
        {field.key !== field.id ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
            key={field.key}
          </span>
        ) : null}
        {field.universal ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100 ring-inset">
            universal
          </span>
        ) : null}
      </div>
      {field.usageCount > 0 ? (
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <AreaIcon area="presets" className="h-3 w-3" />
            Presets
          </span>{" "}
          <CountPill className="bg-slate-100 align-text-bottom">{field.usageCount}</CountPill>:{" "}
          {names}
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">Unused by presets</p>
      )}
    </>
  );

  if (field.usageCount > 0) {
    return (
      <article className="group/fc relative flex flex-col rounded-xl border border-slate-200 bg-white p-2.5">
        <Link
          to="/field/$"
          params={{ _splat: field.id }}
          search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
          title={`Open field "${field.id}"`}
          data-field={field.id}
          className="flex flex-col transition duration-200 hover:text-slate-900"
        >
          {body}
        </Link>
        <Link
          to="/"
          search={(prev) => ({
            ...presetSearchDefaults,
            dataUrl: prev.dataUrl ?? "",
            locale: prev.locale ?? "",
            fieldIds: [field.id],
          })}
          title={`Show all ${field.usageCount} presets using "${field.id}"`}
          className="mt-2 inline-flex items-center gap-1 self-start text-[11px] font-medium text-sky-600 hover:underline"
        >
          <AreaIcon area="presets" className="h-3 w-3" />
          Filter presets
        </Link>
        <span
          aria-hidden
          className="absolute top-2 right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 group-hover/fc:flex"
        >
          ›
        </span>
      </article>
    );
  }

  return (
    <Link
      to="/field/$"
      params={{ _splat: field.id }}
      search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
      title={`Open field "${field.id}"`}
      data-field={field.id}
      className="group/fc relative flex flex-col rounded-xl border border-slate-200 bg-white p-2.5 transition duration-200 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-md hover:shadow-slate-900/5"
    >
      {body}
      <span
        aria-hidden
        className="absolute top-2 right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 group-hover/fc:flex"
      >
        ›
      </span>
    </Link>
  );
}
