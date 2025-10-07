import { Metadata } from 'next';
import { CheckCircle } from '@/components/icons/CheckCircle';
import { PLAN_NAMES, PLAN_FEATURES, formatPrice } from '@/config/plans';

export const metadata: Metadata = {
  title: '料金プラン | AIO Hub AI企業CMS',
  description: 'AIO Hub AI企業CMSの料金プラン。無料プランから企業向けプランまで、ニーズに合わせたプランをご用意しています。',
  keywords: ['料金', 'プラン', '価格', 'AI', 'CMS', '企業管理'],
};

export default function PricingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '料金プラン',
    description: 'AIO Hub AI企業CMSの料金プラン',
    url: 'https://aiohub.jp/pricing',
    isPartOf: {
      '@type': 'WebSite',
      name: 'AIO Hub AI企業CMS',
      url: 'https://aiohub.jp'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              料金プラン
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              ニーズに合わせて選べるプランをご用意しています
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 無料プラン */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{PLAN_NAMES.free}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  {formatPrice('free')}
                </div>
                <p className="text-gray-600 mb-6">個人や小規模企業に最適</p>
              </div>
              <ul className="space-y-3 mb-8">
                {PLAN_FEATURES.free.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                現在のプラン
              </button>
            </div>

            {/* スタンダードプラン */}
            <div className="border-2 border-blue-500 rounded-lg p-6 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">おすすめ</span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{PLAN_NAMES.standard}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  {formatPrice('standard')}
                </div>
                <p className="text-gray-600 mb-6">成長企業に最適</p>
              </div>
              <ul className="space-y-3 mb-8">
                {PLAN_FEATURES.standard.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                プランを選択
              </button>
            </div>

            {/* エンタープライズプラン */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{PLAN_NAMES.enterprise}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  {formatPrice('enterprise')}
                </div>
                <p className="text-gray-600 mb-6">大企業・カスタマイズが必要な企業に</p>
              </div>
              <ul className="space-y-3 mb-8">
                {PLAN_FEATURES.enterprise.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                お問い合わせ
              </button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              まずは無料プランからお始めください。いつでもアップグレード可能です。
            </p>
            <a 
              href="/auth/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              無料で始める
            </a>
          </div>
        </div>
      </div>
    </>
  );
}