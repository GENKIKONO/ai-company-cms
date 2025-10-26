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
        {/* Hero Section - Apple-inspired Product Experience */}
        <section className="relative min-h-screen flex items-center justify-center bg-white overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          <div className="site-container text-center relative z-10">
            {/* Product badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 mb-8 transition-all duration-300 hover:bg-blue-100">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              ChatGPTがあなたの会社を正確に紹介
            </div>
            
            {/* Hero headline with Apple typography */}
            <h1 className="text-display mb-8 max-w-5xl mx-auto">
              AIに<br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">選ばれる企業</span>になる
            </h1>
            
            {/* Value proposition */}
            <p className="text-body-large mb-12 max-w-3xl mx-auto opacity-80">
              構造化された企業情報で、AI検索・ChatGPT回答での露出を確保。<br />
              新たなビジネス機会を創出する次世代企業CMSです。
            </p>

            {/* Visual proof - AI search result mockup */}
            <div className="mb-16 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-2xl border border-gray-200">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded" />
                    <span className="text-sm font-medium text-gray-600">ChatGPT</span>
                  </div>
                  <div className="text-left space-y-3">
                    <div className="text-gray-400 text-sm">「[企業名]について教えて」</div>
                    <div className="text-gray-900 leading-relaxed">
                      <strong>[企業名]</strong>は、AI技術を活用した企業情報統合プラットフォームを提供する企業です。
                      <br /><br />
                      <strong>主なサービス：</strong><br />
                      • 構造化データによる企業情報最適化<br />
                      • JSON-LD準拠のSEO強化<br />
                      • AI検索エンジン対応
                      <br /><br />
                      <strong>導入実績：</strong> 300社以上の企業が導入済み
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-500">↑ AIO Hub導入後のAI回答例</span>
                </div>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <Link
                href="/auth/signup"
                onClick={handleCtaClick}
                className="btn-primary text-lg px-10 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                無料で体験する
                <ArrowRightIcon size={20} />
              </Link>
              <Link
                href="/aio"
                className="btn-secondary text-lg px-10 py-4 hover:bg-gray-50"
              >
                デモを見る
              </Link>
            </div>
            
            <div className="text-caption opacity-60">
              14日間無料 • クレジットカード不要 • 5分で設定完了
            </div>
          </div>
        </section>

        {/* Problem vs Solution - Before/After Comparison */}
        <section className="py-24 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#3B82F6_1px,transparent_1px)] bg-[length:40px_40px]" />
          </div>
          
          <div className="site-container relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-8 shadow-sm border border-orange-200">
                <AlertTriangleIcon size={14} className="text-orange-600" />
                AI時代の新たな課題
              </div>
              <h2 className="text-title1 mb-6">
                従来の企業情報では<br />
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">AIに見つけてもらえない</span>
              </h2>
              <p className="text-body-large max-w-3xl mx-auto opacity-80">
                ChatGPTやGoogle AI検索が主流になる中、<br />
                構造化されていない企業情報は正確に引用されません。
              </p>
            </div>

            {/* Before vs After Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* BEFORE - Problem State */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-red-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-2">現在の課題</div>
                    <h3 className="text-xl font-bold text-gray-900">AIに見つけてもらえない企業</h3>
                  </div>
                </div>
                
                {/* Mockup of poor AI response */}
                <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-red-400 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-gray-400 rounded" />
                    <span className="text-sm text-gray-600">ChatGPT</span>
                  </div>
                  <div className="text-gray-400 text-sm mb-2">「[企業名]について教えて」</div>
                  <div className="text-gray-600 text-sm">
                    申し訳ございませんが、[企業名]について詳細な情報を見つけることができませんでした。より具体的な情報があれば、お手伝いできるかもしれません。
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <span className="text-sm text-gray-700">企業情報が散在・非構造化</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <span className="text-sm text-gray-700">AIが理解・引用できない形式</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <span className="text-sm text-gray-700">ビジネス機会の損失</span>
                  </li>
                </ul>
              </div>

              {/* AFTER - Solution State */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-2">AIO Hub導入後</div>
                    <h3 className="text-xl font-bold text-gray-900">AIに選ばれる企業へ</h3>
                  </div>
                </div>
                
                {/* Mockup of improved AI response */}
                <div className="bg-white rounded-xl p-6 border-l-4 border-blue-400 mb-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded" />
                    <span className="text-sm font-medium text-gray-700">ChatGPT</span>
                  </div>
                  <div className="text-gray-400 text-sm mb-2">「[企業名]について教えて」</div>
                  <div className="text-gray-900 text-sm leading-relaxed">
                    <strong>[企業名]</strong>は、AI技術を活用した企業情報統合プラットフォームを提供する企業です。
                    <br /><br />
                    <strong>主なサービス：</strong><br />
                    • 構造化データによる企業情報最適化<br />
                    • JSON-LD準拠のSEO強化<br />
                    • AI検索エンジン対応
                    <br /><br />
                    <strong>導入実績：</strong> 300社以上
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon size={20} className="text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-700">構造化された企業情報</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon size={20} className="text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-700">AI検索に最適化されたデータ</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon size={20} className="text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-700">新規ビジネス機会の創出</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Arrow indicating transformation */}
            <div className="text-center my-12">
              <div className="inline-flex items-center gap-4">
                <div className="w-16 h-0.5 bg-gradient-to-r from-gray-300 to-blue-500" />
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRightIcon size={24} className="text-white" />
                </div>
                <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-600">AIO Hubで変革</p>
            </div>

            {/* Value proposition summary */}
            <div className="text-center">
              <h3 className="text-title2 mb-6">
                AI時代の企業戦略を、<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">今すぐ始める</span>
              </h3>
              <p className="text-body-large mb-8 max-w-2xl mx-auto opacity-80">
                構造化された企業情報でAIに正確に理解され、<br />
                新たなビジネス機会を創出する時代へ。
              </p>
              
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                14日間無料で体験する
                <ArrowRightIcon size={20} />
              </Link>
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

        {/* Dashboard Demo - Product Experience */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="site-container">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-8 shadow-sm border border-green-200">
                <CheckCircleIcon size={14} className="text-green-600" />
                実際のダッシュボード
              </div>
              <h2 className="text-title1 mb-6">
                直感的で美しい管理画面で<br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">企業情報を一元管理</span>
              </h2>
              <p className="text-body-large max-w-3xl mx-auto opacity-80">
                Apple品質のユーザーインターフェースで、<br />
                複雑な企業情報管理をシンプルに。
              </p>
            </div>

            {/* Interactive Dashboard Mockup */}
            <div className="max-w-7xl mx-auto">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 shadow-2xl">
                {/* Browser Header */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                  <div className="flex items-center gap-2 px-6 py-4 bg-gray-50 border-b">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full" />
                      <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                      <div className="w-3 h-3 bg-green-400 rounded-full" />
                    </div>
                    <div className="flex-1 text-center">
                      <div className="bg-gray-200 rounded-full px-4 py-1 text-sm text-gray-600 inline-block">
                        dashboard.aiohub.jp
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">企業情報ダッシュボード</h3>
                        <p className="text-gray-600">AI最適化された企業情報を管理</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          AI最適化済み
                        </div>
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                          情報を追加
                        </div>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="text-3xl font-bold text-blue-900 mb-2">98%</div>
                        <div className="text-sm text-blue-700">AI理解度</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                        <div className="text-3xl font-bold text-green-900 mb-2">156</div>
                        <div className="text-sm text-green-700">構造化項目</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <div className="text-3xl font-bold text-purple-900 mb-2">23</div>
                        <div className="text-sm text-purple-700">AI引用回数</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                        <div className="text-3xl font-bold text-orange-900 mb-2">+12%</div>
                        <div className="text-sm text-orange-700">月間露出増</div>
                      </div>
                    </div>

                    {/* Content Management */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Information Structure */}
                      <div className="bg-gray-50 rounded-xl p-6 border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <BuildingIcon size={16} className="text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900">企業基本情報</h4>
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            完了
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border">
                            <span className="text-sm text-gray-700">会社概要</span>
                            <CheckCircleIcon size={16} className="text-green-500" />
                          </div>
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border">
                            <span className="text-sm text-gray-700">事業内容</span>
                            <CheckCircleIcon size={16} className="text-green-500" />
                          </div>
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border">
                            <span className="text-sm text-gray-700">強み・特徴</span>
                            <CheckCircleIcon size={16} className="text-green-500" />
                          </div>
                        </div>
                      </div>

                      {/* AI Optimization Status */}
                      <div className="bg-gray-50 rounded-xl p-6 border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900">AI最適化状況</h4>
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            進行中
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border">
                            <span className="text-sm text-gray-700">JSON-LD構造化</span>
                            <CheckCircleIcon size={16} className="text-green-500" />
                          </div>
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border">
                            <span className="text-sm text-gray-700">SEO最適化</span>
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                          <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border">
                            <span className="text-sm text-gray-700">AI検索対応</span>
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">リアルタイム分析</h3>
                <p className="text-sm text-gray-600">AI引用状況とSEO効果をリアルタイムで可視化</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ワンクリック最適化</h3>
                <p className="text-sm text-gray-600">AIが自動で最適な構造化データを生成・適用</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">成果の可視化</h3>
                <p className="text-sm text-gray-600">AI検索での露出増加を数値とグラフで確認</p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-16">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                無料でダッシュボードを体験
                <ArrowRightIcon size={20} />
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

        {/* Features - 理解：主要機能を3つに絞る */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative">
          <div className="site-container">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-title1 mb-6">
                AIO Hubの3つの価値
              </h2>
              <p className="text-body-large max-w-3xl mx-auto opacity-80">
                企業情報をAIが理解しやすい形に最適化し、発見機会を最大化します
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`apple-card bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100 animate-fade-in-up animate-delay-${(index + 1) * 100}`}
                >
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                    <feature.icon size={32} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
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

        {/* Final CTA - Apple-inspired design with visual elements */}
        <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden animate-gradient">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-float animate-delay-300" />
          </div>
          
          <div className="site-container text-center relative z-10">
            <div className="animate-fade-in-up">
              <h2 className="text-title1 mb-6 text-white">
                AI時代に見つかる企業になる
              </h2>
              <p className="text-body-large mb-12 max-w-2xl mx-auto text-white opacity-90">
                14日間の無料体験で、AI検索に最適化された<br />
                企業情報の効果を実感してください。
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                <Link
                  href="/auth/signup"
                  className="apple-button inline-flex items-center gap-2 bg-white text-blue-700 px-10 py-4 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl border-0"
                >
                  今すぐ無料で始める
                  <ArrowRightIcon size={20} />
                </Link>
                <Link
                  href="/hearing-service"
                  className="apple-button inline-flex items-center gap-2 bg-transparent text-white px-10 py-4 rounded-xl font-medium text-lg border-2 border-white border-opacity-30 hover:bg-white hover:bg-opacity-10"
                >
                  専門ヒアリング相談
                </Link>
              </div>
              
              <div className="text-white text-opacity-75 text-sm">
                クレジットカード不要 • いつでもキャンセル可能 • 3分で設定完了
              </div>
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
