import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Fragment, type ReactNode, useState } from 'react'
import { fieldFacetDefaults } from '@/components/PageFields/useFieldFacetState'
import { iconFacetDefaults } from '@/components/PageIcons/useIconFacetState'
import {
  type AuthoredListEntry,
  type AuthoredPresetSource,
  type FieldListKey,
  type FieldOmission,
  formatFieldOmission,
  loadAuthoredPresetSource,
} from '@/components/PagePresets/authoredPresetSource'
import { presetIdFromRef } from '@/components/PagePresets/presetFieldInheritance'
import {
  type KeySortMode,
  sortObjectEntries,
  TAG_OBJECT_KEYS,
} from '@/components/PagePresets/presetKeyOrder'
import {
  getInheritedLabels,
  resolveLabelSourcePresetId,
} from '@/components/PagePresets/presetLabelInheritance'
import { AreaIcon, type SchemaArea } from '@/components/ui/areaIcons'
import { CountPill } from '@/components/ui/CountPill'
import { useSchema } from '@/hooks/useSchema'
import { areaAccent, areaSourceLinkClass } from '@/theme/areaAccent'
import { externalAccent } from '@/theme/externalAccent'
import { isFieldCrossRefKey, resolveFieldRefDisplay } from '@/utils/fieldRefDisplay'
import { githubFileUrl, schemaRepoPath } from '@/utils/githubFileUrl'
import { osmWikiKeyUrl, osmWikiTagUrl, osmWikiUrlForTag } from '@/utils/osmWikiUrl'
import { formatPrerequisiteTag, parsePrerequisiteTag } from '@/utils/prerequisiteTag'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset, RawPresets } from '@/utils/types'
import { presetSearchDefaults } from './useSearchState'

const REF_REGEX = /^\{(.+)\}$/

type RefInfo = {
  kind: 'field' | 'preset'
  id: string
  repoPath: string
}

function presetSearchable(rawPresets: RawPresets, id: string): boolean {
  return rawPresets[id]?.searchable !== false
}

function refInFieldList(value: string, rawPresets: RawPresets): RefInfo {
  const m = value.match(REF_REGEX)
  if (m) {
    const id = m[1]
    return {
      kind: 'preset',
      id,
      repoPath: schemaRepoPath('preset', id, { searchable: presetSearchable(rawPresets, id) }),
    }
  }
  return { kind: 'field', id: value, repoPath: schemaRepoPath('field', value) }
}

function isScalar(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function GithubLink({ href, label = 'GitHub' }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(sourceActionPillClass, externalAccent.pill)}
      title="Open in id-tagging-schema repository"
    >
      {label} ↗
    </a>
  )
}

function WikiLink({
  href,
  label = 'Wiki',
  title = 'Open on OpenStreetMap Wiki',
}: {
  href: string
  label?: string
  title?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        sourceActionPillClass,
        'text-sky-700 ring-sky-100 hover:bg-sky-50 hover:text-sky-800 hover:ring-sky-200',
      )}
      title={title}
    >
      {label} ↗
    </a>
  )
}

function SourceActionGroup({ children }: { children: ReactNode }) {
  return <span className="inline-flex shrink-0 items-center gap-1 self-center">{children}</span>
}

