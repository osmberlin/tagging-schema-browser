import { PageAbout } from "@/components/PageAbout/PageAbout";
import { IconFacetSidebar } from "@/components/PageIcons/IconFacetSidebar";
import { IconSearchBar } from "@/components/PageIcons/IconSearchBar";
import { iconFacetDefaults, iconFacetSchema } from "@/components/PageIcons/useIconFacetState";
import { FacetSidebar } from "@/components/PagePresets/FacetSidebar";
import { PagePresets } from "@/components/PagePresets/PagePresets";
import { SearchBar } from "@/components/PagePresets/SearchBar";
import { presetSearchDefaults, presetSearchSchema } from "@/components/PagePresets/useSearchState";
import { SidebarLayout } from "@/components/ui/SidebarLayout";
import { SchemaProvider } from "@/contexts/SchemaContext";
import { DEFAULT_DATA_URL } from "@/utils/constants";
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
});
type RootSearch = z.infer<typeof rootSearchSchema>;

function RootContent() {
  const navigate = useNavigate();
  const dataUrl = useSearch({ strict: false, select: (s) => s.dataUrl ?? "" });
  const location = useLocation();

  const setDataUrl = (url: string | null) => {
    void navigate({ to: ".", search: (prev) => ({ ...prev, dataUrl: url ?? "" }) });
  };

  const resolvedDataUrl = (dataUrl.trim() || DEFAULT_DATA_URL).trim();
  const topSearch =
    location.pathname === "/icons" ? (
      <IconSearchBar />
    ) : location.pathname === "/" ? (
      <SearchBar />
    ) : null;
  const sidebar =
    location.pathname === "/icons" ? (
      <IconFacetSidebar />
    ) : location.pathname === "/" ? (
      <FacetSidebar />
    ) : (
      <p className="mt-4 px-2 text-sm text-slate-500 ">
        Open <strong>Presets</strong> or <strong>Icons</strong> to use faceted search.
      </p>
    );

  return (
    <SchemaProvider dataUrl={resolvedDataUrl} setDataUrl={setDataUrl}>
      <SidebarLayout sidebar={sidebar} topSearch={topSearch}>
        <Outlet />
      </SidebarLayout>
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
    middlewares: [retainSearchParams<RootSearch>(["dataUrl"]), stripSearchParams({ dataUrl: "" })],
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

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: PageAbout,
});

const routeTree = rootRoute.addChildren([indexRoute, iconsRoute, aboutRoute]);

export const router = createRouter({
  routeTree,
  basepath: routerBasepath(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
