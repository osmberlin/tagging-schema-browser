import type { PresetFilterUpdate } from "@/components/PagePresets/PresetDetailModal.types";
import { PresetIconBox } from "@/components/PagePresets/PresetIconBox";
import { Badge } from "@/components/ui/Badge";
import { CatalystDialog, CatalystDialogBody, CatalystDialogTitle } from "@/components/ui/Dialog";
import { useSchema } from "@/contexts/SchemaContext";
import type { DenormalizedPreset } from "@/utils/types";

export function PresetDetailModal({
  presetId,
  open,
  onClose,
  onApplyFilter,
  onOpenPreset,
}: {
  presetId: string | null;
  open: boolean;
  onClose: () => void;
  onApplyFilter: (update: PresetFilterUpdate) => void;
  onOpenPreset: (id: string) => void;
}) {
  const { presetsById, presets } = useSchema();
  const preset = presetId ? presetsById.get(presetId) : undefined;

  return (
    <CatalystDialog open={open} onClose={onClose} size="4xl">
      {!preset ? (
        <>
          <CatalystDialogTitle>Preset not found</CatalystDialogTitle>
          <CatalystDialogBody>
            <p className="text-sm text-slate-600 ">
              No preset matches this link for the loaded schema.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 "
            >
              Close
            </button>
          </CatalystDialogBody>
        </>
      ) : (
        <PresetDetailContent
          preset={preset}
          presets={presets}
          onClose={onClose}
          onApplyFilter={onApplyFilter}
          onOpenPreset={onOpenPreset}
        />
      )}
    </CatalystDialog>
  );
}

function PresetDetailContent({
  preset,
  presets,
  onClose,
  onApplyFilter,
  onOpenPreset,
}: {
  preset: DenormalizedPreset;
  presets: DenormalizedPreset[];
  onClose: () => void;
  onApplyFilter: (update: PresetFilterUpdate) => void;
  onOpenPreset: (id: string) => void;
}) {
  const allFields = Array.from(
    new Set([...(preset.fields ?? []), ...(preset.moreFields ?? [])]),
  ).sort((a, b) => a.localeCompare(b));
  const tagEntries = Object.entries(preset.tags ?? {});

  const categorySections = preset.categoryNames.map((categoryName, index) => {
    const categoryId = preset.categoryIds[index];
    const related = presets
      .filter(
        (candidate) => candidate.id !== preset.id && candidate.categoryIds.includes(categoryId),
      )
      .map((c) => ({ id: c.id, name: c.name }));
    return {
      title: `Presets of this category "${categoryName}" (${related.length})`,
      onListClick: () => onApplyFilter({ categoryNames: [categoryName] }),
      related,
    };
  });

  const uncategorizedRelated =
    preset.categoryNames.length === 0
      ? presets
          .filter((c) => c.id !== preset.id && c.categoryNames.length === 0)
          .map((c) => ({ id: c.id, name: c.name }))
      : [];

  const iconId = preset.icon;
  const iconRelated = iconId
    ? presets
        .filter((c) => c.id !== preset.id && c.icon === iconId)
        .map((c) => ({ id: c.id, name: c.name }))
    : [];

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <CatalystDialogTitle className="sr-only">{preset.name}</CatalystDialogTitle>
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
          <PresetIconBox preset={preset} size="md" />
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold text-slate-950">{preset.name}</p>
            <p className="mt-1 font-mono text-xs text-slate-500 ">{preset.id}</p>
            <p className="mt-2 text-sm text-slate-600 ">
              {preset.aliases.length > 0 ? `Aliases: ${preset.aliases.join(", ")}` : "No aliases"}
            </p>
            {preset.imageURL ? (
              <p className="mt-2 text-sm">
                <span className="text-slate-500 ">imageURL: </span>
                <a
                  href={preset.imageURL}
                  className="break-all text-sky-600 underline "
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {preset.imageURL}
                </a>
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 "
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <CatalystDialogBody className="max-h-[70vh] overflow-y-auto">
        <div className="flex flex-wrap gap-1">
          {tagEntries.map(([k, v]) => (
            <Badge key={k} variant="zinc">
              {k}={v}
            </Badge>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-900 ">Fields</h2>
          <div className="flex flex-wrap gap-1.5">
            {allFields.map((fieldId) => {
              const count = presets.filter(
                (c) => c.fields.includes(fieldId) || c.moreFields.includes(fieldId),
              ).length;
              return (
                <button
                  key={fieldId}
                  type="button"
                  onClick={() => onApplyFilter({ fieldIds: [fieldId] })}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 "
                >
                  <span>{fieldId}</span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] ">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {categorySections.map((section) => (
            <RelatedBlock
              key={section.title}
              title={section.title}
              onTitleClick={section.onListClick}
              presets={section.related}
              onOpenPreset={onOpenPreset}
            />
          ))}
          {preset.categoryNames.length === 0 && (
            <RelatedBlock
              title={`Presets with no category (${uncategorizedRelated.length})`}
              onTitleClick={() => onApplyFilter({ categoryNames: ["No Category"] })}
              presets={uncategorizedRelated}
              onOpenPreset={onOpenPreset}
            />
          )}
          {iconId ? (
            <RelatedBlock
              title={`Presets with this icon \`${iconId}\` (${iconRelated.length})`}
              onTitleClick={() => onApplyFilter({ iconName: [iconId] })}
              presets={iconRelated}
              onOpenPreset={onOpenPreset}
            />
          ) : null}
        </div>
      </CatalystDialogBody>
    </>
  );
}

function RelatedBlock({
  title,
  onTitleClick,
  presets,
  onOpenPreset,
}: {
  title: string;
  onTitleClick: () => void;
  presets: Array<{ id: string; name: string }>;
  onOpenPreset: (id: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 ">
      <h2 className="text-sm font-semibold text-slate-900 ">
        <button
          type="button"
          onClick={onTitleClick}
          className="cursor-pointer text-left hover:underline"
        >
          {title}
        </button>
      </h2>
      {presets.length === 0 ? (
        <p className="text-sm text-slate-500 ">No related presets.</p>
      ) : (
        <ul className="space-y-1">
          {presets.slice(0, 10).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onOpenPreset(p.id)}
                className="cursor-pointer text-left text-sm text-slate-700 hover:underline "
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
