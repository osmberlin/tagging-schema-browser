/** Violet accent reserved for comparison / non-release data only. */
export const comparisonAccent = {
  navActive:
    "rounded-lg bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 ring-1 ring-violet-200 ring-inset",
  navInactive:
    "rounded-lg px-3 py-1.5 text-sm font-medium text-violet-600 transition hover:bg-violet-50 hover:text-violet-700",
  navIndicatorBg: "bg-violet-50",
  navIndicatorRing: "ring-violet-200",
  navIndicatorText: "text-violet-700",
  badge: "bg-violet-100 text-violet-700",
  link: "text-violet-600 hover:text-violet-700",
  text: "text-violet-700",
  textMuted: "text-violet-400",
  textFaint: "text-violet-300",
  button: "bg-violet-600 hover:bg-violet-700",
  rowHover: "hover:bg-violet-50",
  dot: "bg-violet-500",
} as const;

export function comparisonNavClass(active: boolean): string {
  return active ? comparisonAccent.navActive : comparisonAccent.navInactive;
}
