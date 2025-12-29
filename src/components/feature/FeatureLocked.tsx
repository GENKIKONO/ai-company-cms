/**
 * FeatureLocked - 機能ロック表示コンポーネント（正本）
 *
 * 【重要】
 * - 機能が無効な場合のロック表示はこのコンポーネントを使用する
 * - ページローカル定義は禁止
 * - プラン名のハードコードは禁止（機能ベースの説明のみ）
 *
 * 使用例:
 * ```tsx
 * import { FeatureLocked } from '@/components/feature/FeatureLocked';
 *
 * if (!hasAccess) {
 *   return (
 *     <FeatureLocked
 *       title="機能名"
 *       description="機能の説明"
 *       features={['機能1', '機能2']}
 *     />
 *   );
 * }
 * ```
 */

export interface FeatureLockedProps {
  /** 機能のタイトル */
  title: string;
  /** 機能の説明 */
  description: string;
  /** この機能で利用できる項目一覧 */
  features: string[];
}

/**
 * 機能ロック表示コンポーネント
 *
 * 機能が無効な場合に表示するUI。
 * プラン名のハードコードを排除し、機能ベースの説明のみ表示。
 */
export function FeatureLocked({ title, description, features }: FeatureLockedProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[var(--aio-surface)] rounded-lg border border-[var(--aio-border)] p-8 text-center">
        {/* アイコン */}
        <div className="w-16 h-16 mx-auto mb-6 bg-[var(--aio-surface-hover)] rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[var(--aio-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>

        {/* タイトル・説明 */}
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          {title}
        </h2>
        <p className="text-[var(--text-muted)] mb-8 max-w-2xl mx-auto">
          {description}
        </p>

        {/* 機能リスト */}
        <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-[var(--aio-success)] mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[var(--text-muted)]">{feature}</span>
            </div>
          ))}
        </div>

        {/* 注記（プラン名ハードコード廃止） */}
        <div className="bg-[var(--aio-surface-hover)] rounded-lg p-6 mb-6">
          <p className="text-sm text-[var(--text-muted)]">
            この機能はお使いのプランでは利用できません。
          </p>
        </div>

        {/* 導線 */}
        <p className="text-sm text-[var(--text-muted)]">
          機能を有効化するには、プランのアップグレードをご検討ください。<br />
          詳細は管理者にお問い合わせください。
        </p>
      </div>
    </div>
  );
}
