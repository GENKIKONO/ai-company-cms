'use client';

import { ArrowRight, Calendar, Shield, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import HorizontalScroller from '@/components/ui/HorizontalScroller';

export default function CTASection() {
  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden ui-bottom-content">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* メインメッセージ */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            今すぐAI時代に対応した
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              企業情報を手に入れよう
            </span>
          </h2>
          
          <p className="text-[15px] sm:text-base md:text-xl text-blue-100 mb-8 sm:mb-12 max-w-3xl mx-auto leading-7 sm:leading-8">
            複雑な作業は一切不要。専門スタッフがあなたの企業の魅力を
            <br className="hidden md:block" />
            AIが理解しやすい形で構造化し、競合他社との差別化を実現します。
          </p>

          {/* 特徴ポイント */}
          <div className="mb-8 sm:mb-12">
            <HorizontalScroller ariaLabel="サービス特徴" className="sm:grid-cols-2 lg:grid-cols-4">
              <div className="snap-start min-w-[200px] sm:min-w-0 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-semibold text-sm">最短2週間</div>
                <div className="text-blue-200 text-xs">スピード対応</div>
              </div>
              <div className="snap-start min-w-[200px] sm:min-w-0 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-white font-semibold text-sm">満足保証</div>
                <div className="text-blue-200 text-xs">品質をお約束</div>
              </div>
              <div className="snap-start min-w-[200px] sm:min-w-0 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 mx-auto mb-2" />
                <div className="text-white font-semibold text-sm">4.8★評価</div>
                <div className="text-blue-200 text-xs">高い満足度</div>
              </div>
              <div className="snap-start min-w-[200px] sm:min-w-0 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400 mx-auto mb-2" />
                <div className="text-white font-semibold text-sm">予約制</div>
                <div className="text-blue-200 text-xs">確実な対応</div>
              </div>
            </HorizontalScroller>
          </div>

          {/* メインCTAボタン */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-3 px-6 py-3 min-h-[44px] bg-gradient-to-r from-white to-blue-50 text-gray-900 rounded-lg font-bold hover:from-blue-50 hover:to-white transition-colors duration-200"
              aria-label="今すぐヒアリングを申し込む"
            >
              <span className="whitespace-nowrap">
                <span className="hidden sm:inline">今すぐヒアリング<wbr/>を申し込む</span>
                <span className="sm:hidden">ヒアリング申し込み</span>
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium border border-white/30 hover:bg-white/20 transition-colors duration-200 whitespace-nowrap"
              aria-label="料金プランを確認"
            >
              料金プランを確認
            </Link>
          </div>

          {/* 申込みステップ */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 max-w-4xl mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-6">申し込みは3ステップで完了</h3>
            
            <HorizontalScroller ariaLabel="申し込みステップ" className="lg:grid-cols-3">
              <div className="snap-start min-w-[240px] sm:min-w-0 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="text-white font-semibold mb-2">プラン選択</h4>
                <p className="text-blue-200 text-sm leading-5">シングルまたは継続プランを選択</p>
              </div>
              
              <div className="snap-start min-w-[240px] sm:min-w-0 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="text-white font-semibold mb-2">基本情報入力</h4>
                <p className="text-blue-200 text-sm leading-5">会社概要とヒアリング希望日程</p>
              </div>
              
              <div className="snap-start min-w-[240px] sm:min-w-0 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="text-white font-semibold mb-2">日程確定</h4>
                <p className="text-blue-200 text-sm leading-5">担当者から連絡・ヒアリング実施</p>
              </div>
            </HorizontalScroller>
          </div>

          {/* 追加情報 */}
          <div className="mt-8 sm:mt-12 text-center">
            <p className="jp-body text-blue-200 text-[13px] sm:text-sm mb-4 leading-5 break-keep">
              ✓ 初回相談無料　✓ 契約前のお見積もり無料　✓ オンライン対応可能
            </p>
            <p className="jp-body text-blue-300 text-xs leading-4 break-keep">
              ※ お申し込み後、担当者より24時間以内にご連絡いたします
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}