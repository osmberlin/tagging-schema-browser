import { HeaderSearch } from '@/components/ui/HeaderSearch'
import { useFieldFacetState } from './useFieldFacetState'

export function FieldSearchBar() {
  const [state, setState] = useFieldFacetState()

  return (
    <HeaderSearch
      value={state.f_q}
      onChange={(value) => setState({ f_q: value })}
      placeholder="Search fields by id, key, label, or type…"
      area="fields"
    />
  )
}
