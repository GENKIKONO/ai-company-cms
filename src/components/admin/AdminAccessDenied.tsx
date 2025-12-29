/**
 * AdminAccessDenied
 * アクセス拒否時の共通UI
 */

import Link from 'next/link';

interface AdminAccessDeniedProps {
  reason: 'site_admin_required' | 'feature_disabled' | 'unauthorized';
  featureKey?: string;
}

export function AdminAccessDenied({ reason, featureKey }: AdminAccessDeniedProps) {
  const messages = {
    site_admin_required: {
      title: 'アクセス権限がありません',
      description: 'この機能にアクセスするには管理者権限が必要です。',
    },
    feature_disabled: {
      title: '機能が無効です',
      description: `この機能（${featureKey || '不明'}）は現在無効になっています。`,
    },
    unauthorized: {
      title: '認証が必要です',
      description: 'ログインしてください。',
    },
  };

  const { title, description } = messages[reason];

  return (
    <div className="min-h-screen bg-[var(--aio-background)] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--aio-text)] mb-2">{title}</h1>
          <p className="text-[var(--aio-text-muted)] mb-6">{description}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:opacity-90 transition-opacity"
          >
            トップページへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
