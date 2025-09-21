import { Metadata } from 'next';
import { SearchPage } from '@/components/SearchPage';

export const metadata: Metadata = {
  title: '統合検索 | LuxuCare AI企業CMS',
  description: '企業、サービス、導入事例を一括検索できます。高度な検索フィルターで目的の情報を効率的に見つけることができます。',
  openGraph: {
    title: '統合検索 | LuxuCare AI企業CMS',
    description: '企業、サービス、導入事例を一括検索',
    type: 'website',
  },
};

export default function SearchPageRoute() {
  return <SearchPage />;
}