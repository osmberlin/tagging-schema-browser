import { HeaderSearch } from '@/components/ui/HeaderSearch'
import { useIconFacetState } from './useIconFacetState'

export function IconSearchBar() {
  const [state, setState] = useIconFacetState()

  return (
    <HeaderSearch
      value={state.i_q}
      onChange={(value) => setState({ i_q: value })}
      placeholder="Search icons by name..."
      area="icons"
    />
  )
}
