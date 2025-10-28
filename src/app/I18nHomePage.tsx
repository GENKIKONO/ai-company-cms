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
import { MobileNav } from '@/components/MobileNav';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
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
              <span className="text-[var(--bg-primary)]">
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
              <Link
                href="/auth/signup"
                onClick={() => trackConversion()}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                14日間無料で始める
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl border border-gray-300 transition-all duration-300"
              >
                専門ヒアリング相談
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing-large bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              大きな商談も、小さな問い合わせも、
              <br />
              <span className="text-[var(--bg-primary)]">
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
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BuildingIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">営業資料として</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  構造化された企業情報で説得力アップ。
                  <br />
                  正確な情報で顧客の信頼を獲得
                </p>
              </div>
              <div className="absolute inset-0 bg-blue-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            <div className="group relative bg-white rounded-3xl p-10 border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">採用活動で</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  求職者がAI検索で企業を正確に理解。
                  <br />
                  優秀な人材の獲得率向上
                </p>
              </div>
              <div className="absolute inset-0 bg-blue-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            <div className="group relative bg-white rounded-3xl p-10 border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <InfoIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">PR・広報で</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  メディアがAIで企業情報を取得・引用。
                  <br />
                  露出機会の大幅拡大
                </p>
              </div>
              <div className="absolute inset-0 bg-blue-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              今すぐヒアリング申込み
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl border border-gray-300 transition-all duration-300"
            >
              料金プランを見る
            </Link>
          </div>
        </div>
      </section>


      {/* How it Works Section */}
      <section className="section-spacing bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              シンプルな
              <span className="text-[var(--bg-primary)]">
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
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
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
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
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
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
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
          <div className="text-center mt-16">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              今すぐ3ステップを始める
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>


      {/* Before/After Comparison Section */}
      <section className="section-spacing bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              AI時代の
              <span className="text-gray-800">
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
              <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 min-h-[520px] flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-2xl flex items-center justify-center">
                    <AlertTriangleIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">見つけてもらえない企業</h3>
                    <p className="text-gray-600 font-medium">現在の状況</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">AI回答</div>
                    <span className="text-gray-600 font-semibold">エラー</span>
                  </div>
                  <p className="text-gray-700 italic">
                    申し訳ございませんが、詳細な情報を見つけることができませんでした
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    企業情報が散在・非構造化
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    AIが理解・引用できない形式
                  </div>
                </div>
              </div>
            </div>

            {/* AFTER */}
            <div className="group">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 min-h-[520px] flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-2xl flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">AIに理解される企業へ</h3>
                    <p className="text-blue-600 font-medium">改善後</p>
                  </div>
                </div>

                <div className="bg-white border border-blue-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">AI回答</div>
                    <span className="text-blue-600 font-semibold">成功</span>
                  </div>
                  <p className="text-gray-700">
                    <strong className="text-gray-900">[企業名]</strong>は、AI技術を活用した企業情報統合プラットフォームを提供する企業です。
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                    構造化された企業情報
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-blue-500" />
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
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              14日間無料で体験する
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section-spacing bg-gray-50" id="pricing">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              シンプルで
              <span className="text-[var(--bg-primary)]">
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
      <section className="section-spacing bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Contact CTA */}
          <div className="bg-[var(--bg-primary)] rounded-3xl p-12 mb-20 text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              その他のご質問がございましたら
            </h2>
            <p className="text-xl mb-8 opacity-90">
              AIO・JSON-LD・構造化データに関する技術的なご質問も承ります
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 hover:bg-gray-50 font-bold rounded-xl border-none shadow-lg hover:shadow-xl transition-all duration-300"
            >
              お問い合わせフォーム
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
          
          <FAQSection
            title={aioCopy.faq.title}
            description={aioCopy.faq.description}
            categories={aioCopy.faq.categories}
          />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="section-spacing-large bg-white text-gray-900 relative overflow-hidden">
        {/* Background effects */}
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gray-900">
            まずは情報を
            <br />
            <span className="text-blue-600">
              "構造化"
            </span>
            するところから。
          </h2>
          
          <p className="text-2xl mb-12 text-gray-700 leading-relaxed">
            14日間の無料体験でお試しください
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 text-xl px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
            >
              14日間無料で始める
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center text-xl px-10 py-5 bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 hover:border-gray-400 text-gray-900 font-bold rounded-xl transition-all duration-300"
            >
              専門ヒアリング相談
            </Link>
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
      </section>

      <MobileNav />
    </div>
  );
}