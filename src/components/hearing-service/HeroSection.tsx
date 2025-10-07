'use client';

import { ArrowRight, Sparkles, Brain, Target } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="block">AIに</span>
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              伝わる企業情報へ
            </span>
          </h1>
          
          {/* サブタイトル */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            1時間のヒアリングで、あなたの会社の魅力を
            <br className="hidden md:block" />
            <span className="font-semibold text-blue-600">AIが理解しやすい構造</span>に最適化します
          </p>
          
          {/* 特徴ポイント */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 text-gray-700">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">専任スタッフがヒアリング</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium">AI最適化構造で登録</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium">検索性・発見性向上</span>
            </div>
          </div>
          
          {/* CTAボタン */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#pricing"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span>サービス詳細を見る</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="#faq"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-300"
            >
              よくある質問
            </Link>
          </div>
          
          {/* 統計情報 */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <div className="text-3xl font-bold text-blue-600 mb-2">127+</div>
              <div className="text-gray-700 font-medium">企業様にご利用</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <div className="text-3xl font-bold text-purple-600 mb-2">60分</div>
              <div className="text-gray-700 font-medium">平均ヒアリング時間</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <div className="text-3xl font-bold text-indigo-600 mb-2">4.8★</div>
              <div className="text-gray-700 font-medium">満足度評価</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}