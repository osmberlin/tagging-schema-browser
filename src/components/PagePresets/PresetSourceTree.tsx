import { useSchema } from "@/contexts/SchemaContext";
import { githubFileUrl, schemaRepoPath } from "@/utils/githubFileUrl";
import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import { Fragment, type ReactNode, useState } from "react";

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

function RefDisclosure({
  label,
  ref,
  level,
  dataUrl,
  trailingComma,
  parentKey,
}: {
  label: string;
  ref: RefInfo;
  level: number;
  dataUrl: string;
  trailingComma?: boolean;
  parentKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const { fields, rawPresets } = useSchema();
  const expandedRaw =
    ref.kind === "field"
      ? (fields[ref.id] as Record<string, unknown> | undefined)
      : (rawPresets[ref.id] as Record<string, unknown> | undefined);
  const unnestPresetFields =
    ref.kind === "preset" && (parentKey === "fields" || parentKey === "moreFields") && expandedRaw;

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
          <Link
            to="/preset/$"
            params={{ _splat: ref.id }}
            search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
            className="text-[10px] font-medium text-violet-600 hover:underline"
          >
            open preset
          </Link>
        ) : null}
      </JsonLine>
      {open ? (
        expandedRaw ? (
          unnestPresetFields ? (
            <PresetRefUnnested
              raw={expandedRaw}
              fieldListKey={parentKey as "fields" | "moreFields"}
              level={level + 1}
              dataUrl={dataUrl}
              trailingComma={trailingComma}
            />
          ) : (
            <JsonNode
              value={expandedRaw}
              level={level + 1}
              dataUrl={dataUrl}
              trailingComma={trailingComma}
            />
          )
        ) : (
          <JsonLine level={level + 1} trailingComma={trailingComma}>
            <span className="text-slate-400 italic">{"/* not loaded */"}</span>
          </JsonLine>
        )
      ) : null}
    </>
  );
}

/** When a preset ref is expanded inside a fields/moreFields list, inline that list's items. */
function PresetRefUnnested({
  raw,
  fieldListKey,
  level,
  dataUrl,
  trailingComma,
}: {
  raw: Record<string, unknown>;
  fieldListKey: "fields" | "moreFields";
  level: number;
  dataUrl: string;
  trailingComma?: boolean;
}) {
  const metaEntries = Object.entries(raw).filter(([k]) => k !== "fields" && k !== "moreFields");
  const listToUnnest = Array.isArray(raw[fieldListKey]) ? (raw[fieldListKey] as unknown[]) : [];
  const lines: ReactNode[] = [];

  for (let i = 0; i < metaEntries.length; i++) {
    const [key, child] = metaEntries[i];
    lines.push(
      <JsonObjectEntry
        key={key}
        keyName={key}
        value={child}
        level={level}
        dataUrl={dataUrl}
        trailingComma={i < metaEntries.length - 1 || listToUnnest.length > 0 || trailingComma}
      />,
    );
  }

  for (let i = 0; i < listToUnnest.length; i++) {
    lines.push(
      <JsonNode
        key={`${fieldListKey}-${i}-${String(listToUnnest[i])}`}
        value={listToUnnest[i]}
        level={level}
        parentKey={fieldListKey}
        dataUrl={dataUrl}
        trailingComma={i < listToUnnest.length - 1 ? true : trailingComma}
      />,
    );
  }

  return <>{lines}</>;
}

function JsonNode({
  value,
  level,
  parentKey,
  dataUrl,
  trailingComma,
}: {
  value: unknown;
  level: number;
  parentKey?: string;
  dataUrl: string;
  trailingComma?: boolean;
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
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">]</span>
        </JsonLine>
      </>
    );
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
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
}: {
  keyName: string;
  value: unknown;
  level: number;
  dataUrl: string;
  trailingComma?: boolean;
}) {
  if (isScalar(value)) {
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
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">]</span>
        </JsonLine>
      </Fragment>
    );
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
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
}: {
  presetId: string;
  raw: Record<string, unknown>;
}) {
  const { dataUrl } = useSchema();
  const filePath = schemaRepoPath("preset", presetId);
  const githubUrl = githubFileUrl(dataUrl ?? "", filePath);

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Source preset</h2>
        <div className="flex flex-wrap items-center gap-2">
          <code className="font-mono text-xs text-slate-500">{filePath}</code>
          <GithubLink href={githubUrl} />
        </div>
      </div>
      <div
        className={clsx(
          "overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4",
          "font-mono text-xs leading-relaxed text-slate-800",
        )}
      >
        <JsonNode value={raw} level={0} dataUrl={dataUrl ?? ""} />
      </div>
    </section>
  );
}
