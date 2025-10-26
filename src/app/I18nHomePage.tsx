'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useABTest } from '@/hooks/useABTest';
import { useSEO } from '@/hooks/useSEO';
import { applyJapaneseSoftBreaks } from '@/lib/utils/textUtils';
import FlowSection from '@/components/aio/FlowSection';
import PricingTable from '@/components/pricing/PricingTable';
import FAQSection from '@/components/aio/FAQSection';
import { aioCopy } from '@/app/aio/copy';

// HIG Components
import { HIGButton } from '@/components/ui/HIGButton';
import { HIGCard, HIGCardHeader, HIGCardContent, HIGCardTitle, HIGCardDescription } from '@/components/ui/HIGCard';
import { HIGContainer, HIGSection, HIGStack, HIGGrid, HIGFlex, HIGCenter } from '@/components/layout/HIGLayout';
import { 
  CheckCircleIcon, 
  ArrowRightIcon, 
  BuildingIcon, 
  UserIcon, 
  ServiceIcon,
  InfoIcon,
  AlertTriangleIcon 
} from '@/components/icons/HIGIcons';

interface SiteSettings {
  title: string;
  tagline: string;
  representative_message: string;
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
  
  const { variant: ctaVariant, trackConversion } = useABTest('hero_cta_text');
  
  useEffect(() => {
    const fetchDynamicStats = async () => {
      try {
        const response = await fetch('/api/public/stats');
        if (response.ok) {
          const stats = await response.json();
          setDynamicStats(stats);
        }
      } catch (error) {
        // Stats fetch failed - using default values
      }
    };
    
    fetchDynamicStats();
    setTimeout(() => {
      applyJapaneseSoftBreaks();
    }, 100);
  }, []);

  useSEO({
    title: t('pages.home.title'),
    description: t('pages.home.description'),
    canonical: 'https://aiohub.jp/',
    keywords: ['AI', 'CMS', '企業管理', 'DX', 'デジタル変革'],
    type: 'website',
  });

  const handleCtaClick = () => {
    trackConversion();
  };

  const features = [
    {
      icon: BuildingIcon,
      title: "AI引用最適化",
      description: "企業情報を構造化データとして整備し、AIが理解・引用しやすい形に自動変換"
    },
    {
      icon: ServiceIcon,
      title: "ドメインパワー共有", 
      description: "信頼性の高いプラットフォームに情報を集約することで、検索・AI回答での露出を向上"
    },
    {
      icon: UserIcon,
      title: "アクセス流入促進",
      description: "構造化された企業情報から自社サイトやSNSへの質の高い流入を創出"
    }
  ];

  const stats = [
    { label: "登録企業", value: formatNumber(dynamicStats.organizations), unit: "社" },
    { label: "管理サービス", value: formatNumber(dynamicStats.services), unit: "件" },
    { label: "導入事例", value: formatNumber(dynamicStats.cases), unit: "件" },
  ];

  const showStats = (dynamicStats.organizations + dynamicStats.services + dynamicStats.cases) > 0;
  const featureBadges = ["構造化データ自動生成", "AI検索最適化", "JSON-LD対応"];

