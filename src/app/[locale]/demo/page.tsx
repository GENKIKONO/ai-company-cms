import { Metadata } from 'next';
import Link from 'next/link';
import { 
  SAMPLE_ORGANIZATION, 
  SAMPLE_SERVICES, 
  SAMPLE_FAQS, 
  SAMPLE_CASE_STUDIES 
} from '@/lib/development-helpers';
import { 
  generateOrganizationJsonLd, 
  generateServiceJsonLd, 
  generateFAQPageJsonLd,
  generateCaseStudyJsonLd 
} from '@/lib/jsonld';

export const metadata: Metadata = {
  title: `${SAMPLE_ORGANIZATION.name} | LuxuCare Demo`,
  description: SAMPLE_ORGANIZATION.description,
  openGraph: {
    title: SAMPLE_ORGANIZATION.name,
    description: SAMPLE_ORGANIZATION.description,
    siteName: 'LuxuCare Demo',
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function DemoPage() {
  const organization = SAMPLE_ORGANIZATION;
  const services = SAMPLE_SERVICES;
  const faqs = SAMPLE_FAQS;
  const caseStudies = SAMPLE_CASE_STUDIES;

  // JSON-LD構造化データ生成
  const orgJsonLd = generateOrganizationJsonLd({
    name: organization.name,
    description: organization.description,
    url: organization.url,
    telephoneE164: '+81-3-1234-5678',
    email: organization.email_public ? organization.email : undefined,
    logoUrl: organization.logo_url,
    addressRegion: organization.address_region,
    addressLocality: organization.address_locality,
    streetAddress: organization.street_address,
    postalCode: organization.postal_code,
    founded: organization.founded,
  });

  const serviceJsonLds = services.map(service => 
    generateServiceJsonLd({
      name: service.name,
      summary: service.summary,
      features: service.features,
      category: service.category,
      priceNumeric: undefined, // 価格は文字列のため数値変換省略
      ctaUrl: service.cta_url,
      org: { 
        name: organization.name,
        url: organization.url
      }
    })
  );

  const caseStudyJsonLds = caseStudies.map(caseStudy =>
    generateCaseStudyJsonLd({
      title: caseStudy.title,
      clientType: caseStudy.client_type,
      problem: caseStudy.problem,
      solution: caseStudy.solution,
      outcome: caseStudy.outcome,
      metrics: caseStudy.metrics,
      publishedAt: caseStudy.published_at,
      org: { name: organization.name }
    })
  );

  const faqJsonLd = generateFAQPageJsonLd(
    faqs.map(faq => ({
      question: faq.question,
      answer: faq.answer,
    }))
  );

  const allJsonLds = [
    orgJsonLd,
    ...serviceJsonLds,
    ...caseStudyJsonLds,
    ...(faqJsonLd ? [faqJsonLd] : [])
  ];

  return (
    <>
      {/* JSON-LD構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(allJsonLds, null, 2)
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {organization.logo_url && (
                  <img
                    src={organization.logo_url}
                    alt={`${organization.name}のロゴ`}
                    className="h-12 w-auto"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                  <p className="text-sm text-gray-600">{organization.legal_form}</p>
                </div>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                📍 デモページ
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2 space-y-8">
              {/* 企業概要 */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">企業概要</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {organization.description}
                </p>
              </section>

              {/* サービス一覧 */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">サービス・事業</h2>
                <div className="grid gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {service.name}
                          </h3>
                          {service.category && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-3">
                              {service.category}
                            </span>
                          )}
                          <p className="text-gray-700 mb-4">{service.summary}</p>
                          
                          {service.features && service.features.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">特徴</h4>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {service.features.map((feature, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <p className="text-sm font-medium text-gray-900">
                            料金: {service.price}
                          </p>
                        </div>
                        <div className="ml-4">
                          <a
                            href={service.cta_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                          >
                            詳細を見る
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 導入事例 */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">導入事例</h2>
                <div className="space-y-6">
                  {caseStudies.map((caseStudy) => (
                    <article key={caseStudy.id} className="border border-gray-200 rounded-lg p-6">
                      <header className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{caseStudy.title}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded">
                            {caseStudy.client_type}
                          </span>
                          {!caseStudy.is_anonymous && caseStudy.client_name && (
                            <span>{caseStudy.client_name}</span>
                          )}
                          {caseStudy.published_at && (
                            <time>{new Date(caseStudy.published_at).toLocaleDateString()}</time>
                          )}
                        </div>
                      </header>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">課題</h4>
                          <p className="text-gray-700 text-sm">{caseStudy.problem}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">解決策</h4>
                          <p className="text-gray-700 text-sm">{caseStudy.solution}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">成果</h4>
                          <p className="text-gray-700 text-sm">{caseStudy.outcome}</p>
                        </div>
                        
                        {caseStudy.metrics && Object.keys(caseStudy.metrics).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">効果測定</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(caseStudy.metrics).map(([key, value]) => (
                                <div key={key} className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-xs text-gray-600">{key}</div>
                                  <div className="text-lg font-semibold text-gray-900">{value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* よくある質問 */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">よくある質問</h2>
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <details key={faq.id} className="border border-gray-200 rounded-lg">
                      <summary className="cursor-pointer p-4 font-medium text-gray-900 hover:bg-gray-50">
                        Q. {faq.question}
                      </summary>
                      <div className="px-4 pb-4">
                        <p className="text-gray-700 whitespace-pre-line">A. {faq.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            </div>

            {/* サイドバー */}
            <div className="lg:col-span-1 space-y-6">
              {/* 企業情報 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">企業情報</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-600">代表者</dt>
                    <dd className="text-gray-900">{organization.representative_name}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">設立</dt>
                    <dd className="text-gray-900">{new Date(organization.founded!).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">資本金</dt>
                    <dd className="text-gray-900">{organization.capital!.toLocaleString()}円</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">従業員数</dt>
                    <dd className="text-gray-900">{organization.employees}名</dd>
                  </div>
                </dl>
              </div>

              {/* 所在地 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">所在地</h3>
                <address className="text-sm text-gray-700 not-italic">
                  〒{organization.postal_code}<br />
                  {organization.address_region}{organization.address_locality}<br />
                  {organization.street_address}
                </address>
              </div>

              {/* 連絡先 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">お問い合わせ</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-600">電話番号</div>
                    <div className="text-blue-600">{organization.telephone}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">メール</div>
                    <div className="text-blue-600">{organization.email}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">公式サイト</div>
                    <a 
                      href={organization.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {organization.url}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* フッター */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="text-center text-sm text-gray-600">
                Powered by <span className="font-semibold text-indigo-600">LuxuCare</span>
              </div>
              <div className="flex space-x-4">
                <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
                  ← ホームに戻る
                </Link>
                <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-800">
                  ダッシュボード
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}