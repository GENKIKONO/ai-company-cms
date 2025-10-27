'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60">
      {/* Background decoration - more subtle */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.06),transparent_60%)]"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          {/* Main title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            AIに選ばれる
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              企業
            </span>
            になる
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            専門ヒアリングで企業情報を構造化。ChatGPTやGoogle AI検索で正確に引用され、
            <br className="hidden md:block" />
            ビジネス機会を拡大する企業プロフィールを1時間で構築。
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-12 text-sm text-gray-600">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">1時間</div>
              <div className="text-gray-500">ヒアリング時間</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">3日以内</div>
              <div className="text-gray-500">構造化完了</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">即座に</div>
              <div className="text-gray-500">AI検索対応</div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link 
              href="#pricing"
              className="inline-flex items-center justify-center font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-5 text-xl rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              無料相談を申し込む
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="#comparison"
              className="inline-flex items-center justify-center font-semibold border-2 border-gray-300/60 hover:border-gray-400 bg-white/90 backdrop-blur-xl hover:bg-white text-gray-700 px-10 py-5 text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              サービス詳細を見る
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            ✓ 初回30分の相談は無料です　✓ オンライン対応可能　✓ 全国対応
          </p>
        </div>
      </div>
    </section>
  );
}