function IconValueSourceActions({ iconName }: { iconName: string }) {
  const { data } = useSchema()
  const presetCount = data?.indices.presetsByIcon.get(iconName)?.length ?? 0
  const optionUsages = data?.indices.optionIconUsagesByIcon.get(iconName) ?? []
  const fieldCount = new Set(optionUsages.map((usage) => usage.fieldId)).size
  const usageCount = presetCount + optionUsages.length

  return (
    <SourceActionGroup>
      <Link
        to="/icons"
        search={(prev) => ({
          ...iconFacetDefaults,
          dataUrl: prev.dataUrl ?? '',
          locale: prev.locale ?? '',
          i_q: iconName,
          i_usage: 'all',
        })}
        title={`Browse icon “${iconName}” (${usageCount} usage${usageCount === 1 ? '' : 's'})`}
        className={cn(sourceActionPillClass, areaSourceLinkClass('icons'))}
      >
        <AreaIcon area="icons" className="h-3 w-3" />
        Icons
        {usageCount > 0 ? (
          <CountPill className={`${areaAccent.icons.pill} ${areaAccent.icons.pillText}`}>
            {usageCount}
          </CountPill>
        ) : null}
      </Link>
      {presetCount > 0 ? (
        <Link
          to="/"
          search={(prev) => ({
            ...presetSearchDefaults,
            dataUrl: prev.dataUrl ?? '',
            locale: prev.locale ?? '',
            iconName: [iconName],
            page: 1,
          })}
          title={`Show ${presetCount} preset${presetCount === 1 ? '' : 's'} using “${iconName}”`}
          className={cn(sourceActionPillClass, areaSourceLinkClass('presets'))}
        >
          <AreaIcon area="presets" className="h-3 w-3" />
          Presets
          <CountPill className={`${areaAccent.presets.pill} ${areaAccent.presets.pillText}`}>
            {presetCount}
          </CountPill>
        </Link>
      ) : null}
      {fieldCount > 0 ? (
        <Link
          to="/fields"
          search={(prev) => ({
            ...fieldFacetDefaults,
            dataUrl: prev.dataUrl ?? '',
            locale: prev.locale ?? '',
            f_optionIcon: iconName,
          })}
          title={`Show ${fieldCount} field${fieldCount === 1 ? '' : 's'} with options using “${iconName}”`}
          className={cn(sourceActionPillClass, areaSourceLinkClass('fields'))}
        >
          <AreaIcon area="fields" className="h-3 w-3" />
          Fields
          <CountPill className={`${areaAccent.fields.pill} ${areaAccent.fields.pillText}`}>
            {fieldCount}
          </CountPill>
        </Link>
      ) : null}
    </SourceActionGroup>
  )
}

const sourceActionPillClass =
  'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset transition-colors'

function SourceAreaLink({
  area,
  to,
  params,
  search,
  label,
  title,
}: {
  area: SchemaArea
  to: string
  params?: { _splat: string }
  search: (prev: { dataUrl?: string; locale?: string }) => Record<string, unknown>
  label: string
  title: string
}) {
  const toneClass = areaSourceLinkClass(area)

  return (
    <Link
      to={to}
      params={params}
      search={search}
      title={title}
      className={cn(sourceActionPillClass, toneClass)}
    >
      <AreaIcon area={area} className="h-3 w-3" />
      {label}
    </Link>
  )
}

function JsonLine({
  level,
  children,
  trailingComma,
  wrap = true,
}: {
  level: number
  children: ReactNode
  trailingComma?: boolean
  wrap?: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-baseline gap-x-1.5 gap-y-1',
        wrap ? 'flex-wrap' : 'flex-nowrap',
      )}
      style={{ paddingLeft: level > 0 ? `${level * 1.25}rem` : undefined }}
    >
      {children}
      {trailingComma ? <span className="text-slate-500">,</span> : null}
    </div>
  )
}

function JsonScalar({ value }: { value: string | number | boolean | null }) {
  if (value === null) return <span className="text-slate-400">null</span>
  if (typeof value === 'boolean') return <span className="text-purple-700">{String(value)}</span>
  if (typeof value === 'number') return <span className="text-purple-700">{value}</span>
  return <span className="text-emerald-800">"{value}"</span>
}

function JsonKey({ name }: { name: string }) {
  return <span className="text-rose-800">"{name}"</span>
}

type JsonRootKind = 'field' | 'preset'

export type PresetSourceTreeProps = {
  presetId: string
  raw: Record<string, unknown>
  preset?: DenormalizedPreset
  presets?: DenormalizedPreset[]
  sourceKind?: JsonRootKind
}

type HostPresetContext = {
  /** Preset whose source JSON is being rendered. */
  hostPresetId: string
  rawPresets: RawPresets
  /** Verified authored field lists of the host preset; null shows the expanded dist lists. */
  source: AuthoredPresetSource | null
  /** When rendering a field's source JSON, the field id being viewed. */
  sourceFieldId?: string
}

type PresetRefEntry = Extract<AuthoredListEntry, { kind: 'presetRef' }>

/** Verdicts of every preset a referenced field passes through, innermost first. */
type OmissionChain = ReadonlyArray<ReadonlyMap<string, FieldOmission | undefined>>

function useAuthoredPresetSource(presetId: string, enabled: boolean) {
  const { dataUrl, rawPresets, fields } = useSchema()
  return useQuery({
    queryKey: ['authoredPresetSource', dataUrl, presetId],
    queryFn: () => loadAuthoredPresetSource({ dataUrl, presetId, rawPresets, allFields: fields }),
    enabled: enabled && Boolean(dataUrl) && Boolean(rawPresets[presetId]),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })
}

