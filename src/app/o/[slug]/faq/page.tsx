import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generateFAQJsonLd, generateOrganizationJsonLd } from '@/lib/utils/jsonld';
import type { Organization, FAQ } from '@/types/database';

interface FAQPageData {
  organization: Organization;
  faqs: FAQ[];
}

async function getFAQData(slug: string): Promise<FAQPageData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/organizations/${slug}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return {
      organization: result.data.organization,
      faqs: result.data.faqs || []
    };
  } catch (error) {
    console.error('Failed to fetch FAQ data:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getFAQData(resolvedParams.slug);

  if (!data) {
    return {
      title: 'FAQ Not Found',
    };
  }

  const { organization } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `よくある質問 | ${organization.name}`,
    description: `${organization.name}のよくある質問・FAQ一覧です。サービスに関する疑問を解決します。`,
    openGraph: {
      title: `${organization.name} - よくある質問`,
      description: `${organization.name}のよくある質問・FAQ`,
      type: 'website',
      url: `${baseUrl}/o/${organization.slug}/faq`,
      siteName: organization.name,
      images: organization.logo_url ? [{
        url: organization.logo_url,
        width: 1200,
        height: 630,
        alt: `${organization.name} logo`,
      }] : undefined,
    },
    alternates: {
      canonical: `/o/${organization.slug}/faq`,
    },
  };
}

export default async function FAQPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const data = await getFAQData(resolvedParams.slug);

  if (!data) {
    notFound();
  }

  const { organization, faqs } = data;
  
  // JSON-LD構造化データ生成
  const jsonLdArray = [];
  
  // 組織情報
  jsonLdArray.push(generateOrganizationJsonLd(organization));
  
  // FAQ JSON-LD
  const faqJsonLd = generateFAQJsonLd(faqs);
  if (faqJsonLd) {
    jsonLdArray.push(faqJsonLd);
  }

  return (
    <>
      {/* JSON-LD structured data */}
      {jsonLdArray.map((jsonLd, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                  AIO Hub AI企業CMS
                </Link>
                <nav className="ml-10 hidden md:flex space-x-8">
                  <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
                    企業ディレクトリ
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/login" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  ログイン
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* パンくずナビ */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  ホーム
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link href={`/o/${organization.slug}`} className="text-gray-500 hover:text-gray-700">
                  {organization.name}
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">よくある質問</span>
              </li>
            </ol>
          </nav>

          {/* ページタイトル */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {organization.name} - よくある質問
            </h1>
            <p className="text-lg text-gray-600">
              サービスに関する疑問やご質問にお答えします
            </p>
          </div>

          {/* FAQ一覧 */}
          {faqs && faqs.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  FAQ（よくある質問）
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  質問をクリックすると回答が表示されます
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {faqs.map((faq, index) => (
                  <div key={faq.id} className="group">
                    <details className="group">
                      <summary className="flex items-start justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex-1 pr-4">
                          <div className="flex items-start">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded-full mr-3 mt-1 flex-shrink-0">
                              Q{index + 1}
                            </span>
                            <h3 className="text-base font-medium text-gray-900 leading-relaxed">
                              {faq.question}
                            </h3>
                          </div>
                          {faq.category && (
                            <div className="mt-2 ml-12">
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded">
                                {faq.category}
                              </span>
                            </div>
                          )}
                        </div>
                        <svg 
                          className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0 mt-1"
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-6 pb-6">
                        <div className="ml-12 bg-green-50 rounded-lg p-4">
                          <div className="flex items-start">
                            <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full mr-3 mt-1 flex-shrink-0">
                              A{index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>

              {/* フッター */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    こちらで解決しない場合は、お気軽にお問い合わせください
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {organization.email && (
                      <a 
                        href={`mailto:${organization.email}?subject=${encodeURIComponent('お問い合わせ')}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        メールでお問い合わせ
                      </a>
                    )}
                    {organization.telephone && (
                      <a 
                        href={`tel:${organization.telephone}`}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        電話でお問い合わせ
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  FAQはまだ公開されていません
                </h3>
                <p className="text-gray-600 mb-4">
                  現在準備中です。ご質問がございましたら、お気軽にお問い合わせください。
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {organization.email && (
                    <a 
                      href={`mailto:${organization.email}?subject=${encodeURIComponent('お問い合わせ')}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      メールでお問い合わせ
                    </a>
                  )}
                  {organization.telephone && (
                    <a 
                      href={`tel:${organization.telephone}`}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      電話でお問い合わせ
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 企業情報に戻るリンク */}
          <div className="mt-12 text-center">
            <Link 
              href={`/o/${organization.slug}`}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              {organization.name} トップページに戻る
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}