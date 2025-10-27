/**
 * 料金プラン（ヒアリング代行）デモページ
 * PricingPlansコンポーネントの動作確認用
 */

import PricingPlans from '@/components/pricing/PricingPlans';

export default function PricingDemoPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 section-spacing-small">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            料金プラン（ヒアリング代行）デモ
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            新しく実装されたPricingPlansコンポーネントの動作確認ページです。
            モバイルでは横スクロール、デスクトップでは3列グリッドで表示されます。
          </p>
        </div>
        
        <PricingPlans />
        
        <div className="mt-16 text-center">
          <div className="bg-blue-50 rounded-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              実装済み機能
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">アクセシビリティ</h3>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• ARIA labels とロール属性</li>
                  <li>• キーボードナビゲーション対応</li>
                  <li>• スクリーンリーダー対応</li>
                  <li>• 44px最小タップターゲット</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">レスポンシブデザイン</h3>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• モバイル: 85%幅 + snap-center</li>
                  <li>• デスクトップ: 3列グリッド</li>
                  <li>• 横スクロール時のスクロールバー非表示</li>
                  <li>• すべてのプランカードが同一高さ</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export const metadata = {
  title: '料金プラン（ヒアリング代行）デモ | AIOHub.jp',
  description: 'PricingPlansコンポーネントの動作確認用デモページ',
  robots: 'noindex, nofollow'
};