/** Inherited name / terms / aliases when `name` references another preset. */
function PresetRefInheritedLabels({
  labels,
  level,
  trailingComma,
}: {
  labels: { name: string; terms: string[]; aliases: string[] }
  level: number
  trailingComma?: boolean
}) {
  const hasTerms = labels.terms.length > 0
  const hasAliases = labels.aliases.length > 0

  return (
    <>
      <JsonLine level={level} trailingComma={hasTerms || hasAliases || trailingComma}>
        <JsonKey name="name" />
        <span className="text-slate-500">: </span>
        <JsonScalar value={labels.name} />
      </JsonLine>
      {hasTerms ? (
        <Fragment>
          <JsonLine level={level}>
            <JsonKey name="terms" />
            <span className="text-slate-500">: [</span>
          </JsonLine>
          {labels.terms.map((term, i) => (
            <JsonLine key={term} level={level + 1} trailingComma={i < labels.terms.length - 1}>
              <JsonScalar value={term} />
            </JsonLine>
          ))}
          <JsonLine level={level} trailingComma={hasAliases || trailingComma}>
            <span className="text-slate-500">]</span>
          </JsonLine>
        </Fragment>
      ) : null}
      {hasAliases ? (
        <Fragment>
          <JsonLine level={level}>
            <JsonKey name="aliases" />
            <span className="text-slate-500">: [</span>
          </JsonLine>
          {labels.aliases.map((alias, i) => (
            <JsonLine key={alias} level={level + 1} trailingComma={i < labels.aliases.length - 1}>
              <JsonScalar value={alias} />
            </JsonLine>
          ))}
          <JsonLine level={level} trailingComma={trailingComma}>
            <span className="text-slate-500">]</span>
          </JsonLine>
        </Fragment>
      ) : null}
    </>
  )
}

