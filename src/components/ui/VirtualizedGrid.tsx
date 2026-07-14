import { useVirtualizer } from '@tanstack/react-virtual'
import { type ReactNode, useMemo, useRef } from 'react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { cn } from '@/utils/tw'

type VirtualizedGridProps<T> = {
  items: T[]
  minColumnWidth: number
  gap: number
  /** Fixed card height in px — rows are uniform so the virtualizer can stride predictably. */
  rowEstimate: number
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  className?: string
  listClassName?: string
  busy?: boolean
  maxHeight?: string
}

function columnCountForWidth(width: number, minColumnWidth: number, gap: number) {
  if (width <= 0) return 1
  return Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)))
}

export function VirtualizedGrid<T>({
  items,
  minColumnWidth,
  gap,
  rowEstimate,
  getKey,
  renderItem,
  className,
  listClassName,
  busy = false,
  maxHeight = 'calc(100svh - 12rem)',
}: VirtualizedGridProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useContainerWidth(containerRef)
  const columnCount = columnCountForWidth(width, minColumnWidth, gap)
  const rowCount = Math.ceil(items.length / columnCount)
  const rowStride = rowEstimate + gap

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowStride,
    overscan: 4,
    directDomUpdates: true,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
      gap: `${gap}px`,
    }),
    [columnCount, gap],
  )

  return (
    <div
      ref={containerRef}
      className={cn('flex min-h-0 w-full flex-col overflow-hidden', className)}
      style={{ maxHeight }}
      aria-busy={busy || undefined}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto"
        style={{ opacity: busy ? 0.65 : undefined }}
      >
        <div ref={virtualizer.containerRef} className={cn('relative w-full', listClassName)}>
          {virtualRows.map((virtualRow) => {
            const startIndex = virtualRow.index * columnCount
            const rowItems = items.slice(startIndex, startIndex + columnCount)

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{ paddingBottom: gap }}
              >
                <ul className="grid" style={gridStyle}>
                  {rowItems.map((item) => (
                    <li key={getKey(item)} className="min-w-0">
                      {renderItem(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
