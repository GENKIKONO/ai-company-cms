'use client';

/**
 * AdminStatsBlock
 * Admin領域の統計カード用共通ブロック
 */

import { ReactNode } from 'react';

interface StatItem {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ReactNode;
}

interface AdminStatsBlockProps {
  /** 統計項目の配列 */
  stats: StatItem[];
  /** ローディング状態 */
  isLoading?: boolean;
  /** グリッドのカラム数 */
  columns?: 2 | 3 | 4;
}

export function AdminStatsBlock({
  stats,
  isLoading = false,
  columns = 4,
}: AdminStatsBlockProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--aio-text-muted)]">{stat.label}</p>
            {stat.icon && (
              <div className="text-[var(--aio-text-muted)]">{stat.icon}</div>
            )}
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--aio-text)]">
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </p>
          {stat.change && (
            <p
              className={`mt-2 text-sm ${
                stat.change.type === 'increase'
                  ? 'text-green-600'
                  : stat.change.type === 'decrease'
                    ? 'text-red-600'
                    : 'text-[var(--aio-text-muted)]'
              }`}
            >
              {stat.change.type === 'increase' && '+'}
              {stat.change.value}%
              <span className="ml-1 text-[var(--aio-text-muted)]">前期比</span>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
