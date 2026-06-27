import type { FieldViewModel } from "@/utils/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { z } from "zod";

/** Search params for the fields page (route "/fields"), validated with Zod 4. */
export const fieldFacetSchema = z.object({
  f_q: z.string().catch(""),
  f_type: z.string().catch("all"),
  f_usage: z.enum(["all", "used", "unused"]).catch("all"),
  f_sort: z.enum(["name", "label", "usage_desc", "usage_asc"]).catch("usage_desc"),
});

export type FieldFacetState = z.infer<typeof fieldFacetSchema>;

export const fieldFacetDefaults: FieldFacetState = fieldFacetSchema.parse({});

export function useFieldFacetState() {
  const state = useSearch({ strict: false, select: (raw) => fieldFacetSchema.parse(raw) });
  const navigate = useNavigate();
  const setState = useCallback(
    (patch: Partial<FieldFacetState>) => {
      void navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }), replace: true });
    },
    [navigate],
  );
  return [state, setState] as const;
}

export function applyFieldFacets(
  fields: FieldViewModel[],
  state: FieldFacetState,
): FieldViewModel[] {
  let filtered = fields;

  if (state.f_usage === "used") filtered = filtered.filter((field) => field.usageCount > 0);
  if (state.f_usage === "unused") filtered = filtered.filter((field) => field.usageCount === 0);

  if (state.f_type !== "all") {
    filtered = filtered.filter((field) => field.type === state.f_type);
  }

  const query = state.f_q.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(
      (field) =>
        field.id.toLowerCase().includes(query) ||
        field.key.toLowerCase().includes(query) ||
        field.label.toLowerCase().includes(query) ||
        field.type.toLowerCase().includes(query),
    );
  }

  const sorted = [...filtered];
  if (state.f_sort === "usage_desc")
    sorted.sort((a, b) => b.usageCount - a.usageCount || a.id.localeCompare(b.id));
  else if (state.f_sort === "usage_asc")
    sorted.sort((a, b) => a.usageCount - b.usageCount || a.id.localeCompare(b.id));
  else if (state.f_sort === "label")
    sorted.sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
  else sorted.sort((a, b) => a.id.localeCompare(b.id));

  return sorted;
}

export function useFieldFacetMeta(fields: FieldViewModel[]) {
  return useMemo(() => {
    const typeCounts = new Map<string, number>();
    let usedCount = 0;
    let unusedCount = 0;

    for (const field of fields) {
      typeCounts.set(field.type, (typeCounts.get(field.type) ?? 0) + 1);
      if (field.usageCount > 0) usedCount += 1;
      else unusedCount += 1;
    }

    return { typeCounts, usedCount, unusedCount };
  }, [fields]);
}

/** Navigate to the full-page field detail route (pushes history). */
export function useSetField() {
  const navigate = useNavigate();
  return useCallback(
    (id: string) => {
      void navigate({
        to: "/field/$",
        params: { _splat: id },
        search: (prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" }),
      });
    },
    [navigate],
  );
}
