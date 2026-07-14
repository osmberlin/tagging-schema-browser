import { useEffect } from 'react'
import {
  type IconSupplier,
  ICON_SUPPLIERS,
  areAllIconSuppliersLoaded,
  ensureAllIconSuppliers,
  ensureIconSupplier,
  isIconSupplierLoaded,
  useIconRegistryEpoch,
} from '@/components/PageIcons/iconRegistry'

function isIconSupplier(value: string): value is IconSupplier {
  return (ICON_SUPPLIERS as readonly string[]).includes(value)
}

/** Load bundled icon supplier chunks for the active Icons facet (lazy per supplier). */
export function useIconSupplierLoad(selectedSupplier: string, loadFullCatalog = false) {
  useIconRegistryEpoch()

  useEffect(() => {
    if (!loadFullCatalog) return
    if (selectedSupplier === 'all') {
      void ensureAllIconSuppliers()
      return
    }
    if (isIconSupplier(selectedSupplier)) {
      void ensureIconSupplier(selectedSupplier)
    }
  }, [selectedSupplier, loadFullCatalog])

  const suppliersReady = !loadFullCatalog
    ? true
    : selectedSupplier === 'all'
      ? areAllIconSuppliersLoaded()
      : isIconSupplier(selectedSupplier)
        ? isIconSupplierLoaded(selectedSupplier)
        : true

  return { suppliersReady }
}
