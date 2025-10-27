'use client';

import { ArrowRight, Calendar, Clock, Star } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* 背景装飾 - more subtle */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.3),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          {/* メインメッセージ */}
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            まずは情報を
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              "構造化"
            </span>
            するところから。
          </h2>
          
          <p className="text-2xl mb-12 opacity-90 leading-relaxed">
            14日間の無料体験で効果を実感
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
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
            <Link
              href="/auth/signup"
              aria-label="今すぐヒアリングを申し込む"
              className="inline-flex items-center justify-center font-semibold text-xl px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl border-none shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
            >
              14日間無料で始める
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/contact"
              aria-label="専門ヒアリング相談"
              className="inline-flex items-center justify-center font-semibold text-xl px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 hover:border-white/50 text-white rounded-2xl transition-all duration-300"
            >
              専門ヒアリング相談
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