/**
 * VirtualList コンポーネント
 * 要件定義準拠: パフォーマンス最適化、大量データ対応
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useVirtualScrolling } from '../../../performance';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
}: VirtualListProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);

  // Calculate visible range with overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // Show loading state
  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          className
        )}
        style={{ height }}
      >
        {loadingComponent || <div>読み込み中...</div>}
      </div>
    );
  }

  // Show empty state
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          className
        )}
        style={{ height }}
      >
        {emptyComponent || <div>データがありません</div>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              className="w-full"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Grid Virtual List for 2D virtualization
export interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  height: number;
  width: number;
  columns: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  itemWidth,
  height,
  width,
  columns,
  renderItem,
  gap = 0,
  className,
  onScroll,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight;

  const startRow = Math.floor(scrollTop / rowHeight);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + height) / rowHeight) + 1
  );

  const visibleRows = [];
  for (let row = startRow; row < endRow; row++) {
    const rowItems = [];
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < items.length) {
        rowItems.push({ item: items[index], index });
      }
    }
    if (rowItems.length > 0) {
      visibleRows.push({ row, items: rowItems });
    }
  }

  const offsetY = startRow * rowHeight;

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  return (
    <div
      className={cn('overflow-auto', className)}
      style={{ height, width }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleRows.map(({ row, items: rowItems }) => (
            <div
              key={row}
              style={{
                height: itemHeight,
                marginBottom: gap,
                display: 'flex',
                gap: gap,
              }}
            >
              {rowItems.map(({ item, index }) => (
                <div
                  key={index}
                  style={{
                    width: itemWidth,
                    height: itemHeight,
                  }}
                >
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}