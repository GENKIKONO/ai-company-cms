'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Organization } from '@/types';

interface Stats {
  totalOrganizations: number;
  totalPartners: number;
  totalIndustries: number;
  featuredOrganizations: Organization[];
}

interface Props {
  stats: Stats;
}

export default function LandingPage({ stats }: Props) {
  useEffect(() => {
    // Analytics: ページビュー追跡
    // trackPageView({
    //   url: '/',
    //   referrer: document.referrer,
    //   title: 'AIO Hub - AI企業ディレクトリ',
    // });

  }, [stats]);

  const handleCTAClick = (action: string) => {
  };

  const handleOrganizationClick = (organization: Organization) => {
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">AIO Hub</h1>
              <span className="ml-2 text-sm text-gray-500">AI企業ディレクトリ</span>
            </div>
            <nav className="flex space-x-4">
              <Link 
                href="/directory" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                企業一覧
              </Link>
              <Link 
                href="/favorites" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                お気に入り
              </Link>
              <Link 
                href="/dashboard" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                onClick={() => handleCTAClick('header_dashboard')}
              >
                ダッシュボード
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>
        {/* ヒーローセクション */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                AIが支える<br />
                <span className="text-indigo-600">企業情報プラットフォーム</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                AIO Hubは企業情報を効率的に管理・公開できるAI企業ディレクトリプラットフォームです。
                SEO最適化、構造化データ、自動テキスト抽出で企業の魅力を最大限に伝えます。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/directory"
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
                  onClick={() => handleCTAClick('hero_directory')}
                >
                  📁 企業ディレクトリを見る
                </Link>
                <Link
                  href="/dashboard"
                  className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-50 transition-colors"
                  onClick={() => handleCTAClick('hero_dashboard')}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  管理画面にログイン
                </Link>
              </div>
            </div>
          </div>

          {/* 背景デコレーション */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-96 h-96 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          </div>
        </section>

        {/* 統計セクション */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {stats.totalOrganizations.toLocaleString()}
                </div>
                <div className="text-lg text-gray-600">登録企業数</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {stats.totalPartners.toLocaleString()}
                </div>
                <div className="text-lg text-gray-600">アクティブパートナー</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {stats.totalIndustries.toLocaleString()}
                </div>
                <div className="text-lg text-gray-600">対応業界数</div>
              </div>
            </div>
          </div>
        </section>

        {/* 注目企業セクション */}
        {stats.featuredOrganizations.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  注目の企業
                </h2>
                <p className="text-lg text-gray-600">
                  最近登録された企業をご紹介します
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stats.featuredOrganizations.map((organization) => (
                  <Link
                    key={organization.id}
                    href={`/o/${organization.slug}`}
                    onClick={() => handleOrganizationClick(organization)}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        {organization.logo_url && (
                          <Image
                            src={organization.logo_url}
                            alt={`${organization.name}のロゴ`}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {organization.name}
                          </h3>
                          {organization.address_region && (
                            <p className="text-sm text-gray-600">
                              📍 {organization.address_region}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {organization.industries && organization.industries.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {organization.industries.slice(0, 2).map((industry) => (
                            <span
                              key={industry}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {industry}
                            </span>
                          ))}
                          {organization.industries.length > 2 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{organization.industries.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-12">
                <Link
                  href="/directory"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  onClick={() => handleCTAClick('featured_see_all')}
                >
                  すべての企業を見る →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 機能紹介セクション */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              主要機能
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 機能1 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-indigo-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">企業情報管理</h3>
                <p className="text-gray-600">
                  企業の基本情報、サービス、導入事例、FAQを一元管理。
                  リアルタイムプレビューで確認しながら編集できます。
                </p>
              </div>

              {/* 機能2 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">SEO最適化</h3>
                <p className="text-gray-600">
                  JSON-LD構造化データ自動生成、OGP対応、
                  検索エンジン最適化されたページを自動作成します。
                </p>
              </div>

              {/* 機能3 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 6v6m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AIが読み取りやすい構造で自動出力</h3>
                <p className="text-gray-600">
                  入力された情報をもとに、AI検索に最適な
                  構造化データ・フィードを自動生成します。
                </p>
              </div>

              {/* 機能4 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">パートナー連携</h3>
                <p className="text-gray-600">
                  代理店・パートナー企業による企業情報管理。
                  承認フローと収益配分システムを提供します。
                </p>
              </div>

              {/* 機能5 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">詳細分析</h3>
                <p className="text-gray-600">
                  Plausible Analytics連携によるアクセス解析。
                  パフォーマンス監視とエラー通知システム。
                </p>
              </div>

              {/* 機能6 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a4 4 0 01-4 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">OGP生成</h3>
                <p className="text-gray-600">
                  動的なソーシャルメディア画像生成。
                  カスタマイズ可能なテンプレートで魅力的な画像を自動作成。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 技術スタックセクション */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              技術スタック
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-2">
                  <div className="text-2xl font-bold text-gray-900">Next.js 14</div>
                </div>
                <div className="text-sm text-gray-600">App Router + TypeScript</div>
              </div>
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-2">
                  <div className="text-2xl font-bold text-green-600">Supabase</div>
                </div>
                <div className="text-sm text-gray-600">PostgreSQL + Auth + RLS</div>
              </div>
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-2">
                  <div className="text-2xl font-bold text-purple-600">Stripe</div>
                </div>
                <div className="text-sm text-gray-600">決済・サブスクリプション</div>
              </div>
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-2">
                  <div className="text-2xl font-bold text-blue-600">Tailwind</div>
                </div>
                <div className="text-sm text-gray-600">CSS Framework</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA セクション */}
        <section className="py-20 bg-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              今すぐ始めてみましょう
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              企業情報の管理から公開まで、すべてを一つのプラットフォームで
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/directory"
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
                onClick={() => handleCTAClick('cta_directory')}
              >
                📁 企業ディレクトリを見る
              </Link>
              <Link
                href="/dashboard"
                className="border border-white text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
                onClick={() => handleCTAClick('cta_dashboard')}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                管理画面へログイン
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">AIO Hub</h3>
              <p className="text-gray-400">AI対応企業ディレクトリプラットフォーム</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/directory" className="text-gray-400 hover:text-white">企業一覧</Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white">ダッシュボード</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AIO Hub. AI企業ディレクトリプラットフォーム - Next.js, Supabase, Stripe で構築</p>
          </div>
        </div>
      </footer>
    </div>
  );
}