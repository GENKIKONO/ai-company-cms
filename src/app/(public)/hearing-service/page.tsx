// src/app/hearing-service/page.tsx
/**
 * ヒアリング代行サービスページ
 * AI最適化のための情報整備代行サービス紹介
 */

import { Metadata } from 'next';
import Script from 'next/script';
import HeroSection from '@/components/hearing-service/HeroSection';
import ComparisonSection from '@/components/hearing-service/ComparisonSection';
import FlowSection from '@/components/hearing-service/FlowSection';
import PricingSection from '@/components/hearing-service/PricingSection';
import FAQSection from '@/components/hearing-service/FAQSection';
import CTASection from '@/components/hearing-service/CTASection';
import AioSection from '@/components/layout/AioSection';
// 将来的な価格統一のための参照（現在はヒアリングサービス独自価格を使用）
import { generateHearingServiceJsonLD } from '@/lib/generatePricingJsonLD';

// P4-2: ISR設定（静的ページ）
export const revalidate = 1800; // 30分間隔での再生成

export const metadata: Metadata = {
  title: 'AI最適化ヒアリング代行サービス | LuxuCare CMS',
  description: '企業情報をAIに理解される形へ。1時間のヒアリングで自社データを最適化。専任スタッフが企業の魅力を構造化し、検索性・発見性を向上させます。',
  keywords: 'ヒアリング代行, AI最適化, 企業情報, データ構造化, CMS, DX支援',
  openGraph: {
    title: 'AI最適化ヒアリング代行サービス | LuxuCare CMS',
    description: '企業情報をAIに理解される形へ。1時間のヒアリングで自社データを最適化。',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI最適化ヒアリング代行サービス',
    description: '企業情報をAIに理解される形へ。1時間のヒアリングで自社データを最適化。',
  }
};

// JSON-LD構造化データ（動的生成版）
const serviceJsonLd = generateHearingServiceJsonLD(); // ✅ 動的生成で一貫性を保証

export default function HearingServicePage() {
  return (
    <>
      {/* ページタイトル（SEO・アクセシビリティ用） */}
      <h1 className="sr-only">AI最適化ヒアリング代行サービス</h1>
      
      {/* JSON-LD構造化データ */}
      {serviceJsonLd && (
        <Script
          id="hearing-service-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
      )}
      
      <div className="min-h-screen -mb-12">
        {/* ヒーローセクション */}
        <AioSection tone="white" className="!m-0" noSectionSpacing>
          <HeroSection />
        </AioSection>
        
        {/* 構造化前後の違い */}
        <AioSection tone="muted" noSectionSpacing>
          <ComparisonSection />
        </AioSection>
        
        {/* サービス流れ説明 */}
        <AioSection tone="white" noSectionSpacing>
          <FlowSection />
        </AioSection>
        
        {/* 料金プラン */}
        <AioSection tone="muted" id="pricing" className="pt-6 lg:pt-0 pb-16 lg:pb-20" noSectionSpacing>
          <PricingSection />
        </AioSection>
        
        {/* よくある質問 */}
        <AioSection tone="white" className="pt-12 lg:pt-14" noSectionSpacing>
          <FAQSection />
        </AioSection>
        
        {/* CTA（申込導線） */}
        <AioSection tone="primary" noSectionSpacing className="pt-20">
          <CTASection />
        </AioSection>
      </div>
    </>
  );
}