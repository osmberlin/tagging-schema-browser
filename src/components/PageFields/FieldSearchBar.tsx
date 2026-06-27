import { PAGE_SEARCH_INPUT_ID } from "@/components/ui/HeaderSearch";
import { areaAccent } from "@/theme/areaAccent";
import { useFieldFacetState } from "./useFieldFacetState";

export function FieldSearchBar() {
  const [state, setState] = useFieldFacetState();

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor={PAGE_SEARCH_INPUT_ID} className="sr-only">
        Search fields
      </label>
      <input
        id={PAGE_SEARCH_INPUT_ID}
        type="search"
        value={state.f_q}
        onChange={(e) => setState({ f_q: e.target.value })}
        placeholder="Search fields by id, key, label, or type…"
        className={`w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 ${areaAccent.fields.focus}`}
        autoComplete="off"
      />
    </div>
  );
}
