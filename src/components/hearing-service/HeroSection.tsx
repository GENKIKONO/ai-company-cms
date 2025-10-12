'use client';

import { ArrowRight, Sparkles, Brain, Target } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="section-layer section-hero-pad surface-fade-btm deco-wrap bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hero-gap">
      {/* 背景装飾 - 安全な配置で切り取り防止 */}
      <div className="deco-img opacity-30">
        <svg width="100%" height="100%" viewBox="0 0 1200 800" className="media-contain">
          <circle cx="300" cy="200" r="120" fill="#bfdbfe" opacity="0.8">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite"/>
          </circle>
          <circle cx="900" cy="300" r="120" fill="#c4b5fd" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="200" cy="600" r="120" fill="#a5b4fc" opacity="0.8">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="6s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
      
      <div className="container-hero section-content text-left content-above-deco">
          {/* バッジ */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="jp-phrase">AI時代の企業情報最適化</span>
          </div>
          
          {/* メインタイトル */}
          <div className="measure-hero">
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 text-left">
              <span className="block jp-phrase">AIに</span>
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent jp-phrase">
                伝わる企業情報へ
              </span>
            </h1>
          </div>
          
          {/* サブタイトル */}
          <div className="measure-lead">
            <p className="copy text-[15px] sm:text-base md:text-xl text-gray-600 mb-8 text-left jp-phrase">
              1時間のヒアリングで、あなたの会社の魅力を<span className="font-semibold text-blue-600">AIが理解しやすい構造</span>に最適化します
            </p>
          </div>
          
          {/* 特徴ポイント */}
          <div className="measure-lead">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4 sm:gap-6 mb-8 text-gray-700">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                <span className="copy text-sm font-medium cta-nowrap jp-phrase">専任スタッフがヒアリング</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span className="copy text-sm font-medium cta-nowrap jp-phrase">AI最適化構造で登録</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span className="copy text-sm font-medium cta-nowrap jp-phrase">検索性・発見性向上</span>
              </div>
            </div>
          </div>
          
          {/* CTAボタン */}
          <div className="measure-lead">
            <div className="flex flex-col sm:flex-row items-start justify-start gap-3 sm:gap-4">
            <Link
              href="#pricing"
              className="cta-unified cta-unified--primary gap-2"
            >
              <span className="jp-phrase">サービス詳細を見る</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href="#faq"
              className="cta-unified cta-unified--secondary gap-2"
            >
              <span className="jp-phrase">よくある質問</span>
            </Link>
            </div>
          </div>
          
          {/* サービス特徴 */}
          <div className="section-gap">
            <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="card group p-6 sm:p-7 bg-white/70 backdrop-blur-sm border border-white/60 ui-card transition-all duration-300">
                <h3 className="headline text-lg font-bold text-blue-600 mb-2 text-left jp-phrase">専門ヒアリング</h3>
                <p className="copy measure-body text-[15px] sm:text-base text-gray-700 text-left jp-phrase">AI最適化の専門スタッフが企業情報を丁寧にヒアリング</p>
              </div>
              <div className="card group p-6 sm:p-7 bg-white/70 backdrop-blur-sm border border-white/60 ui-card transition-all duration-300">
                <h3 className="headline text-lg font-bold text-purple-600 mb-2 text-left jp-phrase">構造化登録</h3>
                <p className="copy measure-body text-[15px] sm:text-base text-gray-700 text-left jp-phrase">ヒアリング内容をJSON-LD形式で構造化・最適化して登録</p>
              </div>
              <div className="card group p-6 sm:p-7 bg-white/70 backdrop-blur-sm border border-white/60 ui-card transition-all duration-300">
                <h3 className="headline text-lg font-bold text-indigo-600 mb-2 text-left jp-phrase">継続改善</h3>
                <p className="copy measure-body text-[15px] sm:text-base text-gray-700 text-left jp-phrase">定期的な情報更新とAI検索最適化のサポート</p>
              </div>
            </div>
          </div>
      </div>
    </section>
  );
}