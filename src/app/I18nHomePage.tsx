'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useI18n } from '@/components/layout/I18nProvider';
import { useABTest } from '@/lib/utils/ab-testing';
import { useSEO } from '@/hooks/useSEO';
import StatCard from '@/components/ui/StatCard';
import LayoutDebugger from '@/components/debug/LayoutDebugger';
import { applyJapaneseSoftBreaks } from '@/lib/widow-fix-runtime';

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
    
    // 文節ソフトブレーク機能を適用
    setTimeout(() => {
      applyJapaneseSoftBreaks();
    }, 100);
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
        <section className="section-layer section-hero-pad section-safe-btm surface-fade-btm relative overflow-hidden">
          {/* 背景装飾 - 控えめなラジアルグラデーション */}
          <div className="section-deco bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 to-transparent"></div>
          
          {/* AI Neural Network Background */}
          <div className="section-deco opacity-[0.08]">
            <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
              {/* Neural network nodes */}
              <g fill="currentColor" className="text-gray-600">
                <circle cx="80" cy="60" r="3" />
                <circle cx="120" cy="40" r="2" />
                <circle cx="160" cy="80" r="2.5" />
                <circle cx="200" cy="50" r="3" />
                <circle cx="240" cy="90" r="2" />
                <circle cx="280" cy="70" r="2.5" />
                <circle cx="320" cy="45" r="2" />
                
                <circle cx="100" cy="120" r="2.5" />
                <circle cx="140" cy="140" r="2" />
                <circle cx="180" cy="110" r="3" />
                <circle cx="220" cy="130" r="2.5" />
                <circle cx="260" cy="120" r="2" />
                <circle cx="300" cy="105" r="2.5" />
                
                <circle cx="90" cy="180" r="2" />
                <circle cx="130" cy="200" r="2.5" />
                <circle cx="170" cy="190" r="2" />
                <circle cx="210" cy="170" r="3" />
                <circle cx="250" cy="185" r="2.5" />
                <circle cx="290" cy="195" r="2" />
                <circle cx="330" cy="175" r="2.5" />
              </g>
              
              {/* Connecting lines */}
              <g stroke="currentColor" strokeWidth="0.5" fill="none" className="text-gray-400" opacity="0.6">
                <path d="M80,60 L120,40 M120,40 L160,80 M160,80 L200,50 M200,50 L240,90 M240,90 L280,70 M280,70 L320,45" />
                <path d="M100,120 L140,140 M140,140 L180,110 M180,110 L220,130 M220,130 L260,120 M260,120 L300,105" />
                <path d="M90,180 L130,200 M130,200 L170,190 M170,190 L210,170 M210,170 L250,185 M250,185 L290,195 M290,195 L330,175" />
                
                {/* Vertical connections */}
                <path d="M80,60 L100,120 M120,40 L140,140 M160,80 L180,110 M200,50 L220,130 M240,90 L260,120 M280,70 L300,105" />
                <path d="M100,120 L90,180 M140,140 L130,200 M180,110 L170,190 M220,130 L210,170 M260,120 L250,185 M300,105 L290,195" />
              </g>
            </svg>
          </div>
          
          {/* AI Data Flow Pattern */}
          <div className="absolute top-10 right-10 opacity-[0.1]">
            <svg width="200" height="150" viewBox="0 0 200 150">
              <defs>
                <pattern id="dataflow" patternUnits="userSpaceOnUse" width="40" height="40">
                  <rect width="40" height="40" fill="none"/>
                  <circle cx="20" cy="20" r="1" fill="currentColor" className="text-gray-600"/>
                </pattern>
              </defs>
              <rect width="200" height="150" fill="url(#dataflow)"/>
              
              {/* Flowing data streams */}
              <g stroke="currentColor" strokeWidth="1" fill="none" className="text-gray-500" opacity="0.3">
                <path d="M20,30 Q100,10 180,50">
                  <animate attributeName="stroke-dasharray" values="0,20;20,20;40,20" dur="4s" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" values="0;-40" dur="4s" repeatCount="indefinite"/>
                </path>
                <path d="M20,70 Q100,90 180,50">
                  <animate attributeName="stroke-dasharray" values="0,20;20,20;40,20" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" values="0;-40" dur="3s" repeatCount="indefinite"/>
                </path>
                <path d="M20,110 Q100,130 180,90">
                  <animate attributeName="stroke-dasharray" values="0,20;20,20;40,20" dur="5s" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" values="0;-40" dur="5s" repeatCount="indefinite"/>
                </path>
              </g>
            </svg>
          </div>
          
          <div className="container-hero section-content">
            <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-16 items-center">
              {/* Left Column - Content */}
              <div>
                <div className={`transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  <div className="measure-lead relative">
                    {/* AI Brain Icon Enhancement */}
                    <div className="absolute -top-8 -right-8 opacity-[0.12] hidden sm:block">
                      <svg width="120" height="120" viewBox="0 0 120 120">
                        <g fill="currentColor" className="text-gray-600">
                          {/* AI brain silhouette */}
                          <path d="M60,20 C70,20 80,25 85,35 C90,30 95,28 100,35 C100,45 95,50 90,55 C95,65 90,75 85,80 C80,85 70,90 60,90 C50,90 40,85 35,80 C30,75 25,65 30,55 C25,50 20,45 20,35 C25,28 30,30 35,35 C40,25 50,20 60,20 Z" opacity="0.3"/>
                          
                          {/* Neural pathways */}
                          <g stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.6">
                            <path d="M45,40 Q55,35 65,40 M50,50 Q60,45 70,50 M45,60 Q55,55 65,60" />
                            <path d="M40,45 Q50,50 60,45 M55,60 Q65,55 75,60" />
                          </g>
                          
                          {/* Processing nodes */}
                          <circle cx="45" cy="40" r="1" />
                          <circle cx="60" cy="35" r="1.5" />
                          <circle cx="75" cy="40" r="1" />
                          <circle cx="40" cy="55" r="1" />
                          <circle cx="55" cy="50" r="1.5" />
                          <circle cx="70" cy="55" r="1" />
                          <circle cx="45" cy="70" r="1" />
                          <circle cx="60" cy="65" r="1.5" />
                          <circle cx="75" cy="70" r="1" />
                        </g>
                      </svg>
                    </div>
                    
                    <h1 className="headline heading-guard-top heading-guard-btm text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 lg:mb-6 leading-tight">
                      AIO Hub AI企業CMS
                    </h1>
                    <p className="copy heading-guard-btm text-lg sm:text-xl md:text-2xl text-gray-500 mb-8 lg:mb-10 leading-relaxed">
                      AI技術を活用した企業情報の統合管理プラットフォーム
                    </p>
                  </div>
                  
                  <div className="measure-lead">
                    <div className="flex flex-col sm:flex-row flex-nowrap gap-4 sm:gap-6 justify-start">
                      <Link 
                        href="/auth/signup" 
                        onClick={handleCtaClick}
                        className="cta-nowrap group inline-flex items-center justify-center gap-3 px-6 py-3 min-h-[44px] bg-gray-800 text-white text-base lg:text-lg font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                        aria-label="無料で始める"
                      >
                        <span>無料で始める</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                      <Link 
                        href="/organizations" 
                        className="cta-nowrap group inline-flex items-center justify-center gap-3 px-6 py-3 min-h-[44px] border-2 border-gray-300 text-gray-700 text-base lg:text-lg font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
                        aria-label="企業ディレクトリを見る"
                      >
                        <span>企業ディレクトリを見る</span>
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Visualization */}
              <div className="mt-10 md:mt-0">
                <div className="relative w-full aspect-video rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm ring-1 ring-black/5 overflow-hidden">
                  {/* AI Information Flow Visualization */}
                  <div className="absolute inset-4 flex flex-col justify-center items-center">
                    <div className="text-center space-y-6">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="w-8 h-0.5 bg-gray-300"></div>
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="w-8 h-0.5 bg-gray-300"></div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>企業情報 → AI最適化 → 検索表示</div>
                        <div className="text-xs text-gray-500">構造化データで検索AI時代に対応</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-sm text-gray-500">
                  企業情報をAI検索エンジンが理解しやすい形で構造化
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 機能紹介 */}
        <section className="section-layer section-safe surface-fade-btm compact-section bg-white relative overflow-hidden">
          {/* AI Grid Pattern Background */}
          <div className="section-deco top-1/2 left-4 opacity-[0.015] -translate-y-1/2">
            <svg width="160" height="200" viewBox="0 0 160 200">
              <defs>
                <pattern id="ai-grid" patternUnits="userSpaceOnUse" width="30" height="30">
                  <rect width="30" height="30" fill="none"/>
                  <circle cx="15" cy="15" r="0.8" fill="currentColor" className="text-gray-600"/>
                  <rect x="12" y="12" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-gray-500"/>
                </pattern>
              </defs>
              <rect width="160" height="200" fill="url(#ai-grid)"/>
            </svg>
          </div>
          
          <div className="container-article section-content">
            <div className="section-gap">
              <h2 className="headline heading-guard-top heading-guard-btm text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6 text-left">
                {t('pages.home.features.title')}
              </h2>
              <p className="copy measure-lead text-lg sm:text-xl md:text-2xl lg:text-2xl text-gray-600 text-left">
                {t('pages.home.features.subtitle')}
              </p>
            </div>

            <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* 企業管理 */}
              <div className="card group p-6 sm:p-7">
                <div className="media-frame w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300" style={{'--media-ar': '1/1'} as React.CSSProperties}>
                  <svg className="w-8 h-8 text-gray-600 media-contain" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="headline text-left text-xl font-semibold text-gray-900 mb-4 jp-phrase">
                  {t('pages.home.features.organizationManagement.title')}
                </h3>
                <p className="copy measure-body text-left text-gray-600 jp-phrase">
                  {t('pages.home.features.organizationManagement.description')}
                </p>
              </div>

              {/* サービス管理 */}
              <div className="card group p-6 sm:p-7">
                <div className="media-frame w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300" style={{'--media-ar': '1/1'} as React.CSSProperties}>
                  <svg className="w-8 h-8 text-gray-600 media-contain" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="headline text-left text-xl font-semibold text-gray-900 mb-4 jp-phrase">
                  {t('pages.home.features.serviceManagement.title')}
                </h3>
                <p className="copy measure-body text-left text-gray-600 jp-phrase">
                  {t('pages.home.features.serviceManagement.description')}
                </p>
              </div>

              {/* 導入事例管理 */}
              <div className="card group p-6 sm:p-7">
                <div className="media-frame w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300" style={{'--media-ar': '1/1'} as React.CSSProperties}>
                  <svg className="w-8 h-8 text-gray-600 media-contain" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="headline text-left text-xl font-semibold text-gray-900 mb-4 jp-phrase">
                  {t('pages.home.features.caseManagement.title')}
                </h3>
                <p className="copy measure-body text-left text-gray-600 jp-phrase">
                  {t('pages.home.features.caseManagement.description')}
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* サービスの流れ */}
        <section id="service-flow" className="section-gap bg-white">
          <div className="container-article">
            <div className="section-gap">
              <h2 className="headline text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-left">
                サービスの流れ
              </h2>
              <p className="copy measure-lead text-lg sm:text-xl md:text-2xl text-gray-600 text-left">
                簡単3ステップで始められます
              </p>
            </div>

            <div className="relative">
              {/* 接続線 - グレー基調に */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 transform -translate-y-1/2 z-0"></div>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ステップ1: アカウント作成 */}
                <div className="group">
                  <div className="relative mx-auto w-24 h-24 lg:w-32 lg:h-32 bg-gray-700 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl lg:text-4xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                    アカウント作成
                  </h3>
                  <p className="jp-phrase-aware jp-body text-base lg:text-lg text-gray-600 leading-relaxed">
                    メールアドレスとパスワードで簡単にアカウントを作成。<span className="nb">無料で始められます。</span>
                  </p>
                </div>

                {/* ステップ2: 企業情報登録 */}
                <div className="group">
                  <div className="relative mx-auto w-24 h-24 lg:w-32 lg:h-32 bg-gray-700 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl lg:text-4xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                    企業情報登録
                  </h3>
                  <p className="jp-phrase-aware jp-body text-base lg:text-lg text-gray-600 leading-relaxed">
                    企業の基本情報を入力。<span className="nb">必要最小限の項目のみで</span>素早く登録完了。
                  </p>
                </div>

                {/* ステップ3: コンテンツ管理開始 */}
                <div className="group">
                  <div className="relative mx-auto w-24 h-24 lg:w-32 lg:h-32 bg-gray-700 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl lg:text-4xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                    コンテンツ管理開始
                  </h3>
                  <p className="jp-phrase-aware jp-body text-base lg:text-lg text-gray-600 leading-relaxed">
                    サービス情報や導入事例を追加して、<span className="nb">効果的な企業PR</span>を開始できます。
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
        <section className="section-gap bg-white relative overflow-hidden">
          {/* AI Processing Visualization Background */}
          <div className="absolute top-0 left-0 opacity-[0.02]">
            <svg width="300" height="200" viewBox="0 0 300 200">
              {/* AI processing blocks */}
              <g fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-600">
                <rect x="20" y="30" width="60" height="40" rx="4" />
                <rect x="100" y="20" width="80" height="60" rx="6" />
                <rect x="200" y="35" width="70" height="50" rx="5" />
                
                <rect x="30" y="100" width="50" height="30" rx="3" />
                <rect x="110" y="110" width="90" height="50" rx="4" />
                <rect x="220" y="120" width="60" height="35" rx="4" />
              </g>
              
              {/* Data flow arrows */}
              <g fill="currentColor" className="text-gray-500" opacity="0.4">
                <path d="M85,50 L95,50 L92,45 M92,55 L95,50" />
                <path d="M185,50 L195,50 L192,45 M192,55 L195,50" />
                <path d="M85,115 L100,115 L97,110 M97,120 L100,115" />
                <path d="M205,135 L215,135 L212,130 M212,140 L215,135" />
              </g>
            </svg>
          </div>
          
          {/* Geometric AI Pattern */}
          <div className="absolute bottom-0 right-0 opacity-[0.025]">
            <svg width="250" height="180" viewBox="0 0 250 180">
              <g fill="none" stroke="currentColor" strokeWidth="0.8" className="text-gray-600">
                {/* Hexagonal AI processing grid */}
                <polygon points="50,30 70,20 90,30 90,50 70,60 50,50" />
                <polygon points="90,30 110,20 130,30 130,50 110,60 90,50" />
                <polygon points="130,30 150,20 170,30 170,50 150,60 130,50" />
                <polygon points="170,30 190,20 210,30 210,50 190,60 170,50" />
                
                <polygon points="70,60 90,50 110,60 110,80 90,90 70,80" />
                <polygon points="110,60 130,50 150,60 150,80 130,90 110,80" />
                <polygon points="150,60 170,50 190,60 190,80 170,90 150,80" />
                
                <polygon points="90,90 110,80 130,90 130,110 110,120 90,110" />
                <polygon points="130,90 150,80 170,90 170,110 150,120 130,110" />
              </g>
              
              {/* Center processing nodes */}
              <g fill="currentColor" className="text-gray-600" opacity="0.6">
                <circle cx="70" cy="40" r="1.5" />
                <circle cx="110" cy="40" r="1.5" />
                <circle cx="150" cy="40" r="1.5" />
                <circle cx="190" cy="40" r="1.5" />
                <circle cx="90" cy="70" r="1.5" />
                <circle cx="130" cy="70" r="1.5" />
                <circle cx="170" cy="70" r="1.5" />
                <circle cx="110" cy="100" r="1.5" />
                <circle cx="150" cy="100" r="1.5" />
              </g>
            </svg>
          </div>
          
          <div className="container-article">
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 flex items-center text-left">
              <svg className="w-12 h-12 lg:w-16 lg:h-16 mr-4 lg:mr-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="jp-phrase">AI検索最適化（AIO）対応</span>
            </h2>
            <p className="copy measure-lead text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 text-left">
              本プラットフォームは、AI検索エンジンが理解しやすい構造化データを自動生成します
            </p>
            <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mb-8">
              <div className="card-container h-full rounded-2xl bg-white shadow-sm border border-gray-200 px-5 py-6 sm:px-6 sm:py-7 flex flex-col justify-between">
                <div>
                  <h3 className="jp-phrase-aware ui-measure-body widow-tweak text-lg sm:text-xl font-semibold text-gray-900 mb-2">JSON-LD</h3>
                  <p className="jp-phrase-aware jp-body ui-measure-body widow-tweak text-[15px] leading-7 text-gray-600">構造化データを自動生成し、<span className="nb">AI検索エンジンが</span>理解しやすい形式で情報を公開</p>
                </div>
              </div>
              <div className="card-container h-full rounded-2xl bg-white shadow-sm border border-gray-200 px-5 py-6 sm:px-6 sm:py-7 flex flex-col justify-between">
                <div>
                  <h3 className="jp-phrase-aware ui-measure-body widow-tweak text-lg sm:text-xl font-semibold text-gray-900 mb-2">RSS/XML</h3>
                  <p className="jp-phrase-aware jp-body ui-measure-body widow-tweak text-[15px] leading-7 text-gray-600">フィード配信により<span className="nb">継続的な情報更新を</span>クローラーに通知</p>
                </div>
              </div>
              <div className="card-container h-full rounded-2xl bg-white shadow-sm border border-gray-200 px-5 py-6 sm:px-6 sm:py-7 flex flex-col justify-between">
                <div>
                  <h3 className="jp-phrase-aware ui-measure-body widow-tweak text-lg sm:text-xl font-semibold text-gray-900 mb-2">公開プロフィール（直リンク）</h3>
                  <p className="jp-phrase-aware jp-body ui-measure-body widow-tweak text-[15px] leading-7 text-gray-600">企業・サービスごとに<span className="nb">公開URLを</span>自動生成。検索・AIから直接参照されやすい構成で配信します。</p>
                </div>
              </div>
              <div className="card-container h-full rounded-2xl bg-white shadow-sm border border-gray-200 px-5 py-6 sm:px-6 sm:py-7 flex flex-col justify-between">
                <div>
                  <h3 className="jp-phrase-aware ui-measure-body widow-tweak text-lg sm:text-xl font-semibold text-gray-900 mb-2">サイトマップ</h3>
                  <p className="jp-phrase-aware jp-body ui-measure-body widow-tweak text-[15px] leading-7 text-gray-600">動的生成により<span className="nb">ページ構造を</span>検索エンジンに効率的に伝達</p>
                </div>
              </div>
            </div>
            <Link 
              href="/aio"
              className="focus-clean inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              AIOについて詳しく見る
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* 代表メッセージ */}
        <section className="section-layer section-safe-top surface-fade-top section-gap bg-gray-50">
          <div className="container-article section-content">
            <h2 className="headline heading-guard-top heading-guard-btm text-3xl font-bold text-gray-900 mb-8 text-left">
              {t('pages.home.message.title')}
            </h2>
            <div className="copy measure-lead text-lg text-gray-700 jp-phrase text-left">
              {t('pages.home.message.content', { fallback: siteSettings.representative_message })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-layer section-safe-top section-safe-btm deco-wrap cta-safe-minh bg-gray-800">
          {/* 背景パターン - 安全な配置で切り取り防止 */}
          <div className="deco-img opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 800 600" className="media-contain">
              <circle cx="200" cy="150" r="80" fill="white" opacity="0.8"/>
              <circle cx="600" cy="450" r="80" fill="white" opacity="0.8"/>
              <circle cx="400" cy="300" r="96" fill="white" opacity="0.3"/>
            </svg>
          </div>
          
          {/* AI Circuit Pattern */}
          <div className="section-deco opacity-[0.03]">
            <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
              {/* Circuit board traces */}
              <g fill="none" stroke="white" strokeWidth="1">
                <path d="M100,150 L200,150 L200,250 L350,250 L350,180 L500,180" />
                <path d="M150,100 L150,200 L300,200 L300,300 L450,300 L450,220" />
                <path d="M250,120 L400,120 L400,280 L550,280 L550,160" />
                <path d="M50,300 L150,300 L150,400 L300,400 L300,350 L500,350" />
                <path d="M200,50 L200,100 L400,100 L400,200 L600,200" />
                
                {/* Branching circuits */}
                <path d="M300,200 L320,180 M300,200 L320,220" />
                <path d="M400,250 L420,230 M400,250 L420,270" />
                <path d="M200,150 L180,130 M200,150 L180,170" />
                <path d="M350,180 L330,160 M350,180 L330,200" />
              </g>
              
              {/* Circuit nodes and components */}
              <g fill="white" opacity="0.6">
                <circle cx="200" cy="150" r="3" />
                <circle cx="350" cy="250" r="3" />
                <circle cx="150" cy="200" r="2.5" />
                <circle cx="300" cy="300" r="3" />
                <circle cx="400" cy="120" r="2.5" />
                <circle cx="500" cy="180" r="3" />
                <circle cx="300" cy="200" r="2" />
                <circle cx="450" cy="300" r="2.5" />
                <circle cx="550" cy="280" r="3" />
                
                {/* Micro-processors */}
                <rect x="190" y="140" width="20" height="20" rx="2" opacity="0.4" />
                <rect x="340" y="240" width="20" height="20" rx="2" opacity="0.4" />
                <rect x="290" y="290" width="20" height="20" rx="2" opacity="0.4" />
                <rect x="490" y="170" width="20" height="20" rx="2" opacity="0.4" />
              </g>
            </svg>
          </div>
          
          <div className="relative container-article text-center content-above-deco">
            <div className="max-w-3xl mx-auto">
              <h2 className="headline text-3xl md:text-4xl font-bold text-white mb-6 jp-phrase">
                {t('pages.home.cta.title')}
              </h2>
              <p className="copy measure-lead text-xl text-gray-300 mb-8 jp-phrase">
                {t('pages.home.cta.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row flex-nowrap gap-4 justify-center items-center">
                <Link 
                  href="/auth/signup" 
                  onClick={handleCtaClick}
                  className="group cta-btn cta-btn--primary text-lg"
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
                  className="group cta-btn cta-btn--outline text-lg"
                >
                  <span className="flex items-center gap-2">
                    <span>ヒアリング代行サービス</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2" />
                    </svg>
                  </span>
                </Link>
                
                <div className="flex items-center text-gray-300 text-sm gap-6 sm:gap-8">
                  <div className="flex items-center jp-body break-keep">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    無料トライアル • クレジットカード不要
                  </div>
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
                  高い安定性保証
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
      <footer className="bg-gray-900 text-white section-gap ui-bottom-content">
        <div className="container-article">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="headline text-lg font-semibold mb-4 jp-phrase">{t('ui.header.title')}</h3>
              <p className="copy measure-body text-gray-400 jp-phrase">
                {t('pages.home.footer.tagline')}
              </p>
            </div>
            <div>
              <h4 className="headline font-semibold mb-4 jp-phrase">{t('pages.home.footer.links')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/organizations" className="cta-nowrap hover:text-white transition-colors">{t('pages.home.footer.directory')}</Link></li>
                <li><Link href="/search" className="cta-nowrap hover:text-white transition-colors">{t('pages.home.footer.search')}</Link></li>
                <li><Link href="/dashboard" className="cta-nowrap hover:text-white transition-colors">{t('ui.header.dashboard')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="headline font-semibold mb-4 jp-phrase">{t('pages.home.footer.support')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="cta-nowrap hover:text-white transition-colors">{t('pages.home.footer.helpCenter')}</Link></li>
                <li><Link href="/contact" className="cta-nowrap hover:text-white transition-colors">{t('pages.home.footer.contact')}</Link></li>
                <li><Link href="/terms" className="cta-nowrap hover:text-white transition-colors">{t('pages.home.footer.terms')}</Link></li>
                <li><Link href="/privacy" className="cta-nowrap hover:text-white transition-colors">{t('pages.home.footer.privacy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p className="copy text-center jp-phrase">{t('pages.home.footer.copyright')}</p>
          </div>
        </div>
      </footer>
      
      {/* Debug Overlay - Only in development */}
      {process.env.NODE_ENV === 'development' && <LayoutDebugger />}
    </div>
  );
}