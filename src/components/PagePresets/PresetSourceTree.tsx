import { useSchema } from "@/contexts/SchemaContext";
import { githubFileUrl, schemaRepoPath } from "@/utils/githubFileUrl";
import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import { type ReactNode, useState } from "react";

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

function indent(level: number): string {
  return "  ".repeat(level);
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

function DisclosureRow({
  label,
  repoPath,
  githubHref,
  presetLinkId,
  children,
}: {
  label: string;
  repoPath: string;
  githubHref: string;
  presetLinkId?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex min-w-0 items-center gap-1 text-left hover:text-sky-700"
        >
          <span aria-hidden className="w-3 shrink-0 text-slate-400">
            {open ? "▾" : "▸"}
          </span>
          <span className="text-amber-800">"{label}"</span>
        </button>
        <code className="truncate text-[10px] text-slate-400">{repoPath}</code>
        <GithubLink href={githubHref} />
        {presetLinkId ? (
          <Link
            to="/preset/$"
            params={{ _splat: presetLinkId }}
            search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
            className="text-[10px] font-medium text-violet-600 hover:underline"
          >
            open preset
          </Link>
        ) : null}
      </div>
      {open ? (
        <div className="mt-1 mb-1 ml-5 rounded-md border border-slate-200 bg-white/80 p-2 text-slate-700">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function FieldSummary({ fieldId }: { fieldId: string }) {
  const { fields } = useSchema();
  const field = fields[fieldId];
  if (!field) return <p className="text-slate-500">Field definition not loaded.</p>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
      <dt className="font-semibold text-slate-500">key</dt>
      <dd className="font-mono">{field.key ?? fieldId}</dd>
      {field.type ? (
        <>
          <dt className="font-semibold text-slate-500">type</dt>
          <dd className="font-mono">{field.type}</dd>
        </>
      ) : null}
      {field.geometry?.length ? (
        <>
          <dt className="font-semibold text-slate-500">geometry</dt>
          <dd className="font-mono">{field.geometry.join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function PresetRefSummary({ presetId }: { presetId: string }) {
  const { rawPresets, presetsById } = useSchema();
  const denorm = presetsById.get(presetId);
  const raw = rawPresets[presetId];
  if (!raw && !denorm) return <p className="text-slate-500">Preset not found in loaded schema.</p>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
      {denorm ? (
        <>
          <dt className="font-semibold text-slate-500">name</dt>
          <dd>{denorm.name}</dd>
        </>
      ) : null}
      {typeof raw?.icon === "string" ? (
        <>
          <dt className="font-semibold text-slate-500">icon</dt>
          <dd className="font-mono">{raw.icon}</dd>
        </>
      ) : null}
      {Array.isArray(raw?.fields) ? (
        <>
          <dt className="font-semibold text-slate-500">fields</dt>
          <dd className="font-mono">{raw.fields.join(", ")}</dd>
        </>
      ) : null}
    </dl>
  );
}

function JsonScalar({ value }: { value: string | number | boolean | null }) {
  if (value === null) return <span className="text-slate-400">null</span>;
  if (typeof value === "boolean") return <span className="text-violet-700">{String(value)}</span>;
  if (typeof value === "number") return <span className="text-violet-700">{value}</span>;
  return <span className="text-emerald-800">"{value}"</span>;
}

function JsonNode({
  value,
  level,
  parentKey,
  dataUrl,
}: {
  value: unknown;
  level: number;
  parentKey?: string;
  dataUrl: string;
}) {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return <JsonScalar value={value} />;
  }

  if (typeof value === "string") {
    if (parentKey === "fields" || parentKey === "moreFields") {
      const ref = refInFieldList(value);
      if (ref) {
        return (
          <DisclosureRow
            label={value}
            repoPath={ref.repoPath}
            githubHref={githubFileUrl(dataUrl, ref.repoPath)}
            presetLinkId={ref.kind === "preset" ? ref.id : undefined}
          >
            {ref.kind === "field" ? (
              <FieldSummary fieldId={ref.id} />
            ) : (
              <PresetRefSummary presetId={ref.id} />
            )}
          </DisclosureRow>
        );
      }
    }
    return <JsonScalar value={value} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-500">[]</span>;
    }
    return (
      <>
        <span className="text-slate-500">[</span>
        {value.map((item, i) => (
          <div key={typeof item === "string" ? item : `item-${i}-${JSON.stringify(item)}`}>
            {indent(level + 1)}
            <JsonNode value={item} level={level + 1} parentKey={parentKey} dataUrl={dataUrl} />
            {i < value.length - 1 ? <span className="text-slate-500">,</span> : null}
          </div>
        ))}
        <div>
          {indent(level)}
          <span className="text-slate-500">]</span>
        </div>
      </>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="text-slate-500">{"{}"}</span>;
    }
    return (
      <>
        <span className="text-slate-500">{"{"}</span>
        {entries.map(([key, child], i) => (
          <div key={key}>
            {indent(level + 1)}
            <span className="text-sky-800">"{key}"</span>
            <span className="text-slate-500">: </span>
            <JsonNode value={child} level={level + 1} parentKey={key} dataUrl={dataUrl} />
            {i < entries.length - 1 ? <span className="text-slate-500">,</span> : null}
          </div>
        ))}
        <div>
          {indent(level)}
          <span className="text-slate-500">{"}"}</span>
        </div>
      </>
    );
  }

  return <span className="text-slate-400">undefined</span>;
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
      <pre
        className={clsx(
          "overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4",
          "font-mono text-xs leading-relaxed text-slate-800",
        )}
      >
        <JsonNode value={raw} level={0} dataUrl={dataUrl ?? ""} />
      </pre>
    </section>
  );
}
