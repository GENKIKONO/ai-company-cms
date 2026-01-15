/**
 * Agency Clients Page
 * 代理店配下顧客一覧（将来実装）
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agency Clients - AIOHub',
  description: '代理店配下顧客一覧',
};

export default async function AgencyClientsPage({ 
  params 
}: { 
  params: Promise<{ agencyId: string }> 
}) {
  const resolvedParams = await params;
  // TODO: Phase 2で実装予定
  // - 代理店ID検証
  // - 配下顧客一覧取得
  // - 顧客別売上表示
  // - 新規顧客追加機能

  return (
    <div className="min-h-screen bg-[var(--aio-background)] flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto p-6">
        <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-[var(--aio-secondary)] bg-opacity-10 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-[var(--aio-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-semibold text-[var(--aio-text)] mb-2">
              Agency Clients
            </h1>
            <p className="text-sm text-[var(--aio-text-muted)]">
              代理店ID: {resolvedParams.agencyId}
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-[var(--aio-surface-secondary)] rounded-md p-4">
              <h3 className="text-sm font-medium text-[var(--aio-text)] mb-3">
                Phase 2で実装予定の機能
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-[var(--aio-text)] mb-2">
                    顧客管理
                  </h4>
                  <ul className="text-xs text-[var(--aio-text-muted)] space-y-1">
                    <li>• 配下顧客一覧表示</li>
                    <li>• 新規顧客登録</li>
                    <li>• 顧客情報編集</li>
                    <li>• 顧客削除</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[var(--aio-text)] mb-2">
                    売上・分析
                  </h4>
                  <ul className="text-xs text-[var(--aio-text-muted)] space-y-1">
                    <li>• 顧客別売上レポート</li>
                    <li>• プラン利用状況</li>
                    <li>• 課金履歴</li>
                    <li>• 成果分析</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="border border-[var(--aio-warning)] border-opacity-20 bg-[var(--aio-warning)] bg-opacity-10 rounded-md p-4">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-[var(--aio-warning)] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-[var(--aio-text)]">
                    アクセス権限が必要です
                  </h4>
                  <p className="text-xs text-[var(--aio-text-muted)] mt-1">
                    この機能を利用するには、代理店アカウントでのログインと適切な権限設定が必要です。
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <a
                href="/agency"
                className="inline-flex items-center px-4 py-2 border border-[var(--aio-border)] rounded-md text-sm font-medium text-[var(--aio-text)] bg-[var(--aio-surface)] hover:bg-[var(--aio-surface-secondary)] transition-colors"
              >
                代理店ダッシュボード
              </a>
              <a
                href="/admin"
                className="inline-flex items-center px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md text-sm font-medium hover:bg-[var(--aio-primary-hover)] transition-colors"
              >
                管理画面に戻る
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}