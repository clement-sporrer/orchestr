'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, type ReactNode } from 'react'

interface VirtualGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  columns: number
  estimateSize?: number
  gap?: number
  overscan?: number
  className?: string
}

/**
 * Virtualized grid for optimal rendering of large datasets in grid layout
 */
export function VirtualGrid<T>({
  items,
  renderItem,
  columns,
  estimateSize = 200,
  gap = 16,
  overscan = 2,
  className,
}: Readonly<VirtualGridProps<T>>) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate rows from items and columns
  const rows = Math.ceil(items.length / columns)

  /* TanStack Virtual returns unstable function refs; React Compiler skips memoizing this subtree */
  // eslint-disable-next-line react-hooks/incompatible-library -- @tanstack/react-virtual
  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  const virtualRows = virtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns
          const endIndex = Math.min(startIndex + columns, items.length)
          const rowItems = items.slice(startIndex, endIndex)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={startIndex + colIndex}>
                  {renderItem(item, startIndex + colIndex)}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