function NameRefDisclosure({
  nameRef,
  level,
  dataUrl,
  trailingComma,
}: {
  nameRef: string
  level: number
  dataUrl: string
  trailingComma?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { rawPresets, presetsById } = useSchema()
  const sourceId = resolveLabelSourcePresetId(nameRef, rawPresets)
  const labels = getInheritedLabels(nameRef, rawPresets, presetsById)
  const repoPath = sourceId
    ? schemaRepoPath('preset', sourceId, { searchable: presetSearchable(rawPresets, sourceId) })
    : ''

  return (
    <>
      <JsonLine level={level} trailingComma={!open && trailingComma}>
        <JsonKey name="name" />
        <span className="text-slate-500">: </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex min-w-0 items-center gap-1 text-left ${areaAccent.presets.linkRingHover}`}
        >
          <span aria-hidden className="w-3 shrink-0 text-slate-400">
            {open ? '▾' : '▸'}
          </span>
          <span className="text-emerald-800">"{nameRef}"</span>
        </button>
        {repoPath ? (
          <>
            <code className="truncate text-[10px] text-slate-400">{repoPath}</code>
            <SourceActionGroup>
              <GithubLink href={githubFileUrl(dataUrl, repoPath)} />
              <SourceAreaLink
                area="presets"
                to="/preset/$"
                params={{ _splat: sourceId ?? '' }}
                search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
                label="Preset"
                title={`Open preset "${sourceId}"`}
              />
            </SourceActionGroup>
          </>
        ) : null}
      </JsonLine>
      {open ? (
        labels ? (
          <PresetRefInheritedLabels
            labels={labels}
            level={level + 1}
            trailingComma={trailingComma}
          />
        ) : (
          <JsonLine level={level + 1} trailingComma={trailingComma}>
            <span className="text-slate-400 italic">{'/* not loaded */'}</span>
          </JsonLine>
        )
      ) : null}
    </>
  )
}

function RefDisclosure({
  label,
  refInfo,
  level,
  dataUrl,
  trailingComma,
  parentKey,
  host,
  refEntry,
  omissionChain = [],
  ancestorPresetIds,
  sortMode = 'alpha',
}: {
  label: string
  refInfo: RefInfo
  level: number
  dataUrl: string
  trailingComma?: boolean
  parentKey?: string
  host: HostPresetContext
  refEntry?: PresetRefEntry
  omissionChain?: OmissionChain
  ancestorPresetIds?: string[]
  sortMode?: KeySortMode
}) {
  const [open, setOpen] = useState(false)
  const { fields, rawPresets } = useSchema()
  const fieldListKey = parentKey === 'fields' || parentKey === 'moreFields' ? parentKey : undefined
  const inheritPresetFields = refInfo.kind === 'preset' && fieldListKey
  const resolvedRefEntry =
    refEntry ??
    (inheritPresetFields
      ? host.source?.[fieldListKey]?.find(
          (entry): entry is PresetRefEntry =>
            entry.kind === 'presetRef' && entry.presetRef === label,
        )
      : undefined)
  const expandedRaw =
    refInfo.kind === 'field'
      ? (fields[refInfo.id] as Record<string, unknown> | undefined)
      : (rawPresets[refInfo.id] as Record<string, unknown> | undefined)

  return (
    <>
      <JsonLine level={level} trailingComma={!open && trailingComma}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex min-w-0 items-center gap-1 text-left ${areaAccent.presets.linkRingHover}`}
        >
          <span aria-hidden className="w-3 shrink-0 text-slate-400">
            {open ? '▾' : '▸'}
          </span>
          <span className="text-emerald-800">"{label}"</span>
        </button>
        <code className="truncate text-[10px] text-slate-400">{refInfo.repoPath}</code>
        <SourceActionGroup>
          <GithubLink href={githubFileUrl(dataUrl, refInfo.repoPath)} />
          {refInfo.kind === 'preset' ? (
            <SourceAreaLink
              area="presets"
              to="/preset/$"
              params={{ _splat: refInfo.id }}
              search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
              label="Preset"
              title={`Open preset "${refInfo.id}"`}
            />
          ) : (
            <>
              <SourceAreaLink
                area="fields"
                to="/field/$"
                params={{ _splat: refInfo.id }}
                search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
                label="Field"
                title={`Open field "${refInfo.id}"`}
              />
              <SourceAreaLink
                area="presets"
                to="/"
                search={(prev) => ({
                  ...presetSearchDefaults,
                  dataUrl: prev.dataUrl ?? '',
                  locale: prev.locale ?? '',
                  ...(fieldListKey === 'moreFields'
                    ? { moreFieldIds: [refInfo.id] }
                    : fieldListKey === 'fields'
                      ? { primaryFieldIds: [refInfo.id] }
                      : { fieldIds: [refInfo.id] }),
                  page: 1,
                })}
                label="Presets"
                title="Show presets using this field"
              />
            </>
          )}
        </SourceActionGroup>
      </JsonLine>
      {open ? (
        inheritPresetFields ? (
          resolvedRefEntry ? (
            <ReferencedFieldsTree
              refEntry={resolvedRefEntry}
              fieldListKey={fieldListKey}
              level={level + 1}
              dataUrl={dataUrl}
              trailingComma={trailingComma}
              host={host}
              omissionChain={omissionChain}
              ancestorPresetIds={ancestorPresetIds ?? [host.hostPresetId]}
            />
          ) : (
            <JsonLine level={level + 1} trailingComma={trailingComma}>
              <span className="text-slate-400 italic">{'/* preset not loaded */'}</span>
            </JsonLine>
          )
        ) : expandedRaw ? (
          <>
            <JsonNode
              value={expandedRaw}
              level={level + 1}
              dataUrl={dataUrl}
              trailingComma={trailingComma}
              host={host}
              sortMode={refInfo.kind === 'preset' ? 'preset' : sortMode}
              jsonRootKind={refInfo.kind === 'field' ? 'field' : 'preset'}
            />
          </>
        ) : (
          <JsonLine level={level + 1} trailingComma={trailingComma}>
            <span className="text-slate-400 italic">{'/* not loaded */'}</span>
          </JsonLine>
        )
      ) : null}
    </>
  )
}

/** Field from a preset ref that is not inherited, with reason. */
function OmittedInheritedFieldLine({
  fieldId,
  omission,
  level,
  dataUrl,
  trailingComma,
  host,
}: {
  fieldId: string
  omission: FieldOmission
  level: number
  dataUrl: string
  trailingComma?: boolean
  host: HostPresetContext
}) {
  const refInfo = refInFieldList(fieldId, host.rawPresets)
  if (!refInfo) return null

  const reason = formatFieldOmission(fieldId, omission)

  return (
    <JsonLine level={level} trailingComma={trailingComma}>
      <span className="text-slate-400 line-through">"{fieldId}"</span>
      <code className="truncate text-[10px] text-slate-300">{refInfo.repoPath}</code>
      <span className="text-[10px] text-amber-700" title={reason}>
        {'/* omitted: '}
        {reason}
        {' */'}
      </span>
      <SourceActionGroup>
        <GithubLink href={githubFileUrl(dataUrl, refInfo.repoPath)} />
        <SourceAreaLink
          area="fields"
          to="/field/$"
          params={{ _splat: refInfo.id }}
          search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
          label="Field"
          title={`Open field "${refInfo.id}"`}
        />
      </SourceActionGroup>
    </JsonLine>
  )
}

