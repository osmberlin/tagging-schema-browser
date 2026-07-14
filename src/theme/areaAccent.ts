import type { SchemaArea } from '@/components/ui/areaIcons'
import { cn } from '@/utils/tw'

/** Per-area accent palette. Violet is reserved for comparison / non-release only. */
export type AreaAccent = {
  icon: string
  iconSection: string
  iconBg: string
  navActive: string
  navInactive: string
  navIndicatorBg: string
  navIndicatorRing: string
  navIndicatorText: string
  link: string
  linkRing: string
  linkRingHover: string
  button: string
  focus: string
  searchFocus: string
  facetSelected: string
  facetShowMore: string
  rowHover: string
  rowHoverText: string
  highlight: string
  pill: string
  pillText: string
  cardHoverBorder: string
  cardHoverBg: string
  cardChevron: string
  cardExpandHover: string
  fieldMarker: string
  fieldMarkerSecondary: string
  sharedChip: string
}

export const areaAccent: Record<SchemaArea, AreaAccent> = {
  presets: {
    icon: 'text-rose-600',
    iconSection: 'text-rose-500',
    iconBg: 'bg-rose-50 text-rose-600',
    navActive:
      'rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100 ring-inset transition-colors hover:bg-rose-100 hover:text-rose-800 hover:ring-rose-200',
    navInactive:
      'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700',
    navIndicatorBg: 'bg-rose-50',
    navIndicatorRing: 'ring-rose-100',
    navIndicatorText: 'text-rose-700',
    link: 'text-rose-600 hover:text-rose-700',
    linkRing: 'text-rose-600 ring-rose-100 hover:bg-rose-50',
    linkRingHover: 'hover:text-rose-700',
    button: 'bg-rose-600 hover:bg-rose-700',
    focus: 'focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30',
    searchFocus: 'focus:ring-rose-500/60',
    facetSelected: 'font-medium text-rose-600 before:block before:bg-rose-500',
    facetShowMore: 'text-rose-600',
    rowHover: 'hover:bg-rose-50',
    rowHoverText: 'group-hover/col:text-rose-700 group-hover/ac:text-rose-700',
    highlight: 'bg-rose-50/70',
    pill: 'bg-rose-100',
    pillText: 'text-rose-700',
    cardHoverBorder: 'hover:border-rose-300',
    cardHoverBg: 'hover:bg-rose-50/40',
    cardChevron: 'bg-rose-100 text-rose-700',
    cardExpandHover: 'group-hover/fc:bg-rose-100 group-hover/fc:text-rose-700',
    fieldMarker: 'text-rose-700',
    fieldMarkerSecondary: 'text-rose-500',
    sharedChip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 ring-inset',
  },
  icons: {
    icon: 'text-sky-600',
    iconSection: 'text-sky-500',
    iconBg: 'bg-sky-50 text-sky-600',
    navActive:
      'rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 ring-1 ring-sky-100 ring-inset transition-colors hover:bg-sky-100 hover:text-sky-800 hover:ring-sky-200',
    navInactive:
      'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700',
    navIndicatorBg: 'bg-sky-50',
    navIndicatorRing: 'ring-sky-100',
    navIndicatorText: 'text-sky-700',
    link: 'text-sky-600 hover:text-sky-700',
    linkRing: 'text-sky-600 ring-sky-100 hover:bg-sky-50',
    linkRingHover: 'hover:text-sky-700',
    button: 'bg-sky-600 hover:bg-sky-700',
    focus: 'focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30',
    searchFocus: 'focus:ring-sky-500/60',
    facetSelected: 'font-medium text-sky-600 before:block before:bg-sky-500',
    facetShowMore: 'text-sky-600',
    rowHover: 'hover:bg-sky-50',
    rowHoverText: 'group-hover/col:text-sky-700 group-hover/ac:text-sky-700',
    highlight: 'bg-sky-50/70',
    pill: 'bg-sky-100',
    pillText: 'text-sky-700',
    cardHoverBorder: 'hover:border-sky-300',
    cardHoverBg: 'hover:bg-sky-50/40',
    cardChevron: 'bg-sky-100 text-sky-700',
    cardExpandHover: 'group-hover/fc:bg-sky-100 group-hover/fc:text-sky-700',
    fieldMarker: 'text-sky-700',
    fieldMarkerSecondary: 'text-sky-500',
    sharedChip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100 ring-inset',
  },
  fields: {
    icon: 'text-emerald-600',
    iconSection: 'text-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
    navActive:
      'rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100 ring-inset transition-colors hover:bg-emerald-100 hover:text-emerald-800 hover:ring-emerald-200',
    navInactive:
      'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700',
    navIndicatorBg: 'bg-emerald-50',
    navIndicatorRing: 'ring-emerald-100',
    navIndicatorText: 'text-emerald-700',
    link: 'text-emerald-600 hover:text-emerald-700',
    linkRing: 'text-emerald-700 ring-emerald-100 hover:bg-emerald-50',
    linkRingHover: 'hover:text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    focus: 'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
    searchFocus: 'focus:ring-emerald-500/60',
    facetSelected: 'font-medium text-emerald-600 before:block before:bg-emerald-500',
    facetShowMore: 'text-emerald-600',
    rowHover: 'hover:bg-emerald-50',
    rowHoverText: 'group-hover/col:text-emerald-700 group-hover/ac:text-emerald-700',
    highlight: 'bg-emerald-50/70',
    pill: 'bg-emerald-100',
    pillText: 'text-emerald-700',
    cardHoverBorder: 'hover:border-emerald-300',
    cardHoverBg: 'hover:bg-emerald-50/40',
    cardChevron: 'bg-emerald-100 text-emerald-700',
    cardExpandHover: 'group-hover/fc:bg-emerald-100 group-hover/fc:text-emerald-700',
    fieldMarker: 'text-emerald-700',
    fieldMarkerSecondary: 'text-emerald-500',
    sharedChip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 ring-inset',
  },
  translations: {
    icon: 'text-yellow-600',
    iconSection: 'text-yellow-500',
    iconBg: 'bg-yellow-50 text-yellow-600',
    navActive:
      'rounded-lg bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-700 ring-1 ring-yellow-100 ring-inset transition-colors hover:bg-yellow-100 hover:text-yellow-800 hover:ring-yellow-200',
    navInactive:
      'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-yellow-50 hover:text-yellow-700',
    navIndicatorBg: 'bg-yellow-50',
    navIndicatorRing: 'ring-yellow-100',
    navIndicatorText: 'text-yellow-700',
    link: 'text-yellow-600 hover:text-yellow-700',
    linkRing: 'text-yellow-600 ring-yellow-100 hover:bg-yellow-50',
    linkRingHover: 'hover:text-yellow-700',
    button: 'bg-yellow-600 hover:bg-yellow-700',
    focus: 'focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30',
    searchFocus: 'focus:ring-yellow-500/60',
    facetSelected: 'font-medium text-yellow-600 before:block before:bg-yellow-500',
    facetShowMore: 'text-yellow-600',
    rowHover: 'hover:bg-yellow-50',
    rowHoverText: 'group-hover/col:text-yellow-700 group-hover/ac:text-yellow-700',
    highlight: 'bg-yellow-50/70',
    pill: 'bg-yellow-100',
    pillText: 'text-yellow-700',
    cardHoverBorder: 'hover:border-yellow-300',
    cardHoverBg: 'hover:bg-yellow-50/40',
    cardChevron: 'bg-yellow-100 text-yellow-700',
    cardExpandHover: 'group-hover/fc:bg-yellow-100 group-hover/fc:text-yellow-700',
    fieldMarker: 'text-yellow-700',
    fieldMarkerSecondary: 'text-yellow-500',
    sharedChip: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100 ring-inset',
  },
  presetSwitch: {
    icon: 'text-amber-600',
    iconSection: 'text-amber-500',
    iconBg: 'bg-amber-50 text-amber-600',
    navActive:
      'rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-100 ring-inset transition-colors hover:bg-amber-100 hover:text-amber-800 hover:ring-amber-200',
    navInactive:
      'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-amber-50 hover:text-amber-700',
    navIndicatorBg: 'bg-amber-50',
    navIndicatorRing: 'ring-amber-100',
    navIndicatorText: 'text-amber-700',
    link: 'text-amber-600 hover:text-amber-700',
    linkRing: 'text-amber-600 ring-amber-100 hover:bg-amber-50',
    linkRingHover: 'hover:text-amber-700',
    button: 'bg-amber-600 hover:bg-amber-700',
    focus: 'focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30',
    searchFocus: 'focus:ring-amber-500/60',
    facetSelected: 'font-medium text-amber-600 before:block before:bg-amber-500',
    facetShowMore: 'text-amber-600',
    rowHover: 'hover:bg-amber-50',
    rowHoverText: 'group-hover/col:text-amber-700 group-hover/ac:text-amber-700',
    highlight: 'bg-amber-50/70',
    pill: 'bg-amber-100',
    pillText: 'text-amber-700',
    cardHoverBorder: 'hover:border-amber-300',
    cardHoverBg: 'hover:bg-amber-50/40',
    cardChevron: 'bg-amber-100 text-amber-700',
    cardExpandHover: 'group-hover/fc:bg-amber-100 group-hover/fc:text-amber-700',
    fieldMarker: 'text-amber-700',
    fieldMarkerSecondary: 'text-amber-500',
    sharedChip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 ring-inset',
  },
}

