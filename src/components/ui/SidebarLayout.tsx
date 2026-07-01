import { fieldFacetDefaults } from "@/components/PageFields/useFieldFacetState";
import { iconFacetDefaults } from "@/components/PageIcons/useIconFacetState";
import { presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import { translationsSearchDefaults } from "@/components/PageTranslations/translationsSearch";
import { DataSourceBanner } from "@/components/ui/DataSourceBanner";
import { Kbd } from "@/components/ui/Kbd";
import { LanguagePicker } from "@/components/ui/LanguagePicker";
import { PrimaryNav } from "@/components/ui/PrimaryNav";
import { ReferenceToggle } from "@/components/ui/ReferenceToggle";
import { SchemaLoadIndicator } from "@/components/ui/SchemaLoadIndicator";
import { ShortcutsDialog } from "@/components/ui/ShortcutsDialog";
import { utilityNavClass } from "@/theme/areaAccent";
import { brandAccent } from "@/theme/brandAccent";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useHotkey, useHotkeySequence } from "@tanstack/react-hotkeys";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PAGE_SEARCH_INPUT_ID } from "./HeaderSearch";

function UtilityNavLinks({
  onNavigate,
  onHelp,
}: {
  onNavigate?: () => void;
  onHelp: () => void;
}) {
  const { pathname } = useLocation();
  return (
    <>
      <LanguagePicker />
      <HelpButton onClick={onHelp} />
      <Link
        to="/about"
        search={(prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" })}
        onClick={onNavigate}
        className={utilityNavClass(pathname === "/about")}
      >
        About
      </Link>
    </>
  );
}

function FiltersIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 6h16M6 12h12M9 18h6"
      />
    </svg>
  );
}

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 items-center rounded-lg px-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      aria-label="Keyboard shortcuts"
      title="Keyboard shortcuts"
    >
      <Kbd>?</Kbd>
    </button>
  );
}

export function SidebarLayout({
  children,
  sidebar,
  topSearch,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  topSearch?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const showSidebar =
    location.pathname === "/" ||
    location.pathname === "/icons" ||
    location.pathname === "/fields" ||
    location.pathname === "/translations";

  const focusSearch = () => {
    const input = document.getElementById(PAGE_SEARCH_INPUT_ID) as HTMLInputElement | null;
    if (!input || document.activeElement === input) return;
    input.focus();
    input.select();
  };

  // Mod+K / "/" focus search; "?" opens help; "g" then p/i/a navigates.
  // The library auto-ignores single-key/sequence hotkeys while typing in inputs.
  useHotkey("Mod+K", focusSearch);
  useHotkey("/", focusSearch);
  useHotkey({ key: "?", shift: true }, () => setHelpOpen(true));
  useHotkeySequence(["G", "P"], () =>
    navigate({
      to: "/",
      search: (prev) => ({
        ...presetSearchDefaults,
        dataUrl: prev.dataUrl ?? "",
        locale: prev.locale ?? "",
      }),
    }),
  );
  useHotkeySequence(["G", "I"], () =>
    navigate({
      to: "/icons",
      search: (prev) => ({
        ...iconFacetDefaults,
        dataUrl: prev.dataUrl ?? "",
        locale: prev.locale ?? "",
      }),
    }),
  );
  useHotkeySequence(["G", "F"], () =>
    navigate({
      to: "/fields",
      search: (prev) => ({
        ...fieldFacetDefaults,
        dataUrl: prev.dataUrl ?? "",
        locale: prev.locale ?? "",
      }),
    }),
  );
  useHotkeySequence(["G", "T"], () =>
    navigate({
      to: "/translations",
      search: (prev) => ({
        ...translationsSearchDefaults,
        dataUrl: prev.dataUrl ?? "",
        locale: prev.locale ?? "",
      }),
    }),
  );
  useHotkeySequence(["G", "A"], () =>
    navigate({
      to: "/about",
      search: (prev) => ({ dataUrl: prev.dataUrl ?? "", locale: prev.locale ?? "" }),
    }),
  );

  return (
    <div className="flex min-h-svh w-full flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-sm">
        {/* Wraps to two rows when the search would shrink below 45px: logo on row 1, search + nav on row 2. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-2">
            {showSidebar ? (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="-ml-1 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
                aria-label="Open filters"
              >
                <FiltersIcon className="h-5 w-5" />
              </button>
            ) : null}

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                search={(prev) => ({
                  ...presetSearchDefaults,
                  dataUrl: prev.dataUrl ?? "",
                  locale: prev.locale ?? "",
                })}
                className="shrink-0"
                aria-label="Tagging Schema Browser home"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm ${brandAccent.logo}`}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                    <path
                      d="M3 7.5 11 3l8 4.5v9L11 21l-8-4.5v-9Z"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11 3v18M3 7.5 11 12l8-4.5"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
              <div className="flex min-w-0 flex-col gap-0.5">
                <Link
                  to="/"
                  search={(prev) => ({
                    ...presetSearchDefaults,
                    dataUrl: prev.dataUrl ?? "",
                    locale: prev.locale ?? "",
                  })}
                  className="hidden font-display text-sm leading-none font-semibold whitespace-nowrap text-slate-900 sm:inline"
                >
                  Tagging Schema <span className={brandAccent.wordmark}>Browser</span>
                </Link>
                <ReferenceToggle />
              </div>
            </div>
          </div>

          <PrimaryNav className="order-3 lg:order-none" />

          {/* Inline when header is wide enough; full-width row 2 when search would drop below 45px. */}
          <div
            className={
              topSearch
                ? "order-last flex w-full min-w-[min(100%,calc(45px+33rem))] flex-1 basis-[calc(45px+33rem)] items-center gap-3 lg:order-none"
                : "order-last flex w-full min-w-[min(100%,33rem)] flex-1 basis-132 items-center gap-3 lg:order-none"
            }
          >
            {topSearch ? (
              <div className="min-w-[45px] max-w-[450px] flex-1">{topSearch}</div>
            ) : null}
            <nav aria-label="Settings" className="ml-auto flex shrink-0 items-center gap-1">
              <UtilityNavLinks onHelp={() => setHelpOpen(true)} />
            </nav>
          </div>
        </div>

        <DataSourceBanner />
        <SchemaLoadIndicator />
      </header>

      <div className="flex w-full flex-auto overflow-x-clip">
        {showSidebar ? (
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50 md:block">
            <div className="sticky top-16 max-h-[calc(100svh-4rem)] overflow-y-auto px-5 py-6">
              <h2 className="mb-4 font-display text-sm font-semibold text-slate-900">
                Faceted search
              </h2>
              {sidebar}
            </div>
          </aside>
        ) : null}

        {/* Mobile filters dialog */}
        <Dialog
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          className="relative z-50 md:hidden"
        >
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex">
            <DialogPanel className="flex w-full max-w-xs flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <DialogTitle className="font-display text-sm font-semibold text-slate-900">
                  Faceted search
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close filters"
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">{sidebar}</div>
            </DialogPanel>
          </div>
        </Dialog>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
