import { Metadata } from 'next';
import PricingTable from '@/components/pricing/PricingTable';

export const metadata: Metadata = {
  title: '料金プラン - AI最適化CMSサービス | AIO Hub',
  description: 'AIO HubのAI最適化料金プラン。無料から始められ、本格運用は月額9,800円〜。JSON-LD自動生成とCMS管理で企業情報をAI検索に最適化。',
  keywords: ['料金プラン', 'AIO', 'JSON-LD', '構造化データ', 'AI最適化', 'CMS'],
};

export default function PricingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '料金プラン',
    description: 'AIO Hub AI最適化CMSの料金プラン。無料から企業向けプランまで。',
    url: 'https://aiohub.jp/pricing',
    isPartOf: {
      '@type': 'WebSite',
      name: 'AIO Hub',
      url: 'https://aiohub.jp'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        <PricingTable />
      </div>
    </>
  );
}