export function areaNavClass(area: SchemaArea, active: boolean): string {
  return active ? areaAccent[area].navActive : areaAccent[area].navInactive
}

export function utilityNavClass(active: boolean): string {
  return active
    ? 'rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 ring-1 ring-slate-200 ring-inset transition-colors hover:bg-slate-200 hover:text-slate-950'
    : 'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900'
}

/** Filled area button (header actions, compare preset switch, etc.). */
export function areaNavButtonClass(area: SchemaArea): string {
  return areaAccent[area].navActive
}

export function areaLinkClass(area: SchemaArea): string {
  return cn(
    'font-medium underline-offset-2 decoration-current/40 transition-colors hover:underline hover:decoration-current',
    areaAccent[area].link,
  )
}

/** Chip-styled area links (preset lists, filter chips). */
export function areaChipLinkClass(area: SchemaArea): string {
  const chipHover: Record<SchemaArea, string> = {
    presets: 'hover:bg-rose-100 hover:text-rose-800 hover:ring-rose-200',
    icons: 'hover:bg-sky-100 hover:text-sky-800 hover:ring-sky-200',
    fields: 'hover:bg-emerald-100 hover:text-emerald-800 hover:ring-emerald-200',
    translations: 'hover:bg-yellow-100 hover:text-yellow-800 hover:ring-yellow-200',
    presetSwitch: 'hover:bg-amber-100 hover:text-amber-800 hover:ring-amber-200',
  }
  return cn('transition-colors', areaAccent[area].sharedChip, chipHover[area])
}

export function areaSourceLinkClass(area: SchemaArea): string {
  return `${areaAccent[area].linkRing} ${areaAccent[area].linkRingHover} transition-colors`
}
