'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative section-spacing-large overflow-hidden">
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          {/* Main title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            AIに選ばれる
            <span className="text-[var(--bg-primary)]">
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
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link 
              href="#pricing"
              className="inline-flex items-center justify-center font-bold bg-[var(--bg-primary)] hover:bg-[var(--bg-primary-hover)] text-white px-10 py-5 text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              無料相談を申し込む
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="#comparison"
              className="inline-flex items-center justify-center font-bold border-2 border-[var(--bg-primary)] hover:border-[var(--bg-primary-hover)] bg-white hover:bg-gray-50 text-[var(--bg-primary)] px-10 py-5 text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
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