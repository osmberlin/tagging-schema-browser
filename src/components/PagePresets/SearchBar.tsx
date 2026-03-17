import { HeaderSearch } from "@/components/ui/HeaderSearch";
import { useSearchState } from "./useSearchState";

export function SearchBar() {
  const [state, setState] = useSearchState();
  return (
    <HeaderSearch
      value={state.q}
      onChange={(value) => setState({ q: value, page: 1 })}
      placeholder="Search presets by name, terms, aliases, tags..."
    />
  );
}
