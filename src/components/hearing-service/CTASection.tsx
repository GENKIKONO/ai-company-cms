'use client';

import { ArrowRight, Calendar, Clock, Star } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          {/* メインメッセージ */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            今すぐAI時代に対応した
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
              企業情報を手に入れよう
            </span>
          </h2>
          
          <p className="text-xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
            複雑な作業は一切不要。専門スタッフがあなたの企業の魅力を
            <br className="hidden md:block" />
            AIが理解しやすい形で構造化し、競合他社との差別化を実現します。
          </p>

          {/* 特徴ポイント */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <Clock className="w-8 h-8 text-blue-300 mx-auto mb-4" />
              <div className="text-white font-semibold text-lg mb-2">最短2週間</div>
              <div className="text-white/80">スピード対応</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <Calendar className="w-8 h-8 text-purple-300 mx-auto mb-4" />
              <div className="text-white font-semibold text-lg mb-2">予約制</div>
              <div className="text-white/80">確実な対応</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <Star className="w-8 h-8 text-yellow-300 mx-auto mb-4" />
              <div className="text-white font-semibold text-lg mb-2">専門対応</div>
              <div className="text-white/80">AI最適化の専門家</div>
            </div>
          </div>

          {/* メインCTAボタン */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Link 
              href="/dashboard"
              aria-label="今すぐヒアリングを申し込む"
              className="inline-flex items-center justify-center font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
            >
              今すぐヒアリング申し込み
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            
            <Link 
              href="#pricing"
              aria-label="料金プランを確認"
              className="inline-flex items-center justify-center font-medium bg-white/90 backdrop-blur-lg text-blue-900 hover:bg-white hover:text-purple-900 border-2 border-white/50 hover:border-white px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              料金プランを確認
            </Link>
          </div>

          {/* 申込みステップ */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 max-w-5xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-10 text-center">申し込みは3ステップで完了</h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h4 className="text-white font-semibold text-lg mb-3">プラン選択</h4>
                <p className="text-white/80 leading-relaxed">シングルまたは継続プランを選択</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h4 className="text-white font-semibold text-lg mb-3">基本情報入力</h4>
                <p className="text-white/80 leading-relaxed">会社概要とヒアリング希望日程</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h4 className="text-white font-semibold text-lg mb-3">日程確定</h4>
                <p className="text-white/80 leading-relaxed">担当者から連絡・ヒアリング実施</p>
              </div>
            </div>
          </div>

          {/* 追加情報 */}
          <div className="mt-12 text-center">
            <p className="text-lg text-white/90 mb-4">
              ✓ 初回相談無料　✓ 契約前のお見積もり無料　✓ オンライン対応可能
            </p>
            <p className="text-white/70">
              ※ お申し込み後、担当者より24時間以内にご連絡いたします
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}