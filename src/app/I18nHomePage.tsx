'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useI18n } from '@/components/layout/I18nProvider';
import { useABTest } from '@/lib/utils/ab-testing';
import { useSEO } from '@/hooks/useSEO';

interface SiteSettings {
  hero_title: string;
  hero_subtitle: string;
  representative_message: string;
  footer_links: Array<{
    label: string;
    url: string;
    order?: number;
  }>;
}

interface I18nHomePageProps {
  siteSettings: SiteSettings;
}

export default function I18nHomePage({ siteSettings }: I18nHomePageProps) {
  const { t, formatNumber } = useI18n();
  const [dynamicStats, setDynamicStats] = useState({
    organizations: 1000,
    services: 5000,
    cases: 2500,
    categories: 50
  });
  const [isVisible, setIsVisible] = useState(false);
  
  // A/Bテスト: CTAボタンのテキスト
  const { variant: ctaVariant, trackConversion } = useABTest('hero_cta_text');
  
  // 動的な統計情報を取得
  useEffect(() => {
    const fetchDynamicStats = async () => {
      try {
        const response = await fetch('/api/public/stats');
        if (response.ok) {
          const stats = await response.json();
          setDynamicStats(stats);
        }
      } catch (error) {
        console.error('Failed to fetch dynamic stats:', error);
      }
    };
    
    fetchDynamicStats();
    setIsVisible(true);
  }, []);
  
  // SEO設定
  useSEO({
    title: t('pages.home.title'),
    description: t('pages.home.description'),
    canonical: 'https://aiohub.jp/',
    keywords: ['AI', 'CMS', '企業管理', 'DX', 'デジタル変革'],
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: t('ui.header.title'),
      description: t('pages.home.description'),
      url: 'https://aiohub.jp/'
    }
  });

  const getCtaText = () => {
    if (ctaVariant === 'variant_a') {
      return t('ui.common.tryFree');
    }
    return t('ui.common.getStarted');
  };

  const handleCtaClick = () => {
    trackConversion('signup_click');
  };

  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* ヒーローセクション */}
        <section className="relative py-20 overflow-hidden bg-gray-50">
          {/* 背景装飾 - より控えめに */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-xl"></div>
            <div className="absolute top-10 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-xl"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gray-200 rounded-full mix-blend-multiply filter blur-xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {t('pages.home.hero.title', { fallback: siteSettings.hero_title })}
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                {t('pages.home.hero.subtitle', { fallback: siteSettings.hero_subtitle })}
              </p>
              
              {/* 動的統計情報のプレビュー - グレー基調に */}
              <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  {formatNumber(dynamicStats.organizations)}+ 企業
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                  {formatNumber(dynamicStats.services)}+ サービス
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                  {formatNumber(dynamicStats.cases)}+ 導入事例
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/auth/signup" 
                  onClick={handleCtaClick}
                  className="group px-8 py-4 bg-gray-800 text-white text-lg rounded-lg hover:bg-gray-900 text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                  aria-label="無料で始める"
                >
                  <span className="flex items-center justify-center gap-2">
                    {getCtaText()}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <Link 
                  href="/organizations" 
                  className="group px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg rounded-lg hover:bg-gray-50 text-center transition-all duration-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
                  aria-label="企業ディレクトリを見る"
                >
                  <span className="flex items-center justify-center gap-2">
                    {t('pages.home.hero.viewDirectory')}
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 機能紹介 */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('pages.home.features.title')}
              </h2>
              <p className="text-lg text-gray-600">
                {t('pages.home.features.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 企業管理 */}
              <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('pages.home.features.organizationManagement.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('pages.home.features.organizationManagement.description')}
                </p>
                <div className="mt-4 flex items-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">詳しく見る</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* サービス管理 */}
              <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('pages.home.features.serviceManagement.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('pages.home.features.serviceManagement.description')}
                </p>
                <div className="mt-4 flex items-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">詳しく見る</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* 導入事例管理 */}
              <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('pages.home.features.caseManagement.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('pages.home.features.caseManagement.description')}
                </p>
                <div className="mt-4 flex items-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">詳しく見る</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 統計情報 */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('pages.home.stats.title')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                  <div className="text-4xl font-bold text-gray-700 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {formatNumber(dynamicStats.organizations)}+
                  </div>
                  <div className="text-gray-600 font-medium">
                    {t('pages.home.stats.organizations')}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    登録企業数
                  </div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                  <div className="text-4xl font-bold text-gray-700 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {formatNumber(dynamicStats.services)}+
                  </div>
                  <div className="text-gray-600 font-medium">
                    {t('pages.home.stats.services')}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    提供サービス数
                  </div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                  <div className="text-4xl font-bold text-gray-700 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {formatNumber(dynamicStats.cases)}+
                  </div>
                  <div className="text-gray-600 font-medium">
                    {t('pages.home.stats.cases')}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    成功事例数
                  </div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                  <div className="text-4xl font-bold text-gray-700 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {dynamicStats.categories}+
                  </div>
                  <div className="text-gray-600 font-medium">
                    {t('pages.home.stats.categories')}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    カテゴリー数
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* サービスの流れ */}
        <section id="service-flow" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                サービスの流れ
              </h2>
              <p className="text-lg text-gray-600">
                簡単3ステップで始められます
              </p>
            </div>

            <div className="relative">
              {/* 接続線 - グレー基調に */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 transform -translate-y-1/2 z-0"></div>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ステップ1: アカウント作成 */}
                <div className="text-center group">
                  <div className="relative mx-auto w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    アカウント作成
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    メールアドレスとパスワードで簡単にアカウントを作成。無料で始められます。
                  </p>
                </div>

                {/* ステップ2: 企業情報登録 */}
                <div className="text-center group">
                  <div className="relative mx-auto w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    企業情報登録
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    企業の基本情報を入力。必要最小限の項目のみで素早く登録完了。
                  </p>
                </div>

                {/* ステップ3: コンテンツ管理開始 */}
                <div className="text-center group">
                  <div className="relative mx-auto w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    コンテンツ管理開始
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    サービス情報や導入事例を追加して、効果的な企業PRを開始できます。
                  </p>
                </div>
              </div>
            </div>

            {/* 追加情報 */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center bg-gray-100 rounded-full px-6 py-3">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600 font-medium">
                  約5分で完了 • クレジットカード不要 • いつでも無料
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* AIOダイジェスト */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6v6m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              AI検索最適化（AIO）対応
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              本プラットフォームは、AI検索エンジンが理解しやすい構造化データを自動生成します
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900">JSON-LD</div>
                <div className="text-xs text-gray-600">構造化データ</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900">RSS/XML</div>
                <div className="text-xs text-gray-600">フィード配信</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900">OpenAPI</div>
                <div className="text-xs text-gray-600">API仕様公開</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900">サイトマップ</div>
                <div className="text-xs text-gray-600">動的生成</div>
              </div>
            </div>
            <Link 
              href="/aio"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              AIOについて詳しく見る
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* 代表メッセージ */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {t('pages.home.message.title')}
            </h2>
            <div className="text-lg text-gray-700 leading-relaxed">
              {t('pages.home.message.content', { fallback: siteSettings.representative_message })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 bg-gray-800 overflow-hidden">
          {/* 背景パターン */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full opacity-5"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                {t('pages.home.cta.title')}
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {t('pages.home.cta.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/auth/signup" 
                  onClick={handleCtaClick}
                  className="group px-8 py-4 bg-white text-gray-800 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
                >
                  <span className="flex items-center gap-3">
                    {t('pages.home.cta.button')}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                
                <Link 
                  href="/hearing-service"
                  className="group px-6 py-3 border-2 border-white text-white text-lg font-medium rounded-xl hover:bg-white hover:text-gray-800 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
                >
                  <span className="flex items-center gap-2">
                    ヒアリング代行サービス
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2" />
                    </svg>
                  </span>
                </Link>
                
                <div className="flex items-center text-gray-300 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  無料トライアル • クレジットカード不要
                </div>
              </div>
              
              {/* 信頼性バッジ */}
              <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="flex items-center text-gray-300 text-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  セキュリティ保証
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  99.9% 稼働率保証
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  24/7 サポート
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('ui.header.title')}</h3>
              <p className="text-gray-400">
                {t('pages.home.footer.tagline')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('pages.home.footer.links')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/organizations">{t('pages.home.footer.directory')}</Link></li>
                <li><Link href="/search">{t('pages.home.footer.search')}</Link></li>
                <li><Link href="/dashboard">{t('ui.header.dashboard')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('pages.home.footer.support')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">{t('pages.home.footer.helpCenter')}</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">{t('pages.home.footer.contact')}</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">{t('pages.home.footer.terms')}</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">{t('pages.home.footer.privacy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>{t('pages.home.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}