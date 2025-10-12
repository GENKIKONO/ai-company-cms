'use client';

import { ArrowRight, Sparkles, Brain, Target } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="section bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
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
      
      <div className="container relative z-10">
          {/* バッジ */}
          <div className="badge badge-primary mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="jp-text">AI時代の企業情報最適化</span>
          </div>
          
          {/* メインタイトル */}
          <div className="mb-6">
            <h1 className="text-display text-neutral-900 mb-6">
              <span className="block jp-text">AIに</span>
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent jp-text">
                伝わる企業情報へ
              </span>
            </h1>
          </div>
          
          {/* サブタイトル */}
          <div className="mb-8">
            <p className="text-body-large text-neutral-600 mb-8 jp-text">
              1時間のヒアリングで、あなたの会社の魅力を<span className="font-semibold text-primary">AIが理解しやすい構造</span>に最適化します
            </p>
          </div>
          
          {/* 特徴ポイント */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4 sm:gap-6 mb-8 text-neutral-700">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                <span className="text-body-small font-medium jp-text">専任スタッフがヒアリング</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span className="text-body-small font-medium jp-text">AI最適化構造で登録</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span className="text-body-small font-medium jp-text">検索性・発見性向上</span>
              </div>
            </div>
          </div>
          
          {/* CTAボタン */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start justify-start gap-3 sm:gap-4">
            <Link
              href="#pricing"
              className="btn btn-primary btn-large gap-2"
            >
              <span className="jp-text">サービス詳細を見る</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href="#faq"
              className="btn btn-secondary btn-large gap-2"
            >
              <span className="jp-text">よくある質問</span>
            </Link>
            </div>
          </div>
          
          {/* サービス特徴 */}
          <div className="mt-12">
            <div className="grid grid-3 gap-6">
              <div className="card bg-white/70 backdrop-blur-sm border border-white/60">
                <h3 className="text-h3 text-blue-600 mb-2 jp-text">専門ヒアリング</h3>
                <p className="text-body text-neutral-700 jp-text">AI最適化の専門スタッフが企業情報を丁寧にヒアリング</p>
              </div>
              <div className="card bg-white/70 backdrop-blur-sm border border-white/60">
                <h3 className="text-h3 text-purple-600 mb-2 jp-text">構造化登録</h3>
                <p className="text-body text-neutral-700 jp-text">ヒアリング内容をJSON-LD形式で構造化・最適化して登録</p>
              </div>
              <div className="card bg-white/70 backdrop-blur-sm border border-white/60">
                <h3 className="text-h3 text-indigo-600 mb-2 jp-text">継続改善</h3>
                <p className="text-body text-neutral-700 jp-text">定期的な情報更新とAI検索最適化のサポート</p>
              </div>
            </div>
          </div>
      </div>
    </section>
  );
}