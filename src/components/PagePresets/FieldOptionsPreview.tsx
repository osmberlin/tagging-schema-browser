import { getIconSvgDataUrl } from "@/components/PageIcons/iconRegistry";
import { AreaIcon } from "@/components/ui/areaIcons";
import { areaAccent } from "@/theme/areaAccent";
import type { PresetOptionRow } from "@/utils/fieldOptions";
import { clsx } from "clsx";

function OptionLabelRow({
  english,
  localized,
  showLocale,
}: {
  english: string;
  localized?: string;
  showLocale: boolean;
}) {
  if (!showLocale) {
    return <p className="text-sm text-slate-900">{english}</p>;
  }
  const same = Boolean(localized && localized === english);
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-2">
      <span className="text-slate-900">{english}</span>
      <span
        className={clsx("text-slate-900", same && "text-yellow-700")}
        title={same ? "Same as English" : undefined}
      >
        {localized ?? <span className="text-slate-400">—</span>}
      </span>
    </div>
  );
}

function OptionIcon({ icon, iconBroken }: { icon?: string; iconBroken: boolean }) {
  if (!icon) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-300">—</span>
    );
  }
  if (iconBroken) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-red-300 bg-red-50 text-[10px] font-semibold text-red-700"
        title={`Missing icon: ${icon}`}
      >
        !
      </span>
    );
  }
  return (
    <img
      src={getIconSvgDataUrl(icon) ?? undefined}
      alt=""
      className="h-5 w-5 shrink-0"
      title={icon}
    />
  );
}

export function FieldOptionsPreview({
  options,
  locale,
  fieldLocaleMap,
  onOpenPreset,
}: {
  options: PresetOptionRow[];
  locale?: string;
  fieldLocaleMap?: Record<string, { options?: Record<string, string> }> | null;
  onOpenPreset?: (id: string) => void;
}) {
  const showLocale = Boolean(locale);
  if (options.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
        Options
        {showLocale ? (
          <span className="ml-2 font-normal normal-case text-slate-400">
            EN ↔ <span className="font-mono">{locale}</span>
          </span>
        ) : null}
      </div>
      {options.map((row) => {
        const labelLocale = fieldLocaleMap?.[row.fieldId]?.options?.[row.optionValue];
        const childPreset = row.childPreset;
        return (
          <div
            key={row.optionValue}
            className="flex items-start gap-3 border-t border-slate-100 px-3 py-2 first:border-t-0"
          >
            <OptionIcon icon={row.icon} iconBroken={row.iconBroken} />
            <div className="min-w-0 flex-1 font-sans">
              <p className="font-mono text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">{row.optionValue}</span>
                {row.icon ? (
                  <span className="ml-2 text-slate-400" title="Option icon">
                    {row.icon}
                  </span>
                ) : null}
              </p>
              <OptionLabelRow
                english={row.labelEn}
                localized={labelLocale}
                showLocale={showLocale}
              />
              {childPreset && onOpenPreset ? (
                <button
                  type="button"
                  onClick={() => onOpenPreset(childPreset.id)}
                  className={`mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline ${areaAccent.presets.link}`}
                >
                  <AreaIcon area="presets" className="h-3 w-3" />
                  {childPreset.name}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
