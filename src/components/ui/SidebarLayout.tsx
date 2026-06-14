import { iconFacetDefaults } from "@/components/PageIcons/useIconFacetState";
import { presetSearchDefaults } from "@/components/PagePresets/useSearchState";
import { translationsSearchDefaults } from "@/components/PageTranslations/translationsSearch";
import { Kbd } from "@/components/ui/Kbd";
import { ShortcutsDialog } from "@/components/ui/ShortcutsDialog";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useHotkey, useHotkeySequence } from "@tanstack/react-hotkeys";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PAGE_SEARCH_INPUT_ID } from "./HeaderSearch";

function navLinkClass(active: boolean): string {
  return active
    ? "rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 ring-1 ring-sky-100 ring-inset"
    : "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";
}

// Reset each page's own params to defaults on navigation, but keep `dataUrl`.
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <>
      <Link
        to="/"
        search={(prev) => ({ ...presetSearchDefaults, dataUrl: prev.dataUrl ?? "" })}
        onClick={onNavigate}
        className={navLinkClass(pathname === "/")}
      >
        Presets
      </Link>
      <Link
        to="/icons"
        search={(prev) => ({ ...iconFacetDefaults, dataUrl: prev.dataUrl ?? "" })}
        onClick={onNavigate}
        className={navLinkClass(pathname === "/icons")}
      >
        Icons
      </Link>
      <Link
        to="/translations"
        search={(prev) => ({ ...translationsSearchDefaults, dataUrl: prev.dataUrl ?? "" })}
        onClick={onNavigate}
        className={navLinkClass(pathname === "/translations")}
      >
        Translations
      </Link>
      <Link
        to="/about"
        search={(prev) => ({ dataUrl: prev.dataUrl ?? "" })}
        onClick={onNavigate}
        className={navLinkClass(pathname === "/about")}
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
      className="ml-1 flex h-8 items-center rounded-lg px-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
  const showSidebar = location.pathname === "/" || location.pathname === "/icons";

  const focusSearch = () => {
    const input = document.getElementById(PAGE_SEARCH_INPUT_ID) as HTMLInputElement | null;
    input?.focus();
    input?.select();
  };

  // Mod+K / "/" focus search; "?" opens help; "g" then p/i/a navigates.
  // The library auto-ignores single-key/sequence hotkeys while typing in inputs.
  useHotkey("Mod+K", focusSearch);
  useHotkey("/", focusSearch);
  useHotkey({ key: "?", shift: true }, () => setHelpOpen(true));
  useHotkeySequence(["G", "P"], () =>
    navigate({
      to: "/",
      search: (prev) => ({ ...presetSearchDefaults, dataUrl: prev.dataUrl ?? "" }),
    }),
  );
  useHotkeySequence(["G", "I"], () =>
    navigate({
      to: "/icons",
      search: (prev) => ({ ...iconFacetDefaults, dataUrl: prev.dataUrl ?? "" }),
    }),
  );
  useHotkeySequence(["G", "T"], () =>
    navigate({
      to: "/translations",
      search: (prev) => ({ ...translationsSearchDefaults, dataUrl: prev.dataUrl ?? "" }),
    }),
  );
  useHotkeySequence(["G", "A"], () =>
    navigate({ to: "/about", search: (prev) => ({ dataUrl: prev.dataUrl ?? "" }) }),
  );

  return (
    <div className="flex min-h-svh w-full flex-col overflow-x-clip bg-white text-slate-900">
      <header className="sticky top-0 z-40 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
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

          <Link
            to="/"
            search={(prev) => ({ ...presetSearchDefaults, dataUrl: prev.dataUrl ?? "" })}
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white shadow-sm shadow-sky-500/30">
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
            <span className="hidden font-display text-base font-semibold whitespace-nowrap text-slate-900 sm:inline">
              Tagging Schema <span className="text-sky-600">Browser</span>
            </span>
          </Link>

          <div className="flex min-w-0 flex-1 justify-center">{topSearch}</div>

          <nav className="hidden shrink-0 items-center gap-1 sm:flex">
            <NavLinks />
            <HelpButton onClick={() => setHelpOpen(true)} />
          </nav>
        </div>

        {/* Mobile page nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:hidden">
          <NavLinks />
          <HelpButton onClick={() => setHelpOpen(true)} />
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-auto">
        {showSidebar ? (
          <aside className="relative hidden w-72 shrink-0 md:block before:absolute before:inset-y-0 before:right-0 before:w-screen before:border-r before:border-slate-200 before:bg-slate-50">
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
