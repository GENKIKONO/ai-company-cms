'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { trackOrganizationView, trackExternalLink } from '@/lib/analytics';
import { OrganizationPageData, Organization } from '@/types';
import FavoriteButton from '@/components/FavoriteButton';
import { recommendationEngine } from '@/lib/recommendations';

interface Props {
  data: OrganizationPageData;
}

export default function OrganizationPublicPage({ data }: Props) {
  const { organization, partner } = data;
  const [similarOrganizations, setSimilarOrganizations] = useState<Organization[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  useEffect(() => {
    // Analytics: ページビュー追跡
    trackOrganizationView(organization.slug, organization.name);
    
    // 類似企業を取得
    loadSimilarOrganizations();
  }, [organization.slug, organization.name]);

  const loadSimilarOrganizations = async () => {
    try {
      const similar = await recommendationEngine.getSimilarOrganizations(organization.id, 6);
      setSimilarOrganizations(similar);
    } catch (error) {
      console.error('Failed to load similar organizations:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleExternalLinkClick = (url: string) => {
    trackExternalLink(url, organization.slug);
  };

  const formatAddress = () => {
    const parts = [
      organization.postal_code && `〒${organization.postal_code}`,
      organization.address_region,
      organization.address_locality,
      organization.street_address
    ].filter(Boolean);
    
    return parts.join(' ');
  };

  const formatPhoneNumber = (phone: string) => {
    // E.164形式から表示用に変換
    if (phone.startsWith('+81')) {
      return phone.replace('+81', '0').replace(/(\d{2,3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {organization.logo_url && (
                <img
                  src={organization.logo_url}
                  alt={`${organization.name}のロゴ`}
                  className="h-12 w-auto"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                    <p className="text-sm text-gray-600">{organization.legal_form}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FavoriteButton
                      organization={{
                        id: organization.id,
                        name: organization.name,
                        slug: organization.slug,
                        logo_url: organization.logo_url,
                        industries: organization.industries,
                        address_region: organization.address_region,
                      }}
                      variant="button"
                      size="md"
                    />
                    <Link
                      href={`/compare?ids=${organization.id}`}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                    >
                      比較に追加
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {partner && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Powered by</span>
                {partner.brand_logo_url ? (
                  <img
                    src={partner.brand_logo_url}
                    alt={partner.name}
                    className="h-6 w-auto"
                  />
                ) : (
                  <span className="font-medium">{partner.name}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-8">
            {/* 企業概要 */}
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">企業概要</h2>
              <p className="text-gray-700 leading-relaxed">{organization.description}</p>
              
              {organization.industries && organization.industries.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">業界</h3>
                  <div className="flex flex-wrap gap-2">
                    {organization.industries.map((industry, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* サービス一覧 */}
            {organization.services.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">サービス</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {organization.services.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{service.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                      
                      {service.features && service.features.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">特徴</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {service.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {service.price_range && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">料金: </span>
                          <span className="text-sm text-gray-600">{service.price_range}</span>
                        </div>
                      )}
                      
                      {service.url && (
                        <a
                          href={service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleExternalLinkClick(service.url)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          詳細を見る →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 導入事例 */}
            {organization.case_studies.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">導入事例</h2>
                <div className="space-y-6">
                  {organization.case_studies.map((caseStudy) => (
                    <div key={caseStudy.id} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{caseStudy.title}</h3>
                      
                      {!caseStudy.is_anonymous && (
                        <div className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">{caseStudy.client_name}</span>
                          {caseStudy.client_industry && (
                            <span className="ml-2">({caseStudy.client_industry})</span>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-3 text-sm">
                        {caseStudy.problem && (
                          <div>
                            <h4 className="font-medium text-gray-700">課題</h4>
                            <p className="text-gray-600">{caseStudy.problem}</p>
                          </div>
                        )}
                        
                        {caseStudy.solution && (
                          <div>
                            <h4 className="font-medium text-gray-700">解決策</h4>
                            <p className="text-gray-600">{caseStudy.solution}</p>
                          </div>
                        )}
                        
                        {caseStudy.outcome && (
                          <div>
                            <h4 className="font-medium text-gray-700">効果</h4>
                            <p className="text-gray-600">{caseStudy.outcome}</p>
                          </div>
                        )}
                        
                        {caseStudy.metrics && Object.keys(caseStudy.metrics).length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700">具体的な成果</h4>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {Object.entries(caseStudy.metrics).map(([key, value]) => (
                                <div key={key} className="text-center p-2 bg-gray-50 rounded">
                                  <div className="font-semibold text-blue-600">{value}</div>
                                  <div className="text-xs text-gray-500">{key}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* よくある質問 */}
            {organization.faqs.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">よくある質問</h2>
                <div className="space-y-4">
                  {organization.faqs.map((faq) => (
                    <details key={faq.id} className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <h3 className="font-medium text-gray-900">{faq.question}</h3>
                        <svg
                          className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-4 px-4 pb-4">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 企業情報 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">企業情報</h3>
              <div className="space-y-3 text-sm">
                {organization.representative_name && (
                  <div>
                    <span className="font-medium text-gray-700">代表者:</span>
                    <span className="ml-2 text-gray-600">{organization.representative_name}</span>
                  </div>
                )}
                
                {organization.founded && (
                  <div>
                    <span className="font-medium text-gray-700">設立:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(organization.founded).getFullYear()}年
                    </span>
                  </div>
                )}
                
                {organization.capital && (
                  <div>
                    <span className="font-medium text-gray-700">資本金:</span>
                    <span className="ml-2 text-gray-600">
                      {organization.capital.toLocaleString()}円
                    </span>
                  </div>
                )}
                
                {organization.employees && (
                  <div>
                    <span className="font-medium text-gray-700">従業員数:</span>
                    <span className="ml-2 text-gray-600">{organization.employees}名</span>
                  </div>
                )}
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">連絡先</h3>
              <div className="space-y-3 text-sm">
                {formatAddress() && (
                  <div>
                    <span className="font-medium text-gray-700">住所:</span>
                    <p className="mt-1 text-gray-600">{formatAddress()}</p>
                  </div>
                )}
                
                {organization.telephone && (
                  <div>
                    <span className="font-medium text-gray-700">電話:</span>
                    <a
                      href={`tel:${organization.telephone}`}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      {formatPhoneNumber(organization.telephone)}
                    </a>
                  </div>
                )}
                
                {organization.email && organization.email_public && (
                  <div>
                    <span className="font-medium text-gray-700">メール:</span>
                    <a
                      href={`mailto:${organization.email}`}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      {organization.email}
                    </a>
                  </div>
                )}
                
                {organization.url && (
                  <div>
                    <span className="font-medium text-gray-700">Webサイト:</span>
                    <a
                      href={organization.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleExternalLinkClick(organization.url!)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      公式サイト →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* SNSリンク */}
            {organization.same_as && organization.same_as.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SNS</h3>
                <div className="space-y-2">
                  {organization.same_as.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleExternalLinkClick(url)}
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {new URL(url).hostname} →
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 類似企業セクション */}
        {similarOrganizations.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="border-t border-gray-200 pt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">類似企業</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarOrganizations.map((similarOrg) => (
                  <div key={similarOrg.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden border">
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        {similarOrg.logo_url && (
                          <div className="flex-shrink-0">
                            <Image
                              src={similarOrg.logo_url}
                              alt={`${similarOrg.name}のロゴ`}
                              width={48}
                              height={48}
                              className="rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {similarOrg.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {similarOrg.description}
                              </p>
                            </div>
                            <FavoriteButton
                              organization={similarOrg}
                              variant="icon"
                              size="sm"
                              className="ml-2"
                            />
                          </div>
                          
                          {similarOrg.industries && similarOrg.industries.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {similarOrg.industries.slice(0, 2).map((industry) => (
                                <span
                                  key={industry}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {industry}
                                </span>
                              ))}
                              {similarOrg.industries.length > 2 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  +{similarOrg.industries.length - 2}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-4 flex space-x-2">
                            <Link
                              href={`/o/${similarOrg.slug}`}
                              className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                              詳細を見る
                            </Link>
                            <Link
                              href={`/compare?ids=${organization.id},${similarOrg.id}`}
                              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                            >
                              比較
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loadingSimilar && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="border-t border-gray-200 pt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">類似企業</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="flex space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} {organization.name}. All rights reserved.</p>
            <p className="mt-2">
              Powered by{' '}
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                LuxuCare
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}