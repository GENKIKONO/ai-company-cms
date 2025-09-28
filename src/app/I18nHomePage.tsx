'use client';

import Link from 'next/link';
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
  
  // A/Bテスト: CTAボタンのテキスト
  const { variant: ctaVariant, trackConversion } = useABTest('hero_cta_text');
  
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
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {t('pages.home.hero.title', { fallback: siteSettings.hero_title })}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                {t('pages.home.hero.subtitle', { fallback: siteSettings.hero_subtitle })}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/auth/signup" 
                  onClick={handleCtaClick}
                  className="px-8 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 text-center transition-colors"
                >
                  {getCtaText()}
                </Link>
                <Link 
                  href="/organizations" 
                  className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-lg rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center transition-colors"
                >
                  {t('pages.home.hero.viewDirectory')}
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
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('pages.home.features.organizationManagement.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('pages.home.features.organizationManagement.description')}
                </p>
              </div>

              {/* サービス管理 */}
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('pages.home.features.serviceManagement.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('pages.home.features.serviceManagement.description')}
                </p>
              </div>

              {/* 導入事例管理 */}
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('pages.home.features.caseManagement.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('pages.home.features.caseManagement.description')}
                </p>
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
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {formatNumber(1000)}+
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {t('pages.home.stats.organizations')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {formatNumber(5000)}+
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {t('pages.home.stats.services')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {formatNumber(2500)}+
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {t('pages.home.stats.cases')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  50+
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {t('pages.home.stats.categories')}
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
        <section className="py-20 bg-blue-600 dark:bg-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('pages.home.cta.title')}
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {t('pages.home.cta.subtitle')}
            </p>
            <Link 
              href="/auth/signup" 
              onClick={handleCtaClick}
              className="px-8 py-3 bg-white text-blue-600 text-lg rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t('pages.home.cta.button')}
            </Link>
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
                <li>{t('pages.home.features.organizationManagement.title')}</li>
                <li>{t('pages.home.features.serviceManagement.title')}</li>
                <li>{t('pages.home.features.caseManagement.title')}</li>
                <li>{t('pages.home.footer.search')}</li>
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