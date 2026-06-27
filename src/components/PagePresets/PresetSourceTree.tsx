import { fieldFacetDefaults } from "@/components/PageFields/useFieldFacetState";
import { FieldSourceEnrichment } from "@/components/PagePresets/FieldSourceEnrichment";
import {
  getInheritedFieldItems,
  presetIdFromRef,
} from "@/components/PagePresets/presetFieldInheritance";
import { type KeySortMode, sortObjectEntries } from "@/components/PagePresets/presetKeyOrder";
import {
  getInheritedLabels,
  resolveLabelSourcePresetId,
} from "@/components/PagePresets/presetLabelInheritance";
import { AreaIcon, type SchemaArea } from "@/components/ui/areaIcons";
import { useSchema } from "@/contexts/SchemaContext";
import { githubFileUrl, schemaRepoPath } from "@/utils/githubFileUrl";
import type { DenormalizedPreset, RawPreset } from "@/utils/types";
import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import { Fragment, type ReactNode, useState } from "react";
import { presetSearchDefaults } from "./useSearchState";

const REF_REGEX = /^\{(.+)\}$/;

type RefInfo = {
  kind: "field" | "preset";
  id: string;
  repoPath: string;
};

function refInFieldList(value: string): RefInfo | null {
  const m = value.match(REF_REGEX);
  if (m) {
    return { kind: "preset", id: m[1], repoPath: schemaRepoPath("preset", m[1]) };
  }
  return { kind: "field", id: value, repoPath: schemaRepoPath("field", value) };
}

function isScalar(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function GithubLink({ href, label = "GitHub" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-sky-600 ring-1 ring-sky-100 ring-inset hover:bg-sky-50"
      title="Open in id-tagging-schema repository"
    >
      {label} ↗
    </a>
  );
}

const sourceRefButtonClass =
  "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset";

function SourceAreaLink({
  area,
  to,
  params,
  search,
  label,
  title,
}: {
  area: SchemaArea;
  to: string;
  params?: { _splat: string };
  search: (prev: { dataUrl?: string; locale?: string }) => Record<string, unknown>;
  label: string;
  title: string;
}) {
  const toneClass =
    area === "fields"
      ? "text-emerald-700 ring-emerald-100 hover:bg-emerald-50"
      : "text-sky-600 ring-sky-100 hover:bg-sky-50";

  return (
    <Link
      to={to}
      params={params}
      search={search}
      title={title}
      className={clsx(sourceRefButtonClass, toneClass)}
    >
      <AreaIcon area={area} className="h-3 w-3" />
      {label}
    </Link>
  );
}

function JsonLine({
  level,
  children,
  trailingComma,
}: {
  level: number;
  children: ReactNode;
  trailingComma?: boolean;
}) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-baseline gap-x-1.5"
      style={{ paddingLeft: level > 0 ? `${level * 1.25}rem` : undefined }}
    >
      {children}
      {trailingComma ? <span className="text-slate-500">,</span> : null}
    </div>
  );
}

function JsonScalar({ value }: { value: string | number | boolean | null }) {
  if (value === null) return <span className="text-slate-400">null</span>;
  if (typeof value === "boolean") return <span className="text-violet-700">{String(value)}</span>;
  if (typeof value === "number") return <span className="text-violet-700">{value}</span>;
  return <span className="text-emerald-800">"{value}"</span>;
}

function JsonKey({ name }: { name: string }) {
  return <span className="text-sky-800">"{name}"</span>;
}

type JsonRootKind = "field" | "preset";

type HostPresetContext = {
  hostPreset: RawPreset;
  hostOriginalFields: string[];
  hostOriginalMoreFields: string[];
  hostPresetDenorm?: DenormalizedPreset;
  allPresets: DenormalizedPreset[];
  onOpenPreset?: (id: string) => void;
};

/** Inherited name / terms / aliases when `name` references another preset. */
function PresetRefInheritedLabels({
  labels,
  level,
  trailingComma,
}: {
  labels: { name: string; terms: string[]; aliases: string[] };
  level: number;
  trailingComma?: boolean;
}) {
  const hasTerms = labels.terms.length > 0;
  const hasAliases = labels.aliases.length > 0;

  return (
    <>
      <JsonLine level={level} trailingComma={hasTerms || hasAliases || trailingComma}>
        <JsonKey name="name" />
        <span className="text-slate-500">: </span>
        <JsonScalar value={labels.name} />
      </JsonLine>
      {hasTerms ? (
        <Fragment>
          <JsonLine level={level}>
            <JsonKey name="terms" />
            <span className="text-slate-500">: [</span>
          </JsonLine>
          {labels.terms.map((term, i) => (
            <JsonLine key={term} level={level + 1} trailingComma={i < labels.terms.length - 1}>
              <JsonScalar value={term} />
            </JsonLine>
          ))}
          <JsonLine level={level} trailingComma={hasAliases || trailingComma}>
            <span className="text-slate-500">]</span>
          </JsonLine>
        </Fragment>
      ) : null}
      {hasAliases ? (
        <Fragment>
          <JsonLine level={level}>
            <JsonKey name="aliases" />
            <span className="text-slate-500">: [</span>
          </JsonLine>
          {labels.aliases.map((alias, i) => (
            <JsonLine key={alias} level={level + 1} trailingComma={i < labels.aliases.length - 1}>
              <JsonScalar value={alias} />
            </JsonLine>
          ))}
          <JsonLine level={level} trailingComma={trailingComma}>
            <span className="text-slate-500">]</span>
          </JsonLine>
        </Fragment>
      ) : null}
    </>
  );
}

