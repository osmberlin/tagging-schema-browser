import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useSchema } from '@/hooks/useSchema'
import type { IconViewModel } from '@/utils/types'
import { iconBrowseNeedsFullCatalog } from './iconFacetMeta'
import {
  areAllIconSuppliersLoaded,
  areIconsReadyForMissingSvgCheck,
  collectSchemaIconNames,
  ensureIconsForNames,
  useIconRegistryEpoch,
} from './iconRegistry'
import { useIconFacetState } from './useIconFacetState'
import { useIconSearch } from './useIconSearch'
import { useIconSupplierLoad } from './useIconSupplierLoad'

type IconsPageContextValue = {
  icons: IconViewModel[]
  suppliersReady: boolean
  /** Every supplier catalog is in the registry (required for accurate All / Unused counts). */
  allSupplierCatalogLoaded: boolean
}

const IconsPageContext = createContext<IconsPageContextValue | null>(null)

/** Single icon index for the Icons page sidebar and main content (keeps facet counts in sync). */
export function IconsPageProvider({ children }: { children: ReactNode }) {
  useIconRegistryEpoch()
  const { data } = useSchema()
  const [state] = useIconFacetState()
  const loadFullCatalog = iconBrowseNeedsFullCatalog(state.i_usage)
  const needsReferencedSuppliers = state.i_hasSvg === 'missing'
  const { suppliersReady: catalogReady } = useIconSupplierLoad(state.i_supplier, loadFullCatalog)
  const { icons } = useIconSearch(
    data?.presets ?? [],
    data?.fields ?? {},
    data?.fieldTranslations ?? {},
  )
  const referencedIconNames = useMemo(() => {
    if (!data || !needsReferencedSuppliers) return [] as string[]
    return collectSchemaIconNames(
      data.rawPresets,
      data.fields,
      data.presets,
      data.fieldTranslations,
    )
  }, [data, needsReferencedSuppliers])

  useEffect(() => {
    if (referencedIconNames.length === 0) return
    void ensureIconsForNames(referencedIconNames)
  }, [referencedIconNames])

  const referencedReady = !needsReferencedSuppliers
    ? true
    : data
      ? referencedIconNames.length === 0 || areIconsReadyForMissingSvgCheck(referencedIconNames)
      : false

  const suppliersReady = loadFullCatalog ? catalogReady : referencedReady
  const allSupplierCatalogLoaded = areAllIconSuppliersLoaded()

  const value = useMemo(
    () => ({ icons, suppliersReady, allSupplierCatalogLoaded }),
    [icons, suppliersReady, allSupplierCatalogLoaded],
  )

  return <IconsPageContext.Provider value={value}>{children}</IconsPageContext.Provider>
}

export function useIconsPage(): IconsPageContextValue {
  const value = useContext(IconsPageContext)
  if (!value) {
    throw new Error('useIconsPage must be used within IconsPageProvider')
  }
  return value
}
