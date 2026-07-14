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
  const { suppliersReady } = useIconSupplierLoad(state.i_supplier)
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

/** True when usage counts need the full supplier catalog (All / Unused with every supplier). */
export function iconFacetCountsNeedFullCatalog(i_usage: string, i_supplier: string): boolean {
  return i_supplier === 'all' && (i_usage === 'all' || i_usage === 'unused')
}
