import { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';
import ComparePage from '@/components/ComparePage';

export const metadata: Metadata = {
  title: '企業比較 | LuxuCare',
  description: '複数の企業を比較して、最適なビジネスパートナーを見つけましょう。企業規模、業界、サービス、所在地などを詳細に比較できます。',
  keywords: '企業比較, ビジネス比較, 企業選定, サービス比較, LuxuCare',
  openGraph: {
    title: '企業比較 | LuxuCare',
    description: '複数の企業を比較して、最適なビジネスパートナーを見つけましょう。',
    type: 'website',
  },
};

interface SearchParams {
  ids?: string;
}

interface Props {
  searchParams: SearchParams;
}

export default async function CompareIndexPage({ searchParams }: Props) {
  const supabase = supabaseServer();
  
  // URLパラメータから企業IDを取得
  const compareIds = searchParams.ids ? searchParams.ids.split(',').filter(Boolean) : [];
  
  let organizations = [];
  
  if (compareIds.length > 0) {
    // 指定された企業の詳細情報を取得
    const { data: organizationData, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        description,
        legal_form,
        founded,
        capital,
        employees,
        address_region,
        address_locality,
        telephone,
        email,
        url,
        logo_url,
        industries,
        services!org_id(
          id,
          name,
          description,
          features,
          price_range
        ),
        case_studies!org_id(
          id,
          title,
          client_industry,
          metrics
        )
      `)
      .in('id', compareIds)
      .eq('status', 'published');
    
    if (error) {
      console.error('Compare organizations fetch error:', error);
    } else {
      organizations = organizationData || [];
    }
  }

  // 比較用の候補企業リストを取得（最大20社）
  const { data: candidateOrganizations } = await supabase
    .from('organizations')
    .select('id, name, slug, industries, address_region, logo_url')
    .eq('status', 'published')
    .order('name')
    .limit(20);

  return (
    <ComparePage
      organizations={organizations}
      candidates={candidateOrganizations || []}
      selectedIds={compareIds}
    />
  );
}