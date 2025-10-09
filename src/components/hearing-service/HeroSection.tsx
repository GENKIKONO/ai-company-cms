'use client';

import { ArrowRight, Sparkles, Brain, Target } from 'lucide-react';
import Link from 'next/link';
import HorizontalScroller from '@/components/ui/HorizontalScroller';

export default function HeroSection() {
  return (
    <section className="relative py-10 sm:py-16 lg:py-20 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* バッジ */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>AI時代の企業情報最適化</span>
          </div>
          
          {/* メインタイトル */}
          <h1 className="jp-heading text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            <span className="block">AIに</span>
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              伝わる企業情報へ
            </span>
          </h1>
          
          {/* サブタイトル */}
          <p className="jp-body text-[15px] sm:text-base md:text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-7 sm:leading-8">
            1時間のヒアリングで、<br className="sm:hidden" />あなたの会社の魅力を<br className="hidden md:block" /><span className="font-semibold text-blue-600">AIが理解しやすい構造</span>に最適化します
          </p>
          
          {/* 特徴ポイント */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 text-gray-700">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium whitespace-nowrap">専任スタッフがヒアリング</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium whitespace-nowrap">AI最適化構造で登録</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium whitespace-nowrap">検索性・発見性向上</span>
            </div>
          </div>
          
          {/* CTAボタン */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="#pricing"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors duration-200"
            >
              <span>サービス詳細を見る</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="#faq"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg font-medium border border-gray-200 hover:bg-white hover:border-gray-300 transition-colors duration-200"
            >
              よくある質問
            </Link>
          </div>
          
          {/* サービス特徴 */}
          <div className="mt-12 sm:mt-16">
            <HorizontalScroller ariaLabel="サービス特徴" className="sm:grid-cols-2 lg:grid-cols-3">
              <div className="snap-start min-w-[280px] sm:min-w-0 bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/50">
                <div className="jp-heading text-lg font-bold text-blue-600 mb-2">専門ヒアリング</div>
                <div className="jp-body text-[15px] sm:text-base text-gray-700 leading-6 sm:leading-7">AI最適化の専門スタッフが<br className="sm:hidden" />企業情報を丁寧にヒアリング</div>
              </div>
              <div className="snap-start min-w-[280px] sm:min-w-0 bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/50">
                <div className="jp-heading text-lg font-bold text-purple-600 mb-2">構造化登録</div>
                <div className="jp-body text-[15px] sm:text-base text-gray-700 leading-6 sm:leading-7">ヒアリング内容を<br className="sm:hidden" />JSON-LD形式で構造化・最適化して登録</div>
              </div>
              <div className="snap-start min-w-[280px] sm:min-w-0 bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/50">
                <div className="jp-heading text-lg font-bold text-indigo-600 mb-2">継続改善</div>
                <div className="jp-body text-[15px] sm:text-base text-gray-700 leading-6 sm:leading-7">定期的な情報更新と<br className="sm:hidden" />AI検索最適化のサポート</div>
              </div>
            </HorizontalScroller>
          </div>
        </div>
      </div>
    </section>
  );
}