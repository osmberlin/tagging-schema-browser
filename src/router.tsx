import { PageAbout } from "@/components/PageAbout/PageAbout";
import { FieldDetailPage } from "@/components/PageFields/FieldDetailPage";
import { FieldFacetSidebar } from "@/components/PageFields/FieldFacetSidebar";
import { FieldSearchBar } from "@/components/PageFields/FieldSearchBar";
import { fieldFacetDefaults, fieldFacetSchema } from "@/components/PageFields/useFieldFacetState";
import { IconFacetSidebar } from "@/components/PageIcons/IconFacetSidebar";
import { IconSearchBar } from "@/components/PageIcons/IconSearchBar";
import { iconFacetDefaults, iconFacetSchema } from "@/components/PageIcons/useIconFacetState";
import { FacetSidebar } from "@/components/PagePresets/FacetSidebar";
import { PagePresets } from "@/components/PagePresets/PagePresets";
import { PresetDetailPage } from "@/components/PagePresets/PresetDetailPage";
import { SearchBar } from "@/components/PagePresets/SearchBar";
import { presetSearchDefaults, presetSearchSchema } from "@/components/PagePresets/useSearchState";
import { TranslationsSidebar } from "@/components/PageTranslations/TranslationsSidebar";
import {
  translationsSearchDefaults,
  translationsSearchSchema,
} from "@/components/PageTranslations/translationsSearch";
import { SidebarLayout } from "@/components/ui/SidebarLayout";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { SchemaProvider } from "@/contexts/SchemaContext";
import { useReferenceStore } from "@/stores/referenceStore";
import { dataUrlForReference, resolveActiveDataUrl, resolveSchemaReference } from "@/utils/dataUrl";
import { routerSearch } from "@/utils/routerSearch";
import { preloadSchemaData } from "@/utils/schemaCache";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  retainSearchParams,
  stripSearchParams,
  useLocation,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { Suspense, lazy, useEffect } from "react";
import { z } from "zod";

const LazyPageIcons = lazy(() =>
  import("@/components/PageIcons/PageIcons").then((m) => ({ default: m.PageIcons })),
);

const LazyPageTranslations = lazy(() =>
  import("@/components/PageTranslations/PageTranslations").then((m) => ({
    default: m.PageTranslations,
  })),
);

const LazyPageFields = lazy(() =>
  import("@/components/PageFields/PageFields").then((m) => ({ default: m.PageFields })),
);

const LazyPageComparison = lazy(() =>
  import("@/components/PageComparison/PageComparison").then((m) => ({
    default: m.PageComparison,
  })),
);

function routerBasepath(): string {
  const trimmed = import.meta.env.BASE_URL.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "/";
}

/**
 * Root search params shared by every page. `dataUrl` points at an
 * id-tagging-schema `dist/` base (release or PR preview); it is retained
 * across navigation by the `retainSearchParams` middleware below.
 */
const rootSearchSchema = z.object({
  dataUrl: z.string().catch(""),
  /** Global comparison locale (used by the Translations page + preset details). */
  locale: z.string().catch(""),
  /** Canonical dataset when `dataUrl` is empty: npm release or interem staging. */
  reference: z.enum(["release", "interem"]).optional().catch(undefined),
});
type RootSearch = z.infer<typeof rootSearchSchema>;

