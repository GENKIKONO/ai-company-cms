'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SAMPLE_ORGANIZATION, SAMPLE_SERVICES, SAMPLE_FAQS, SAMPLE_CASE_STUDIES } from '@/lib/development-helpers';

export default function DemoDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'faqs' | 'cases' | 'preview'>('overview');
  const [organization] = useState(SAMPLE_ORGANIZATION);
  const [services] = useState(SAMPLE_SERVICES);
  const [faqs] = useState(SAMPLE_FAQS);
  const [caseStudies] = useState(SAMPLE_CASE_STUDIES);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                LuxuCare
              </Link>
              <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                デモモード
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/demo"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                公開ページを見る
              </Link>
              <Link
                href="/"
                className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {organization.name} - 管理ダッシュボード
          </h1>
          <p className="text-gray-600">
            企業情報の管理・編集・公開設定を行います（デモモード）
          </p>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '概要', icon: '📊' },
              { id: 'services', label: 'サービス', icon: '🛠️' },
              { id: 'faqs', label: 'FAQ', icon: '❓' },
              { id: 'cases', label: '導入事例', icon: '📈' },
              { id: 'preview', label: 'プレビュー', icon: '👁️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* タブコンテンツ */}
        <div className="space-y-6">
          {/* 概要タブ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 統計カード */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="text-3xl text-blue-500 mr-4">🛠️</div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{services.length}</div>
                      <div className="text-sm text-gray-600">サービス</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="text-3xl text-green-500 mr-4">📈</div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{caseStudies.length}</div>
                      <div className="text-sm text-gray-600">導入事例</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="text-3xl text-purple-500 mr-4">❓</div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{faqs.length}</div>
                      <div className="text-sm text-gray-600">FAQ</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 企業情報カード */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">企業情報</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">ステータス:</span>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      公開中
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">最終更新:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(organization.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">公開日:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(organization.published_at!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* サービスタブ */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">サービス管理</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  新規サービス追加
                </button>
              </div>
              
              <div className="grid gap-4">
                {services.map((service) => (
                  <div key={service.id} className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{service.name}</h3>
                        {service.category && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-2">
                            {service.category}
                          </span>
                        )}
                        <p className="text-gray-700 text-sm mb-3">{service.summary}</p>
                        <div className="text-sm text-gray-600">
                          料金: {service.price}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          編集
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQタブ */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">FAQ管理</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  新規FAQ追加
                </button>
              </div>
              
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {faq.sort_order}
                          </span>
                          <h3 className="text-lg font-medium text-gray-900">
                            Q. {faq.question}
                          </h3>
                        </div>
                        <p className="text-gray-700 text-sm">A. {faq.answer}</p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          ↑
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          ↓
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          編集
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 導入事例タブ */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">導入事例管理</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  新規事例追加
                </button>
              </div>
              
              <div className="grid gap-4">
                {caseStudies.map((caseStudy) => (
                  <div key={caseStudy.id} className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{caseStudy.title}</h3>
                        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded">{caseStudy.client_type}</span>
                          {caseStudy.is_anonymous ? (
                            <span className="text-orange-600">匿名</span>
                          ) : (
                            <span>{caseStudy.client_name}</span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-2">{caseStudy.outcome}</p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          編集
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* プレビュータブ */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">プレビュー・公開管理</h2>
                <div className="flex space-x-3">
                  <Link
                    href="/demo"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    公開ページを見る
                  </Link>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                    再公開
                  </button>
                </div>
              </div>
              
              <div className="grid gap-6">
                {/* 公開ステータス */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">公開ステータス</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">現在のステータス</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        公開中
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">最終公開日</span>
                      <span className="text-sm text-gray-900">
                        {new Date(organization.published_at!).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">公開URL</span>
                      <Link 
                        href="/demo" 
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        /o/{organization.slug}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* JSON-LD検証 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">構造化データ検証</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Organization Schema</span>
                      <span className="text-green-600 text-sm">✓ 有効</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Service Schema</span>
                      <span className="text-green-600 text-sm">✓ 有効 ({services.length}件)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">FAQ Schema</span>
                      <span className="text-green-600 text-sm">✓ 有効 ({faqs.length}件)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Case Study Schema</span>
                      <span className="text-green-600 text-sm">✓ 有効 ({caseStudies.length}件)</span>
                    </div>
                  </div>
                </div>

                {/* SEO情報 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">SEO情報</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">ページタイトル:</span>
                      <div className="mt-1 text-gray-900">{organization.name} | LuxuCare</div>
                    </div>
                    <div>
                      <span className="text-gray-600">メタディスクリプション:</span>
                      <div className="mt-1 text-gray-900 line-clamp-2">{organization.description}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">OGP画像:</span>
                      <div className="mt-1 text-gray-900">
                        {organization.logo_url ? '設定済み' : '未設定'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}