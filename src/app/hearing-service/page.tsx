/**
 * ヒアリング代行サービスページ
 * AI最適化のための情報整備代行サービス紹介
 */

import { Metadata } from 'next';
import HeroSection from '@/components/hearing-service/HeroSection';
import FlowSection from '@/components/hearing-service/FlowSection';
import PricingPlans from '@/components/pricing/PricingPlans';
import FAQSection from '@/components/hearing-service/FAQSection';
import CTASection from '@/components/hearing-service/CTASection';

// ISR設定: 即時反映を優先（安定後は60などに調整可）
export const revalidate = 0;

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
      "name": "ライトヒアリング（基本構造化）",
      "description": "企業の基本情報を短時間でAI最適化",
      "price": "30000",
      "priceCurrency": "JPY",
      "priceValidUntil": "2025-12-31"
    },
    {
      "@type": "Offer",
      "name": "アドバンスヒアリング（戦略構造化）",
      "description": "採用・PR・B2B向けQ&A拡充で深度ある情報構造",
      "price": "70000",
      "priceCurrency": "JPY",
      "priceValidUntil": "2025-12-31"
    },
    {
      "@type": "Offer",
      "name": "フルヒアリング（包括構造化＋運用設計）",
      "description": "AI引用を前提とした完全構造化プロフィール",
      "price": "120000",
      "priceCurrency": "JPY",
      "priceValidUntil": "2025-12-31"
    },
    {
      "@type": "Offer",
      "name": "継続フォロー（運用＋月次ヒアリング）",
      "description": "月次ヒアリング＋更新代行で継続的な最適化",
      "price": "30000",
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
          "description": "専門ヒアリングによる企業情報の構造化"
        }
      },
      {
        "@type": "Offer", 
        "itemOffered": {
          "@type": "Service",
          "name": "AI最適化構造化",
          "description": "ヒアリング内容のAI理解に最適な形での構造化・登録"
        }
      },
      {
        "@type": "Offer", 
        "itemOffered": {
          "@type": "Service",
          "name": "継続運用サポート",
          "description": "月次ヒアリングと情報更新による継続的な最適化"
        }
      }
    ]
  },
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
        <section className="mt-0">
          <HeroSection />
        </section>
        
        {/* サービス流れ説明 */}
        <section className="mt-12 md:mt-16">
          <FlowSection />
        </section>
        
        {/* 料金プラン - 新PricingPlansコンポーネント */}
        <section className="mt-12 md:mt-16">
          <PricingPlans />
        </section>
        
        {/* よくある質問 */}
        <section className="mt-12 md:mt-16">
          <FAQSection />
        </section>
        
        {/* CTA（申込導線） */}
        <section className="mt-12 md:mt-16">
          <CTASection />
        </section>
      </div>
    </>
  );
}