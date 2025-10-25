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
        {/* Hero Section */}
        <section className="section">
          <div className="site-container">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
                  AI企業CMS
                  <span className="text-blue-600 block">AIO Hub</span>
                </h1>
                <p className="text-lg text-secondary leading-relaxed">
                  <strong>ゼロクリック時代</strong>にAIが理解・引用しやすい企業情報を構築。検索結果からAI回答まで、企業が"選ばれる"プラットフォームです。
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/auth/signup"
                    onClick={handleCtaClick}
                    className="btn-nowrap inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    無料で始める
                    <ArrowRightIcon size={20} className="ml-2" />
                  </Link>
                  <Link
                    href="/organizations"
                    className="btn-nowrap inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-primary font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    企業ディレクトリを見る
                  </Link>
                </div>

                {/* Stats or Feature Badges */}
                {showStats ? (
                  <div className="grid grid-cols-3 gap-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {stat.value}<span className="text-sm text-secondary">{stat.unit}</span>
                        </div>
                        <div className="text-sm text-secondary">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {featureBadges.map((badge) => (
                      <span key={badge} className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-medium">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <ServiceIcon size={16} />
                    ゼロクリック対応
                  </div>
                  <h2 className="text-2xl font-bold text-primary">
                    AIに選ばれる企業情報を構築
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon 
                        size={20} 
                        className="text-green-500 flex-shrink-0 mt-0.5" 
                      />
                      <span className="text-primary">構造化データ自動生成</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon 
                        size={20} 
                        className="text-green-500 flex-shrink-0 mt-0.5" 
                      />
                      <span className="text-primary">AI引用最適化</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon 
                        size={20} 
                        className="text-green-500 flex-shrink-0 mt-0.5" 
                      />
                      <span className="text-primary">流入促進とSEO強化</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Zero-Click Era Evolution Section */}
        <section className="section--alt">
          <div className="site-container">
            {/* Header Card */}
            <div className="card text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
                検索体験の変化とAI時代への対応
              </h2>
              <p className="text-lg text-secondary leading-relaxed max-w-3xl mx-auto">
                SEOは残り続けますが、AIが情報を直接引用・回答する機会が急増。企業の発見機会を確保する新たなアプローチが必要です。
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
                  ゼロクリック時代の企業戦略
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
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section">
          <div className="site-container text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              ゼロクリック時代に取り残されませんか？
            </h2>
            <p className="text-lg text-secondary mb-8 max-w-3xl mx-auto">
              AIが企業を"選ぶ"時代。構造化された情報で検索・AI回答での露出を確保し、新たな流入機会を創出しましょう。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="btn-nowrap inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                無料で始める
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/hearing-service"
                className="btn-nowrap inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-primary font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                ヒアリング代行サービス
              </Link>
            </div>

            <div className="mt-8 text-sm text-secondary">
              無料トライアル • クレジットカード不要
            </div>
          </div>
        </section>

        {/* Flow Section */}
        <FlowSection
          title={aioCopy.flow.title}
          description={aioCopy.flow.description}
          steps={aioCopy.flow.steps}
          beforeAfter={aioCopy.flow.beforeAfter}
        />

        {/* Pricing Section */}
        <PricingTable />

        {/* FAQ Section */}
        <FAQSection
          title={aioCopy.faq.title}
          description={aioCopy.faq.description}
          categories={aioCopy.faq.categories}
        />

        {/* Final CTA Section */}
        <section className="section--alt">
          <div className="site-container text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              今すぐゼロクリック時代に備えましょう
            </h2>
            <p className="text-lg text-secondary mb-8 max-w-3xl mx-auto">
              無料プランでAIO Hubの価値を体験し、AI時代の企業情報戦略を始めてください。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="btn-nowrap inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                無料で始める
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/hearing-service"
                className="btn-nowrap inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-primary font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                ヒアリング代行サービス
              </Link>
            </div>

            <div className="mt-8 text-sm text-secondary">
              永続無料プラン • クレジットカード不要 • 今すぐ開始
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
