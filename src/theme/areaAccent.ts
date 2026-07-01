import type { SchemaArea } from '@/components/ui/areaIcons'

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
      'rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100 ring-inset',
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
      'rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 ring-1 ring-sky-100 ring-inset',
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
      'rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100 ring-inset',
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
      'rounded-lg bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-700 ring-1 ring-yellow-100 ring-inset',
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
}

export function areaNavClass(area: SchemaArea, active: boolean): string {
  return active ? areaAccent[area].navActive : areaAccent[area].navInactive
}

export function utilityNavClass(active: boolean): string {
  return active
    ? 'rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 ring-1 ring-slate-200 ring-inset'
    : 'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'
}

export function areaLinkClass(area: SchemaArea): string {
  return `font-medium ${areaAccent[area].link} transition hover:underline`
}

export function areaSourceLinkClass(area: SchemaArea): string {
  return `${areaAccent[area].linkRing} ${areaAccent[area].linkRingHover}`
}
