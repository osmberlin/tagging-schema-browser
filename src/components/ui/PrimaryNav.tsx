import { Link, useLocation } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { fieldFacetDefaults } from '@/components/PageFields/useFieldFacetState'
import { iconFacetDefaults } from '@/components/PageIcons/useIconFacetState'
import { presetBuilderSearchDefaults } from '@/components/PagePresetBuilder/presetBuilderSearch'
import { presetSearchDefaults } from '@/components/PagePresets/useSearchState'
import { presetSwitchSearchDefaults } from '@/components/PagePresetSwitch/presetSwitchSearch'
import { translationsSearchDefaults } from '@/components/PageTranslations/translationsSearch'
import { AreaIcon, PresetBuilderNavIcon, type SchemaArea } from '@/components/ui/areaIcons'
import { Tooltip } from '@/components/ui/Tooltip'
import { useComparison } from '@/hooks/useComparison'
import { areaAccent } from '@/theme/areaAccent'
import { comparisonAccent } from '@/theme/comparisonAccent'
import { cn } from '@/utils/tw'

type NavKey = SchemaArea | 'comparison' | 'presetBuilder'

type NavIndicator = {
  bg: string
  ring: string
  text: string
}

const areaIndicators: Record<SchemaArea, NavIndicator> = {
  presets: {
    bg: areaAccent.presets.navIndicatorBg,
    ring: areaAccent.presets.navIndicatorRing,
    text: areaAccent.presets.navIndicatorText,
  },
  icons: {
    bg: areaAccent.icons.navIndicatorBg,
    ring: areaAccent.icons.navIndicatorRing,
    text: areaAccent.icons.navIndicatorText,
  },
  fields: {
    bg: areaAccent.fields.navIndicatorBg,
    ring: areaAccent.fields.navIndicatorRing,
    text: areaAccent.fields.navIndicatorText,
  },
  translations: {
    bg: areaAccent.translations.navIndicatorBg,
    ring: areaAccent.translations.navIndicatorRing,
    text: areaAccent.translations.navIndicatorText,
  },
  presetSwitch: {
    bg: areaAccent.presetSwitch.navIndicatorBg,
    ring: areaAccent.presetSwitch.navIndicatorRing,
    text: areaAccent.presetSwitch.navIndicatorText,
  },
}

const comparisonIndicator: NavIndicator = {
  bg: comparisonAccent.navIndicatorBg,
  ring: comparisonAccent.navIndicatorRing,
  text: comparisonAccent.navIndicatorText,
}

function getIndicator(key: NavKey): NavIndicator {
  if (key === 'comparison') return comparisonIndicator
  if (key === 'presetBuilder') return areaIndicators.presets
  return areaIndicators[key]
}

function getActiveKey(pathname: string): NavKey {
  if (pathname === '/preset-builder') return 'presetBuilder'
  if (pathname === '/icons') return 'icons'
  if (pathname === '/fields' || pathname.startsWith('/field/')) return 'fields'
  if (pathname === '/translations') return 'translations'
  if (pathname === '/preset-switch') return 'presetSwitch'
  if (pathname === '/comparison') return 'comparison'
  return 'presets'
}

type NavItem = {
  key: NavKey
  to: string
  label: string
  area?: SchemaArea
  search: (prev: {
    dataUrl?: string
    locale?: string
    reference?: string
  }) => Record<string, unknown>
  title?: string
  children?: React.ReactNode
  customIcon?: React.ReactNode
}

const springTransition = { type: 'spring' as const, stiffness: 500, damping: 35, bounce: 0 }

