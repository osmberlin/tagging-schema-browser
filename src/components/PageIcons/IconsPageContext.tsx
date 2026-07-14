import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useSchema } from '@/hooks/useSchema'
import type { IconViewModel } from '@/utils/types'
import { useIconFacetState } from './useIconFacetState'
import { useIconSearch } from './useIconSearch'
import { useIconSupplierLoad } from './useIconSupplierLoad'

type IconsPageContextValue = {
  icons: IconViewModel[]
  suppliersReady: boolean
}

const IconsPageContext = createContext<IconsPageContextValue | null>(null)

/** Single icon index for the Icons page sidebar and main content (keeps facet counts in sync). */
export function IconsPageProvider({ children }: { children: ReactNode }) {
  const { data } = useSchema()
  const [state] = useIconFacetState()
  const loadFullCatalog = iconBrowseNeedsFullCatalog(state.i_usage)
  const { suppliersReady } = useIconSupplierLoad(state.i_supplier, loadFullCatalog)
  const { icons } = useIconSearch(
    data?.presets ?? [],
    data?.fields ?? {},
    data?.fieldTranslations ?? {},
  )

  const value = useMemo(() => ({ icons, suppliersReady }), [icons, suppliersReady])

  return <IconsPageContext.Provider value={value}>{children}</IconsPageContext.Provider>
}

export function useIconsPage(): IconsPageContextValue {
  const value = useContext(IconsPageContext)
  if (!value) {
    throw new Error('useIconsPage must be used within IconsPageProvider')
  }
  return value
}

/** True when the browse view needs a supplier's full icon catalog (not schema-referenced only). */
export function iconBrowseNeedsFullCatalog(i_usage: string): boolean {
  return i_usage === 'all' || i_usage === 'unused'
}

/** True when All / Unused sidebar counts need the full catalog (all suppliers selected). */
export function iconFacetCountsNeedFullCatalog(i_usage: string, i_supplier: string): boolean {
  return i_supplier === 'all' && iconBrowseNeedsFullCatalog(i_usage)
}
