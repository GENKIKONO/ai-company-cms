/**
 * AdminPageHeader
 * Admin領域の共通ヘッダー
 */

import { ReactNode } from 'react';

interface AdminPageHeaderProps {
  /** ページタイトル */
  title: string;
  /** サブタイトル/説明 */
  description?: string;
  /** 右側のアクションボタン群 */
  actions?: ReactNode;
  /** パンくずリスト用のリンク */
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      {/* パンくずリスト */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4">
          <ol className="flex items-center gap-2 text-sm text-[var(--aio-text-muted)]">
            <li>
              <a href="/admin" className="hover:text-[var(--aio-primary)]">
                Admin
              </a>
            </li>
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-2">
                <span>/</span>
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-[var(--aio-primary)]">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-[var(--aio-text)]">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* タイトルとアクション */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--aio-text)]">{title}</h1>
          {description && (
            <p className="mt-1 text-[var(--aio-text-muted)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
