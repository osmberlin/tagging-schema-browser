import type { SchemaArea } from '@/components/ui/areaIcons'
import { Input } from '@/components/ui/Input'
import { Kbd, modLabel } from '@/components/ui/Kbd'
import { areaAccent } from '@/theme/areaAccent'

export const PAGE_SEARCH_INPUT_ID = 'page-search-input'

function SearchIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
      />
    </svg>
  )
}

export function HeaderSearch({
  value,
  onChange,
  placeholder,
  area = 'presets',
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  area?: SchemaArea
}) {
  return (
    <div className="w-full">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <SearchIcon className="h-4.5 w-4.5" />
        </span>
        <Input
          id={PAGE_SEARCH_INPUT_ID}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          area={area}
          className={`h-10 rounded-lg pr-12 pl-11 hover:border-slate-400 ${areaAccent[area].focus}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-2.5 hidden items-center sm:flex">
          <Kbd>{`${modLabel()}K`}</Kbd>
        </span>
      </div>
    </div>
  )
}
