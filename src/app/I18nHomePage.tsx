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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main>
        {/* ヒーローセクション */}
        <section className="relative py-20 overflow-hidden">
          {/* 背景装飾 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-10 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                {t('pages.home.hero.title', { fallback: siteSettings.hero_title })}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                {t('pages.home.hero.subtitle', { fallback: siteSettings.hero_subtitle })}
              </p>
              
              {/* 動的統計情報のプレビュー */}
              <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  {formatNumber(dynamicStats.organizations)}+ 企業
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {formatNumber(dynamicStats.services)}+ サービス
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  {formatNumber(dynamicStats.cases)}+ 導入事例
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/auth/signup" 
                  onClick={handleCtaClick}
                  className="group px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                  className="group px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-lg rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
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
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('pages.home.features.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t('pages.home.features.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 企業管理 */}
              <div className="group bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-l-4 border-blue-500">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t('pages.home.features.organizationManagement.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('pages.home.features.organizationManagement.description')}
                </p>
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">詳しく見る</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* サービス管理 */}
              <div className="group bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-l-4 border-green-500">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t('pages.home.features.serviceManagement.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('pages.home.features.serviceManagement.description')}
                </p>
                <div className="mt-4 flex items-center text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">詳しく見る</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* 導入事例管理 */}
              <div className="group bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-l-4 border-purple-500">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t('pages.home.features.caseManagement.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('pages.home.features.caseManagement.description')}
                </p>
                <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('pages.home.stats.title')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {formatNumber(dynamicStats.organizations)}+
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    {t('pages.home.stats.organizations')}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    登録企業数
                  </div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {formatNumber(dynamicStats.services)}+
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    {t('pages.home.stats.services')}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    提供サービス数
                  </div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {formatNumber(dynamicStats.cases)}+
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    {t('pages.home.stats.cases')}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    成功事例数
                  </div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {dynamicStats.categories}+
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
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

        {/* 代表メッセージ */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              {t('pages.home.message.title')}
            </h2>
            <div className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('pages.home.message.content', { fallback: siteSettings.representative_message })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 overflow-hidden">
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
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                {t('pages.home.cta.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/auth/signup" 
                  onClick={handleCtaClick}
                  className="group px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
                >
                  <span className="flex items-center gap-3">
                    {t('pages.home.cta.button')}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                
                <div className="flex items-center text-blue-100 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  無料トライアル • クレジットカード不要
                </div>
              </div>
              
              {/* 信頼性バッジ */}
              <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="flex items-center text-blue-100 text-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  セキュリティ保証
                </div>
                <div className="flex items-center text-blue-100 text-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  99.9% 稼働率保証
                </div>
                <div className="flex items-center text-blue-100 text-sm">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('ui.header.title')}</h3>
              <p className="text-gray-400">
                {t('pages.home.footer.tagline')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('pages.home.footer.features')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/organizations" className="hover:text-white transition-colors">{t('pages.home.features.organizationManagement.title')}</Link></li>
                <li><Link href="/organizations" className="hover:text-white transition-colors">{t('pages.home.features.serviceManagement.title')}</Link></li>
                <li><Link href="/organizations" className="hover:text-white transition-colors">{t('pages.home.features.caseManagement.title')}</Link></li>
              </ul>
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