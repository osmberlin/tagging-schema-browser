import { clsx } from "clsx";

/** Mauve for outbound links and buttons (GitHub, upstream repos, test URLs, etc.). */
export const externalAccent = {
  link: "text-mauve-600 hover:text-mauve-700",
  linkUnderline:
    "font-medium text-mauve-600 underline decoration-mauve-300/70 underline-offset-2 hover:text-mauve-700 hover:decoration-mauve-400",
  pill: "text-mauve-600 ring-mauve-100 hover:bg-mauve-50",
  button:
    "rounded-lg bg-mauve-50 px-3 py-1.5 text-xs font-medium text-mauve-700 transition hover:bg-mauve-100",
} as const;

export function externalLinkClass(...extra: (string | undefined)[]): string {
  return clsx(externalAccent.linkUnderline, ...extra);
}

export function externalPillClass(...extra: (string | undefined)[]): string {
  return clsx(
    "rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
    externalAccent.pill,
    ...extra,
  );
}
