import { clsx } from "clsx";

export type SchemaArea = "presets" | "icons" | "fields" | "translations";

const areaTitles: Record<SchemaArea, string> = {
  presets: "Presets",
  icons: "Icons",
  fields: "Fields",
  translations: "Translations",
};

/** Distinct icons for each schema browsing area — reused in nav and cross-links. */
export function AreaIcon({
  area,
  className,
}: {
  area: SchemaArea;
  className?: string;
}) {
  const cn = clsx("shrink-0", className);
  switch (area) {
    case "presets":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={cn}>
          <title>{areaTitles.presets}</title>
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
      );
    case "icons":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={cn}>
          <title>{areaTitles.icons}</title>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth={1.6} />
          <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
          <path
            d="M3 15l4.5-4 3 3 5.5-6 6 7"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "fields":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={cn}>
          <title>{areaTitles.fields}</title>
          <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth={1.6} />
          <path
            d="M8 8h8M8 12h8M8 16h5"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </svg>
      );
    case "translations":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={cn}>
          <title>{areaTitles.translations}</title>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.6} />
          <path
            d="M3 12h18M12 3c2.5 2.8 3.8 6.2 3.8 9s-1.3 6.2-3.8 9M12 3c-2.5 2.8-3.8 6.2-3.8 9s1.3 6.2 3.8 9"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function areaLabel(area: SchemaArea): string {
  return areaTitles[area];
}

/** Inline label with the area icon — for headings, facets, and filter pills. */
export function AreaLabel({
  area,
  children,
  className,
  iconClassName,
}: {
  area: SchemaArea;
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5", className)}>
      <AreaIcon area={area} className={clsx("h-3.5 w-3.5 shrink-0", iconClassName)} />
      <span>{children}</span>
    </span>
  );
}
