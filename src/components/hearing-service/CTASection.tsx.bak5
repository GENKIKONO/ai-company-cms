'use client';

import { ArrowRight, Calendar, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import AioSection from '@/components/layout/AioSection';
import { HIGLinkButton } from '@/components/ui/HIGButton';
import { useRevealOnScroll } from '@/lib/useRevealOnScroll';

export default function CTASection() {
  const { ref: mainRef, isVisible: mainVisible } = useRevealOnScroll();
  const { ref: stepsRef, isVisible: stepsVisible } = useRevealOnScroll();
  
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center">
        {/* メインメッセージ */}
        <div 
          ref={mainRef as React.RefObject<HTMLDivElement>}
          className={`reveal-base reveal-fade ${mainVisible ? 'is-visible' : ''}`}
        >
        <h2 className="text-5xl lg:text-6xl font-bold text-[var(--text-on-primary)] mb-6 leading-[1.3] max-w-3xl mx-auto">
          まずは情報を
          <br />
          <span className="inline-block text-[var(--aio-surface)] bg-[var(--aio-primary)] px-2 rounded">
            "構造化"
          </span>
          するところから。
        </h2>
        
        <p className="text-2xl mb-12 text-[var(--text-on-primary)] leading-relaxed">
          14日間の無料体験で機能をお試しください
        </p>

        {/* 特徴ポイント */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-[var(--aio-primary)] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-[var(--text-on-primary)]" />
            </div>
            <div className="text-[var(--text-on-primary)] font-bold text-lg mb-2">最短2週間</div>
            <div className="text-[var(--text-on-primary)]">スピード対応</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 hig-bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-[var(--text-on-primary)]" />
            </div>
            <div className="text-[var(--text-on-primary)] font-bold text-lg mb-2">予約制</div>
            <div className="text-[var(--text-on-primary)]">確実な対応</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 hig-bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-[var(--text-on-primary)]" />
            </div>
            <div className="text-[var(--text-on-primary)] font-bold text-lg mb-2">専門対応</div>
            <div className="text-[var(--text-on-primary)]">AI最適化の専門家</div>
          </div>
        </div>

        {/* メインCTAボタン */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12 mt-10">
          <HIGLinkButton
            href="/auth/signup"
            variant="primary"
            size="xl"
            rightIcon={<ArrowRight className="w-5 h-5" />}
            aria-label="今すぐヒアリングを申し込む"
            className="bg-white text-[var(--aio-primary)] hover:bg-gray-50 font-bold shadow-lg hover:shadow-xl border-2 border-white"
          >
            14日間無料で始める
          </HIGLinkButton>
          <HIGLinkButton
            href="/contact"
            variant="ghost"
            size="xl"
            aria-label="専門ヒアリング相談"
            className="border-2 border-white/70 text-white hover:bg-white/10 font-medium"
          >
            専門ヒアリング相談
          </HIGLinkButton>
        </div>
        </div>

        {/* 申込みステップ */}
        <div 
          ref={stepsRef as React.RefObject<HTMLDivElement>}
          className={`bg-gray-50 rounded-3xl p-8 border border-gray-200 max-w-5xl mx-auto reveal-base reveal-fade ${stepsVisible ? 'is-visible' : ''}`}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 text-center">申し込みは3ステップで完了</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--aio-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-[var(--text-on-primary)] font-bold text-xl">1</span>
              </div>
              <h4 className="text-gray-900 font-bold text-lg mb-3">プラン選択</h4>
              <p className="text-gray-700 leading-relaxed">シングルまたは継続プランを選択</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--aio-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-[var(--text-on-primary)] font-bold text-xl">2</span>
              </div>
              <h4 className="text-gray-900 font-bold text-lg mb-3">基本情報入力</h4>
              <p className="text-gray-700 leading-relaxed">会社概要とヒアリング希望日程</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--aio-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-[var(--text-on-primary)] font-bold text-xl">3</span>
              </div>
              <h4 className="text-gray-900 font-bold text-lg mb-3">日程確定</h4>
              <p className="text-gray-700 leading-relaxed">担当者から連絡・ヒアリング実施</p>
            </div>
          </div>
        </div>

        {/* 追加情報 */}
        <div className="mt-12 pb-16 lg:pb-20 text-center">
          <p className="text-lg text-[var(--text-on-primary)] mb-4">
            ✓ 初回相談無料　✓ 契約前のお見積もり無料　✓ オンライン対応可能
          </p>
          <p className="text-[color:var(--text-on-primary-muted,_rgba(255,255,255,0.78))]">
            ※ お申し込み後、担当者より24時間以内にご連絡いたします
          </p>
        </div>
      </div>
    </div>
  );
}