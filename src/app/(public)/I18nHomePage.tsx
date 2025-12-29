// src/app/I18nHomePage.tsx - Main landing page (590 lines → target 150 lines with HIG design system)
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
import { aioCopy } from '@/app/(public)/aio/copy';
import AioSection from '@/components/layout/AioSection';

import { 
  CheckCircleIcon, 
  ArrowRightIcon, 
  BuildingIcon, 
  UserIcon, 
  InfoIcon,
  AlertTriangleIcon 
} from '@/components/icons/HIGIcons';
import { HIGButton, HIGLinkButton } from '@/components/ui/HIGButton';
import { LockIcon, SaveIcon, ShieldIcon, ChartUpIcon } from '@/components/icons/SecurityIcons';
import SectionMedia, { HeroMedia, FeatureMedia, IconMedia } from '@/components/media/SectionMedia';

interface SiteSettings {
  title: string;
  tagline: string;
  representative_message: string;
  hero_background_image?: string;
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
        // Keep default stats on error
      }
    };

    fetchDynamicStats();
  }, []);

  useSEO({
    title: siteSettings.title,
    description: siteSettings.tagline,
  });

  // Features data
  const features = [
    {
      icon: BuildingIcon,
      title: "構造化企業情報",
      description: "ChatGPT・Geminiが理解しやすい形式で企業情報を最適化"
    },
    {
      icon: UserIcon,
      title: "AI検索対応",
      description: "Google AI検索での発見性を向上する企業プロフィール"
    },
    {
      icon: InfoIcon,
      title: "自動更新",
      description: "最新の企業情報を継続的に反映・メンテナンス"
    }
  ];

  // Simplified section headers without intersection observers
  function FeaturesHeader() {
    return (
      <div className="text-center mb-24">
        <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
          <span className="hig-text-primary">AIに理解される企業</span>
          <br />
          への変革
        </h2>
        <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          構造化されていない企業情報では、もはや正確にAI引用されません
        </p>
      </div>
    );
  }

  // Simplified feature card component without intersection observer
  function FeatureCard({ icon: Icon, title, description, index }: { 
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; 
    title: string; 
    description: string; 
    index: number 
  }) {
    return (
      <div className="aio-surface group relative p-10 border border-gray-200/60 hover:shadow-2xl hover:bg-[var(--aio-info-surface)] transition-all duration-500 hover:-translate-y-2">
        <div className="relative z-10 mb-8">
          <div className="w-20 h-20 hig-bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-10 h-10 hig-text-on-primary" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-600 text-lg leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    );
  }

  // Simplified How it Works header
  function HowItWorksHeader() {
    return (
      <div className="text-center mb-20 section-heading-top">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          シンプルな
          <span className="hig-text-primary">
            3ステップ
          </span>
          で
          <br />
          AI最適化を実現
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          簡単な手続きで、企業情報が構造化され、AIで検索される状態に
        </p>
      </div>
    );
  }

  // Simplified pricing section header
  function PricingHeader() {
    return (
      <div className="text-center mb-16 section-heading-top">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          シンプルで
          <span className="hig-text-primary">
            透明な料金
          </span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          企業規模に応じた最適なプランをご用意しています
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Modern Hero Section */}
      <AioSection tone="white" className="!m-0">
        <section className="relative overflow-hidden py-24 lg:py-32 flex items-center">
        {/* Simple background */}
        <div className="absolute inset-0 bg-white" />
        
        <div className="relative z-10 w-full px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            {/* Trust indicators */}
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-full px-6 py-3 mb-10 text-sm font-semibold text-gray-700 shadow-lg">
              <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse"></div>
              14日間無料・クレジットカード不要
            </div>
            
            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
              <span className="hig-text-primary">
                AIに"正しく理解"
              </span>
              <br />
              <span className="text-gray-900">される企業へ。</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              企業情報を構造化し、検索やAI回答で
              <span className="font-semibold text-gray-900">発見性を向上</span>
              状態をつくるCMS。
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <span className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-[var(--aio-info-border)]/60 rounded-2xl px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                構造化データ
              </span>
              <span className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-purple-200/60 rounded-2xl px-6 py-3 text-sm font-semibold text-purple-700 shadow-lg">
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                AI検索最適化
              </span>
              <span className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-indigo-200/60 rounded-2xl px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                JSON-LD対応
              </span>
            </div>
            
            {/* CTAs - Replaced with HIG design system */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
              <HIGLinkButton 
                href="/auth/signup"
                onClick={() => trackConversion()}
                variant="primary" 
                size="lg" 
                rightIcon={<ArrowRightIcon className="w-5 h-5" />}
              >
                14日間無料で始める
              </HIGLinkButton>
              <HIGLinkButton 
                href="/contact"
                variant="secondary" 
                size="lg"
              >
                専門ヒアリング相談
              </HIGLinkButton>
            </div>

          </div>
        </div>
        </section>
      </AioSection>

      {/* Features & Benefits Section - Consolidated */}
      <AioSection tone="muted" className="pt-24 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FeaturesHeader />
          
          <div className="grid md:grid-cols-3 gap-12 mb-20">
            <FeatureCard
              icon={BuildingIcon}
              title="営業資料として"
              description="構造化された企業情報で説得力アップ。正確な情報で顧客の信頼を獲得"
              index={0}
            />
            <FeatureCard
              icon={UserIcon}
              title="採用活動で"
              description="求職者がAI検索で企業を正確に理解。優秀な人材の獲得率向上"
              index={1}
            />
            <FeatureCard
              icon={InfoIcon}
              title="PR・広報で"
              description="メディアがAIで企業情報を取得・引用。露出機会の大幅拡大"
              index={2}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <HIGLinkButton 
              href="/contact"
              variant="primary" 
              size="md"
            >
              今すぐヒアリング申込み
            </HIGLinkButton>
            <HIGLinkButton 
              href="#pricing"
              variant="secondary" 
              size="md"
            >
              料金プランを見る
            </HIGLinkButton>
          </div>
        </div>
      </AioSection>


      {/* How it Works Section */}
      <AioSection tone="white" className="pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <HowItWorksHeader />
          
          <div className="mobile-scroll lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative min-w-[85%] snap-center lg:min-w-0">
              <div className="aio-surface p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 hig-bg-primary rounded-2xl flex items-center justify-center hig-text-on-primary text-2xl font-bold shadow-lg">
                    1
                  </div>
                  <div className="hidden lg:block w-8 h-0.5 bg-blue-200 absolute -right-10 top-8"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">申し込み</h3>
                <p className="text-gray-600 mb-6">基本情報を入力して、すぐに始められます</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">企業名・業界・規模を入力</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">主要サービス・特徴を選択</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">14日間無料トライアル開始</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative min-w-[85%] snap-center lg:min-w-0">
              <div className="aio-surface p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 hig-bg-primary rounded-2xl flex items-center justify-center hig-text-on-primary text-2xl font-bold shadow-lg">
                    2
                  </div>
                  <div className="hidden lg:block w-8 h-0.5 bg-blue-200 absolute -right-10 top-8"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">ヒアリング（60分）</h3>
                <p className="text-gray-600 mb-6">専門スタッフが最適化戦略をご提案</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">現在の情報発信状況を確認</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">AI検索最適化の方向性を相談</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">カスタマイズプランを提案</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative min-w-[85%] snap-center lg:min-w-0">
              <div className="aio-surface p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 hig-bg-primary rounded-2xl flex items-center justify-center hig-text-on-primary text-2xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI最適化・公開</h3>
                <p className="text-gray-600 mb-6">自動で構造化データを生成・公開</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">JSON-LD構造化データ生成</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">AI検索エンジンに最適化</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700">企業情報ハブを即座公開</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16 mb-12 lg:mb-16">
            <HIGLinkButton 
              href="/auth/signup"
              variant="primary" 
              size="md"
              rightIcon={<ArrowRightIcon className="w-5 h-5" />}
            >
              今すぐ3ステップを始める
            </HIGLinkButton>
          </div>
        </div>
      </AioSection>



      {/* Pricing, FAQ & CTA Section - Consolidated */}
      <AioSection tone="muted" id="pricing" className="bg-gray-100 pt-24 pb-24" noSectionSpacing={true}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <PricingHeader />
          <PricingTable />
          
          {/* FAQ Integration */}
          <div className="mt-20">
            <FAQSection
              title={aioCopy.faq.title}
              description={aioCopy.faq.description}
              categories={aioCopy.faq.categories}
            />
          </div>
          
          {/* Final CTA - Integrated */}
          <div className="text-center mt-20 mb-0">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight text-gray-900">
              まずは情報を
              <span className="hig-text-primary">"構造化"</span>
              するところから。
            </h2>
            <p className="text-xl mb-8 text-gray-600 leading-relaxed">
              14日間の無料体験でお試しください
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
              <HIGLinkButton 
                href="/auth/signup"
                variant="primary" 
                size="lg"
                rightIcon={<ArrowRightIcon className="w-5 h-5" />}
              >
                14日間無料で始める
              </HIGLinkButton>
              <HIGLinkButton 
                href="/contact"
                variant="secondary" 
                size="lg"
              >
                専門ヒアリング相談
              </HIGLinkButton>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-gray-600" />
                クレジットカード不要
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-gray-600" />
                いつでも解約可能
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-gray-600" />
                専門サポート付き
              </div>
            </div>
          </div>
        </div>
      </AioSection>

    </div>
  );
}