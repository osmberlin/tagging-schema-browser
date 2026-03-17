import { getIconSvgDataUrl } from "@/components/PageIcons/iconRegistry";
import { Badge } from "@/components/ui/Badge";
import { useSchema } from "@/contexts/SchemaContext";
import { Link } from "@tanstack/react-router";

function listHref(params: Record<string, string>) {
  const search = new URLSearchParams({ page: "1", ...params });
  return `/?${search.toString()}`;
}

function RelatedPresetList({
  title,
  listHrefValue,
  presets,
}: {
  title: string;
  listHrefValue: string;
  presets: Array<{ id: string; name: string }>;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
        <a href={listHrefValue} className="hover:underline">
          {title}
        </a>
      </h2>
      {presets.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No related presets found.</p>
      ) : (
        <ul className="space-y-1">
          {presets.slice(0, 10).map((relatedPreset) => (
            <li key={relatedPreset.id}>
              <Link
                to="/presets/$presetId"
                params={{ presetId: relatedPreset.id }}
                className="text-sm text-zinc-700 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-white"
              >
                {relatedPreset.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PagePresetDetails({ presetId }: { presetId: string }) {
  const { presetsById, presets } = useSchema();
  const preset = presetsById.get(presetId);

  if (!preset) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Preset not found</h1>
        <a href="/" className="text-sm text-zinc-600 underline dark:text-zinc-400">
          Back to presets
        </a>
      </div>
    );
  }

  const iconSrc = getIconSvgDataUrl(preset.icon);
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
      .map((candidate) => ({ id: candidate.id, name: candidate.name }));
    return {
      title: `Presets of this category "${categoryName}" (${related.length})`,
      href: listHref({ categoryNames: categoryName }),
      related,
    };
  });

  const iconRelated = preset.icon
    ? presets
        .filter((candidate) => candidate.id !== preset.id && candidate.icon === preset.icon)
        .map((candidate) => ({ id: candidate.id, name: candidate.name }))
    : [];

  return (
    <div className="space-y-6">
      <article className="rounded-xl border border-zinc-200 bg-white p-5 ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            {iconSrc ? (
              <img src={iconSrc} alt="" className="h-9 w-9" />
            ) : (
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {preset.icon ?? "no-icon"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">{preset.name}</h1>
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{preset.id}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {preset.aliases.length > 0 ? `Aliases: ${preset.aliases.join(", ")}` : "No aliases"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1">
          {tagEntries.map(([key, value]) => (
            <Badge key={key} variant="zinc">
              {key}={value}
            </Badge>
          ))}
        </div>

        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">Fields</h2>
          <div className="flex flex-wrap gap-1.5">
            {allFields.map((fieldId) => {
              const count = presets.filter(
                (candidate) =>
                  candidate.fields.includes(fieldId) || candidate.moreFields.includes(fieldId),
              ).length;
              return (
                <a
                  key={fieldId}
                  href={listHref({ fieldIds: fieldId })}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <span>{fieldId}</span>
                  <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] dark:bg-zinc-700">
                    {count}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        {categorySections.map((section) => (
          <RelatedPresetList
            key={section.title}
            title={section.title}
            listHrefValue={section.href}
            presets={section.related}
          />
        ))}
        {preset.icon ? (
          <RelatedPresetList
            title={`Presets with this icon "${preset.icon}" (${iconRelated.length})`}
            listHrefValue={listHref({ iconName: preset.icon })}
            presets={iconRelated}
          />
        ) : null}
      </div>
    </div>
  );
}
