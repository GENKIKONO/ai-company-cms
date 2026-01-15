/**
 * AIOページ（LP構造対応版）
 * AI情報最適化の概念説明とサービス紹介
 */

import { Metadata } from 'next';
import HeroSection from '@/components/aio/HeroSection';
import FlowSection from '@/components/aio/FlowSection';
import PricingTable from '@/components/pricing/PricingTable';
import FAQSection from '@/components/aio/FAQSection';
import CTASection from '@/components/aio/CTASection';
import AioSection from '@/components/layout/AioSection';
import { aioCopy } from './copy';
import { UNIFIED_PRICES } from '@/config/unified-plans';
import { generateAIOPricingJsonLD } from '@/lib/generatePricingJsonLD';

// P4-2: ISR設定（静的ページ）
export const revalidate = 1800; // 30分間隔での再生成

export const metadata: Metadata = {
  title: aioCopy.metadata.title,
  description: aioCopy.metadata.description,
  keywords: 'AIO, AI Information Optimization, JSON-LD, 構造化データ, Schema.org, ゼロクリック検索, AI検索最適化',
  openGraph: {
    title: aioCopy.metadata.title,
    description: aioCopy.metadata.description,
    url: '/aio',
    siteName: 'AIOHub',
    type: 'website',
    locale: 'ja_JP',
    images: [
      {
        url: '/aio/og.png',
        width: 1200,
        height: 630,
        alt: aioCopy.metadata.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: aioCopy.metadata.title,
    description: aioCopy.metadata.description,
    images: ['/aio/og.png'],
  },
};

// JSON-LD構造化データ（動的生成版）
function generateStaticJsonLD() {
  const dynamicPricingData = generateAIOPricingJsonLD(); // ✅ 統一価格から動的生成
  
  return {
    "@context": "https://schema.org",
    "@type": "WebPage", 
    "name": aioCopy.metadata.title,
    "description": aioCopy.metadata.description,
    "url": "https://aiohub.jp/aio",
    "mainEntity": dynamicPricingData, // ✅ 動的価格データを使用
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "ホーム",
          "item": "https://aiohub.jp"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "AIOとは",
          "item": "https://aiohub.jp/aio"
        }
      ]
    }
  };
}

const aioJsonLd = generateStaticJsonLD();

export default function AIOPage() {
  return (
    <>
      {/* JSON-LD構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aioJsonLd) }}
      />
      
      <AioSection tone="white">
        {/* ヒーローセクション */}
        <HeroSection
          title={aioCopy.hero.title}
          subtitle={aioCopy.hero.subtitle}
          description={aioCopy.hero.description}
          features={aioCopy.hero.features}
          benefits={aioCopy.hero.benefits}
          primaryCta={{ href: aioCopy.cta.primaryHref, text: aioCopy.cta.primaryText }}
          secondaryCta={{ href: aioCopy.cta.secondaryHref, text: aioCopy.cta.secondaryText }}
        />
        
        {/* Section Buffer */}
        <div className="section-buffer"></div>
        
        {/* サービス流れ説明 */}
        <FlowSection
          title={aioCopy.flow.title}
          description={aioCopy.flow.description}
          steps={aioCopy.flow.steps}
          beforeAfter={aioCopy.flow.beforeAfter}
        />
        
        {/* 料金プラン */}
        <PricingTable />
        
        {/* よくある質問 */}
        <FAQSection
          title={aioCopy.faq.title}
          description={aioCopy.faq.description}
          categories={aioCopy.faq.categories}
        />
        
        {/* Section Buffer */}
        <div className="section-buffer"></div>
        
        {/* CTA（申込導線） */}
        <CTASection
          title={aioCopy.cta.title}
          description={aioCopy.cta.description}
          primaryText={aioCopy.cta.primaryText}
          primaryHref={aioCopy.cta.primaryHref}
          secondaryText={aioCopy.cta.secondaryText}
          secondaryHref={aioCopy.cta.secondaryHref}
          features={aioCopy.cta.features}
        />
      </AioSection>
    </>
  );
}