/**
 * Fields behind an opened `{preset}` reference. The referenced preset's own source file groups
 * them by its nested references; until (or unless) it loads, they are listed flat.
 */
function ReferencedFieldsTree({
  refEntry,
  fieldListKey,
  level,
  dataUrl,
  trailingComma,
  host,
  omissionChain,
  ancestorPresetIds,
}: {
  refEntry: PresetRefEntry
  fieldListKey: FieldListKey
  level: number
  dataUrl: string
  trailingComma?: boolean
  host: HostPresetContext
  omissionChain: OmissionChain
  ancestorPresetIds: string[]
}) {
  const referencedSource = useAuthoredPresetSource(refEntry.presetId, true).data
  const entries: AuthoredListEntry[] =
    referencedSource?.[fieldListKey] ??
    refEntry.fields.map((field) => ({ kind: 'field', fieldId: field.fieldId }))
  const chain: OmissionChain = [
    new Map(refEntry.fields.map((field) => [field.fieldId, field.omission])),
    ...omissionChain,
  ]

  if (entries.length === 0) {
    return (
      <JsonLine level={level} trailingComma={trailingComma}>
        <span className="text-slate-400 italic">{'/* no fields on referenced preset */'}</span>
      </JsonLine>
    )
  }

  return (
    <>
      {entries.map((entry, index) => {
        const entryTrailingComma = index < entries.length - 1 ? true : trailingComma

        if (entry.kind === 'presetRef') {
          if (ancestorPresetIds.includes(entry.presetId) || entry.presetId === refEntry.presetId) {
            return (
              <JsonLine
                key={`${fieldListKey}-${entry.presetRef}-cyclic`}
                level={level}
                trailingComma={entryTrailingComma}
              >
                <span className="text-slate-400 line-through">"{entry.presetRef}"</span>
                <span className="text-[10px] text-amber-700">
                  {'/* cyclic preset ref — already expanded above */'}
                </span>
              </JsonLine>
            )
          }

          return (
            <RefDisclosure
              key={`${fieldListKey}-${entry.presetRef}`}
              label={entry.presetRef}
              refInfo={refInFieldList(entry.presetRef, host.rawPresets)}
              level={level}
              dataUrl={dataUrl}
              trailingComma={entryTrailingComma}
              parentKey={fieldListKey}
              host={host}
              refEntry={entry}
              omissionChain={chain}
              ancestorPresetIds={[...ancestorPresetIds, refEntry.presetId]}
            />
          )
        }

        const omission = chain.map((verdicts) => verdicts.get(entry.fieldId)).find(Boolean)
        if (omission) {
          return (
            <OmittedInheritedFieldLine
              key={`${fieldListKey}-${entry.fieldId}-omitted`}
              fieldId={entry.fieldId}
              omission={omission}
              level={level}
              dataUrl={dataUrl}
              trailingComma={entryTrailingComma}
              host={host}
            />
          )
        }

        return (
          <JsonNode
            key={`${fieldListKey}-${entry.fieldId}`}
            value={entry.fieldId}
            level={level}
            parentKey={fieldListKey}
            dataUrl={dataUrl}
            trailingComma={entryTrailingComma}
            host={host}
          />
        )
      })}
    </>
  )
}

