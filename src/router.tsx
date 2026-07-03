import {
  HeadContent,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  retainSearchParams,
  stripSearchParams,
  useLocation,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { Suspense, lazy, useEffect } from 'react'
import { z } from 'zod'
import { PageAbout } from '@/components/PageAbout/PageAbout'
import { FieldDetailPage } from '@/components/PageFields/FieldDetailPage'
import { FieldFacetSidebar } from '@/components/PageFields/FieldFacetSidebar'
import { FieldSearchBar } from '@/components/PageFields/FieldSearchBar'
import { fieldFacetDefaults, fieldFacetSchema } from '@/components/PageFields/useFieldFacetState'
import { IconFacetSidebar } from '@/components/PageIcons/IconFacetSidebar'
import { IconSearchBar } from '@/components/PageIcons/IconSearchBar'
import { iconFacetDefaults, iconFacetSchema } from '@/components/PageIcons/useIconFacetState'
import { FacetSidebar } from '@/components/PagePresets/FacetSidebar'
import { PagePresets } from '@/components/PagePresets/PagePresets'
import { PresetDetailPage } from '@/components/PagePresets/PresetDetailPage'
import { SearchBar } from '@/components/PagePresets/SearchBar'
import { presetSearchDefaults, presetSearchSchema } from '@/components/PagePresets/useSearchState'
import {
  presetSwitchSearchDefaults,
  presetSwitchSearchSchema,
} from '@/components/PagePresetSwitch/presetSwitchSearch'
import {
  translationsSearchDefaults,
  translationsSearchSchema,
} from '@/components/PageTranslations/translationsSearch'
import { TranslationsSidebar } from '@/components/PageTranslations/TranslationsSidebar'
import { SidebarLayout } from '@/components/ui/SidebarLayout'
import { useReference, useReferenceActions } from '@/features/data-source/reference-store'
import { queryClient, SCHEMA_STALE_TIME } from '@/queries/queryClient'
import { prefetchSchemaData, schemaKeys } from '@/queries/schema'
import { dataUrlForReference, resolveSchemaReference } from '@/utils/dataUrl'
import { documentDetailTitleHead, documentTitleHead } from '@/utils/documentTitle'
import { routerSearch } from '@/utils/routerSearch'

const LazyPageIcons = lazy(() =>
  import('@/components/PageIcons/PageIcons').then((m) => ({ default: m.PageIcons })),
)

const LazyPageTranslations = lazy(() =>
  import('@/components/PageTranslations/PageTranslations').then((m) => ({
    default: m.PageTranslations,
  })),
)

const LazyPageFields = lazy(() =>
  import('@/components/PageFields/PageFields').then((m) => ({ default: m.PageFields })),
)

const LazyPageComparison = lazy(() =>
  import('@/components/PageComparison/PageComparison').then((m) => ({
    default: m.PageComparison,
  })),
)

const LazyPagePresetSwitch = lazy(() =>
  import('@/components/PagePresetSwitch/PagePresetSwitch').then((m) => ({
    default: m.PagePresetSwitch,
  })),
)

function routerBasepath(): string {
  const trimmed = import.meta.env.BASE_URL.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}` : '/'
}

/**
 * Root search params shared by every page. `dataUrl` points at an
 * id-tagging-schema `dist/` base (release or PR preview); it is retained
 * across navigation by the `retainSearchParams` middleware below.
 */
const rootSearchSchema = z.object({
  dataUrl: z.string().catch(''),
  /** Global comparison locale (used by the Translations page + preset details). */
  locale: z.string().catch(''),
  /** Canonical dataset when `dataUrl` is empty: npm release or interem staging. */
  reference: z.enum(['release', 'interem']).optional().catch(undefined),
})
type RootSearch = z.infer<typeof rootSearchSchema>

function RootContent() {
  const navigate = useNavigate()
  const dataUrl = useSearch({ strict: false, select: (s) => s.dataUrl ?? '' })
  const urlReference = useSearch({ strict: false, select: (s) => s.reference })
  const persistedReference = useReference()
  const { setReference: setPersistedReference } = useReferenceActions()
  const location = useLocation()

  // URL `reference=release` wins; otherwise fall back to persisted preference (default interem).
  const reference = resolveSchemaReference(urlReference, persistedReference)

  useEffect(
    function syncPersistedReferenceFromUrl() {
      if (urlReference === 'release') setPersistedReference('release')
      if (urlReference === 'interem') setPersistedReference('interem')
    },
    [urlReference, setPersistedReference],
  )

  // Keep the URL aligned when release was persisted but the param was stripped.
  useEffect(
    function restoreReleaseReferenceInUrl() {
      if (dataUrl.trim()) return
      if (urlReference !== undefined) return
      if (persistedReference !== 'release') return
      void navigate({
        to: '.',
        search: (prev) => ({ ...prev, reference: 'release' }),
        replace: true,
      })
    },
    [dataUrl, urlReference, persistedReference, navigate],
  )

  // Preload the alternate canonical reference so toggling can commit from cache.
  useEffect(
    function prefetchAlternateReferenceSchema() {
      if (dataUrl.trim()) return
      const other: 'release' | 'interem' = reference === 'interem' ? 'release' : 'interem'
      const otherUrl = dataUrlForReference(other)
      void queryClient.prefetchQuery({
        queryKey: schemaKeys.data(otherUrl),
        queryFn: () => prefetchSchemaData(otherUrl),
        staleTime: SCHEMA_STALE_TIME,
      })
    },
    [dataUrl, reference],
  )

  const topSearch =
    location.pathname === '/icons' ? (
      <IconSearchBar />
    ) : location.pathname === '/fields' ? (
      <FieldSearchBar />
    ) : location.pathname === '/' || location.pathname === '/translations' ? (
      <SearchBar />
    ) : null
  const isDetailPage =
    location.pathname.startsWith('/preset/') || location.pathname.startsWith('/field/')
  const sidebar =
    location.pathname === '/icons' ? (
      <IconFacetSidebar />
    ) : location.pathname === '/fields' ? (
      <FieldFacetSidebar />
    ) : location.pathname === '/translations' ? (
      <TranslationsSidebar />
    ) : location.pathname === '/' ? (
      <FacetSidebar />
    ) : isDetailPage ? null : (
      <p className="mt-4 px-2 text-sm text-slate-500">
        Open <strong>Presets</strong>, <strong>Icons</strong>, or <strong>Fields</strong> to use
        faceted search.
      </p>
    )

  return (
    <>
      <HeadContent />
      <SidebarLayout sidebar={sidebar} topSearch={topSearch}>
        <Outlet />
      </SidebarLayout>
    </>
  )
}

const rootRoute = createRootRoute({
  component: RootContent,
  // Zod 4 schemas are StandardSchema validators: TanStack reads search with the
  // fully-defaulted output type and accepts the permissive input type when
  // navigating (so a partial `search` patch type-checks).
  validateSearch: rootSearchSchema,
  // Keep dataUrl across navigation, but drop it from the URL when it's the
  // default ("") so shared links stay clean.
  search: {
    middlewares: [
      retainSearchParams<RootSearch>(['dataUrl', 'locale', 'reference']),
      stripSearchParams({ dataUrl: '', locale: '', reference: undefined }),
    ],
  },
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  head: documentTitleHead('Presets'),
  validateSearch: presetSearchSchema,
  search: { middlewares: [stripSearchParams(presetSearchDefaults)] },
  component: PagePresets,
})

const iconsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/icons',
  head: documentTitleHead('Icons'),
  validateSearch: iconFacetSchema,
  search: { middlewares: [stripSearchParams(iconFacetDefaults)] },
  component: () => (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading icons...</p>}>
      <LazyPageIcons />
    </Suspense>
  ),
})

const fieldsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fields',
  head: documentTitleHead('Fields'),
  validateSearch: fieldFacetSchema,
  search: { middlewares: [stripSearchParams(fieldFacetDefaults)] },
  component: () => (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading fields...</p>}>
      <LazyPageFields />
    </Suspense>
  ),
})

const translationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/translations',
  head: documentTitleHead('Translations'),
  validateSearch: translationsSearchSchema,
  search: { middlewares: [stripSearchParams(translationsSearchDefaults)] },
  component: () => (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading translations...</p>}>
      <LazyPageTranslations />
    </Suspense>
  ),
})

const presetSwitchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/preset-switch',
  head: documentTitleHead('Preset switch'),
  validateSearch: presetSwitchSearchSchema,
  search: { middlewares: [stripSearchParams(presetSwitchSearchDefaults)] },
  component: () => (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading preset switch...</p>}>
      <LazyPagePresetSwitch />
    </Suspense>
  ),
})

const comparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/comparison',
  head: documentTitleHead('Comparison'),
  component: () => (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading comparison...</p>}>
      <LazyPageComparison />
    </Suspense>
  ),
})

const presetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/preset/$',
  head: documentDetailTitleHead('Preset'),
  component: PresetDetailPage,
})

const fieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/field/$',
  head: documentDetailTitleHead('Field'),
  component: FieldDetailPage,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  head: documentTitleHead('About'),
  component: PageAbout,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  iconsRoute,
  fieldsRoute,
  translationsRoute,
  presetSwitchRoute,
  comparisonRoute,
  presetRoute,
  fieldRoute,
  aboutRoute,
])

export const router = createRouter({
  routeTree,
  basepath: routerBasepath(),
  parseSearch: routerSearch.parse,
  stringifySearch: routerSearch.stringify,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
