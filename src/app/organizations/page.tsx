import { Metadata } from 'next';
import { OrganizationList } from '@/components/OrganizationList';

export const metadata: Metadata = {
  title: '企業ディレクトリ | LuxuCare AI企業CMS',
  description: '革新的な企業とそのサービス・導入事例をご紹介します。業界別検索で目的の企業を見つけることができます。',
  openGraph: {
    title: '企業ディレクトリ | LuxuCare AI企業CMS',
    description: '革新的な企業とそのサービス・導入事例をご紹介します。',
    type: 'website',
  },
};

export default function OrganizationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationList />
    </div>
  );
}