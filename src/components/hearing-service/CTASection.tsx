'use client';

import { ArrowRight, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { HIGButton } from '@/components/ui/HIGButton';
import { HIGGrid } from '@/components/layout/HIGLayout';

export default function CTASection() {
  return (
    <section className="hig-section bg-[var(--color-primary-dark)] relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[var(--color-primary-light)] rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--color-primary)] rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative hig-container">
        <div className="text-center">
          {/* メインメッセージ */}
          <h2 className="hig-text-h2 text-white mb-[var(--space-lg)] hig-jp-heading">
            今すぐAI時代に対応した
            <br className="hidden md:block" />
            <span className="text-[var(--color-primary-light)]">
              企業情報を手に入れよう
            </span>
          </h2>
          
          <p className="hig-text-body text-white/90 mb-[var(--space-xl)] max-w-3xl mx-auto hig-jp-body">
            複雑な作業は一切不要。専門スタッフがあなたの企業の魅力を
            <br className="hidden md:block" />
            AIが理解しやすい形で構造化し、競合他社との差別化を実現します。
          </p>

          {/* 特徴ポイント */}
          <div className="mb-[var(--space-xl)]">
            <HIGGrid columns={3} gap="md" className="max-w-2xl lg:max-w-4xl mx-auto">
              <div className="hig-card border-white/10 text-center">
                <Clock className="w-7 h-7 text-[var(--color-primary-light)] mx-auto mb-[var(--space-xs)]" />
                <div className="text-white font-semibold hig-text-caption">最短2週間</div>
                <div className="text-white/80 hig-text-caption">スピード対応</div>
              </div>
              <div className="hig-card border-white/10 text-center">
                <Calendar className="w-7 h-7 text-[var(--color-primary-light)] mx-auto mb-[var(--space-xs)]" />
                <div className="text-white font-semibold hig-text-caption">予約制</div>
                <div className="text-white/80 hig-text-caption">確実な対応</div>
              </div>
              <div className="hig-card border-white/10 text-center">
                <Clock className="w-7 h-7 text-[var(--color-success)] mx-auto mb-[var(--space-xs)]" />
                <div className="text-white font-semibold hig-text-caption">専門対応</div>
                <div className="text-white/80 hig-text-caption">AI最適化の専門家</div>
              </div>
            </HIGGrid>
          </div>

          {/* メインCTAボタン */}
          <div className="hig-space-stack-md flex flex-col sm:flex-row items-center justify-center gap-[var(--space-md)] mb-[var(--space-xl)] w-full">
            <HIGButton
              variant="primary"
              size="lg"
              className="bg-white text-[var(--color-primary-dark)] hover:bg-[var(--color-background-secondary)] hig-jp-nowrap"
              asChild
            >
              <Link 
                href="/dashboard"
                aria-label="今すぐヒアリングを申し込む"
              >
                <span className="hig-jp-text">今すぐヒアリング申し込み</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </HIGButton>
            
            <HIGButton
              variant="secondary"
              size="lg"
              className="bg-white/80 backdrop-blur text-[var(--color-primary-dark)] hover:bg-white/90"
              asChild
            >
              <Link 
                href="#pricing"
                aria-label="料金プランを確認"
              >
                <span className="hig-jp-text">料金プランを確認</span>
              </Link>
            </HIGButton>
          </div>

          {/* 申込みステップ */}
          <div className="bg-white/5 backdrop-blur-sm rounded-[var(--radius-xl)] p-[var(--space-lg)] border border-white/10 max-w-4xl mx-auto">
            <h3 className="hig-text-h3 text-white mb-[var(--space-lg)] text-center hig-jp-heading">申し込みは3ステップで完了</h3>
            
            <div className="hig-grid hig-grid--3-cols gap-[var(--space-lg)]">
              <div className="text-center">
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-[var(--radius-lg)] flex items-center justify-center mx-auto mb-[var(--space-sm)]">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="text-white font-semibold mb-[var(--space-xs)] hig-text-body">プラン選択</h4>
                <p className="text-white/80 hig-text-caption hig-jp-body">シングルまたは継続プランを選択</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-[var(--radius-lg)] flex items-center justify-center mx-auto mb-[var(--space-sm)]">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="text-white font-semibold mb-[var(--space-xs)] hig-text-body">基本情報入力</h4>
                <p className="text-white/80 hig-text-caption hig-jp-body">会社概要とヒアリング希望日程</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-[var(--radius-lg)] flex items-center justify-center mx-auto mb-[var(--space-sm)]">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="text-white font-semibold mb-[var(--space-xs)] hig-text-body">日程確定</h4>
                <p className="text-white/80 hig-text-caption hig-jp-body">担当者から連絡・ヒアリング実施</p>
              </div>
            </div>
          </div>

          {/* 追加情報 */}
          <div className="mt-[var(--space-xl)] text-center">
            <p className="hig-text-caption text-white/90 mb-[var(--space-sm)] hig-jp-body">
              ✓ 初回相談無料　✓ 契約前のお見積もり無料　✓ オンライン対応可能
            </p>
            <p className="hig-text-caption text-white/70 hig-jp-body">
              ※ お申し込み後、担当者より24時間以内にご連絡いたします
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}