  return (
    <div className="min-h-screen">
      <main>
        {/* Hero Section - 導入：価値を3秒で伝える */}
        <section className="section section--hero">
          <div className="site-container">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <ServiceIcon size={16} />
                  AI時代の企業情報管理
                </div>
                <h1 className="text-display hig-jp-heading" style={{ color: 'var(--color-text-primary)' }}>
                  AI時代に"見つかる"企業へ
                  <span className="block" style={{ color: 'var(--color-primary)' }}>AIO Hub</span>
                </h1>
                <p className="text-body-responsive hig-jp-body" style={{ color: 'var(--color-text-secondary)' }}>
                  AIがあなたの情報を最適に理解・推薦するための企業CMS。<br />
                  構造化された企業情報で、検索からAI回答まで確実に見つけられます。
                </p>
              </div>
              
              {/* 単一CTA */}
              <div className="flex justify-center">
                <Link
                  href="/auth/signup"
                  onClick={handleCtaClick}
                  className="hig-cta-primary text-lg px-8 py-4 gap-3"
                >
                  14日間無料で試す
                  <ArrowRightIcon size={24} />
                </Link>
              </div>

              {/* 機能チップ */}
              <div className="flex flex-wrap justify-center gap-3">
                {featureBadges.map((badge, index) => (
                  <div 
                    key={badge} 
                    className="group inline-flex items-center gap-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    tabIndex={0}
                    role="button"
                    aria-label={`${badge}の詳細を確認`}
                  >
                    <CheckCircleIcon size={16} className="text-blue-600 group-hover:text-blue-700" />
                    <span>{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problem & Vision - 理解：課題提示とAI時代の文脈 */}
        <section className="section section--alt">
          <div className="site-container">
            <div className="text-center mb-16">
              <h2 className="text-heading hig-jp-heading mb-6" style={{ color: 'var(--color-text-primary)' }}>
                検索からAI回答へ<br />企業発見の仕組みが変わった
              </h2>
              <p className="text-body-responsive hig-jp-body max-w-3xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                AIが情報を直接引用・回答する時代。<br />従来のSEOだけでは企業が見つけられない新たな課題が生まれています。
              </p>
            </div>

            {/* Evolution Timeline Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Traditional Search */}
              <div className="card text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium mb-4">従来</div>
                <h3 className="text-xl font-semibold text-primary mb-2">検索→クリック→サイト訪問</h3>
                <p className="text-sm text-secondary">SEO対策による上位表示とクリック率向上が中心</p>
              </div>

              {/* Transition */}
              <div className="card text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium mb-4">現在</div>
                <h3 className="text-xl font-semibold text-primary mb-2">AI回答の併存</h3>
                <p className="text-sm text-secondary">検索結果とAI回答（ChatGPT、Google SGE等）が並存</p>
              </div>

              {/* Future */}
              <div className="card text-center">
                <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-4">将来</div>
                <h3 className="text-xl font-semibold text-primary mb-2">AI優先の情報発見</h3>
                <p className="text-sm text-secondary">AIが直接回答し、クリックを経ずに情報が伝達される機会が増加</p>
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                  AI時代の企業戦略
                </h2>
                <p className="text-lg text-secondary">
                  AIが情報を直接回答する時代に、企業が"選ばれる"ための仕組みを提供
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="card text-center">
                    <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-primary mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-secondary">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Subtle CTA Reappearance */}
              <div className="text-center mt-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors">
                  <ArrowRightIcon size={16} />
                  <Link href="/auth/signup" className="hover:underline">
                    今すぐAI最適化を始める
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Apple-inspired Design */}
        <section className="py-24 relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
          
          <div className="site-container text-center relative z-10">
            {/* Alert badge with Apple-style design */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-8 shadow-sm border border-orange-200">
              <AlertTriangleIcon size={14} className="text-orange-600" />
              AI時代の新たな挑戦
            </div>
            
            {/* Hero headline with Apple typography */}
            <h2 className="text-display mb-6">
              AI時代に<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">選ばれる企業</span>になる
            </h2>
            
            {/* Subtitle with refined spacing */}
            <p className="text-body-large mb-12 max-w-2xl mx-auto">
              構造化された企業情報で、AI検索・ChatGPT回答での<br />
              露出を確保し、新たなビジネス機会を創出します。
            </p>
            
            {/* Apple-style button group */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <HIGButton
                variant="primary"
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-0 rounded-xl px-8 py-4 text-lg font-medium transition-all duration-200"
                asChild
              >
                <Link href="/auth/signup">
                  14日間無料で始める
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </HIGButton>
              <HIGButton
                variant="secondary"
                size="lg"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-xl px-8 py-4 text-lg font-medium transition-all duration-200 shadow-sm"
                asChild
              >
                <Link href="/hearing-service">
                  専門ヒアリングサービス
                </Link>
              </HIGButton>
            </div>

            {/* Subtle footer text */}
            <div className="text-sm text-gray-500">
              クレジットカード不要 • いつでもキャンセル可能
            </div>
          </div>
        </section>

        {/* Solution / How It Works - 理解：AIO Hubの強み・ステップ */}
        <FlowSection
          title={aioCopy.flow.title}
          description={aioCopy.flow.description}
          steps={aioCopy.flow.steps}
          beforeAfter={aioCopy.flow.beforeAfter}
        />

        {/* Features - 理解：主要機能を3つに絞る */}
        <section className="section section--clean">
          <div className="site-container">
            <div className="text-center mb-16">
              <h2 className="text-heading hig-jp-heading mb-6" style={{ color: 'var(--color-text-primary)' }}>
                AIO Hubの3つの価値
              </h2>
              <p className="text-body-responsive hig-jp-body max-w-3xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                企業情報をAIが理解しやすい形に最適化し、発見機会を最大化します
              </p>
            </div>
            
            <div className="hig-grid--3-cols">
              {features.map((feature, index) => (
                <div key={index} className="hig-card text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-blue-50 rounded-xl flex items-center justify-center">
                    <feature.icon size={32} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing - 行動：料金とCTA */}
        <PricingTable />

        {/* FAQ Section */}
        <FAQSection
          title={aioCopy.faq.title}
          description={aioCopy.faq.description}
          categories={aioCopy.faq.categories}
        />

        {/* Final CTA - Apple-inspired minimal design */}
        <section className="py-20 bg-gray-50">
          <div className="site-container text-center">
            <h2 className="text-title1 mb-6">
              AI時代に見つかる企業になる
            </h2>
            <p className="text-body-large mb-10 max-w-2xl mx-auto">
              14日間の無料体験で、AI検索に最適化された<br />
              企業情報の効果を実感してください。
            </p>
            
            <Link
              href="/auth/signup"
              className="btn-primary text-lg px-10 py-4"
            >
              今すぐ無料で始める
              <ArrowRightIcon size={20} />
            </Link>
            
            <div className="mt-6 text-caption">
              クレジットカード不要 • 設定も簡単
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="section bg-gray-50">
          <div className="site-container">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">AIO Hub</h3>
                <p className="text-secondary">
                  AI技術を活用した企業情報の統合管理プラットフォーム
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-primary">リンク</h4>
                <ul className="space-y-2">
                  <li><Link href="/organizations" className="text-secondary hover:text-primary">企業ディレクトリ</Link></li>
                  <li><Link href="/search" className="text-secondary hover:text-primary">検索</Link></li>
                  <li><Link href="/dashboard" className="text-secondary hover:text-primary">ダッシュボード</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-primary">サポート</h4>
                <ul className="space-y-2">
                  <li><Link href="/help" className="text-secondary hover:text-primary">ヘルプ</Link></li>
                  <li><Link href="/contact" className="text-secondary hover:text-primary">お問い合わせ</Link></li>
                  <li><Link href="/terms" className="text-secondary hover:text-primary">利用規約</Link></li>
                  <li><Link href="/privacy" className="text-secondary hover:text-primary">プライバシー</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 mt-8 pt-8 text-center">
              <p className="text-sm text-slate-600">
                © 2024 AIO Hub. All rights reserved.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
