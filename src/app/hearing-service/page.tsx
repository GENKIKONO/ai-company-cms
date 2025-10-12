/**
 * ヒアリング代行サービスページ
 * AI最適化のための情報整備代行サービス紹介
 */

import { Metadata } from 'next';
import HeroSection from '@/components/hearing-service/HeroSection';
import FlowSection from '@/components/hearing-service/FlowSection';
import PricingSection from '@/components/hearing-service/PricingSection';
import FAQSection from '@/components/hearing-service/FAQSection';
import CTASection from '@/components/hearing-service/CTASection';

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

// JSON-LD構造化データ
const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "AI最適化ヒアリング代行サービス",
  "description": "企業情報をAIに理解される形に構造化する専門ヒアリング代行サービス",
  "provider": {
    "@type": "Organization",
    "name": "LuxuCare CMS",
    "url": "https://luxucare.jp"
  },
  "serviceType": "ビジネスコンサルティング",
  "areaServed": "JP",
  "availableLanguage": "ja",
  "offers": [
    {
      "@type": "Offer",
      "name": "シングルヒアリング",
      "description": "1社向け1回限りのヒアリング代行サービス",
      "price": "30000",
      "priceCurrency": "JPY",
      "priceValidUntil": "2025-12-31"
    },
    {
      "@type": "Offer",
      "name": "継続支援プラン",
      "description": "継続的な情報更新・最適化支援",
      "price": "50000",
      "priceCurrency": "JPY",
      "billingIncrement": "P1M",
      "priceValidUntil": "2025-12-31"
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "ヒアリング代行プラン",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "企業情報ヒアリング",
          "description": "60分の専門ヒアリングによる企業情報の構造化"
        }
      },
      {
        "@type": "Offer", 
        "itemOffered": {
          "@type": "Service",
          "name": "AI最適化構造化",
          "description": "ヒアリング内容のAI理解に最適な形での構造化・登録"
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
};

export default function HearingServicePage() {
  return (
    <>
      {/* JSON-LD構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      
      <div className="min-h-screen bg-clean">
        {/* ヒーローセクション */}
        <HeroSection />
        
        {/* サービス流れ説明 */}
        <FlowSection />
        
        {/* 料金プラン */}
        <PricingSection />
        
        {/* よくある質問 */}
        <FAQSection />
        
        {/* CTA（申込導線） */}
        <CTASection />
      </div>
    </>
  );
}