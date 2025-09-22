'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { getOrganizationBySlug } from '@/lib/organizations';
import { type Organization } from '@/types/database';

export default function OrganizationDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const result = await getOrganizationBySlug(slug);
        if (result.data) {
          setOrganization(result.data);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchOrganization();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!organization) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": organization.name,
    "description": organization.description,
    "url": organization.url,
    "logo": organization.logo_url,
    "email": organization.email_public ? organization.email : undefined,
    "telephone": organization.telephone,
    "foundingDate": organization.founded,
    "legalName": organization.name,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": organization.address_country,
      "addressRegion": organization.address_region,
      "addressLocality": organization.address_locality,
      "streetAddress": organization.address_street,
      "postalCode": organization.address_postal_code
    },
    "sameAs": organization.same_as || []
  };

  return (
    <>
      <Head>
        <title>{organization.meta_title || `${organization.name} - LuxuCare企業ディレクトリ`}</title>
        <meta 
          name="description" 
          content={organization.meta_description || organization.description} 
        />
        {organization.meta_keywords && (
          <meta name="keywords" content={organization.meta_keywords.join(', ')} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                  LuxuCare AI企業CMS
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
                  企業ディレクトリ
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{organization.name}</span>
              </li>
            </ol>
          </nav>

          {/* 企業情報 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* ヘッダー部分 */}
            <div className="px-6 py-8 sm:p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {organization.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={`${organization.name}のロゴ`}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-2xl">
                        {organization.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="ml-6">
                    <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                    {organization.legal_form && (
                      <p className="text-lg text-gray-600 mt-1">{organization.legal_form}</p>
                    )}
                    {organization.industries && organization.industries.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {organization.industries.map((industry, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {organization.url && (
                  <Link
                    href={organization.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    公式サイトを開く
                  </Link>
                )}
              </div>

              {organization.description && (
                <div className="mt-6">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {organization.description}
                  </p>
                </div>
              )}
            </div>

            {/* 詳細情報 */}
            <div className="border-t border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8">
                {/* 基本情報 */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
                  <dl className="space-y-3">
                    {organization.representative_name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">代表者</dt>
                        <dd className="mt-1 text-sm text-gray-900">{organization.representative_name}</dd>
                      </div>
                    )}
                    {organization.founded && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">設立</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(organization.founded).toLocaleDateString('ja-JP')}
                        </dd>
                      </div>
                    )}
                    {organization.capital && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">資本金</dt>
                        <dd className="mt-1 text-sm text-gray-900">{organization.capital.toLocaleString()}万円</dd>
                      </div>
                    )}
                    {organization.employees && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">従業員数</dt>
                        <dd className="mt-1 text-sm text-gray-900">{organization.employees.toLocaleString()}名</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* 連絡先情報 */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">連絡先</h2>
                  <dl className="space-y-3">
                    {/* 住所 */}
                    {(organization.address_region || organization.address_locality || organization.address_street) && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">所在地</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {organization.address_postal_code && `〒${organization.address_postal_code} `}
                          {organization.address_region}
                          {organization.address_locality}
                          {organization.address_street}
                        </dd>
                      </div>
                    )}
                    {organization.telephone && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a href={`tel:${organization.telephone}`} className="hover:text-blue-600">
                            {organization.telephone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {organization.email_public && organization.email && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a href={`mailto:${organization.email}`} className="hover:text-blue-600">
                            {organization.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {organization.url && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">ウェブサイト</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a 
                            href={organization.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {organization.url}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            {/* サービス一覧 */}
            {organization.services && organization.services.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">提供サービス</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organization.services.map((service) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start">
                          {service.logo_url ? (
                            <img
                              src={service.logo_url}
                              alt={`${service.name}のロゴ`}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-gray-600 font-semibold">
                                {service.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="ml-3 flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                            {service.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            {service.categories && service.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {service.categories.slice(0, 2).map((category, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                  >
                                    {category}
                                  </span>
                                ))}
                                {service.categories.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    +{service.categories.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center space-x-3 mt-3 text-xs text-gray-500">
                              {service.api_available && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  API提供
                                </span>
                              )}
                              {service.free_trial && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  無料トライアル
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 事例一覧 */}
            {organization.case_studies && organization.case_studies.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">導入事例</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {organization.case_studies.map((caseStudy) => (
                      <div key={caseStudy.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{caseStudy.title}</h3>
                            {!caseStudy.is_anonymous && caseStudy.client_name && (
                              <p className="text-sm text-gray-600 mt-1">
                                {caseStudy.client_name}
                                {caseStudy.client_industry && ` - ${caseStudy.client_industry}`}
                              </p>
                            )}
                          </div>
                          {caseStudy.thumbnail_url && (
                            <img
                              src={caseStudy.thumbnail_url}
                              alt={caseStudy.title}
                              className="w-16 h-16 rounded-lg object-cover ml-4"
                            />
                          )}
                        </div>
                        
                        {caseStudy.problem && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700">課題</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseStudy.problem}</p>
                          </div>
                        )}
                        
                        {caseStudy.solution && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-gray-700">解決策</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseStudy.solution}</p>
                          </div>
                        )}
                        
                        {caseStudy.outcome && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-gray-700">成果</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseStudy.outcome}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FAQ */}
            {organization.faqs && organization.faqs.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">よくある質問</h2>
                  <div className="space-y-4">
                    {organization.faqs
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((faq) => (
                        <div key={faq.id} className="border border-gray-200 rounded-lg">
                          <details className="group">
                            <summary className="flex items-center justify-between p-4 cursor-pointer">
                              <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                              <svg 
                                className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <div className="px-4 pb-4">
                              <p className="text-gray-600 whitespace-pre-wrap">{faq.answer}</p>
                            </div>
                          </details>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="mt-12 text-center">
            <Link 
              href="/organizations"
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              企業ディレクトリに戻る
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}