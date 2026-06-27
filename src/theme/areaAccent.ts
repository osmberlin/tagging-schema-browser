import type { SchemaArea } from "@/components/ui/areaIcons";

/** Per-area accent palette. Violet is reserved for comparison / non-release only. */
export type AreaAccent = {
  icon: string;
  iconSection: string;
  iconBg: string;
  navActive: string;
  navInactive: string;
  link: string;
  linkRing: string;
  linkRingHover: string;
  button: string;
  focus: string;
  searchFocus: string;
  facetSelected: string;
  facetShowMore: string;
  rowHover: string;
  rowHoverText: string;
  highlight: string;
  pill: string;
  pillText: string;
  cardHoverBorder: string;
  cardHoverBg: string;
  cardChevron: string;
  fieldMarker: string;
  fieldMarkerSecondary: string;
  sharedChip: string;
};

export const areaAccent: Record<SchemaArea, AreaAccent> = {
  presets: {
    icon: "text-indigo-600",
    iconSection: "text-indigo-500",
    iconBg: "bg-indigo-50 text-indigo-600",
    navActive:
      "rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-100 ring-inset",
    navInactive:
      "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700",
    link: "text-indigo-600 hover:text-indigo-700",
    linkRing: "text-indigo-600 ring-indigo-100 hover:bg-indigo-50",
    linkRingHover: "hover:text-indigo-700",
    button: "bg-indigo-600 hover:bg-indigo-700",
    focus: "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
    searchFocus: "focus:ring-indigo-500/60",
    facetSelected: "font-medium text-indigo-600 before:block before:bg-indigo-500",
    facetShowMore: "text-indigo-600",
    rowHover: "hover:bg-indigo-50",
    rowHoverText: "group-hover/col:text-indigo-700 group-hover/ac:text-indigo-700",
    highlight: "bg-indigo-50/70",
    pill: "bg-indigo-100",
    pillText: "text-indigo-700",
    cardHoverBorder: "hover:border-indigo-300",
    cardHoverBg: "hover:bg-indigo-50/40",
    cardChevron: "bg-indigo-100 text-indigo-700",
    fieldMarker: "text-indigo-700",
    fieldMarkerSecondary: "text-indigo-500",
    sharedChip: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 ring-inset",
  },
  icons: {
    icon: "text-sky-600",
    iconSection: "text-sky-500",
    iconBg: "bg-sky-50 text-sky-600",
    navActive:
      "rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 ring-1 ring-sky-100 ring-inset",
    navInactive:
      "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700",
    link: "text-sky-600 hover:text-sky-700",
    linkRing: "text-sky-600 ring-sky-100 hover:bg-sky-50",
    linkRingHover: "hover:text-sky-700",
    button: "bg-sky-600 hover:bg-sky-700",
    focus: "focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30",
    searchFocus: "focus:ring-sky-500/60",
    facetSelected: "font-medium text-sky-600 before:block before:bg-sky-500",
    facetShowMore: "text-sky-600",
    rowHover: "hover:bg-sky-50",
    rowHoverText: "group-hover/col:text-sky-700 group-hover/ac:text-sky-700",
    highlight: "bg-sky-50/70",
    pill: "bg-sky-100",
    pillText: "text-sky-700",
    cardHoverBorder: "hover:border-sky-300",
    cardHoverBg: "hover:bg-sky-50/40",
    cardChevron: "bg-sky-100 text-sky-700",
    fieldMarker: "text-sky-700",
    fieldMarkerSecondary: "text-sky-500",
    sharedChip: "bg-sky-50 text-sky-700 ring-1 ring-sky-100 ring-inset",
  },
  fields: {
    icon: "text-emerald-600",
    iconSection: "text-emerald-500",
    iconBg: "bg-emerald-50 text-emerald-600",
    navActive:
      "rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100 ring-inset",
    navInactive:
      "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700",
    link: "text-emerald-600 hover:text-emerald-700",
    linkRing: "text-emerald-700 ring-emerald-100 hover:bg-emerald-50",
    linkRingHover: "hover:text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700",
    focus: "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
    searchFocus: "focus:ring-emerald-500/60",
    facetSelected: "font-medium text-emerald-600 before:block before:bg-emerald-500",
    facetShowMore: "text-emerald-600",
    rowHover: "hover:bg-emerald-50",
    rowHoverText: "group-hover/col:text-emerald-700 group-hover/ac:text-emerald-700",
    highlight: "bg-emerald-50/70",
    pill: "bg-emerald-100",
    pillText: "text-emerald-700",
    cardHoverBorder: "hover:border-emerald-300",
    cardHoverBg: "hover:bg-emerald-50/40",
    cardChevron: "bg-emerald-100 text-emerald-700",
    fieldMarker: "text-emerald-700",
    fieldMarkerSecondary: "text-emerald-500",
    sharedChip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 ring-inset",
  },
  translations: {
    icon: "text-amber-600",
    iconSection: "text-amber-500",
    iconBg: "bg-amber-50 text-amber-600",
    navActive:
      "rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-100 ring-inset",
    navInactive:
      "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-amber-50 hover:text-amber-700",
    link: "text-amber-600 hover:text-amber-700",
    linkRing: "text-amber-600 ring-amber-100 hover:bg-amber-50",
    linkRingHover: "hover:text-amber-700",
    button: "bg-amber-600 hover:bg-amber-700",
    focus: "focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30",
    searchFocus: "focus:ring-amber-500/60",
    facetSelected: "font-medium text-amber-600 before:block before:bg-amber-500",
    facetShowMore: "text-amber-600",
    rowHover: "hover:bg-amber-50",
    rowHoverText: "group-hover/col:text-amber-700 group-hover/ac:text-amber-700",
    highlight: "bg-amber-50/70",
    pill: "bg-amber-100",
    pillText: "text-amber-700",
    cardHoverBorder: "hover:border-amber-300",
    cardHoverBg: "hover:bg-amber-50/40",
    cardChevron: "bg-amber-100 text-amber-700",
    fieldMarker: "text-amber-700",
    fieldMarkerSecondary: "text-amber-500",
    sharedChip: "bg-amber-50 text-amber-700 ring-1 ring-amber-100 ring-inset",
  },
};

export function areaNavClass(area: SchemaArea, active: boolean): string {
  return active ? areaAccent[area].navActive : areaAccent[area].navInactive;
}

export function areaLinkClass(area: SchemaArea): string {
  return `font-medium ${areaAccent[area].link} transition hover:underline`;
}

export function areaSourceLinkClass(area: SchemaArea): string {
  return `${areaAccent[area].linkRing} ${areaAccent[area].linkRingHover}`;
}
