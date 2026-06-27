import { googleTranslateUrl } from "@/components/PagePresets/PresetTranslationTable";
import type { RawFieldTranslation } from "@/utils/types";
import { clsx } from "clsx";
import type { ReactNode } from "react";

function AttrRow({
  label,
  english,
  localized,
  showLocale,
}: {
  label: string;
  english: ReactNode;
  localized?: ReactNode;
  showLocale: boolean;
}) {
  return (
    <div
      className={clsx(
        "grid items-start gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-2",
        showLocale ? "grid-cols-[5rem_1fr] sm:grid-cols-[6rem_1fr_1fr]" : "grid-cols-[5rem_1fr]",
      )}
    >
      <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</div>
      <div className="min-w-0 text-sm text-slate-900 sm:col-start-2">{english}</div>
      {showLocale ? (
        <div className="col-start-2 min-w-0 text-sm text-slate-900 sm:col-start-3">{localized}</div>
      ) : null}
    </div>
  );
}

function TextWithTranslate({
  locale,
  text,
  children,
}: {
  locale: string;
  text: string;
  children: ReactNode;
}) {
  if (!text.trim()) return <>{children}</>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {children}
      <a
        href={googleTranslateUrl(locale, text)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-medium text-sky-600 hover:underline"
      >
        Google Translate ↗
      </a>
    </span>
  );
}

export function FieldTranslationTable({
  fieldId,
  english,
  localized,
  locale,
}: {
  fieldId: string;
  english: RawFieldTranslation;
  localized?: RawFieldTranslation;
  locale: string;
}) {
  const showLocale = Boolean(locale);
  const optionKeys = Array.from(
    new Set([...Object.keys(english.options ?? {}), ...Object.keys(localized?.options ?? {})]),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
        <span className="font-mono">{fieldId}</span>
        {showLocale ? (
          <span className="ml-3">
            EN ↔ <span className="font-mono">{locale}</span>
          </span>
        ) : (
          <span className="ml-3">English</span>
        )}
      </div>
      <AttrRow
        label="Label"
        english={english.label ?? "—"}
        localized={localized?.label ?? "—"}
        showLocale={showLocale}
      />
      <AttrRow
        label="Placeholder"
        english={english.placeholder ?? "—"}
        localized={localized?.placeholder ?? "—"}
        showLocale={showLocale}
      />
      <AttrRow
        label="Terms"
        english={english.terms ?? "—"}
        localized={
          localized?.terms ? (
            <TextWithTranslate locale={locale} text={english.terms ?? ""}>
              {localized.terms}
            </TextWithTranslate>
          ) : (
            "—"
          )
        }
        showLocale={showLocale}
      />
      {optionKeys.length > 0 ? (
        <div className="border-t border-slate-100">
          <div className="px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Options
          </div>
          {optionKeys.map((key) => (
            <AttrRow
              key={key}
              label={key}
              english={english.options?.[key] ?? "—"}
              localized={localized?.options?.[key] ?? "—"}
              showLocale={showLocale}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
