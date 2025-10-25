'use client';

import { ArrowRight, Sparkles, Brain, Target } from 'lucide-react';
import Link from 'next/link';
import { HIGButton } from '@/components/ui/HIGButton';
import { HIGCard, HIGCardTitle, HIGCardContent } from '@/components/ui/HIGCard';
import { HIGGrid } from '@/components/layout/HIGLayout';

export default function HeroSection() {
  return (
    <section className="hig-section bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 1200 800" className="w-full h-full">
          <circle cx="300" cy="200" r="120" fill="#3b82f6" opacity="0.1">
            <animate attributeName="opacity" values="0.1;0.2;0.1" dur="4s" repeatCount="indefinite"/>
          </circle>
          <circle cx="900" cy="300" r="120" fill="#8b5cf6" opacity="0.1">
            <animate attributeName="opacity" values="0.1;0.15;0.1" dur="5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="200" cy="600" r="120" fill="#6366f1" opacity="0.1">
            <animate attributeName="opacity" values="0.05;0.15;0.05" dur="6s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
      
      <div className="hig-container relative z-10 text-center">
          {/* バッジ */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>AI時代の企業情報最適化</span>
          </div>
          
          {/* メインタイトル */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              <span className="block text-slate-900">AIに</span>
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                伝わる企業情報へ
              </span>
            </h1>
          </div>
          
          {/* サブタイトル */}
          <div className="mb-8">
            <p className="text-xl text-slate-700 mb-8 leading-relaxed max-w-3xl mx-auto">
              1時間のヒアリングで、あなたの会社の魅力を<span className="font-semibold text-blue-700">AIが理解しやすい構造</span>に最適化します
            </p>
          </div>
          
          {/* 特徴ポイント */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-3 p-4 bg-white/80 rounded-2xl shadow-sm">
                <Brain className="w-8 h-8 text-blue-600" />
                <span className="text-lg font-medium text-slate-800">専任スタッフがヒアリング</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 bg-white/80 rounded-2xl shadow-sm">
                <Target className="w-8 h-8 text-purple-600" />
                <span className="text-lg font-medium text-slate-800">AI最適化構造で登録</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 bg-white/80 rounded-2xl shadow-sm">
                <Sparkles className="w-8 h-8 text-indigo-600" />
                <span className="text-lg font-medium text-slate-800">検索性・発見性向上</span>
              </div>
            </div>
          </div>
          
          {/* CTAボタン */}
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="#pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                <span>サービス詳細を見る</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                href="#faq"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 shadow"
              >
                <span>よくある質問</span>
              </Link>
            </div>
          </div>
          
          {/* サービス特徴 */}
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-blue-600 mb-4">専門ヒアリング</h3>
                <p className="text-gray-700 leading-relaxed">AI最適化の専門スタッフが企業情報を丁寧にヒアリング</p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-purple-600 mb-4">構造化登録</h3>
                <p className="text-gray-700 leading-relaxed">ヒアリング内容をJSON-LD形式で構造化・最適化して登録</p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-indigo-600 mb-4">継続改善</h3>
                <p className="text-gray-700 leading-relaxed">定期的な情報更新とAI検索最適化のサポート</p>
              </div>
            </div>
          </div>
      </div>
    </section>
  );
}