'use client';

/**
 * DashboardPageHeader - ダッシュボードページヘッダーコンポーネント
 *
 * 各ダッシュボードページの共通ヘッダー
 * タイトル、説明、アクションボタンを統一レイアウトで表示
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon } from '@/components/icons/HIGIcons';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface DashboardPageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** ページタイトル */
  title: string;
  /** ページ説明（オプション） */
  description?: string;
  /** 右側のアクションボタン */
  actions?: React.ReactNode;
  /** 戻るリンク */
  backLink?: {
    href: string;
    label: string;
  };
  /** パンくずリスト */
  breadcrumbs?: BreadcrumbItem[];
  /** バッジ（ステータス表示など） */
  badge?: React.ReactNode;
}

export const DashboardPageHeader = React.forwardRef<HTMLDivElement, DashboardPageHeaderProps>(
  ({
    className,
    title,
    description,
    actions,
    backLink,
    breadcrumbs,
    badge,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-8', className)}
        {...props}
      >
        {/* Back link or Breadcrumbs */}
        {(backLink || breadcrumbs) && (
          <div className="mb-4">
            {backLink && !breadcrumbs && (
              <Link
                href={backLink.href}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--aio-primary)] transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span>{backLink.label}</span>
              </Link>
            )}
            {breadcrumbs && (
              <nav aria-label="パンくずリスト">
                <ol className="flex items-center gap-2 text-sm">
                  {breadcrumbs.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {index > 0 && (
                        <span className="text-[var(--color-text-tertiary)]">/</span>
                      )}
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="text-[var(--color-text-secondary)] hover:text-[var(--aio-primary)] transition-colors"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="text-[var(--color-text-primary)] font-medium">
                          {item.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>
        )}

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
              {title}
            </h1>
            {badge}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="mt-2 text-[var(--color-text-secondary)] max-w-3xl">
            {description}
          </p>
        )}
      </div>
    );
  }
);

DashboardPageHeader.displayName = 'DashboardPageHeader';
