import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Locale } from '@/i18n';
import { generateMetadata as generateLocalizedMetadata, generateStructuredData } from '@/lib/metadata';
// import RecommendationsContainer from '@/components/RecommendationSection';
// import SmartSearchBox from '@/components/SmartSearchBox';

export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }): Promise<Metadata> {
  return generateLocalizedMetadata(locale);
}

interface HomePageProps {
  params: {
    locale: Locale;
  };
}

export default async function HomePage({ params: { locale } }: HomePageProps) {
  const t = await getTranslations();
  const structuredData = generateStructuredData(locale, 'website');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">LuxuCare</h1>
              <span className="ml-2 text-sm text-gray-500">{t('common.tagline')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                <Link 
                  href={`/${locale}/directory`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.directory')}
                </Link>
                <Link 
                  href={`/${locale}/search`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.advancedSearch')}
                </Link>
                <Link 
                  href={`/${locale}/api/docs`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.api')}
                </Link>
                <Link 
                  href={`/${locale}/favorites`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.favorites')}
                </Link>
                <Link 
                  href={`/${locale}/compare`}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.compare')}
                </Link>
                <Link 
                  href={`/${locale}/dashboard`}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  {t('navigation.dashboard')}
                </Link>
              </nav>
              <LanguageSwitcher currentLocale={locale} />
            </div>
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
                {t('homepage.hero.title1')}<br />
                <span className="text-indigo-600">{t('homepage.hero.title2')}</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                {t('homepage.hero.description')}
              </p>
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <input
                    type="text"
                    placeholder={t('homepage.hero.searchPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/${locale}/directory`}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  📁 {t('homepage.hero.viewDirectory')}
                </Link>
                <Link
                  href={`/${locale}/dashboard`}
                  className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-50 transition-colors"
                >
                  🚀 {t('homepage.hero.loginDashboard')}
                </Link>
              </div>
            </div>
          </div>

          {/* 背景デコレーション */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-96 h-96 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          </div>
        </section>

        {/* 機能紹介セクション */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              {t('homepage.features.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 機能1 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('homepage.features.management.title')}</h3>
                <p className="text-gray-600">
                  {t('homepage.features.management.description')}
                </p>
              </div>

              {/* 機能2 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('homepage.features.seo.title')}</h3>
                <p className="text-gray-600">
                  {t('homepage.features.seo.description')}
                </p>
              </div>

              {/* 機能3 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('homepage.features.ai.title')}</h3>
                <p className="text-gray-600">
                  {t('homepage.features.ai.description')}
                </p>
              </div>

              {/* 機能4 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">💳</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('homepage.features.subscription.title')}</h3>
                <p className="text-gray-600">
                  {t('homepage.features.subscription.description')}
                </p>
              </div>

              {/* 機能5 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('homepage.features.approval.title')}</h3>
                <p className="text-gray-600">
                  {t('homepage.features.approval.description')}
                </p>
              </div>

              {/* 機能6 */}
              <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('homepage.features.analytics.title')}</h3>
                <p className="text-gray-600">
                  {t('homepage.features.analytics.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 推薦企業セクション */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              {t('homepage.recommendations.title')}
            </h2>
            <div className="text-center text-gray-600">
              <p>{t('homepage.recommendations.placeholder')}</p>
            </div>
            <div className="text-center mt-8">
              <Link
                href={`/${locale}/directory`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {t('homepage.recommendations.viewAll')}
                <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* 技術スタックセクション */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              {t('homepage.techStack.title')}
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
              {t('homepage.cta.title')}
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              {t('homepage.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/directory`}
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
              >
                📁 {t('homepage.cta.viewDirectory')}
              </Link>
              <Link
                href={`/${locale}/dashboard`}
                className="border border-white text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                🚀 {t('homepage.cta.loginDashboard')}
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
              <h3 className="text-xl font-bold">LuxuCare</h3>
              <p className="text-gray-400">{t('common.tagline')}</p>
            </div>
            <div className="flex space-x-6">
              <Link href={`/${locale}/directory`} className="text-gray-400 hover:text-white">{t('navigation.directory')}</Link>
              <Link href={`/${locale}/search`} className="text-gray-400 hover:text-white">{t('navigation.advancedSearch')}</Link>
              <Link href={`/${locale}/api/docs`} className="text-gray-400 hover:text-white">{t('navigation.api')}</Link>
              <Link href={`/${locale}/favorites`} className="text-gray-400 hover:text-white">{t('navigation.favorites')}</Link>
              <Link href={`/${locale}/compare`} className="text-gray-400 hover:text-white">{t('navigation.compare')}</Link>
              <Link href={`/${locale}/dashboard`} className="text-gray-400 hover:text-white">{t('navigation.dashboard')}</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>{t('homepage.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}