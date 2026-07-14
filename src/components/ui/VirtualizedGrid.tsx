import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { type ReactNode, useMemo, useRef } from 'react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { useScrollMargin } from '@/hooks/useScrollMargin'
import { cn } from '@/utils/tw'

type VirtualizedGridProps<T> = {
  items: T[]
  minColumnWidth: number
  gap: number
  rowEstimate: number
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  className?: string
  listClassName?: string
  busy?: boolean
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
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useContainerWidth(containerRef)
  const scrollMargin = useScrollMargin(containerRef)
  const columnCount = columnCountForWidth(width, minColumnWidth, gap)
  const rowCount = Math.ceil(items.length / columnCount)

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowEstimate,
    overscan: 4,
    scrollMargin,
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
      className={cn('w-full', className)}
      aria-busy={busy || undefined}
      style={{ opacity: busy ? 0.65 : undefined }}
    >
      <div
        className={cn('relative w-full', listClassName)}
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount
          const rowItems = items.slice(startIndex, startIndex + columnCount)

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
            >
              <ul className="grid" style={gridStyle}>
                {rowItems.map((item) => (
                  <li key={getKey(item)} className="h-full min-w-0">
                    {renderItem(item)}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
