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

import { 
  CheckCircleIcon, 
  ArrowRightIcon, 
  BuildingIcon, 
  UserIcon, 
  InfoIcon,
  AlertTriangleIcon 
} from '@/components/icons/HIGIcons';
import { LockIcon, SaveIcon, ShieldIcon, ChartUpIcon } from '@/components/icons/SecurityIcons';
import SectionMedia, { HeroMedia, FeatureMedia, IconMedia } from '@/components/media/SectionMedia';
import { PrimaryCTA, SecondaryCTA } from '@/design-system';

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
      description: "Google AI検索で確実に見つけられる企業プロフィール"
    },
    {
      icon: InfoIcon,
      title: "自動更新",
      description: "最新の企業情報を継続的に反映・メンテナンス"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Enhanced Background gradient with geometric elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
        
        <div className="relative z-10 w-full px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            {/* Trust indicators */}
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-full px-6 py-3 mb-10 text-sm font-semibold text-gray-700 shadow-lg">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              14日間無料・クレジットカード不要
            </div>
            
            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AIに"正しく理解"
              </span>
              <br />
              <span className="text-gray-900">される企業へ。</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              企業情報を構造化し、検索やAI回答で
              <span className="font-semibold text-gray-900">確実に見つかる</span>
              状態をつくるCMS。
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-14">
              <span className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-blue-200/60 rounded-2xl px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg">
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
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-20">
              <PrimaryCTA
                href="/auth/signup"
                size="large"
                showArrow={true}
                onClick={() => trackConversion()}
                className="text-xl px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl font-semibold"
              >
                14日間無料で始める
              </PrimaryCTA>
              <SecondaryCTA
                href="/contact"
                size="large"
                className="text-xl px-10 py-5 bg-white/95 backdrop-blur-xl border-2 border-gray-300/60 hover:border-gray-400 hover:bg-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl font-semibold text-gray-700"
              >
                専門ヒアリング相談
              </SecondaryCTA>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/40 shadow-lg text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-sm font-medium text-gray-600">監視体制</div>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/40 shadow-lg text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-sm font-medium text-gray-600">稼働率</div>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/40 shadow-lg text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">10種類</div>
                <div className="text-sm font-medium text-gray-600">セキュリティ機能</div>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/40 shadow-lg text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">50業界</div>
                <div className="text-sm font-medium text-gray-600">対応可能</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-b from-white via-gray-50/30 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              大きな商談も、小さな問い合わせも、
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                すべてに対応
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              企業情報を一元化し、あらゆるビジネスシーンで活用できます
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 mb-20">
            <div className="group relative bg-white rounded-3xl p-10 border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BuildingIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">営業資料として</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  構造化された企業情報で説得力アップ。
                  <br />
                  正確な情報で顧客の信頼を獲得
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            <div className="group relative bg-white rounded-3xl p-10 border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">採用活動で</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  求職者がAI検索で企業を正確に理解。
                  <br />
                  優秀な人材の獲得率向上
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            <div className="group relative bg-white rounded-3xl p-10 border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <InfoIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">PR・広報で</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  メディアがAIで企業情報を取得・引用。
                  <br />
                  露出機会の大幅拡大
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <SecondaryCTA 
              href="/contact" 
              size="large"
              className="text-lg px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl rounded-2xl font-semibold transform hover:-translate-y-1 transition-all duration-300"
            >
              今すぐヒアリング申込み
            </SecondaryCTA>
            <SecondaryCTA 
              href="#pricing" 
              size="large"
              className="text-lg px-10 py-5 border-2 border-gray-300/60 hover:border-gray-400 bg-white/90 backdrop-blur-xl hover:bg-white shadow-xl hover:shadow-2xl rounded-2xl font-semibold transition-all duration-300 text-gray-700"
            >
              料金プランを見る
            </SecondaryCTA>
          </div>
        </div>
      </section>


      {/* How it Works Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              シンプルな
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
          
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    1
                  </div>
                  <div className="hidden lg:block w-8 h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 absolute -right-10 top-8"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">申し込み</h3>
                <p className="text-gray-600 mb-6">基本情報を入力して、すぐに始められます</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">企業名・業界・規模を入力</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">主要サービス・特徴を選択</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">14日間無料トライアル開始</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    2
                  </div>
                  <div className="hidden lg:block w-8 h-0.5 bg-gradient-to-r from-purple-200 to-emerald-200 absolute -right-10 top-8"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">ヒアリング（60分）</h3>
                <p className="text-gray-600 mb-6">専門スタッフが最適化戦略をご提案</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">現在の情報発信状況を確認</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">AI検索最適化の方向性を相談</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">カスタマイズプランを提案</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI最適化・公開</h3>
                <p className="text-gray-600 mb-6">自動で構造化データを生成・公開</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">JSON-LD構造化データ生成</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">AI検索エンジンに最適化</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">企業情報ハブを即座公開</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <PrimaryCTA
              href="/auth/signup"
              size="large"
              showArrow={true}
              className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              今すぐ3ステップを始める
            </PrimaryCTA>
          </div>
        </div>
      </section>


      {/* Before/After Comparison Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              AI時代の
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                新しい課題
              </span>
              を解決
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              ChatGPTやGoogle AI検索が主流になる中、構造化されていない企業情報は正確に引用されません
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            {/* BEFORE */}
            <div className="group">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-100 rounded-3xl p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                    <AlertTriangleIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">見つけてもらえない企業</h3>
                    <p className="text-red-600 font-medium">現在の状況</p>
                  </div>
                </div>

                <div className="bg-white border border-red-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">AI回答</div>
                    <span className="text-red-600 font-semibold">エラー</span>
                  </div>
                  <p className="text-gray-700 italic">
                    申し訳ございませんが、詳細な情報を見つけることができませんでした
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    企業情報が散在・非構造化
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    AIが理解・引用できない形式
                  </div>
                </div>
              </div>
            </div>

            {/* AFTER */}
            <div className="group">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 rounded-3xl p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">AIに理解される企業へ</h3>
                    <p className="text-green-600 font-medium">改善後</p>
                  </div>
                </div>

                <div className="bg-white border border-green-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">AI回答</div>
                    <span className="text-green-600 font-semibold">成功</span>
                  </div>
                  <p className="text-gray-700">
                    <strong className="text-gray-900">[企業名]</strong>は、AI技術を活用した企業情報統合プラットフォームを提供する企業です。
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    構造化された企業情報
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    AI検索に最適化されたデータ
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Image */}
          <div className="text-center mb-16">
            <FeatureMedia 
              caption="構造化前後での検索結果の違い（実際の比較画面）"
              align="center"
              className="shadow-2xl rounded-2xl"
            />
          </div>

          <div className="text-center">
            <PrimaryCTA
              href="/auth/signup"
              size="large"
              showArrow={true}
              className="text-lg px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              14日間無料で体験する
            </PrimaryCTA>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-gray-100" id="pricing">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              シンプルで
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                透明な料金
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              企業規模に応じた最適なプランをご用意しています
            </p>
          </div>
          <PricingTable />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Contact CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 mb-20 text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              その他のご質問がございましたら
            </h2>
            <p className="text-xl mb-8 opacity-90">
              AIO・JSON-LD・構造化データに関する技術的なご質問も承ります
            </p>
            <PrimaryCTA
              href="/contact"
              size="large"
              showArrow={true}
              className="bg-white text-blue-600 hover:bg-gray-50 border-none"
            >
              お問い合わせフォーム
            </PrimaryCTA>
          </div>
          
          <FAQSection
            title={aioCopy.faq.title}
            description={aioCopy.faq.description}
            categories={aioCopy.faq.categories}
          />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.3),transparent_50%)]" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            まずは情報を
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              "構造化"
            </span>
            するところから。
          </h2>
          
          <p className="text-2xl mb-12 opacity-90 leading-relaxed">
            14日間の無料体験で効果を実感
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
            <PrimaryCTA
              href="/auth/signup"
              size="large"
              showArrow={true}
              className="text-xl px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-none shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
            >
              14日間無料で始める
            </PrimaryCTA>
            <SecondaryCTA
              href="/contact"
              size="large"
              className="text-xl px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300"
            >
              専門ヒアリング相談
            </SecondaryCTA>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm opacity-75">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              クレジットカード不要
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              いつでも解約可能
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              専門サポート付き
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}