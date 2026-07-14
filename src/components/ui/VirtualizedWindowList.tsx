import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { type ReactNode, useRef } from 'react'
import { useScrollMargin } from '@/hooks/useScrollMargin'
import { cn } from '@/utils/tw'

type VirtualizedWindowListProps<T> = {
  items: T[]
  estimateSize: number
  getKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  busy?: boolean
}

export function VirtualizedWindowList<T>({
  items,
  estimateSize,
  getKey,
  renderItem,
  className,
  busy = false,
}: VirtualizedWindowListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollMargin = useScrollMargin(containerRef)

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize,
    overscan: 8,
    scrollMargin,
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', className)}
      aria-busy={busy || undefined}
      style={{ height: `${virtualizer.getTotalSize()}px`, opacity: busy ? 0.65 : undefined }}
    >
      {virtualItems.map((virtualItem) => {
        const item = items[virtualItem.index]
        if (!item) return null

        return (
          <div
            key={getKey(item, virtualItem.index)}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full"
            style={{ transform: `translateY(${virtualItem.start - scrollMargin}px)` }}
          >
            {renderItem(item, virtualItem.index)}
          </div>
        )
      })}
    </div>
  )
}
