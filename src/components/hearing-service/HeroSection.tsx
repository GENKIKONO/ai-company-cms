'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PrimaryCTA } from '@/design-system';

export default function HeroSection() {
  return (
    <section className="apple-hero-section">
      <div className="apple-container">
        <div className="apple-hero-content">
          {/* Apple式メインタイトル - 1文構成 */}
          <h1 className="apple-hero-title">
            AIに選ばれる企業になる
          </h1>
          
          {/* Apple式サブタイトル - 短い補助文 */}
          <p className="apple-hero-subtitle">
            専門ヒアリングで企業情報を構造化。ChatGPTやGoogle AI検索で正確に引用され、ビジネス機会を拡大する企業プロフィールを1時間で構築。
          </p>

          {/* 実績表示 */}
          <div className="flex justify-center gap-8 mb-8 text-sm text-gray-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">1時間</div>
              <div>ヒアリング時間</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">3日以内</div>
              <div>構造化完了</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">即座に</div>
              <div>AI検索対応</div>
            </div>
          </div>
          
          {/* Apple式CTA - 単一のプライマリボタン */}
          <div className="apple-hero-cta">
            <PrimaryCTA
              href="#pricing"
              size="large"
              showArrow={true}
            >
              無料相談を申し込む
            </PrimaryCTA>
            <p className="text-sm text-gray-500 mt-2">
              ※初回30分の相談は無料です
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}