function RootContent() {
  const navigate = useNavigate();
  const dataUrl = useSearch({ strict: false, select: (s) => s.dataUrl ?? "" });
  const locale = useSearch({ strict: false, select: (s) => s.locale ?? "" });
  const urlReference = useSearch({ strict: false, select: (s) => s.reference });
  const persistedReference = useReferenceStore((s) => s.reference);
  const setPersistedReference = useReferenceStore((s) => s.setReference);
  const location = useLocation();

  // URL `reference=release` wins; otherwise fall back to persisted preference (default interem).
  const reference = resolveSchemaReference(urlReference, persistedReference);

  useEffect(() => {
    if (urlReference === "release") setPersistedReference("release");
    if (urlReference === "interem") setPersistedReference("interem");
  }, [urlReference, setPersistedReference]);

  // Keep the URL aligned when release was persisted but the param was stripped.
  useEffect(() => {
    if (dataUrl.trim()) return;
    if (urlReference !== undefined) return;
    if (persistedReference !== "release") return;
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, reference: "release" }),
      replace: true,
    });
  }, [dataUrl, urlReference, persistedReference, navigate]);

  // Preload the alternate canonical reference so toggling can commit from cache.
  useEffect(() => {
    if (dataUrl.trim()) return;
    const other: "release" | "interem" = reference === "interem" ? "release" : "interem";
    void preloadSchemaData(dataUrlForReference(other));
  }, [dataUrl, reference]);

  const setDataUrl = (url: string | null) => {
    void navigate({ to: ".", search: (prev) => ({ ...prev, dataUrl: url ?? "" }) });
  };
  const setLocale = (next: string) => {
    void navigate({ to: ".", search: (prev) => ({ ...prev, locale: next || undefined }) });
  };

  const resolvedDataUrl = resolveActiveDataUrl(dataUrl, reference);
  const topSearch =
    location.pathname === "/icons" ? (
      <IconSearchBar />
    ) : location.pathname === "/fields" ? (
      <FieldSearchBar />
    ) : location.pathname === "/" || location.pathname === "/translations" ? (
      <SearchBar />
    ) : null;
  const isDetailPage =
    location.pathname.startsWith("/preset/") || location.pathname.startsWith("/field/");
  const sidebar =
    location.pathname === "/icons" ? (
      <IconFacetSidebar />
    ) : location.pathname === "/fields" ? (
      <FieldFacetSidebar />
    ) : location.pathname === "/translations" ? (
      <TranslationsSidebar />
    ) : location.pathname === "/" ? (
      <FacetSidebar />
    ) : isDetailPage ? null : (
      <p className="mt-4 px-2 text-sm text-slate-500 ">
        Open <strong>Presets</strong>, <strong>Icons</strong>, or <strong>Fields</strong> to use
        faceted search.
      </p>
    );

  return (
    <SchemaProvider dataUrl={resolvedDataUrl} setDataUrl={setDataUrl}>
      <ComparisonProvider
        rawDataUrl={dataUrl}
        reference={reference}
        activeDataUrl={resolvedDataUrl}
      >
        <LocaleProvider dataUrl={resolvedDataUrl} locale={locale} setLocale={setLocale}>
          <SidebarLayout sidebar={sidebar} topSearch={topSearch}>
            <Outlet />
          </SidebarLayout>
        </LocaleProvider>
      </ComparisonProvider>
    </SchemaProvider>
  );
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
      retainSearchParams<RootSearch>(["dataUrl", "locale", "reference"]),
      stripSearchParams({ dataUrl: "", locale: "", reference: undefined }),
    ],
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: presetSearchSchema,
  search: { middlewares: [stripSearchParams(presetSearchDefaults)] },
  component: PagePresets,
});

const iconsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/icons",
  validateSearch: iconFacetSchema,
  search: { middlewares: [stripSearchParams(iconFacetDefaults)] },
  component: () => (
    <Suspense fallback={<p className="text-sm text-slate-500 ">Loading icons...</p>}>
      <LazyPageIcons />
    </Suspense>
  ),
});

const fieldsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fields",
  validateSearch: fieldFacetSchema,
  search: { middlewares: [stripSearchParams(fieldFacetDefaults)] },
  component: () => (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading fields...</p>}>
      <LazyPageFields />
    </Suspense>
  ),
});

const translationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/translations",
  validateSearch: translationsSearchSchema,
  search: { middlewares: [stripSearchParams(translationsSearchDefaults)] },
  component: () => (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading translations...</p>}>
      <LazyPageTranslations />
    </Suspense>
  ),
});

const comparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/comparison",
  component: () => (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading comparison...</p>}>
      <LazyPageComparison />
    </Suspense>
  ),
});

const presetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/preset/$",
  component: PresetDetailPage,
});

const fieldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/field/$",
  component: FieldDetailPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: PageAbout,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  iconsRoute,
  fieldsRoute,
  translationsRoute,
  comparisonRoute,
  presetRoute,
  fieldRoute,
  aboutRoute,
]);

export const router = createRouter({
  routeTree,
  basepath: routerBasepath(),
  parseSearch: routerSearch.parse,
  stringifySearch: routerSearch.stringify,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
