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
        {/* Hero Section - Apple HIG準拠 */}
        <section className="section-apple-hero bg-white relative overflow-hidden">
          <div className="site-container text-center relative z-10">
            {/* Product badge - Apple style */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-8 transition-all duration-300 hover:bg-blue-100">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-caption text-blue">ChatGPTがあなたの会社を正確に紹介</span>
            </div>
            
            {/* Hero headline - Apple Typography */}
            <h1 className="text-display mb-6 max-w-4xl mx-auto">
              AIに選ばれる企業になる
            </h1>
            
            {/* Value proposition - 簡潔化 */}
            <p className="text-body-large mb-8 max-w-2xl mx-auto">
              構造化データで、確実な検索露出
            </p>

            {/* Primary CTA - Apple Interactive Elements */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/auth/signup"
                onClick={handleCtaClick}
                className="btn-apple btn-apple-primary"
              >
                無料で体験する
                <ArrowRightIcon size={20} className="ml-2" />
              </Link>
              <Link
                href="/aio"
                className="btn-apple btn-apple-secondary"
              >
                デモを見る
              </Link>
            </div>
            
            <div className="text-caption">
              14日間無料 • クレジットカード不要
            </div>
          </div>
        </section>

        {/* Problem vs Solution - Apple HIG準拠 */}
        <section className="section-apple bg-surface relative">
          <div className="site-container relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-title1 mb-4">
                AI時代の新しい課題
              </h2>
              <p className="text-body-large max-w-2xl mx-auto">
                ChatGPTやGoogle AI検索が主流になる中、構造化されていない企業情報は正確に引用されません
              </p>
            </div>

            {/* Before vs After Comparison - Apple Card Style */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
              {/* BEFORE - Problem State */}
              <div className="card-apple">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertTriangleIcon size={16} className="text-red-600" />
                  </div>
                  <div>
                    <div className="text-caption text-secondary mb-1">現在の課題</div>
                    <h3 className="text-title3">見つけてもらえない企業</h3>
                  </div>
                </div>
                
                {/* Mockup of poor AI response */}
                <div className="bg-surface rounded-lg p-4 border-l-4 border-red-400 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-gray-400 rounded" />
                    <span className="text-caption">ChatGPT</span>
                  </div>
                  <div className="text-caption text-secondary mb-2">「[企業名]について教えて」</div>
                  <div className="text-body text-secondary">
                    申し訳ございませんが、詳細な情報を見つけることができませんでした
                  </div>
                </div>

                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <span className="text-body">企業情報が散在・非構造化</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <span className="text-body">AIが理解・引用できない形式</span>
                  </li>
                </ul>
              </div>

              {/* AFTER - Solution State */}
              <div className="card-apple bg-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue rounded-lg flex items-center justify-center">
                    <CheckCircleIcon size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-caption text-blue mb-1">AIO Hub導入後</div>
                    <h3 className="text-title3">AIに選ばれる企業へ</h3>
                  </div>
                </div>
                
                {/* Mockup of improved AI response */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-blue mb-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-blue rounded" />
                    <span className="text-caption font-medium">ChatGPT</span>
                  </div>
                  <div className="text-caption text-secondary mb-2">「[企業名]について教えて」</div>
                  <div className="text-body leading-relaxed">
                    <strong>[企業名]</strong>は、AI技術を活用した企業情報統合プラットフォームを提供する企業です。
                    <br /><br />
                    <strong>主なサービス：</strong> 構造化データによる企業情報最適化
                    <br />
                    <strong>導入実績：</strong> 300社以上
                  </div>
                </div>

                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon size={16} className="text-green-500 mt-1" />
                    <span className="text-body">構造化された企業情報</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon size={16} className="text-green-500 mt-1" />
                    <span className="text-body">AI検索に最適化されたデータ</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                href="/auth/signup"
                className="btn-apple btn-apple-primary"
              >
                14日間無料で体験する
                <ArrowRightIcon size={16} className="ml-2" />
              </Link>
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

        {/* Features - Apple HIG準拠 */}
        <section className="section-apple bg-white">
          <div className="site-container">
            <div className="text-center mb-8">
              <h2 className="text-title1 mb-4">
                3つの価値
              </h2>
              <p className="text-body-large max-w-2xl mx-auto">
                企業情報をAIが理解しやすい形に最適化
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="card-apple text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-50 rounded-lg flex items-center justify-center">
                    <feature.icon size={24} className="text-blue" />
                  </div>
                  <h3 className="text-title3 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-body text-secondary">
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

        {/* Final CTA - Apple HIG準拠 */}
        <section className="section-apple-large bg-surface">
          <div className="site-container text-center">
            <h2 className="text-title1 mb-4">
              AI時代に見つかる企業になる
            </h2>
            <p className="text-body-large mb-8 max-w-xl mx-auto">
              14日間の無料体験で効果を実感
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/auth/signup"
                className="btn-apple btn-apple-primary"
              >
                今すぐ無料で始める
                <ArrowRightIcon size={16} className="ml-2" />
              </Link>
              <Link
                href="/hearing-service"
                className="btn-apple btn-apple-secondary"
              >
                専門ヒアリング相談
              </Link>
            </div>
            
            <div className="text-caption">
              クレジットカード不要 • いつでもキャンセル可能
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
