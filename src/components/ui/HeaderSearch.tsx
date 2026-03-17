import { Input } from "@/components/ui/Input";
import { useEffect, useMemo, useState } from "react";

export const PAGE_SEARCH_INPUT_ID = "page-search-input";

function SearchIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
      />
    </svg>
  );
}

export function HeaderSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [modifierLabel, setModifierLabel] = useState("Ctrl");
  const shortcutLabel = useMemo(() => `${modifierLabel} K`, [modifierLabel]);

  useEffect(() => {
    setModifierLabel(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? "⌘" : "Ctrl");
  }, []);

  return (
    <div className="hidden md:block md:max-w-md md:flex-auto">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
          <SearchIcon className="h-5 w-5" />
        </span>
        <Input
          id={PAGE_SEARCH_INPUT_ID}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-full border-zinc-900/10 bg-white pl-10 pr-20 shadow-none ring-1 ring-zinc-900/10 hover:ring-zinc-900/20 focus:ring-2 focus:ring-zinc-900/20 dark:border-white/10 dark:bg-white/5 dark:ring-white/10 dark:hover:ring-white/20"
        />
        <kbd className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-2xs text-zinc-400 dark:text-zinc-500">
          {shortcutLabel}
        </kbd>
      </div>
    </div>
  );
}
