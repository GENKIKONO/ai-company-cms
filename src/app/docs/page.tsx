import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ドキュメント | AIO Hub',
  description: 'AIO Hubの使い方や機能についてのドキュメントです。',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AIO Hub ドキュメント</h1>
          <p className="text-xl text-gray-600">
            AIO Hubの機能と使い方について詳しく説明します。
          </p>
        </div>

        <div className="prose prose-lg mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">📚 ドキュメントについて</h2>
            <p className="text-blue-800">
              AIO Hubは企業情報をAI検索エンジンで見つけやすくするプラットフォームです。
              こちらのドキュメントでは、サービスの利用方法や機能について詳しく説明しています。
            </p>
          </div>

          <h2>主な機能</h2>
          <ul>
            <li><strong>企業情報管理</strong> - 会社概要、サービス、FAQの一元管理</li>
            <li><strong>AI検索最適化</strong> - AI検索エンジンでの見つけやすさを向上</li>
            <li><strong>埋め込みウィジェット</strong> - 企業情報をWebサイトに簡単埋め込み</li>
            <li><strong>アナリティクス</strong> - アクセス状況と検索パフォーマンスの分析</li>
          </ul>

          <h2>利用料金</h2>
          <p>
            AIO Hubでは、ニーズに応じて3つのプランをご用意しています：
          </p>
          <ul>
            <li><strong>Starter</strong> - ¥2,980/月 - 基本的な企業情報管理</li>
            <li><strong>Pro</strong> - ¥8,000/月 - 高度な分析とカスタマイズ</li>
            <li><strong>Business</strong> - ¥15,000/月 - エンタープライズ向け機能</li>
          </ul>

          <h2>よくある質問</h2>
          <div className="space-y-4">
            <details className="border border-gray-200 rounded p-4">
              <summary className="font-medium cursor-pointer">AIO Hubとは何ですか？</summary>
              <p className="mt-2 text-gray-700">
                AIO Hubは、企業情報をAI検索エンジンで見つけやすくするためのプラットフォームです。
                ChatGPTやBardなどのAI検索で企業が適切に表示されるよう最適化します。
              </p>
            </details>
            
            <details className="border border-gray-200 rounded p-4">
              <summary className="font-medium cursor-pointer">どのような企業に適していますか？</summary>
              <p className="mt-2 text-gray-700">
                BtoB企業、コンサルティング会社、技術系企業など、
                AI検索での認知度向上を求める全ての企業に適しています。
              </p>
            </details>
          </div>

          <h2>サポート</h2>
          <p>
            ご質問やサポートが必要な場合は、<a href="/contact" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]">お問い合わせページ</a>からご連絡ください。
            専門スタッフが迅速にサポートいたします。
          </p>
        </div>
      </div>
    </div>
  );
}