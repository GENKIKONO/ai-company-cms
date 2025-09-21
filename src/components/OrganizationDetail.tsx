'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { favorites } from '@/lib/auth';
import { type Organization } from '@/types/database';

interface OrganizationDetailProps {
  organization: Organization;
}

export function OrganizationDetail({ organization }: OrganizationDetailProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, organization.id]);

  const checkFavoriteStatus = async () => {
    if (!user) return;
    
    try {
      const favorited = await favorites.check(user.id, organization.id);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (isFavorited) {
        await favorites.remove(user.id, organization.id);
        setIsFavorited(false);
      } else {
        await favorites.add(user.id, organization.id);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              {/* ロゴ */}
              {organization.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={organization.logo_url}
                    alt={`${organization.name} logo`}
                    className="h-24 w-auto object-contain rounded-lg"
                  />
                </div>
              )}

              {/* 基本情報 */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {organization.name}
                </h1>
                
                {organization.description && (
                  <p className="mt-2 text-lg text-gray-600 max-w-3xl">
                    {organization.description}
                  </p>
                )}

                {/* 業界タグ */}
                {organization.industries && organization.industries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {organization.industries.map((industry) => (
                      <span
                        key={industry}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                )}

                {/* 基本統計 */}
                <div className="flex space-x-6 mt-4 text-sm text-gray-600">
                  {organization.services && (
                    <span>サービス: {organization.services.length}</span>
                  )}
                  {organization.case_studies && (
                    <span>導入事例: {organization.case_studies.length}</span>
                  )}
                  {organization.faqs && (
                    <span>FAQ: {organization.faqs.length}</span>
                  )}
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex space-x-2">
              {user && (
                <button
                  onClick={toggleFavorite}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isFavorited
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {loading ? '...' : isFavorited ? '❤️ お気に入り解除' : '🤍 お気に入り追加'}
                </button>
              )}
              
              {organization.url && (
                <a
                  href={organization.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  🔗 公式サイト
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-8">
            {/* サービス一覧 */}
            {organization.services && organization.services.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">サービス</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organization.services.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {service.description}
                        </p>
                      )}
                      
                      {/* 機能リスト */}
                      {service.features && service.features.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">主要機能:</h4>
                          <ul className="list-disc list-inside text-xs text-gray-600">
                            {service.features.slice(0, 3).map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 価格・その他情報 */}
                      <div className="flex justify-between items-center text-sm">
                        {service.price_range && (
                          <span className="text-green-600 font-medium">
                            {service.price_range}
                          </span>
                        )}
                        {service.url && (
                          <a
                            href={service.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            詳細 →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 導入事例 */}
            {organization.case_studies && organization.case_studies.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">導入事例</h2>
                <div className="space-y-6">
                  {organization.case_studies.map((caseStudy) => (
                    <div key={caseStudy.id} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {caseStudy.title}
                      </h3>
                      
                      {!caseStudy.is_anonymous && caseStudy.client_name && (
                        <p className="text-sm text-gray-600 mb-2">
                          クライアント: {caseStudy.client_name}
                          {caseStudy.client_industry && ` (${caseStudy.client_industry})`}
                        </p>
                      )}

                      {caseStudy.problem && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700">課題:</h4>
                          <p className="text-sm text-gray-600">{caseStudy.problem}</p>
                        </div>
                      )}

                      {caseStudy.solution && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700">解決策:</h4>
                          <p className="text-sm text-gray-600">{caseStudy.solution}</p>
                        </div>
                      )}

                      {caseStudy.outcome && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700">成果:</h4>
                          <p className="text-sm text-gray-600">{caseStudy.outcome}</p>
                        </div>
                      )}

                      {/* 成果指標 */}
                      {caseStudy.metrics && Object.keys(caseStudy.metrics).length > 0 && (
                        <div className="flex flex-wrap gap-4 mt-2">
                          {Object.entries(caseStudy.metrics).map(([key, value]) => (
                            <div key={key} className="bg-green-50 px-3 py-1 rounded text-sm">
                              <span className="font-medium text-green-800">{key}:</span>
                              <span className="text-green-600 ml-1">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ */}
            {organization.faqs && organization.faqs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">よくある質問</h2>
                <div className="space-y-4">
                  {organization.faqs.map((faq) => (
                    <div key={faq.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Q: {faq.question}
                      </h3>
                      <p className="text-gray-600">
                        A: {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 企業情報 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">企業情報</h2>
              
              <div className="space-y-3 text-sm">
                {organization.legal_form && (
                  <div>
                    <span className="font-medium text-gray-700">法人格:</span>
                    <span className="ml-2 text-gray-600">{organization.legal_form}</span>
                  </div>
                )}

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
                      {new Date(organization.founded).toLocaleDateString('ja-JP')}
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">連絡先</h2>
              
              <div className="space-y-3 text-sm">
                {(organization.address_region || organization.address_locality || organization.street_address) && (
                  <div>
                    <span className="font-medium text-gray-700">住所:</span>
                    <div className="ml-2 text-gray-600">
                      {organization.postal_code && `〒${organization.postal_code}`}<br />
                      {organization.address_region}{organization.address_locality}<br />
                      {organization.street_address}
                    </div>
                  </div>
                )}

                {organization.telephone && (
                  <div>
                    <span className="font-medium text-gray-700">電話:</span>
                    <span className="ml-2 text-gray-600">{organization.telephone}</span>
                  </div>
                )}

                {organization.email && organization.email_public && (
                  <div>
                    <span className="font-medium text-gray-700">メール:</span>
                    <a 
                      href={`mailto:${organization.email}`}
                      className="ml-2 text-blue-600 hover:text-blue-700"
                    >
                      {organization.email}
                    </a>
                  </div>
                )}

                {organization.url && (
                  <div>
                    <span className="font-medium text-gray-700">ウェブサイト:</span>
                    <a 
                      href={organization.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-700"
                    >
                      {organization.url}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 戻るリンク */}
            <div className="bg-white rounded-lg shadow p-6">
              <Link
                href="/organizations"
                className="block w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← 企業一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}