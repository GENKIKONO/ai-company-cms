import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { supabaseServer } from '@/lib/supabase-server';
import DirectoryPage from '@/components/DirectoryPage';
import { generateMetadata as generateLocalizedMetadata } from '@/lib/metadata';
import { Locale } from '@/i18n';

export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations();
  return generateLocalizedMetadata(
    locale,
    `${t('navigation.directory')} | LuxuCare`,
    t('directory.meta.description')
  );
}

interface SearchParams {
  q?: string;
  industry?: string;
  region?: string;
  size?: string;
  founded?: string;
  has_url?: string;
  has_logo?: string;
  has_services?: string;
  has_case_studies?: string;
  page?: string;
}

interface Props {
  params: {
    locale: Locale;
  };
  searchParams: SearchParams;
}

export default async function DirectoryIndexPage({ params: { locale }, searchParams }: Props) {
  const t = await getTranslations();
  const supabase = supabaseServer();
  
  // 検索パラメータの処理
  const query = searchParams.q || '';
  const industry = searchParams.industry || '';
  const region = searchParams.region || '';
  const size = searchParams.size || '';
  const founded = searchParams.founded || '';
  const hasUrl = searchParams.has_url === 'true';
  const hasLogo = searchParams.has_logo === 'true';
  const hasServices = searchParams.has_services === 'true';
  const hasCaseStudies = searchParams.has_case_studies === 'true';
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // 企業データを取得
  let supabaseQuery = supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      industries,
      address_region,
      address_locality,
      employees,
      founded,
      url,
      created_at
    `)
    .eq('status', 'published');

  // 検索条件を適用
  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (industry) {
    supabaseQuery = supabaseQuery.contains('industries', [industry]);
  }

  if (region) {
    supabaseQuery = supabaseQuery.eq('address_region', region);
  }

  if (size) {
    switch (size) {
      case 'small':
        supabaseQuery = supabaseQuery.lte('employees', 50);
        break;
      case 'medium':
        supabaseQuery = supabaseQuery.gte('employees', 51).lte('employees', 300);
        break;
      case 'large':
        supabaseQuery = supabaseQuery.gte('employees', 301);
        break;
    }
  }

  // 設立年フィルター
  if (founded) {
    const currentYear = new Date().getFullYear();
    switch (founded) {
      case 'recent':
        supabaseQuery = supabaseQuery.gte('founded', '2020-01-01');
        break;
      case 'established':
        supabaseQuery = supabaseQuery.gte('founded', '2010-01-01').lt('founded', '2020-01-01');
        break;
      case 'mature':
        supabaseQuery = supabaseQuery.lt('founded', '2010-01-01');
        break;
    }
  }

  // 特徴フィルター
  if (hasUrl) {
    supabaseQuery = supabaseQuery.not('url', 'is', null);
  }

  if (hasLogo) {
    supabaseQuery = supabaseQuery.not('logo_url', 'is', null);
  }

  // サービス・導入事例フィルターは別クエリで処理
  let finalQuery = supabaseQuery;
  
  if (hasServices || hasCaseStudies) {
    // サービスや導入事例がある企業のIDを先に取得
    let filterQuery = supabase.from('organizations').select('id').eq('status', 'published');
    
    if (hasServices) {
      const { data: orgsWithServices } = await supabase
        .from('services')
        .select('organization_id')
        .not('organization_id', 'is', null);
      
      const orgIds = orgsWithServices?.map(s => s.organization_id) || [];
      if (orgIds.length > 0) {
        finalQuery = finalQuery.in('id', orgIds);
      } else {
        // サービスがある企業が見つからない場合は空の結果を返す
        finalQuery = finalQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }
    
    if (hasCaseStudies) {
      const { data: orgsWithCases } = await supabase
        .from('case_studies')
        .select('organization_id')
        .not('organization_id', 'is', null);
      
      const orgIds = orgsWithCases?.map(c => c.organization_id) || [];
      if (orgIds.length > 0) {
        finalQuery = finalQuery.in('id', orgIds);
      } else {
        // 導入事例がある企業が見つからない場合は空の結果を返す
        finalQuery = finalQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }
  }

  // データ取得
  const { data: organizations, error } = await finalQuery
    .order('name')
    .range(offset, offset + limit - 1);

  // 総数を取得（ページネーション用）
  const { count } = await finalQuery
    .select('*', { count: 'exact', head: true });

  // フィルタ用の業界一覧を取得
  const { data: allOrganizations } = await supabase
    .from('organizations')
    .select('industries, address_region')
    .eq('status', 'published');

  // 業界と地域のユニークリストを作成
  const industries = Array.from(
    new Set(
      (allOrganizations || [])
        .flatMap(org => org.industries || [])
        .filter(Boolean)
    )
  ).sort();

  const regions = Array.from(
    new Set(
      (allOrganizations || [])
        .map(org => org.address_region)
        .filter(Boolean)
    )
  ).sort();

  if (error) {
    console.error('Directory fetch error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('common.error')}</h1>
          <p className="text-gray-600">{t('directory.error.fetchFailed')}</p>
        </div>
      </div>
    );
  }

  const totalPages = count ? Math.ceil(count / limit) : 1;

  return (
    <DirectoryPage
      locale={locale}
      organizations={organizations || []}
      filters={{
        industries,
        regions,
        sizes: [
          { value: 'small', label: t('directory.filters.size.small') },
          { value: 'medium', label: t('directory.filters.size.medium') },
          { value: 'large', label: t('directory.filters.size.large') },
        ],
      }}
      currentFilters={{
        query,
        industry,
        region,
        size,
      }}
      pagination={{
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        limit,
      }}
    />
  );
}