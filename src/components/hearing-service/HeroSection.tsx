'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PrimaryCTA } from '@/components/ui/UnifiedCTA';

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
            対話を通じて企業価値を構造化し、AI検索で発見される企業プロフィールを構築
          </p>
          
          {/* Apple式CTA - 単一のプライマリボタン */}
          <div className="apple-hero-cta">
            <PrimaryCTA
              href="#pricing"
              size="large"
              showArrow={true}
            >
              ヒアリングを申し込む
            </PrimaryCTA>
          </div>
        </div>
      </div>
    </section>
  );
}