function JsonNode({
  value,
  level,
  parentKey,
  dataUrl,
  trailingComma,
  host,
  sortMode = 'alpha',
  jsonRootKind = 'preset',
}: {
  value: unknown
  level: number
  parentKey?: string
  dataUrl: string
  trailingComma?: boolean
  host: HostPresetContext
  sortMode?: KeySortMode
  jsonRootKind?: JsonRootKind
}) {
  if (isScalar(value)) {
    if (typeof value === 'string' && (parentKey === 'fields' || parentKey === 'moreFields')) {
      const fieldRef = refInFieldList(value, host.rawPresets)
      if (fieldRef) {
        return (
          <RefDisclosure
            label={value}
            refInfo={fieldRef}
            level={level}
            dataUrl={dataUrl}
            trailingComma={trailingComma}
            parentKey={parentKey}
            host={host}
            sortMode={sortMode}
          />
        )
      }
    }
    return (
      <JsonLine level={level} trailingComma={trailingComma}>
        <JsonScalar value={value} />
      </JsonLine>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">[]</span>
        </JsonLine>
      )
    }
    return (
      <>
        <JsonLine level={level}>
          <span className="text-slate-500">[</span>
        </JsonLine>
        {value.map((item, i) => (
          <JsonNode
            key={typeof item === 'string' ? item : `item-${i}-${JSON.stringify(item)}`}
            value={item}
            level={level + 1}
            parentKey={parentKey}
            dataUrl={dataUrl}
            trailingComma={i < value.length - 1}
            host={host}
            sortMode={sortMode}
            jsonRootKind={jsonRootKind}
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">]</span>
        </JsonLine>
      </>
    )
  }

  if (typeof value === 'object' && value !== null) {
    const entries = sortObjectEntries(Object.entries(value as Record<string, unknown>), {
      parentKey,
      sortMode,
    })
    if (entries.length === 0) {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">{'{}'}</span>
        </JsonLine>
      )
    }
    return (
      <>
        <JsonLine level={level}>
          <span className="text-slate-500">{'{'}</span>
        </JsonLine>
        {entries.map(([key, child], i) => (
          <JsonObjectEntry
            key={key}
            keyName={key}
            value={child}
            level={level + 1}
            parentKey={parentKey}
            dataUrl={dataUrl}
            trailingComma={i < entries.length - 1}
            host={host}
            sortMode={sortMode}
            jsonRootKind={jsonRootKind}
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">{'}'}</span>
        </JsonLine>
      </>
    )
  }

  return (
    <JsonLine level={level} trailingComma={trailingComma}>
      <span className="text-slate-400">undefined</span>
    </JsonLine>
  )
}

function FieldCrossRefLine({
  keyName,
  refDisplay,
  level,
  dataUrl,
  trailingComma,
}: {
  keyName: string
  refDisplay: { ref: string; refFieldId: string; resolved: string }
  level: number
  dataUrl: string
  trailingComma?: boolean
}) {
  const repoPath = schemaRepoPath('field', refDisplay.refFieldId)

  return (
    <JsonLine level={level} trailingComma={trailingComma}>
      <JsonKey name={keyName} />
      <span className="text-slate-500">: </span>
      <JsonScalar value={refDisplay.resolved} />
      <span className="text-[10px] text-slate-400" title="Reference in source JSON">
        ref {refDisplay.ref}
      </span>
      <code className="truncate text-[10px] text-slate-400">{repoPath}</code>
      <SourceActionGroup>
        <GithubLink href={githubFileUrl(dataUrl, repoPath)} />
        <SourceAreaLink
          area="fields"
          to="/field/$"
          params={{ _splat: refDisplay.refFieldId }}
          search={(prev) => ({ dataUrl: prev.dataUrl ?? '', locale: prev.locale ?? '' })}
          label="Field"
          title={`Open field "${refDisplay.refFieldId}"`}
        />
      </SourceActionGroup>
    </JsonLine>
  )
}

function JsonObjectEntry({
  keyName,
  value,
  level,
  parentKey,
  dataUrl,
  trailingComma,
  host,
  sortMode = 'alpha',
  jsonRootKind = 'preset',
}: {
  keyName: string
  value: unknown
  level: number
  parentKey?: string
  dataUrl: string
  trailingComma?: boolean
  host: HostPresetContext
  sortMode?: KeySortMode
  jsonRootKind?: JsonRootKind
}) {
  const { fields, fieldTranslations } = useSchema()

  if (isScalar(value)) {
    if (keyName === 'name' && typeof value === 'string' && presetIdFromRef(value)) {
      return (
        <NameRefDisclosure
          nameRef={value}
          level={level}
          dataUrl={dataUrl}
          trailingComma={trailingComma}
        />
      )
    }
    if (
      jsonRootKind === 'field' &&
      host.sourceFieldId &&
      typeof value === 'string' &&
      isFieldCrossRefKey(keyName)
    ) {
      const refDisplay = resolveFieldRefDisplay(
        host.sourceFieldId,
        keyName,
        value,
        fields,
        fieldTranslations,
      )
      if (refDisplay) {
        return (
          <FieldCrossRefLine
            keyName={keyName}
            refDisplay={refDisplay}
            level={level}
            dataUrl={dataUrl}
            trailingComma={trailingComma}
          />
        )
      }
    }
    if (keyName === 'type' && typeof value === 'string' && jsonRootKind === 'field') {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: </span>
          <JsonScalar value={value} />
          <SourceActionGroup>
            <SourceAreaLink
              area="fields"
              to="/fields"
              search={(prev) => ({
                ...fieldFacetDefaults,
                dataUrl: prev.dataUrl ?? '',
                locale: prev.locale ?? '',
                f_type: value,
              })}
              label="Fields"
              title={`Browse all ${value} fields`}
            />
          </SourceActionGroup>
        </JsonLine>
      )
    }
    if (parentKey && TAG_OBJECT_KEYS.has(parentKey) && typeof value === 'string') {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: </span>
          <JsonScalar value={value} />
          <SourceActionGroup>
            <WikiLink
              href={osmWikiTagUrl(keyName, value)}
              title={`OSM Wiki: ${keyName}=${value}`}
            />
          </SourceActionGroup>
        </JsonLine>
      )
    }
    if (keyName === 'key' && typeof value === 'string' && jsonRootKind === 'field') {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: </span>
          <JsonScalar value={value} />
          <SourceActionGroup>
            <WikiLink href={osmWikiKeyUrl(value)} title={`OSM Wiki key: ${value}`} />
          </SourceActionGroup>
        </JsonLine>
      )
    }
    if (parentKey === 'icons' && typeof value === 'string') {
      return (
        <JsonLine level={level} trailingComma={trailingComma} wrap={false}>
          <JsonKey name={keyName} />
          <span className="shrink-0 text-slate-500">: </span>
          <span className="inline-flex min-w-0 shrink-0 flex-nowrap items-baseline gap-x-1.5">
            <JsonScalar value={value} />
            <IconValueSourceActions iconName={value} />
          </span>
        </JsonLine>
      )
    }
    return (
      <JsonLine level={level} trailingComma={trailingComma}>
        <JsonKey name={keyName} />
        <span className="text-slate-500">: </span>
        <JsonScalar value={value} />
      </JsonLine>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: []</span>
        </JsonLine>
      )
    }
    return (
      <Fragment>
        <JsonLine level={level}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: [</span>
        </JsonLine>
        {value.map((item, i) => (
          <JsonNode
            key={typeof item === 'string' ? item : `item-${i}-${JSON.stringify(item)}`}
            value={item}
            level={level + 1}
            parentKey={keyName}
            dataUrl={dataUrl}
            trailingComma={i < value.length - 1}
            host={host}
            sortMode={sortMode}
            jsonRootKind={jsonRootKind}
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">]</span>
        </JsonLine>
      </Fragment>
    )
  }

  if (typeof value === 'object' && value !== null) {
    if (keyName === 'prerequisiteTag') {
      const tag = parsePrerequisiteTag(value)
      const entries = sortObjectEntries(Object.entries(value as Record<string, unknown>), {
        parentKey: keyName,
        sortMode,
      })
      return (
        <Fragment>
          {tag ? (
            <JsonLine level={level}>
              <span className="text-[11px] text-sky-700">/* {formatPrerequisiteTag(tag)} */</span>
            </JsonLine>
          ) : null}
          <JsonLine level={level}>
            <JsonKey name={keyName} />
            <span className="text-slate-500">: {'{'}</span>
          </JsonLine>
          {entries.map(([key, child], i) => (
            <JsonObjectEntry
              key={key}
              keyName={key}
              value={child}
              level={level + 1}
              parentKey={keyName}
              dataUrl={dataUrl}
              trailingComma={i < entries.length - 1}
              host={host}
              sortMode={sortMode}
              jsonRootKind={jsonRootKind}
            />
          ))}
          <JsonLine level={level} trailingComma={trailingComma}>
            <span className="text-slate-500">{'}'}</span>
          </JsonLine>
        </Fragment>
      )
    }

    const entries = sortObjectEntries(Object.entries(value as Record<string, unknown>), {
      parentKey: keyName,
      sortMode,
    })
    if (entries.length === 0) {
      return (
        <JsonLine level={level} trailingComma={trailingComma}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: {'{}'}</span>
        </JsonLine>
      )
    }
    // `reference` is typed on the loaded preset; no need to re-parse the JSON value.
    const wikiRef =
      keyName === 'reference' && !parentKey && jsonRootKind === 'preset'
        ? host.hostPreset.reference
        : undefined
    return (
      <Fragment>
        <JsonLine level={level}>
          <JsonKey name={keyName} />
          <span className="text-slate-500">: {'{'}</span>
          {wikiRef ? (
            <SourceActionGroup>
              <WikiLink
                href={osmWikiUrlForTag(wikiRef.key, wikiRef.value)}
                title={`OSM Wiki: ${wikiRef.value ? `${wikiRef.key}=${wikiRef.value}` : wikiRef.key}`}
              />
            </SourceActionGroup>
          ) : null}
        </JsonLine>
        {entries.map(([key, child], i) => (
          <JsonObjectEntry
            key={key}
            keyName={key}
            value={child}
            level={level + 1}
            parentKey={keyName}
            dataUrl={dataUrl}
            trailingComma={i < entries.length - 1}
            host={host}
            sortMode={sortMode}
            jsonRootKind={jsonRootKind}
          />
        ))}
        <JsonLine level={level} trailingComma={trailingComma}>
          <span className="text-slate-500">{'}'}</span>
        </JsonLine>
      </Fragment>
    )
  }

  return (
    <JsonLine level={level} trailingComma={trailingComma}>
      <JsonKey name={keyName} />
      <span className="text-slate-500">: </span>
      <span className="text-slate-400">undefined</span>
    </JsonLine>
  )
}

type SourceListsMode = 'checking' | 'authored' | 'expanded'

/** Says where `fields` / `moreFields` come from: the source file, or the built dist lists. */
function SourceListsNote({ mode }: { mode: SourceListsMode }) {
  return (
    <p
      data-testid="source-lists-mode"
      data-mode={mode}
      className="mb-2 max-w-3xl font-sans text-[11px] text-slate-500"
    >
      {mode === 'authored' ? (
        <>
          <code>fields</code> and <code>moreFields</code> are shown as written in the source file,
          with their <code>{'{preset}'}</code> references.
        </>
      ) : mode === 'checking' ? (
        'Loading the source file…'
      ) : (
        <>
          The source file for this schema version could not be loaded, so <code>fields</code> and{' '}
          <code>moreFields</code> show the built lists. The build has already replaced every{' '}
          <code>{'{preset}'}</code> reference with its fields; the GitHub file has them as written.
        </>
      )}
    </p>
  )
}

function authoredListItems(entries: AuthoredListEntry[]): string[] {
  return entries.map((entry) => (entry.kind === 'field' ? entry.fieldId : entry.presetRef))
}

export function PresetSourceTree({
  presetId,
  raw,
  preset: _preset,
  presets: _presets,
  sourceKind = 'preset',
}: PresetSourceTreeProps) {
  const { dataUrl, rawPresets } = useSchema()
  const hasFieldLists =
    sourceKind === 'preset' && (Array.isArray(raw.fields) || Array.isArray(raw.moreFields))
  const sourceQuery = useAuthoredPresetSource(presetId, hasFieldLists)
  const source = hasFieldLists ? (sourceQuery.data ?? null) : null
  const sourceListsMode: SourceListsMode | null = !hasFieldLists
    ? null
    : source
      ? 'authored'
      : sourceQuery.isFetching
        ? 'checking'
        : 'expanded'
  const displayRaw = source
    ? {
        ...raw,
        ...(source.fields ? { fields: authoredListItems(source.fields) } : {}),
        ...(source.moreFields ? { moreFields: authoredListItems(source.moreFields) } : {}),
      }
    : raw
  const host: HostPresetContext = {
    hostPresetId: presetId,
    rawPresets,
    source,
    sourceFieldId: sourceKind === 'field' ? presetId : undefined,
  }

  return (
    <div
      className={cn(
        'overflow-x-auto bg-slate-50 p-4',
        'font-mono text-xs leading-relaxed text-slate-800',
      )}
    >
      {sourceListsMode ? <SourceListsNote mode={sourceListsMode} /> : null}
      <JsonNode
        value={displayRaw}
        level={0}
        dataUrl={dataUrl ?? ''}
        host={host}
        sortMode="preset"
        jsonRootKind={sourceKind}
      />
    </div>
  )
}