function NameRefDisclosure({
  nameRef,
  level,
  dataUrl,
  trailingComma,
}: {
  nameRef: string;
  level: number;
  dataUrl: string;
  trailingComma?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { rawPresets, presetsById } = useSchema();
  const sourceId = resolveLabelSourcePresetId(nameRef, rawPresets);
  const labels = getInheritedLabels(nameRef, rawPresets, presetsById);
  const repoPath = sourceId ? schemaRepoPath("preset", sourceId) : "";

  return (
    <>
      <JsonLine level={level} trailingComma={!open && trailingComma}>
        <JsonKey name="name" />
        <span className="text-slate-500">: </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex min-w-0 items-center gap-1 text-left hover:text-sky-700"
        >
          <span aria-hidden className="w-3 shrink-0 text-slate-400">
            {open ? "▾" : "▸"}
          </span>
          <span className="text-emerald-800">"{nameRef}"</span>
        </button>
        {repoPath ? (
          <>
            <code className="truncate text-[10px] text-slate-400">{repoPath}</code>
            <GithubLink href={githubFileUrl(dataUrl, repoPath)} />
            <SourceAreaLink
              area="presets"
              to="/preset/$"
              params={{ _splat: sourceId ?? "" }}
              search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
              label="Preset"
              title={`Open preset "${sourceId}"`}
            />
          </>
        ) : null}
      </JsonLine>
      {open ? (
        labels ? (
          <PresetRefInheritedLabels
            labels={labels}
            level={level + 1}
            trailingComma={trailingComma}
          />
        ) : (
          <JsonLine level={level + 1} trailingComma={trailingComma}>
            <span className="text-slate-400 italic">{"/* not loaded */"}</span>
          </JsonLine>
        )
      ) : null}
    </>
  );
}

function RefDisclosure({
  label,
  ref,
  level,
  dataUrl,
  trailingComma,
  parentKey,
  host,
  sortMode = "alpha",
}: {
  label: string;
  ref: RefInfo;
  level: number;
  dataUrl: string;
  trailingComma?: boolean;
  parentKey?: string;
  host: HostPresetContext;
  sortMode?: KeySortMode;
}) {
  const [open, setOpen] = useState(false);
  const { fields, rawPresets } = useSchema();
  const fieldListKey = parentKey === "fields" || parentKey === "moreFields" ? parentKey : undefined;
  const inheritPresetFields = ref.kind === "preset" && fieldListKey;
  const expandedRaw =
    ref.kind === "field"
      ? (fields[ref.id] as Record<string, unknown> | undefined)
      : (rawPresets[ref.id] as Record<string, unknown> | undefined);

  return (
    <>
      <JsonLine level={level} trailingComma={!open && trailingComma}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex min-w-0 items-center gap-1 text-left hover:text-sky-700"
        >
          <span aria-hidden className="w-3 shrink-0 text-slate-400">
            {open ? "▾" : "▸"}
          </span>
          <span className="text-emerald-800">"{label}"</span>
        </button>
        <code className="truncate text-[10px] text-slate-400">{ref.repoPath}</code>
        <GithubLink href={githubFileUrl(dataUrl, ref.repoPath)} />
        {ref.kind === "preset" ? (
          <SourceAreaLink
            area="presets"
            to="/preset/$"
            params={{ _splat: ref.id }}
            search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
            label="Preset"
            title={`Open preset "${ref.id}"`}
          />
        ) : (
          <>
            <SourceAreaLink
              area="fields"
              to="/field/$"
              params={{ _splat: ref.id }}
              search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
              label="Field"
              title={`Open field "${ref.id}"`}
            />
            <SourceAreaLink
              area="presets"
              to="/"
              search={(prev) => ({
                ...presetSearchDefaults,
                dataUrl: prev.dataUrl ?? "",
                locale: prev.locale ?? "",
                fieldIds: [ref.id],
                page: 1,
              })}
              label="Presets"
              title="Show presets using this field"
            />
          </>
        )}
      </JsonLine>
      {open ? (
        inheritPresetFields ? (
          <PresetRefInheritedFields
            presetRef={label}
            fieldListKey={fieldListKey}
            level={level + 1}
            dataUrl={dataUrl}
            trailingComma={trailingComma}
            host={host}
          />
        ) : expandedRaw ? (
          <>
            <JsonNode
              value={expandedRaw}
              level={level + 1}
              dataUrl={dataUrl}
              trailingComma={trailingComma}
              host={host}
              sortMode={ref.kind === "preset" ? "preset" : sortMode}
              jsonRootKind={ref.kind === "field" ? "field" : "preset"}
            />
            {ref.kind === "field" && host.hostPresetDenorm && host.onOpenPreset ? (
              <FieldSourceEnrichment
                fieldId={ref.id}
                preset={host.hostPresetDenorm}
                presets={host.allPresets}
                onOpenPreset={host.onOpenPreset}
              />
            ) : null}
          </>
        ) : (
          <JsonLine level={level + 1} trailingComma={trailingComma}>
            <span className="text-slate-400 italic">{"/* not loaded */"}</span>
          </JsonLine>
        )
      ) : null}
    </>
  );
}

/** Inherited field ids when a preset ref is expanded inside fields or moreFields. */
function PresetRefInheritedFields({
  presetRef,
  fieldListKey,
  level,
  dataUrl,
  trailingComma,
  host,
}: {
  presetRef: string;
  fieldListKey: "fields" | "moreFields";
  level: number;
  dataUrl: string;
  trailingComma?: boolean;
  host: HostPresetContext;
}) {
  const { fields: allFields, rawPresets } = useSchema();
  const inheritedItems = getInheritedFieldItems(
    host.hostPreset,
    presetRef,
    fieldListKey,
    host.hostOriginalFields,
    host.hostOriginalMoreFields,
    rawPresets,
    allFields,
  );

  if (inheritedItems.length === 0) {
    return (
      <JsonLine level={level} trailingComma={trailingComma}>
        <span className="text-slate-400 italic">{"/* no inherited fields */"}</span>
      </JsonLine>
    );
  }

  return (
    <>
      {inheritedItems.map((item) => (
        <JsonNode
          key={`${fieldListKey}-${item}`}
          value={item}
          level={level}
          parentKey={fieldListKey}
          dataUrl={dataUrl}
          trailingComma={item !== inheritedItems[inheritedItems.length - 1] ? true : trailingComma}
          host={host}
        />
      ))}
    </>
  );
}

function JsonNode({
  value,
  level,
  parentKey,
  dataUrl,
  trailingComma,
  host,
  sortMode = "alpha",
  jsonRootKind = "preset",
}: {
  value: unknown;
  level: number;
  parentKey?: string;
  dataUrl: string;
  trailingComma?: boolean;
  host: HostPresetContext;
  sortMode?: KeySortMode;
  jsonRootKind?: JsonRootKind;
}) {
  if (isScalar(value)) {
    if (typeof value === "string" && (parentKey === "fields" || parentKey === "moreFields")) {
      const ref = refInFieldList(value);
      if (ref) {
        return (
          <RefDisclosure
            label={value}
            ref={ref}
            level={level}
            dataUrl={dataUrl}
            trailingComma={trailingComma}
            parentKey={parentKey}
            host={host}
            sortMode={sortMode}
          />
        );
      }
    }
    return (
      <JsonLine level={level} trailingComma={trailingComma}>
        <JsonScalar value={value} />
      </JsonLine>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">[]</span>
        </JsonLine>
      );
    }
    return (
      <>
        <JsonLine level={level}>
          <span className="text-slate-500">[</span>
        </JsonLine>
        {value.map((item, i) => (
          <JsonNode
            key={typeof item === "string" ? item : `item-${i}-${JSON.stringify(item)}`}
            value={item}
            level={level + 1}
            parentKey={parentKey}
            dataUrl={dataUrl}
            trailingComma={i < value.length - 1}
            host={host}
            sortMode={sortMode}
            jsonRootKind={jsonRootKind}
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">]</span>
        </JsonLine>
      </>
    );
  }

  if (typeof value === "object" && value !== null) {
    const entries = sortObjectEntries(Object.entries(value as Record<string, unknown>), {
      parentKey,
      sortMode,
    });
    if (entries.length === 0) {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">{"{}"}</span>
        </JsonLine>
      );
    }
    return (
      <>
        <JsonLine level={level}>
          <span className="text-slate-500">{"{"}</span>
        </JsonLine>
        {entries.map(([key, child], i) => (
          <JsonObjectEntry
            key={key}
            keyName={key}
            value={child}
            level={level + 1}
            dataUrl={dataUrl}
            trailingComma={i < entries.length - 1}
            host={host}
            sortMode={sortMode}
            jsonRootKind={jsonRootKind}
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">{"}"}</span>
        </JsonLine>
      </>
    );
  }

  return (
    <JsonLine level={level} trailingComma={trailingComma}>
      <span className="text-slate-400">undefined</span>
    </JsonLine>
  );
}

function JsonObjectEntry({
  keyName,
  value,
  level,
  dataUrl,
  trailingComma,
  host,
  sortMode = "alpha",
  jsonRootKind = "preset",
}: {
  keyName: string;
  value: unknown;
  level: number;
  dataUrl: string;
  trailingComma?: boolean;
  host: HostPresetContext;
  sortMode?: KeySortMode;
  jsonRootKind?: JsonRootKind;
}) {
  if (isScalar(value)) {
    if (keyName === "name" && typeof value === "string" && presetIdFromRef(value)) {
      return (
        <NameRefDisclosure
          nameRef={value}
          level={level}
          dataUrl={dataUrl}
          trailingComma={trailingComma}
        />
      );
    }
    if (keyName === "type" && typeof value === "string" && jsonRootKind === "field") {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: </span>
          <JsonScalar value={value} />
          <SourceAreaLink
            area="fields"
            to="/fields"
            search={(prev) => ({
              ...fieldFacetDefaults,
              dataUrl: prev.dataUrl ?? "",
              locale: prev.locale ?? "",
              f_type: value,
            })}
            label="Fields"
            title={`Browse all ${value} fields`}
          />
        </JsonLine>
      );
    }
    return (
      <JsonLine level={level} trailingComma={trailingComma}>
        <JsonKey name={keyName} />
        <span className="text-slate-500">: </span>
        <JsonScalar value={value} />
      </JsonLine>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: []</span>
        </JsonLine>
      );
    }
    return (
      <Fragment>
        <JsonLine level={level}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: [</span>
        </JsonLine>
        {value.map((item, i) => (
          <JsonNode
            key={typeof item === "string" ? item : `item-${i}-${JSON.stringify(item)}`}
            value={item}
            level={level + 1}
            parentKey={keyName}
            dataUrl={dataUrl}
            trailingComma={i < value.length - 1}
            host={host}
            sortMode={sortMode}
            jsonRootKind={jsonRootKind}
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">]</span>
        </JsonLine>
      </Fragment>
    );
  }

  if (typeof value === "object" && value !== null) {
    const entries = sortObjectEntries(Object.entries(value as Record<string, unknown>), {
      parentKey: keyName,
      sortMode,
    });
    if (entries.length === 0) {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: {"{}"}</span>
        </JsonLine>
      );
    }
    return (
      <Fragment>
        <JsonLine level={level}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: {"{"}</span>
        </JsonLine>
        {entries.map(([key, child], i) => (
          <JsonObjectEntry
            key={key}
            keyName={key}
            value={child}
            level={level + 1}
            dataUrl={dataUrl}
            trailingComma={i < entries.length - 1}
            host={host}
            sortMode={sortMode}
            jsonRootKind={jsonRootKind}
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">{"}"}</span>
        </JsonLine>
      </Fragment>
    );
  }

  return (
    <JsonLine level={level} trailingComma={trailingComma}>
      <JsonKey name={keyName} />
      <span className="text-slate-500">: </span>
      <span className="text-slate-400">undefined</span>
    </JsonLine>
  );
}

export function PresetSourceTree({
  presetId,
  raw,
  preset,
  presets,
  onOpenPreset,
  sourceKind = "preset",
}: {
  presetId: string;
  raw: Record<string, unknown>;
  preset?: DenormalizedPreset;
  presets?: DenormalizedPreset[];
  onOpenPreset?: (id: string) => void;
  sourceKind?: JsonRootKind;
}) {
  void presetId;
  const { dataUrl } = useSchema();
  const host: HostPresetContext = {
    hostPreset: raw as RawPreset,
    hostOriginalFields: Array.isArray(raw.fields)
      ? (raw.fields as string[]).filter((f) => typeof f === "string")
      : [],
    hostOriginalMoreFields: Array.isArray(raw.moreFields)
      ? (raw.moreFields as string[]).filter((f) => typeof f === "string")
      : [],
    hostPresetDenorm: preset,
    allPresets: presets ?? [],
    onOpenPreset,
  };

  return (
    <div
      className={clsx(
        "overflow-x-auto bg-slate-50 p-4",
        "font-mono text-xs leading-relaxed text-slate-800",
      )}
    >
      <JsonNode
        value={raw}
        level={0}
        dataUrl={dataUrl ?? ""}
        host={host}
        sortMode="preset"
        jsonRootKind={sourceKind}
      />
    </div>
  );
}
