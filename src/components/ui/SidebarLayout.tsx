import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useHotkey, useHotkeySequence } from '@tanstack/react-hotkeys'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { fieldFacetDefaults } from '@/components/PageFields/useFieldFacetState'
import { iconFacetDefaults } from '@/components/PageIcons/useIconFacetState'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { presetSwitchSearchDefaults } from '@/components/PagePresetSwitch/presetSwitchSearch'
import { translationsSearchDefaults } from '@/components/PageTranslations/translationsSearch'
import { DataSourceBanner } from '@/components/ui/DataSourceBanner'
import { Kbd } from '@/components/ui/Kbd'
import { LanguagePicker } from '@/components/ui/LanguagePicker'
import { PrimaryNav } from '@/components/ui/PrimaryNav'
import { ReferenceToggle } from '@/components/ui/ReferenceToggle'
import { SchemaLoadIndicator } from '@/components/ui/SchemaLoadIndicator'
import { ShortcutsDialog } from '@/components/ui/ShortcutsDialog'
import { Tooltip } from '@/components/ui/Tooltip'
import { utilityNavClass } from '@/theme/areaAccent'
import { brandAccent } from '@/theme/brandAccent'
import { PAGE_SEARCH_INPUT_ID } from './HeaderSearch'

function UtilityNavLinks({ onNavigate, onHelp }: { onNavigate?: () => void; onHelp: () => void }) {
  const { pathname } = useLocation()
  return (
    <>
      <LanguagePicker />
      <Link
        to="/about"
        search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
        onClick={onNavigate}
        className={`inline-flex h-10 items-center ${utilityNavClass(pathname === '/about')}`}
      >
        About
      </Link>
      <HelpButton onClick={onHelp} />
    </>
  )
}

function FiltersIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 6h16M6 12h12M9 18h6"
      />
    </svg>
  )
}

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip content="Keyboard shortcuts" placement="bottom">
      <button
        type="button"
        onClick={onClick}
        className="flex h-10 items-center rounded-lg px-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Keyboard shortcuts"
      >
        <Kbd>?</Kbd>
      </button>
    </Tooltip>
  )
}

export function SidebarLayout({
  children,
  sidebar,
  sidebarSearch,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
  sidebarSearch?: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const showSidebar =
    location.pathname === '/' ||
    location.pathname === '/icons' ||
    location.pathname === '/fields' ||
    location.pathname === '/translations'

  const focusSearch = () => {
    const input = document.getElementById(PAGE_SEARCH_INPUT_ID) as HTMLInputElement | null
    if (!input || document.activeElement === input) return
    input.focus()
    input.select()
  }

  // Mod+K / "/" focus search; "?" opens help; "g" then p/i/f/t/s/a navigates.
  // The library auto-ignores single-key/sequence hotkeys while typing in inputs.
  useHotkey('Mod+K', focusSearch)
  useHotkey('/', focusSearch)
  useHotkey({ key: '?', shift: true }, () => setHelpOpen(true))
  useHotkeySequence(['G', 'P'], () =>
    navigate({
      to: '/',
      search: (prev) => ({
        ...presetSearchDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
    }),
  )
  useHotkeySequence(['G', 'I'], () =>
    navigate({
      to: '/icons',
      search: (prev) => ({
        ...iconFacetDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
    }),
  )
  useHotkeySequence(['G', 'F'], () =>
    navigate({
      to: '/fields',
      search: (prev) => ({
        ...fieldFacetDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
    }),
  )
  useHotkeySequence(['G', 'T'], () =>
    navigate({
      to: '/translations',
      search: (prev) => ({
        ...translationsSearchDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
    }),
  )
  useHotkeySequence(['G', 'S'], () =>
    navigate({
      to: '/preset-switch',
      search: (prev) => ({
        ...presetSwitchSearchDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
    }),
  )
  useHotkeySequence(['G', 'A'], () =>
    navigate({
      to: '/about',
      search: (prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' }),
    }),
  )

  return (
    <div className="flex min-h-svh w-full flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-sm">
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
                  dataUrl: prev.dataUrl ?? '',
                  locale: prev.locale ?? '',
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
                    dataUrl: prev.dataUrl ?? '',
                    locale: prev.locale ?? '',
                  })}
                  className="hidden font-display text-sm leading-none font-semibold whitespace-nowrap text-slate-900 sm:inline"
                >
                  Tagging Schema <span className={brandAccent.wordmark}>Browser</span>
                </Link>
                <ReferenceToggle />
              </div>
            </div>
          </div>

          <PrimaryNav className="shrink-0" />

          <nav aria-label="Settings" className="ml-auto flex shrink-0 items-center gap-2">
            <UtilityNavLinks onHelp={() => setHelpOpen(true)} />
          </nav>
        </div>

        <DataSourceBanner />
        <SchemaLoadIndicator />
      </header>

      <div className="flex w-full flex-auto overflow-x-clip">
        {showSidebar ? (
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50 md:block">
            <div className="sticky top-16 max-h-[calc(100svh-4rem)] overflow-y-auto px-5 py-6">
              {sidebarSearch ? <div className="mb-5">{sidebarSearch}</div> : null}
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
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {sidebarSearch ? <div className="mb-5">{sidebarSearch}</div> : null}
                {sidebar}
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
