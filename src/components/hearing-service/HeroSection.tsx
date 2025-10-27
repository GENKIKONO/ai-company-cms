'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
      
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              asChild
            >
              <Link href="#pricing">
                無料相談を申し込む
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-gray-300 hover:border-gray-400 bg-white/90 backdrop-blur-xl hover:bg-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              asChild
            >
              <Link href="#comparison">
                サービス詳細を見る
              </Link>
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            ✓ 初回30分の相談は無料です　✓ オンライン対応可能　✓ 全国対応
          </p>
        </div>
      </div>
    </section>
  );
}