import { ICON_SUPPLIERS } from '@/components/PageIcons/iconRegistry'
import { AreaLabel, type SchemaArea } from '@/components/ui/areaIcons'
import { SidebarSection } from '@/components/ui/Sidebar'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent } from '@/theme/areaAccent'
import { cn } from '@/utils/tw'
import { useIconFacetMeta, useIconFacetState } from './useIconFacetState'
import { useIconSearch } from './useIconSearch'

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
            ? areaAccent.icons.facetSelected
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

export function IconFacetSidebar() {
  const { data } = useSchema()
  const { icons } = useIconSearch(data?.presets ?? [], data?.fields ?? {})
  const [state, setState] = useIconFacetState()
  const meta = useIconFacetMeta(icons)

  return (
    <div className="mt-4 flex flex-col gap-4">
      <SidebarSection title="Usage" area="icons">
        <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
          <FacetButton
            active={state.i_usage === 'all'}
            label="All"
            count={icons.length}
            onClick={() => setState({ i_usage: 'all' })}
          />
          <FacetButton
            active={state.i_usage === 'any'}
            label="Used by presets or options"
            labelArea="presets"
            count={meta.anyCount}
            onClick={() => setState({ i_usage: 'any' })}
          />
          <FacetButton
            active={state.i_usage === 'presets'}
            label="Used by presets"
            labelArea="presets"
            count={meta.presetsCount}
            onClick={() => setState({ i_usage: 'presets' })}
          />
          <FacetButton
            active={state.i_usage === 'options'}
            label="Used by options"
            labelArea="fields"
            count={meta.optionsCount}
            onClick={() => setState({ i_usage: 'options' })}
          />
          <FacetButton
            active={state.i_usage === 'unused'}
            label="Unused"
            count={meta.unusedCount}
            onClick={() => setState({ i_usage: 'unused' })}
          />
        </ul>
      </SidebarSection>

      <SidebarSection title="Supplier">
        <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
          <FacetButton
            active={state.i_supplier === 'all'}
            label="All suppliers"
            count={icons.length}
            onClick={() => setState({ i_supplier: 'all' })}
          />
          {ICON_SUPPLIERS.map((prefix) => (
            <FacetButton
              key={prefix}
              active={state.i_supplier === prefix}
              label={prefix === 'pinhead' ? 'pinhead (on demand)' : prefix}
              count={meta.supplierCounts.get(prefix) ?? 0}
              onClick={() => setState({ i_supplier: prefix })}
            />
          ))}
        </ul>
      </SidebarSection>

      <SidebarSection title="Asset status">
        <ul className="mt-1 space-y-1 border-l-2 border-slate-100">
          <FacetButton
            active={state.i_hasSvg === 'all'}
            label="All"
            count={icons.length}
            onClick={() => setState({ i_hasSvg: 'all' })}
          />
          <FacetButton
            active={state.i_hasSvg === 'with'}
            label="With SVG"
            count={meta.withSvg}
            onClick={() => setState({ i_hasSvg: 'with' })}
          />
          <FacetButton
            active={state.i_hasSvg === 'missing' && state.i_usage === 'presets'}
            label="Missing preset icons"
            labelArea="presets"
            count={meta.missingPresetRef}
            onClick={() => setState({ i_hasSvg: 'missing', i_usage: 'presets' })}
          />
          <FacetButton
            active={state.i_hasSvg === 'missing' && state.i_usage === 'all'}
            label="Missing SVG (all)"
            count={meta.missingSvg}
            onClick={() => setState({ i_hasSvg: 'missing', i_usage: 'all' })}
          />
        </ul>
      </SidebarSection>
    </div>
  )
}
