import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OrganizationDetail } from '@/components/OrganizationDetail';
import { getOrganizationBySlug } from '@/lib/organizations';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data: organization } = await getOrganizationBySlug(params.slug);
  
  if (!organization) {
    return {
      title: '企業が見つかりません | LuxuCare AI企業CMS',
    };
  }

  return {
    title: `${organization.name} | LuxuCare AI企業CMS`,
    description: organization.description || `${organization.name}の詳細情報、サービス、導入事例をご紹介します。`,
    openGraph: {
      title: organization.name,
      description: organization.description || `${organization.name}の詳細情報`,
      type: 'website',
      images: organization.logo_url ? [{ url: organization.logo_url }] : [],
    },
  };
}

export default async function OrganizationPage({ params }: PageProps) {
  const { data: organization, error } = await getOrganizationBySlug(params.slug);
  
  if (error || !organization) {
    notFound();
  }

  return <OrganizationDetail organization={organization} />;
}