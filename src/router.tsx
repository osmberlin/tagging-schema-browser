import { IconFacetSidebar } from "@/components/PageIcons/IconFacetSidebar";
import { IconSearchBar } from "@/components/PageIcons/IconSearchBar";
import { FacetSidebar } from "@/components/PagePresets/FacetSidebar";
import { PagePresetDetails } from "@/components/PagePresets/PagePresetDetails";
import { PagePresets } from "@/components/PagePresets/PagePresets";
import { SearchBar } from "@/components/PagePresets/SearchBar";
import { SidebarLayout } from "@/components/ui/SidebarLayout";
import { SchemaProvider } from "@/contexts/SchemaContext";
import { DEFAULT_DATA_URL } from "@/utils/constants";
import { createRootRouteWithContext, createRoute, createRouter } from "@tanstack/react-router";
import { Outlet, useLocation } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { parseAsString } from "nuqs/server";
import { Suspense, lazy } from "react";
import { useEffect } from "react";

const LazyPageIcons = lazy(() =>
  import("@/components/PageIcons/PageIcons").then((m) => ({ default: m.PageIcons })),
);

function RootContent() {
  const [dataUrl, setDataUrl] = useQueryState("dataUrl", parseAsString.withDefault(""));
  const location = useLocation();

  useEffect(() => {
    if (!dataUrl?.trim()) {
      setDataUrl(DEFAULT_DATA_URL);
    }
  }, [dataUrl, setDataUrl]);

  const urlOrNull = (dataUrl?.trim() || DEFAULT_DATA_URL).trim();
  const topSearch = location.pathname === "/icons" ? <IconSearchBar /> : <SearchBar />;
  const sidebar = location.pathname === "/icons" ? <IconFacetSidebar /> : <FacetSidebar />;

  return (
    <SchemaProvider dataUrl={urlOrNull} setDataUrl={(url) => setDataUrl(url ?? "")}>
      <SidebarLayout sidebar={sidebar} topSearch={topSearch}>
        <Outlet />
      </SidebarLayout>
    </SchemaProvider>
  );
}

function RootComponent() {
  return (
    <NuqsAdapter>
      <RootContent />
    </NuqsAdapter>
  );
}

const rootRoute = createRootRouteWithContext()({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <PagePresets />,
});

const iconsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/icons",
  component: () => (
    <Suspense
      fallback={<p className="text-sm text-zinc-500 dark:text-zinc-400">Loading icons...</p>}
    >
      <LazyPageIcons />
    </Suspense>
  ),
});

const presetDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/presets/$presetId",
  component: PresetDetailRouteComponent,
});

function PresetDetailRouteComponent() {
  const { presetId } = presetDetailRoute.useParams();
  return <PagePresetDetails presetId={presetId} />;
}

const routeTree = rootRoute.addChildren([indexRoute, iconsRoute, presetDetailRoute]);

export const router = createRouter({ routeTree });
