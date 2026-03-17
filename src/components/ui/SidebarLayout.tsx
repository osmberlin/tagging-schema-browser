import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { getHotkeyManager } from "@tanstack/hotkeys";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PAGE_SEARCH_INPUT_ID } from "./HeaderSearch";
import { Sidebar, SidebarBody, SidebarHeader } from "./Sidebar";

const navItems = [
  { to: "/", label: "Presets" },
  { to: "/icons", label: "Icons" },
];

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
  const location = useLocation();

  useEffect(() => {
    const manager = getHotkeyManager();
    const hotkey = manager.register("Mod+K", () => {
      const input = document.getElementById(PAGE_SEARCH_INPUT_ID) as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });

    return () => {
      hotkey.unregister();
    };
  }, []);

  return (
    <div className="relative min-h-svh w-full bg-zinc-50 dark:bg-zinc-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-900/10 bg-white/90 backdrop-blur-xs dark:border-white/10 dark:bg-zinc-900/80">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="hidden shrink-0 lg:block">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              iD Tagging Schema Browser
            </span>
          </div>

          {topSearch}

          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                    location.pathname === to
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
              aria-label="Open filters"
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
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-900/10 px-4 py-2 dark:border-white/10 md:hidden">
          <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">
            iD Tagging Schema Browser
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  location.pathname === to
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-[1400px] pt-24 md:bg-zinc-100">
        {/* Desktop sidebar */}
        <aside className="fixed bottom-0 left-0 top-14 z-30 hidden w-72 md:block">
          <Sidebar>
            <SidebarHeader>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                Faceted Search
              </span>
            </SidebarHeader>
            <SidebarBody>{sidebar}</SidebarBody>
          </Sidebar>
        </aside>

        {/* Mobile sidebar dialog */}
        <Dialog
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          className="relative z-50 md:hidden"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex">
            <DialogPanel className="ml-0 w-full max-w-xs bg-white dark:bg-zinc-900">
              <DialogTitle className="sr-only">Faceted Search</DialogTitle>
              <Sidebar>
                <SidebarHeader className="flex flex-row items-center justify-between">
                  <span className="text-sm font-semibold">Faceted Search</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="rounded p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </SidebarHeader>
                <SidebarBody>{sidebar}</SidebarBody>
              </Sidebar>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-6 md:pl-72 md:pr-6">
          <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-white/10 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
