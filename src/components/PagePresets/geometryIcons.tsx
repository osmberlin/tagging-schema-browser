import areaSvg from '@/icons/geometry/area.svg?raw'
import lineSvg from '@/icons/geometry/line.svg?raw'
import pointSvg from '@/icons/geometry/point.svg?raw'
import relationSvg from '@/icons/geometry/relation.svg?raw'
import vertexSvg from '@/icons/geometry/vertex.svg?raw'

/** OSM Wiki element graphics (User:Moresby), simplified for small UI use. */
const GEOMETRY_SVGS: Record<string, string> = {
  point: pointSvg,
  line: lineSvg,
  area: areaSvg,
  vertex: vertexSvg,
  relation: relationSvg,
}

const dataUrlCache = new Map<string, string>()

function geometryDataUrl(type: string): string | null {
  const raw = GEOMETRY_SVGS[type]
  if (!raw) return null
  const cached = dataUrlCache.get(type)
  if (cached) return cached
  const url = `data:image/svg+xml,${encodeURIComponent(raw)}`
  dataUrlCache.set(type, url)
  return url
}

export function GeometryIcon({
  type,
  className = 'h-5 w-5',
}: {
  type: string
  className?: string
}) {
  const src = geometryDataUrl(type)
  if (!src) {
    return <span className="font-mono text-[10px] text-slate-500">{type}</span>
  }
  return <img src={src} alt="" title={type} className={`shrink-0 ${className}`} />
}

export function GeometryIcons({
  geometry,
  className = 'h-5 w-5',
}: {
  geometry: string[]
  className?: string
}) {
  if (!geometry.length) return <span className="text-slate-300">—</span>
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {geometry.map((g) => (
        <GeometryIcon key={g} type={g} className={className} />
      ))}
    </span>
  )
}
