import { ArrowRight, Sparkles, Brain, Target } from 'lucide-react';
import Link from 'next/link';
import { aioCopy } from '../copy';

export default function Stage() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
            <span>AI時代の企業情報最適化プラットフォーム</span>
          </div>
          
          {/* メインタイトル */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-wide">
            <span className="block">{aioCopy.stage.title}</span>
          </h1>
          
          {/* サブタイトル */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed tracking-normal">
            {aioCopy.stage.description}
          </p>
          
          {/* 特徴ポイント */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 text-gray-700">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">フォーム入力だけで構造化</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium">JSON-LD自動生成</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium">AI引用確率向上</span>
            </div>
          </div>
          
          {/* CTAボタン */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/organizations"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span>無料で始める</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/hearing-service"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-300"
            >
              ヒアリング代行サービス
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}