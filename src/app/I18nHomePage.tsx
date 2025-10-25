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

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <main>
        {/* Hero Section */}
        <HIGSection spacing="xl" className="hig-section">
          <HIGContainer>
            <HIGGrid columns={2} gap="xl" className="items-center">
              <HIGStack spacing="lg">
                <h1 className="hig-text-h1 hig-jp-heading text-[var(--color-text-primary)]">
                  AI企業CMS
                  <span className="text-[var(--color-primary)] block">AIO Hub</span>
                </h1>
                <p className="hig-text-body hig-jp-body text-[var(--color-text-secondary)] text-lg leading-relaxed">
                  <strong>ゼロクリック時代</strong>にAIが理解・引用しやすい企業情報を構築。検索結果からAI回答まで、企業が"選ばれる"プラットフォームです。
                </p>
                
                <HIGFlex 
                  direction="col" 
                  className="sm:flex-row" 
                  gap="md"
                >
                  <HIGButton
                    variant="primary"
                    size="lg"
                    onClick={handleCtaClick}
                    rightIcon={<ArrowRightIcon size={20} />}
                    className="btn-nowrap"
                    asChild
                  >
                    <Link href="/auth/signup">
                      無料で始める
                    </Link>
                  </HIGButton>
                  <HIGButton
                    variant="secondary"
                    size="lg"
                    asChild
                  >
                    <Link href="/organizations">
                      企業ディレクトリを見る
                    </Link>
                  </HIGButton>
                </HIGFlex>

                {/* Stats */}
                <HIGGrid columns={3} gap="md">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="hig-text-h2 text-[var(--color-primary)] mb-2 hig-jp-nowrap">
                        {stat.value}<span className="hig-text-caption">{stat.unit}</span>
                      </div>
                      <div className="hig-text-caption text-[var(--color-text-secondary)] hig-jp-text">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </HIGGrid>
              </HIGStack>

              <HIGCard variant="elevated" padding="lg">
                <HIGStack spacing="lg">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] rounded-full text-sm font-medium">
                    <ServiceIcon size={16} />
                    ゼロクリック対応
                  </div>
                  <HIGCardTitle className="hig-jp-heading">
                    AIに選ばれる企業情報を構築
                  </HIGCardTitle>
                  <HIGStack spacing="md">
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon 
                        size={20} 
                        className="text-[var(--color-success)] flex-shrink-0 mt-0.5" 
                      />
                      <span className="hig-text-body hig-jp-text">構造化データ自動生成</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon 
                        size={20} 
                        className="text-[var(--color-success)] flex-shrink-0 mt-0.5" 
                      />
                      <span className="hig-text-body hig-jp-text">AI引用最適化</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon 
                        size={20} 
                        className="text-[var(--color-success)] flex-shrink-0 mt-0.5" 
                      />
                      <span className="hig-text-body hig-jp-text">流入促進とSEO強化</span>
                    </div>
                  </HIGStack>
                </HIGStack>
              </HIGCard>
            </HIGGrid>
          </HIGContainer>
        </HIGSection>

        {/* Zero-Click Era Evolution Section */}
        <HIGSection spacing="xl" background="default" className="container-section bg-gray-50">
          <HIGContainer size="xl" className="container-page">
            {/* ヘッダーカード */}
            <div className="bg-white rounded-2xl border border-gray-100 p-[var(--space-xl)] mb-[var(--space-xl)] shadow-sm text-center">
              <h2 className="hig-text-h1 text-[var(--color-text-primary)] mb-[var(--space-lg)] hig-jp-heading">
                検索体験の変化とAI時代への対応
              </h2>
              <p className="hig-text-body text-[var(--color-text-secondary)] hig-jp-body leading-relaxed max-w-3xl mx-auto">
                SEOは残り続けますが、AIが情報を直接引用・回答する機会が急増。企業の発見機会を確保する新たなアプローチが必要です。
              </p>
            </div>

            {/* Evolution Timeline Cards */}
            <div className="grid grid-cols-1 gap-[var(--space-lg)] md:grid-cols-3">
              {/* Traditional Search */}
              <div className="bg-white rounded-2xl border border-gray-100 p-[var(--space-lg)] shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-[var(--space-md)]">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium mb-[var(--space-md)]">従来</div>
                <h3 className="hig-text-h3 text-[var(--color-text-primary)] mb-[var(--space-sm)] hig-jp-heading">検索→クリック→サイト訪問</h3>
                <p className="hig-text-caption text-[var(--color-text-secondary)] hig-jp-body">SEO対策による上位表示とクリック率向上が中心</p>
              </div>

              {/* Transition */}
              <div className="bg-white rounded-2xl border border-orange-100 p-[var(--space-lg)] shadow-sm text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-[var(--space-md)]">
                  <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium mb-[var(--space-md)]">現在</div>
                <h3 className="hig-text-h3 text-[var(--color-text-primary)] mb-[var(--space-sm)] hig-jp-heading">AI回答の併存</h3>
                <p className="hig-text-caption text-[var(--color-text-secondary)] hig-jp-body">検索結果とAI回答（ChatGPT、Google SGE等）が並存</p>
              </div>

              {/* Future */}
              <div className="bg-white rounded-2xl border border-green-100 p-[var(--space-lg)] shadow-sm text-center">
                <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-[var(--space-md)]">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-[var(--space-md)]">将来</div>
                <h3 className="hig-text-h3 text-[var(--color-text-primary)] mb-[var(--space-sm)] hig-jp-heading">AI優先の情報発見</h3>
                <p className="hig-text-caption text-[var(--color-text-secondary)] hig-jp-body">AIが直接回答し、クリックを経ずに情報が伝達される機会が増加</p>
              </div>
            </div>

            {/* Comparison Table - Split into two sections */}
            <div className="mb-8">
              <h3 className="text-h2 text-neutral-900 mb-6 jp-text text-center">検索体験の変化</h3>
              <HIGGrid columns={2} gap="md">
                {/* Traditional Search */}
                <HIGCard variant="default" padding="md" className="bg-neutral-50 border-l-4 border-neutral-400">
                  <div className="mb-4">
                    <div className="badge badge-neutral mb-2">従来の検索</div>
                    <h4 className="text-h3 text-neutral-900 jp-text flex items-center gap-2">
                      <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      クリック型の情報取得
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-lg border border-neutral-200">
                      <h5 className="text-body font-medium text-neutral-900 mb-2 jp-text flex items-center gap-2">
                        <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        情報取得方法
                      </h5>
                      <p className="text-body-small text-neutral-600 jp-text">検索結果をクリックしてサイト訪問</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-neutral-200">
                      <h5 className="text-body font-medium text-neutral-900 mb-2 jp-text flex items-center gap-2">
                        <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        企業への影響
                      </h5>
                      <p className="text-body-small text-neutral-600 jp-text">SEO順位とクリック率が重要</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-neutral-200">
                      <h5 className="text-body font-medium text-neutral-900 mb-2 jp-text flex items-center gap-2">
                        <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        必要な対策
                      </h5>
                      <p className="text-body-small text-neutral-600 jp-text">キーワード最適化、コンテンツSEO</p>
                    </div>
                  </div>
                </HIGCard>

                {/* AI Era Search */}
                <HIGCard variant="default" padding="md" className="bg-primary-50 border-l-4 border-primary-600 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                  <div className="relative">
                    <div className="mb-4">
                      <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-2">AI時代の検索</div>
                      <h4 className="text-h3 text-primary-700 jp-text flex items-center gap-2">
                        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        ゼロクリック情報提供
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded-lg border border-primary-200 shadow-sm">
                        <h5 className="text-body font-medium text-primary-700 mb-2 jp-text flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          情報取得方法
                        </h5>
                        <p className="text-body-small text-primary-600 jp-text">AIが情報を直接引用・要約して回答</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-primary-200 shadow-sm">
                        <h5 className="text-body font-medium text-primary-700 mb-2 jp-text flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          企業への影響
                        </h5>
                        <p className="text-body-small text-primary-600 jp-text">AIに引用されるかが重要</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-primary-200 shadow-sm">
                        <h5 className="text-body font-medium text-primary-700 mb-2 jp-text flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          必要な対策
                        </h5>
                        <p className="text-body-small text-primary-600 jp-text">構造化データ、AI理解最適化</p>
                      </div>
                    </div>
                  </div>
                </HIGCard>
              </HIGGrid>
            </div>

            {/* Challenge and Solution */}
            <HIGGrid columns={2} gap="lg">
              {/* Challenge */}
              <HIGCard variant="default" padding="md" className="bg-red-50 border-t-4 border-red-400 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-full -translate-y-12 translate-x-12 opacity-30"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center border-2 border-red-200">
                      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-h3 text-red-900 jp-text">課題：発見機会の減少リスク</h3>
                  </div>
                </div>
                <ul className="space-y-3 text-body-small text-red-800 jp-text">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">●</span>
                    <span>AIに選ばれない企業は潜在顧客からの発見機会が減少</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">●</span>
                    <span>従来のSEO対策だけでは不十分な場面が増加</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">●</span>
                    <span>早期対応企業と後発企業の格差拡大</span>
                  </li>
                </ul>
              </HIGCard>

              {/* Solution */}
              <HIGCard variant="default" padding="md" className="bg-blue-50 border-t-4 border-blue-400 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full -translate-y-12 translate-x-12 opacity-30"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-h3 text-blue-900 jp-text">解決策：AIO対応で発見機会を確保</h3>
                  </div>
                </div>
                <ul className="space-y-3 text-body-small text-blue-800 jp-text">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">●</span>
                    <span>構造化データでAIが理解しやすい情報形式に変換</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">●</span>
                    <span>信頼性の高いプラットフォームでドメインパワーを活用</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">●</span>
                    <span>AI引用から自社サイトへの流入促進</span>
                  </li>
                </ul>
              </HIGCard>
            </HIGGrid>
          </HIGContainer>
        </HIGSection>

        {/* Features Section */}
        <HIGSection spacing="xl" background="secondary" className="container-section">
          <HIGContainer size="xl" className="container-page">
            <div className="text-center mb-12">
              <h2 className="text-h1 text-neutral-900 mb-6 jp-text">
                ゼロクリック時代の企業戦略
              </h2>
              <p className="text-body-large text-neutral-600 jp-text">
                AIが情報を直接回答する時代に、企業が"選ばれる"ための仕組みを提供
              </p>
            </div>

            <HIGGrid columns={3} gap="md">
              {features.map((feature, index) => (
                <HIGCard key={index} variant="default" padding="md" className="text-center">
                  <feature.icon className="icon icon-lg text-primary mx-auto mb-4" />
                  <h3 className="text-h3 text-neutral-900 mb-4 jp-text">
                    {feature.title}
                  </h3>
                  <p className="text-body text-neutral-600 jp-text">
                    {feature.description}
                  </p>
                </HIGCard>
              ))}
            </HIGGrid>
          </HIGContainer>
        </HIGSection>

        {/* CTA Section */}
        <HIGSection spacing="xl" className="container-section">
          <HIGContainer size="md" className="container-page text-center">
            <h2 className="text-h1 text-neutral-900 mb-6 jp-text">
              ゼロクリック時代に取り残されませんか？
            </h2>
            <p className="text-body-large text-neutral-600 mb-8 jp-text">
              AIが企業を"選ぶ"時代。構造化された情報で検索・AI回答での露出を確保し、新たな流入機会を創出しましょう。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <HIGButton variant="primary" size="lg" className="btn-nowrap" asChild>
                <Link href="/auth/signup">
                  無料で始める
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </HIGButton>
              <HIGButton variant="secondary" size="lg" asChild>
                <Link href="/hearing-service">
                  ヒアリング代行サービス
                </Link>
              </HIGButton>
            </div>

            <div className="mt-8 text-body-small text-neutral-500 jp-text">
              無料トライアル • クレジットカード不要
            </div>
          </HIGContainer>
        </HIGSection>

        {/* Flow Section - ゼロクリック時代の課題と解決策 */}
        <FlowSection
          title={aioCopy.flow.title}
          description={aioCopy.flow.description}
          steps={aioCopy.flow.steps}
          beforeAfter={aioCopy.flow.beforeAfter}
        />

        {/* Pricing Section - 料金プラン */}
        <PricingTable />

        {/* FAQ Section - よくある質問 */}
        <FAQSection
          title={aioCopy.faq.title}
          description={aioCopy.faq.description}
          categories={aioCopy.faq.categories}
        />

        {/* Final CTA Section */}
        <HIGSection spacing="xl" background="secondary" className="container-section">
          <HIGContainer size="md" className="text-center">
            <h2 className="text-h1 text-neutral-900 mb-6 jp-text">
              今すぐゼロクリック時代に備えましょう
            </h2>
            <p className="text-body-large text-neutral-600 mb-8 jp-text">
              無料プランでAIO Hubの価値を体験し、AI時代の企業情報戦略を始めてください。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <HIGButton variant="primary" size="lg" className="btn-nowrap" asChild>
                <Link href="/auth/signup">
                  無料で始める
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </HIGButton>
              <HIGButton variant="secondary" size="lg" asChild>
                <Link href="/hearing-service">
                  ヒアリング代行サービス
                </Link>
              </HIGButton>
            </div>

            <div className="mt-8 text-body-small text-neutral-500 jp-text">
              永続無料プラン • クレジットカード不要 • 今すぐ開始
            </div>
          </HIGContainer>
        </HIGSection>

        {/* Footer */}
        <HIGSection spacing="xl" className="bg-gray-50 container-section">
          <HIGContainer size="xl" className="container-page">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-h3 mb-4 jp-text text-slate-900">AIO Hub</h3>
                <p className="text-body text-slate-600 jp-text">
                  AI技術を活用した企業情報の統合管理プラットフォーム
                </p>
              </div>
              <div>
                <h4 className="text-body font-semibold mb-4 jp-text text-slate-900">リンク</h4>
                <ul className="space-y-2">
                  <li><Link href="/organizations" className="text-slate-600 hover:text-slate-900">企業ディレクトリ</Link></li>
                  <li><Link href="/search" className="text-slate-600 hover:text-slate-900">検索</Link></li>
                  <li><Link href="/dashboard" className="text-slate-600 hover:text-slate-900">ダッシュボード</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-body font-semibold mb-4 jp-text text-slate-900">サポート</h4>
                <ul className="space-y-2">
                  <li><Link href="/help" className="text-slate-600 hover:text-slate-900">ヘルプ</Link></li>
                  <li><Link href="/contact" className="text-slate-600 hover:text-slate-900">お問い合わせ</Link></li>
                  <li><Link href="/terms" className="text-slate-600 hover:text-slate-900">利用規約</Link></li>
                  <li><Link href="/privacy" className="text-slate-600 hover:text-slate-900">プライバシー</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-200 mt-8 pt-8 text-center">
              <p className="text-body-small text-slate-500 jp-text">
                © 2024 AIO Hub. All rights reserved.
              </p>
            </div>
          </HIGContainer>
        </HIGSection>
      </main>
    </div>
  );
}