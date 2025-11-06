'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden py-24 lg:py-32 flex items-center">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          {/* Trust indicators */}
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-full px-6 py-3 mb-10 text-sm font-semibold text-gray-700 shadow-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            専門ヒアリング代行サービス
          </div>

          {/* Main title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            AIに選ばれる
            <span className="text-[var(--aio-primary)]">
              企業
            </span>
            になる
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            専門ヒアリングで企業情報を構造化。ChatGPTやGoogle AI検索で正確に引用され、
            <br className="hidden md:block" />
            ビジネス機会を拡大する企業プロフィールを構築。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12 lg:mb-16">
            <Link 
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 text-lg px-8 py-4 bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-[var(--text-on-primary)] font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              無料相談を申し込む
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#comparison"
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--aio-surface)] hover:bg-[var(--aio-muted)] text-[var(--text-primary)] font-bold rounded-xl border border-gray-300 transition-all duration-300"
            >
              サービス詳細を見る
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            ✓ 初回30分の相談は無料です　✓ オンライン対応可能　✓ 全国対応
          </p>
        </div>
      </div>
    </div>
  );
}