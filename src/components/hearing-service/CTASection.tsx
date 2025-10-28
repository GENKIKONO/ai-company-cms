'use client';

import { ArrowRight, Calendar, Clock, Star } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="relative section-spacing-large overflow-hidden bg-slate-900">
      {/* 背景装飾 - more subtle */}
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          {/* メインメッセージ */}
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            まずは情報を
            <br />
            <span className="text-blue-200">
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
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-white font-bold text-lg mb-2">最短2週間</div>
              <div className="text-white/80">スピード対応</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="text-white font-bold text-lg mb-2">予約制</div>
              <div className="text-white/80">確実な対応</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-white font-bold text-lg mb-2">専門対応</div>
              <div className="text-white/80">AI最適化の専門家</div>
            </div>
          </div>

          {/* メインCTAボタン */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
            <Link
              href="/auth/signup"
              aria-label="今すぐヒアリングを申し込む"
              className="inline-flex items-center justify-center font-bold text-xl px-10 py-5 bg-[var(--bg-primary)] hover:bg-[var(--bg-primary-hover)] text-white rounded-2xl border-none shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              14日間無料で始める
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/contact"
              aria-label="専門ヒアリング相談"
              className="inline-flex items-center justify-center font-bold text-xl px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 hover:border-white/50 text-white rounded-2xl transition-all duration-300"
            >
              専門ヒアリング相談
            </Link>
          </div>

          {/* 申込みステップ */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 max-w-5xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-10 text-center">申し込みは3ステップで完了</h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-3">プラン選択</h4>
                <p className="text-white/80 leading-relaxed">シングルまたは継続プランを選択</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-3">基本情報入力</h4>
                <p className="text-white/80 leading-relaxed">会社概要とヒアリング希望日程</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-3">日程確定</h4>
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