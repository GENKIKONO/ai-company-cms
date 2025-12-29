/**
 * Account Notifications Page
 *
 * 通知設定ページ（Read-only MVP）
 * 主体: user（個人）
 */

import { UserShell } from '@/components/account';
import Link from 'next/link';

export const metadata = {
  title: '通知設定 | アカウント設定',
  description: 'メール通知、プッシュ通知等の設定',
};

// 通知設定の型定義
interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

// 通知カテゴリの型定義
interface NotificationCategory {
  id: string;
  title: string;
  settings: NotificationSetting[];
}

// 現在の通知設定（将来的にはDBから取得）
const notificationCategories: NotificationCategory[] = [
  {
    id: 'general',
    title: '一般通知',
    settings: [
      {
        id: 'product_updates',
        label: '製品アップデート',
        description: '新機能や改善のお知らせ',
        enabled: true,
      },
      {
        id: 'tips',
        label: '活用のヒント',
        description: 'サービスをより活用するためのヒント',
        enabled: false,
      },
    ],
  },
  {
    id: 'organization',
    title: '組織通知',
    settings: [
      {
        id: 'member_changes',
        label: 'メンバー変更',
        description: '組織メンバーの追加・削除',
        enabled: true,
      },
      {
        id: 'billing',
        label: '課金関連',
        description: 'プラン変更、請求書等',
        enabled: true,
      },
    ],
  },
  {
    id: 'security',
    title: 'セキュリティ通知',
    settings: [
      {
        id: 'login_alerts',
        label: 'ログインアラート',
        description: '新しいデバイスからのログイン',
        enabled: true,
      },
      {
        id: 'security_updates',
        label: 'セキュリティ更新',
        description: '重要なセキュリティに関するお知らせ',
        enabled: true,
      },
    ],
  },
];

export default async function NotificationsPage() {
  return (
    <UserShell title="通知設定">
      <div className="space-y-6">
        {/* パンくずナビ */}
        <nav className="text-sm text-[var(--color-text-secondary)]">
          <Link href="/account" className="hover:text-[var(--aio-primary)]">
            アカウント設定
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-text-primary)]">通知設定</span>
        </nav>

        {/* ヘッダー */}
        <div className="border-b border-[var(--aio-border)] pb-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            通知設定
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            メール通知やプッシュ通知の設定を管理します
          </p>
        </div>

        {/* 通知設定 */}
        <div className="space-y-6">
          {notificationCategories.map((category) => (
            <div
              key={category.id}
              className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                {category.title}
              </h2>
              <div className="divide-y divide-[var(--aio-border)]">
                {category.settings.map((setting) => (
                  <div key={setting.id} className="py-4 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {setting.label}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {setting.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      {/* 読み取り専用のトグル表示 */}
                      <div
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          setting.enabled
                            ? 'bg-[var(--aio-primary)]'
                            : 'bg-gray-200'
                        }`}
                        aria-label={setting.enabled ? '有効' : '無効'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            setting.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 配信停止オプション */}
        <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            全ての通知を停止
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            セキュリティ通知を除く全ての通知メールを停止します
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              現在: 通知有効
            </span>
          </div>
        </div>

        {/* 注記 */}
        <p className="text-xs text-[var(--color-text-secondary)]">
          通知設定の変更機能は今後追加予定です
        </p>
      </div>
    </UserShell>
  );
}
