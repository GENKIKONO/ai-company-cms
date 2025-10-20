'use client';

import { ArrowRight, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="section bg-blue-900 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative container">
        <div className="text-center">
          {/* メインメッセージ */}
          <h2 className="text-h2 text-white mb-6 leading-tight tracking-tight text-balance">
            今すぐAI時代に対応した
            <br className="hidden md:block" />
            <span className="text-blue-400">
              企業情報を手に入れよう
            </span>
          </h2>
          
          <p className="text-body-large text-blue-100 mb-8 sm:mb-12 max-w-3xl mx-auto leading-7 sm:leading-8">
            複雑な作業は一切不要。専門スタッフがあなたの企業の魅力を
            <br className="hidden md:block" />
            AIが理解しやすい形で構造化し、競合他社との差別化を実現します。
          </p>

          {/* 特徴ポイント */}
          <div className="mb-8 sm:mb-12">
            <div className="highlights-unified max-w-2xl lg:max-w-4xl mx-auto">
              <div className="border border-white/10 rounded-xl p-4 text-center">
                <Clock className="w-7 h-7 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-semibold text-sm">最短2週間</div>
                <div className="text-blue-200 text-xs">スピード対応</div>
              </div>
              <div className="border border-white/10 rounded-xl p-4 text-center">
                <Calendar className="w-7 h-7 text-pink-400 mx-auto mb-2" />
                <div className="text-white font-semibold text-sm">予約制</div>
                <div className="text-blue-200 text-xs">確実な対応</div>
              </div>
              <div className="border border-white/10 rounded-xl p-4 text-center">
                <Clock className="w-7 h-7 text-green-400 mx-auto mb-2" />
                <div className="text-white font-semibold text-sm">専門対応</div>
                <div className="text-blue-200 text-xs">AI最適化の専門家</div>
              </div>
            </div>
          </div>

          {/* メインCTAボタン */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 sm:mb-12 w-full">
            <Link
              href="/dashboard"
              className="btn-unified bg-white text-blue-900 hover:bg-gray-100"
              aria-label="今すぐヒアリングを申し込む"
            >
              <span className="jp-text">今すぐヒアリング申し込み</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href="#pricing"
              className="btn-unified bg-white/80 backdrop-blur text-blue-700 hover:bg-white/90"
              aria-label="料金プランを確認"
            >
              <span className="jp-text">料金プランを確認</span>
            </Link>
          </div>

          {/* 申込みステップ */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 max-w-4xl mx-auto">
            <h3 className="text-h3 text-white mb-6 text-center">申し込みは3ステップで完了</h3>
            
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="text-white font-semibold mb-2">プラン選択</h4>
                <p className="text-blue-200 text-sm leading-5">シングルまたは継続プランを選択</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="text-white font-semibold mb-2">基本情報入力</h4>
                <p className="text-blue-200 text-sm leading-5">会社概要とヒアリング希望日程</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="text-white font-semibold mb-2">日程確定</h4>
                <p className="text-blue-200 text-sm leading-5">担当者から連絡・ヒアリング実施</p>
              </div>
            </div>
          </div>

          {/* 追加情報 */}
          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-body-small text-blue-200 mb-4 leading-5 break-keep">
              ✓ 初回相談無料　✓ 契約前のお見積もり無料　✓ オンライン対応可能
            </p>
            <p className="text-body-small text-blue-300 leading-4 break-keep">
              ※ お申し込み後、担当者より24時間以内にご連絡いたします
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}