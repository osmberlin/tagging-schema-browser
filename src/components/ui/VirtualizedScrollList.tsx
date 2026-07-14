import { useVirtualizer } from '@tanstack/react-virtual'
import { type ReactNode, useRef } from 'react'
import { cn } from '@/utils/tw'

type VirtualizedScrollListProps<T> = {
  items: T[]
  estimateSize: number
  getKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => ReactNode
  header?: ReactNode
  className?: string
  busy?: boolean
  maxHeight?: string
}

/** Virtual list inside a dedicated scroll container (avoids window scroll-margin bugs). */
export function VirtualizedScrollList<T>({
  items,
  estimateSize,
  getKey,
  renderItem,
  header,
  className,
  busy = false,
  maxHeight = 'calc(100svh - 12rem)',
}: VirtualizedScrollListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan: 12,
    // React Compiler caches getVirtualItems() unless positions are written directly.
    directDomUpdates: true,
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div className={cn('w-full', className)} aria-busy={busy || undefined}>
      {header}
      <div
        ref={scrollRef}
        className="overflow-auto"
        style={{ height: maxHeight, opacity: busy ? 0.65 : undefined }}
      >
        <div ref={virtualizer.containerRef} className="relative w-full">
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index]
            if (!item) return null

            return (
              <div
                key={getKey(item, virtualItem.index)}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
              >
                {renderItem(item, virtualItem.index)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
