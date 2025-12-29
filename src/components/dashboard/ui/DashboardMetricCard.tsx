'use client';

/**
 * DashboardMetricCard - メトリクス表示用カードコンポーネント
 *
 * 数値やKPIを表示するための統一されたカード
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { DashboardCard } from './DashboardCard';

export interface DashboardMetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** メトリクスのラベル */
  label: string;
  /** メトリクスの値 */
  value: string | number;
  /** アイコン（オプション） */
  icon?: React.ReactNode;
  /** 変化率（オプション） */
  change?: {
    value: number;
    label?: string;
  };
  /** トレンドの方向 */
  trend?: 'up' | 'down' | 'neutral';
  /** ローディング状態 */
  loading?: boolean;
  /** サブテキスト */
  subtext?: string;
}

export const DashboardMetricCard = React.forwardRef<HTMLDivElement, DashboardMetricCardProps>(
  ({
    className,
    label,
    value,
    icon,
    change,
    trend = 'neutral',
    loading = false,
    subtext,
    ...props
  }, ref) => {
    const trendColors = {
      up: 'text-[var(--status-success)]',
      down: 'text-[var(--status-error)]',
      neutral: 'text-[var(--color-text-secondary)]',
    };

    const trendIcons = {
      up: '↑',
      down: '↓',
      neutral: '→',
    };

    if (loading) {
      return (
        <DashboardCard ref={ref} className={cn('animate-pulse', className)} {...props}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
            {icon && (
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            )}
          </div>
        </DashboardCard>
      );
    }

    return (
      <DashboardCard ref={ref} className={className} {...props}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] truncate">
              {label}
            </p>
            <p className="mt-2 text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {(change || subtext) && (
              <div className="mt-2 flex items-center gap-2">
                {change && (
                  <span className={cn('text-sm font-medium flex items-center gap-0.5', trendColors[trend])}>
                    <span>{trendIcons[trend]}</span>
                    <span>{change.value > 0 ? '+' : ''}{change.value}%</span>
                    {change.label && (
                      <span className="text-[var(--color-text-tertiary)] ml-1">
                        {change.label}
                      </span>
                    )}
                  </span>
                )}
                {subtext && (
                  <span className="text-sm text-[var(--color-text-tertiary)]">
                    {subtext}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 ml-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--aio-primary)]/10 flex items-center justify-center text-[var(--aio-primary)]">
                {icon}
              </div>
            </div>
          )}
        </div>
      </DashboardCard>
    );
  }
);

DashboardMetricCard.displayName = 'DashboardMetricCard';
