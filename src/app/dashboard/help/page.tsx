'use client';

/**
 * Help Page - 新アーキテクチャ版
 */

import {
  DashboardPageShell,
} from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardButton,
} from '@/components/dashboard/ui';

// =====================================================
// MAIN PAGE
// =====================================================

export default function HelpPage() {
  return (
    <DashboardPageShell
      title="ヘルプ・サポート"
      requiredRole="viewer"
    >
      <HelpContent />
    </DashboardPageShell>
  );
}

// =====================================================
// CONTENT
// =====================================================

function HelpContent() {
  const faqs = [
    {
      question: '企業情報を編集するには？',
      answer: 'ダッシュボードの「企業情報を編集」ボタンから編集画面にアクセスできます。',
    },
    {
      question: 'サービスを公開するには？',
      answer: 'まず企業を公開状態にしてから、各サービスの編集画面で「公開」に設定してください。',
    },
    {
      question: 'データをエクスポートできますか？',
      answer: 'ダッシュボードの「データ出力」ボタンからCSV形式でデータをダウンロードできます。',
    },
  ];

  return (
    <>
      <DashboardPageHeader
        title="ヘルプ・サポート"
        description="よくある質問とサポート情報"
        backLink={{ href: '/dashboard', label: 'ダッシュボード' }}
      />

      <div className="space-y-6">
        {/* FAQ セクション */}
        <DashboardCard>
          <DashboardCardHeader>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">よくある質問</h2>
          </DashboardCardHeader>
          <DashboardCardContent>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-[var(--dashboard-card-border)] rounded-lg p-4"
                >
                  <h3 className="font-medium text-[var(--color-text-primary)] mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </DashboardCardContent>
        </DashboardCard>

        {/* サポート連絡先 */}
        <DashboardCard variant="flat">
          <DashboardCardContent>
            <h3 className="font-medium text-[var(--color-text-primary)] mb-2">
              サポートが必要ですか？
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              上記で解決しない問題については、サポートチームまでお気軽にお問い合わせください。
            </p>
            <a href="mailto:support@luxucare.com">
              <DashboardButton variant="secondary">
                メールで問い合わせ
              </DashboardButton>
            </a>
          </DashboardCardContent>
        </DashboardCard>
      </div>
    </>
  );
}
