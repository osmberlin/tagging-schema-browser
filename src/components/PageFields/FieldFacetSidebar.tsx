import { AreaLabel, type SchemaArea } from '@/components/ui/areaIcons'
import { SidebarSection } from '@/components/ui/Sidebar'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { fieldTypeHint } from '@/utils/fieldTypes'
import { cn } from '@/utils/tw'
import { useFieldFacetMeta, useFieldFacetState } from './useFieldFacetState'
import { useFieldSearch } from './useFieldSearch'

function FacetButton({
  active,
  label,
  labelArea,
  count,
  onClick,
}: {
  active: boolean
  label: string
  labelArea?: SchemaArea
  count: number
  onClick: () => void
}) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full items-center justify-between gap-2 py-0.5 pl-4 text-left text-sm transition before:pointer-events-none before:absolute before:top-1/2 before:-left-1 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full',
          active
            ? areaAccent.fields.facetSelected
            : 'text-slate-600 before:hidden before:bg-slate-300 hover:text-slate-900 hover:before:block',
        )}
      >
        <span className="truncate">
          {labelArea ? (
            <AreaLabel area={labelArea} iconClassName="h-3 w-3">
              {label}
            </AreaLabel>
          ) : (
            label
          )}
        </span>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          {count}
        </span>
      </button>
    </li>
  )
}

export function FieldFacetSidebar() {
  const { data } = useSchema()
  const { fields, types } = useFieldSearch(
    data?.fields ?? {},
    data?.presets ?? [],
    data?.fieldTranslations ?? {},
  )
  const [state, setState] = useFieldFacetState()
  const meta = useFieldFacetMeta(fields)

  return (
    <div className="mt-4 flex flex-col gap-4">
      <SidebarSection title="Usage" area="fields">
        <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
          <FacetButton
            active={state.f_usage === 'all'}
            label="All"
            count={fields.length}
            onClick={() => setState({ f_usage: 'all' })}
          />
          <FacetButton
            active={state.f_usage === 'used'}
            label="Used by presets"
            labelArea="presets"
            count={meta.usedCount}
            onClick={() => setState({ f_usage: 'used' })}
          />
          <FacetButton
            active={state.f_usage === 'unused'}
            label="Unused"
            count={meta.unusedCount}
            onClick={() => setState({ f_usage: 'unused' })}
          />
        </ul>
      </SidebarSection>

      <SidebarSection title="Icon consistency" area="icons">
        <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
          <FacetButton
            active={state.f_iconMismatch === 'all'}
            label="All"
            count={fields.length}
            onClick={() => setState({ f_iconMismatch: 'all' })}
          />
          <FacetButton
            active={state.f_iconMismatch === 'mismatch'}
            label="Option ↔ preset mismatch"
            labelArea="presets"
            count={meta.mismatchCount}
            onClick={() => setState({ f_iconMismatch: 'mismatch' })}
          />
        </ul>
      </SidebarSection>

      <SidebarSection title="Type">
        <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
          <FacetButton
            active={state.f_type === 'all'}
            label="All"
            count={fields.length}
            onClick={() => setState({ f_type: 'all' })}
          />
          {types.map((type) => (
            <FacetButton
              key={type}
              active={state.f_type === type}
              label={fieldTypeHint(type) ? `${type} — ${fieldTypeHint(type)}` : type}
              count={meta.typeCounts.get(type) ?? 0}
              onClick={() => setState({ f_type: type })}
            />
          ))}
        </ul>
      </SidebarSection>
    </div>
  )
}
