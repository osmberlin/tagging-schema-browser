import { PageAbout } from "@/components/PageAbout/PageAbout";
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
import { DEFAULT_DATA_URL } from "@/utils/constants";
import { routerSearch } from "@/utils/routerSearch";
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
import { Suspense, lazy } from "react";
import { z } from "zod";

const LazyPageIcons = lazy(() =>
  import("@/components/PageIcons/PageIcons").then((m) => ({ default: m.PageIcons })),
);

const LazyPageTranslations = lazy(() =>
  import("@/components/PageTranslations/PageTranslations").then((m) => ({
    default: m.PageTranslations,
  })),
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
});
type RootSearch = z.infer<typeof rootSearchSchema>;

function RootContent() {
  const navigate = useNavigate();
  const dataUrl = useSearch({ strict: false, select: (s) => s.dataUrl ?? "" });
  const locale = useSearch({ strict: false, select: (s) => s.locale ?? "" });
  const location = useLocation();

  const setDataUrl = (url: string | null) => {
    void navigate({ to: ".", search: (prev) => ({ ...prev, dataUrl: url ?? "" }) });
  };
  const setLocale = (next: string) => {
    void navigate({ to: ".", search: (prev) => ({ ...prev, locale: next || undefined }) });
  };

  const resolvedDataUrl = (dataUrl.trim() || DEFAULT_DATA_URL).trim();
  const topSearch =
    location.pathname === "/icons" ? (
      <IconSearchBar />
    ) : location.pathname === "/" || location.pathname === "/translations" ? (
      <SearchBar />
    ) : null;
  const isPresetDetail = location.pathname.startsWith("/preset/");
  const sidebar =
    location.pathname === "/icons" ? (
      <IconFacetSidebar />
    ) : location.pathname === "/translations" ? (
      <TranslationsSidebar />
    ) : location.pathname === "/" ? (
      <FacetSidebar />
    ) : isPresetDetail ? null : (
      <p className="mt-4 px-2 text-sm text-slate-500 ">
        Open <strong>Presets</strong> or <strong>Icons</strong> to use faceted search.
      </p>
    );

  return (
    <SchemaProvider dataUrl={resolvedDataUrl} setDataUrl={setDataUrl}>
      <ComparisonProvider dataUrl={resolvedDataUrl}>
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
      retainSearchParams<RootSearch>(["dataUrl", "locale"]),
      stripSearchParams({ dataUrl: "", locale: "" }),
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

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: PageAbout,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  iconsRoute,
  translationsRoute,
  comparisonRoute,
  presetRoute,
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
