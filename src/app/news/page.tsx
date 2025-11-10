import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お知らせ | AIO Hub',
  description: 'AIO Hubの最新情報、機能追加、メンテナンス情報をお知らせします。',
};

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">最新のお知らせ</h1>
          <p className="text-xl text-gray-600">
            AIO Hubの最新情報、機能追加、重要な更新をお知らせします
          </p>
        </div>

        <div className="space-y-8">
          {/* 最新のお知らせ */}
          <article className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                新機能
              </span>
              <time className="text-sm text-gray-500">{new Date().toLocaleDateString('ja-JP')}</time>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              AI可視性ガード機能を日本語化しました
            </h2>
            <p className="text-gray-700 leading-relaxed">
              管理者向けのAI可視性ガード機能のUIを日本語化し、より使いやすくなりました。
              致命的な問題、重要な問題、軽微な問題の分類表示や、
              応答時間の監視機能が日本語で確認できるようになっています。
            </p>
          </article>

          <article className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                機能改善
              </span>
              <time className="text-sm text-gray-500">2024年11月1日</time>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              管理ページのパフォーマンスを改善
            </h2>
            <p className="text-gray-700 leading-relaxed">
              ダッシュボードと管理コンソールの読み込み速度を改善しました。
              特に大量のデータを扱う企業様において、画面表示が高速化されています。
              動的レンダリング化により、最新の情報をリアルタイムで表示できるようになりました。
            </p>
          </article>

          <article className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                セキュリティ
              </span>
              <time className="text-sm text-gray-500">2024年10月25日</time>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Basic認証を強化しました
            </h2>
            <p className="text-gray-700 leading-relaxed">
              管理者向けページのセキュリティを強化し、
              Basic認証による2段階のアクセス保護を実装しました。
              お客様の重要な企業情報をより安全に管理できるようになっています。
            </p>
          </article>

          <article className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                一般
              </span>
              <time className="text-sm text-gray-500">2024年10月15日</time>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              AIO Hubサービス正式リリース
            </h2>
            <p className="text-gray-700 leading-relaxed">
              企業情報をAI検索エンジンで見つけやすくするプラットフォーム「AIO Hub」を正式リリースしました。
              ChatGPTやBardなどの生成AIで企業情報が適切に表示されるよう最適化し、
              新しい検索体験に対応した企業のデジタルプレゼンスを支援します。
            </p>
          </article>
        </div>

        {/* サイドバー的な情報 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📢 重要なお知らせ</h3>
            <ul className="space-y-2 text-blue-800">
              <li>• 定期メンテナンス: 毎月第3日曜日 2:00-4:00（JST）</li>
              <li>• サポート時間: 平日 9:00-18:00</li>
              <li>• 緊急時対応: 24時間365日監視体制</li>
            </ul>
          </div>
        </div>

        {/* お問い合わせリンク */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            ご質問やお困りのことがございましたら、
            <a href="/contact" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] mx-1">
              お問い合わせページ
            </a>
            からご連絡ください。
          </p>
        </div>
      </div>
    </div>
  );
}