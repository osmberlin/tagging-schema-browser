import { FieldTranslationTable } from "@/components/PageFields/FieldTranslationTable";
import { useFieldLocale } from "@/components/PageFields/useFieldLocale";
import { PresetSourceTree } from "@/components/PagePresets/PresetSourceTree";
import { GeometryIcons } from "@/components/PagePresets/geometryIcons";
import { presetSearchDefaults, useSetPreset } from "@/components/PagePresets/useSearchState";
import { AreaLink } from "@/components/ui/AreaLink";
import { CountPill } from "@/components/ui/CountPill";
import { DetailDisclosure } from "@/components/ui/DetailDisclosure";
import { AreaIcon } from "@/components/ui/areaIcons";
import { useLocale } from "@/contexts/LocaleContext";
import { useSchema } from "@/contexts/SchemaContext";
import { areaAccent } from "@/theme/areaAccent";
import { githubFileUrl, schemaRepoPath } from "@/utils/githubFileUrl";
import type { DenormalizedPreset, RawFieldTranslation } from "@/utils/types";
import { useNavigate, useParams } from "@tanstack/react-router";

type RelatedItem = { id: string; name: string };

export function FieldDetailPage() {
  const { _splat: fieldId } = useParams({ strict: false });
  const { fields, presets, dataUrl, data } = useSchema();
  const raw = fieldId ? fields[fieldId] : undefined;

  if (!fieldId) {
    return <p className="text-sm text-slate-600">No field id in URL.</p>;
  }

  if (!raw) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-slate-900">Field not found</h1>
        <p className="text-sm text-slate-600">
          No field matches <code className="font-mono text-xs">{fieldId}</code> for the loaded
          schema.
        </p>
      </div>
    );
  }

  const english: RawFieldTranslation = data?.fieldTranslations[fieldId] ?? {
    label: typeof raw.label === "string" ? raw.label : undefined,
    placeholder: typeof raw.placeholder === "string" ? raw.placeholder : undefined,
  };

  const primaryPresets = presets.filter((p) => p.fields.includes(fieldId));
  const morePresets = presets.filter(
    (p) => p.moreFields.includes(fieldId) && !p.fields.includes(fieldId),
  );

  return (
    <FieldDetailContent
      fieldId={fieldId}
      raw={raw as Record<string, unknown>}
      english={english}
      primaryPresets={primaryPresets}
      morePresets={morePresets}
      dataUrl={dataUrl ?? ""}
    />
  );
}

function FieldDetailContent({
  fieldId,
  raw,
  english,
  primaryPresets,
  morePresets,
  dataUrl,
}: {
  fieldId: string;
  raw: Record<string, unknown>;
  english: RawFieldTranslation;
  primaryPresets: DenormalizedPreset[];
  morePresets: DenormalizedPreset[];
  dataUrl: string;
}) {
  const navigate = useNavigate();
  const setPreset = useSetPreset();
  const { locale, loading: localeLoading, error: localeError } = useLocale();
  const {
    fieldLocale,
    loading: fieldLocaleLoading,
    error: fieldLocaleError,
  } = useFieldLocale(locale, fieldId);

  const filePath = schemaRepoPath("field", fieldId);
  const githubUrl = githubFileUrl(dataUrl, filePath);
  const label = english.label ?? fieldId;
  const key = typeof raw.key === "string" ? raw.key : fieldId;
  const type = typeof raw.type === "string" ? raw.type : "unknown";
  const geometry = Array.isArray(raw.geometry) ? (raw.geometry as string[]) : [];

  const onFilterPresets = () => {
    void navigate({
      to: "/",
      search: (prev) => ({
        ...presetSearchDefaults,
        dataUrl: prev.dataUrl ?? "",
        locale: prev.locale ?? "",
        fieldIds: [fieldId],
        page: 1,
      }),
    });
  };

  const toItem = (p: DenormalizedPreset): RelatedItem => ({ id: p.id, name: p.name });

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1 ring-emerald-100 ring-inset ${areaAccent.fields.iconBg}`}
          >
            <AreaIcon area="fields" className="h-8 w-8" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-slate-950">{label}</h1>
            <p className="mt-1 font-mono text-xs text-slate-500">{fieldId}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs">
                {type}
              </span>
              <span>
                key: <code className="font-mono text-xs">{key}</code>
              </span>
              {raw.universal ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100 ring-inset">
                  universal
                </span>
              ) : null}
            </div>
            {geometry.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Geometry</span>
                <GeometryIcons geometry={geometry} />
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            View source ↗
          </a>
          <AreaLink
            area="presets"
            to="/"
            search={(prev) => ({
              ...presetSearchDefaults,
              dataUrl: prev.dataUrl ?? "",
              locale: prev.locale ?? "",
              fieldIds: [fieldId],
              page: 1,
            })}
            className="text-xs"
          >
            Filter presets using this field
          </AreaLink>
        </div>
      </header>

      <DetailDisclosure
        title="Translation"
        area="translations"
        subtitle={
          locale ? (
            <>
              EN ↔ <span className="font-mono">{locale}</span>
            </>
          ) : (
            "English"
          )
        }
        defaultOpen
      >
        {locale && (localeLoading || fieldLocaleLoading) ? (
          <p className="px-4 py-3 text-sm text-slate-500">Loading {locale}…</p>
        ) : locale && (localeError || fieldLocaleError) ? (
          <p className="mx-4 my-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {localeError ?? fieldLocaleError}
          </p>
        ) : (
          <FieldTranslationTable
            fieldId={fieldId}
            english={english}
            localized={fieldLocale}
            locale={locale}
          />
        )}
      </DetailDisclosure>

      <DetailDisclosure
        title="Source field"
        actions={
          <>
            <code className="font-mono text-xs text-slate-500">{filePath}</code>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${areaAccent.fields.linkRing}`}
            >
              GitHub ↗
            </a>
          </>
        }
        defaultOpen
      >
        <PresetSourceTree presetId={fieldId} raw={raw} sourceKind="field" />
      </DetailDisclosure>

      <DetailDisclosure title="Related presets" area="presets" defaultOpen>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <RelatedBlock
            title="Presets with this field (primary)"
            count={primaryPresets.length}
            onTitleClick={onFilterPresets}
            presets={primaryPresets.map(toItem)}
            onOpenPreset={setPreset}
          />
          <RelatedBlock
            title="Presets with this field (more fields)"
            count={morePresets.length}
            onTitleClick={onFilterPresets}
            presets={morePresets.map(toItem)}
            onOpenPreset={setPreset}
          />
        </div>
      </DetailDisclosure>
    </div>
  );
}

function RelatedBlock({
  title,
  count,
  onTitleClick,
  presets,
  onOpenPreset,
}: {
  title: string;
  count: number;
  onTitleClick: () => void;
  presets: RelatedItem[];
  onOpenPreset: (id: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
        <button
          type="button"
          onClick={onTitleClick}
          className="inline-flex min-w-0 items-center gap-1.5 text-left hover:underline"
        >
          <AreaIcon area="presets" className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0">{title}</span>
        </button>
        <CountPill>{count}</CountPill>
      </h2>
      {presets.length === 0 ? (
        <p className="text-sm text-slate-500">No related presets.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {presets.slice(0, 30).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpenPreset(p.id)}
              title={p.id}
              className="max-w-full truncate rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 ring-inset hover:bg-slate-100"
            >
              {p.name}
            </button>
          ))}
          {presets.length > 30 ? (
            <span className="self-center text-xs text-slate-400">+{presets.length - 30} more</span>
          ) : null}
        </div>
      )}
    </section>
  );
}