// Reset each page's own params to defaults on navigation, but keep `dataUrl`.
export function PrimaryNav({
  onNavigate,
  className,
}: {
  onNavigate?: () => void
  className?: string
}) {
  const { pathname } = useLocation()
  const { isComparing, changeCount } = useComparison()
  const reducedMotion = useReducedMotion()
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef(new Map<NavKey, HTMLAnchorElement>())
  const [hoveredKey, setHoveredKey] = useState<NavKey | null>(null)
  const [indicatorRect, setIndicatorRect] = useState({ left: 0, width: 0 })

  const activeKey = getActiveKey(pathname)
  const indicatorKey = hoveredKey ?? activeKey
  const indicator = getIndicator(indicatorKey)

  const items: NavItem[] = [
    {
      key: 'presets',
      to: '/',
      label: 'Presets',
      area: 'presets',
      search: (prev) => ({
        ...presetSearchDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
    },
    {
      key: 'fields',
      to: '/fields',
      label: 'Fields',
      area: 'fields',
      search: (prev) => ({
        ...fieldFacetDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
    },
    {
      key: 'icons',
      to: '/icons',
      label: 'Icons',
      area: 'icons',
      search: (prev) => ({
        ...iconFacetDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
    },
    {
      key: 'translations',
      to: '/translations',
      label: 'Translations',
      area: 'translations',
      search: (prev) => ({
        ...translationsSearchDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
    },
    {
      key: 'presetSwitch',
      to: '/preset-switch',
      label: 'Preset switch',
      area: 'presetSwitch',
      search: (prev) => ({
        ...presetSwitchSearchDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
      title: 'Compare tag changes when switching presets',
    },
    {
      key: 'presetBuilder',
      to: '/preset-builder',
      label: 'Preset builder',
      search: (prev) => ({
        ...presetBuilderSearchDefaults,
        dataUrl: prev.dataUrl ?? '',
        locale: prev.locale ?? '',
      }),
      title: 'Draft a new preset JSON file',
      customIcon: <PresetBuilderNavIcon className="h-3.5 w-3.5" />,
    },
    ...(isComparing
      ? [
          {
            key: 'comparison' as const,
            to: '/comparison',
            label: 'Comparison',
            search: (prev: { dataUrl?: string; locale?: string; reference?: string }) => ({
              ...presetSearchDefaults,
              dataUrl: prev.dataUrl ?? '',
              locale: prev.locale ?? '',
            }),
            title: 'What changed vs unreleased',
            children:
              changeCount != null ? (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${comparisonAccent.badge}`}
                >
                  {changeCount}
                </span>
              ) : null,
          },
        ]
      : []),
  ]

  const measureIndicator = useCallback(() => {
    const el = itemRefs.current.get(indicatorKey)
    if (!el) return
    setIndicatorRect({ left: el.offsetLeft, width: el.offsetWidth })
  }, [indicatorKey])

  useLayoutEffect(() => {
    measureIndicator()
  }, [measureIndicator])

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const observer = new ResizeObserver(measureIndicator)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [measureIndicator])

  const transition = reducedMotion ? { duration: 0 } : springTransition

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className={cn('relative flex shrink-0 items-center gap-1', className)}
      onMouseLeave={() => setHoveredKey(null)}
    >
      {indicatorRect.width > 0 ? (
        <motion.div
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-0 bottom-0 rounded-lg ring-1 ring-inset',
            indicator.bg,
            indicator.ring,
          )}
          initial={false}
          animate={{ left: indicatorRect.left, width: indicatorRect.width }}
          transition={transition}
        />
      ) : null}

      {items.map((item) => {
        const highlighted = item.key === indicatorKey
        const itemIndicator = getIndicator(item.key)
        const link = (
          <Link
            ref={(el) => {
              if (el) itemRefs.current.set(item.key, el)
              else itemRefs.current.delete(item.key)
            }}
            to={item.to}
            search={item.search}
            onClick={onNavigate}
            onMouseEnter={() => setHoveredKey(item.key)}
            className={cn(
              'relative z-10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              highlighted ? itemIndicator.text : 'text-slate-600',
            )}
          >
            {item.customIcon ? (
              <span
                className={cn(
                  'mr-1.5 inline h-3.5 w-3.5 align-[-2px]',
                  highlighted ? itemIndicator.text : areaAccent.presets.icon,
                )}
              >
                {item.customIcon}
              </span>
            ) : item.area ? (
              <AreaIcon
                area={item.area}
                className={cn(
                  'mr-1.5 inline h-3.5 w-3.5 align-[-2px]',
                  highlighted ? itemIndicator.text : areaAccent[item.area].icon,
                )}
              />
            ) : null}
            {item.label}
            {item.children}
          </Link>
        )

        return item.title ? (
          <Tooltip key={item.key} content={item.title} placement="bottom" openDelay={400}>
            {link}
          </Tooltip>
        ) : (
          <span key={item.key} className="contents">
            {link}
          </span>
        )
      })}
    </nav>
  )
}
