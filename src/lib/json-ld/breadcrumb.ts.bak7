/**
 * BreadcrumbList JSON-LD 生成
 * 要件定義準拠: ナビゲーション構造化データ
 */

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbListJsonLd {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

/**
 * パンくずリストから BreadcrumbList JSON-LD を生成
 */
export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): BreadcrumbListJsonLd | null {
  // 有効なアイテムのみフィルタリング
  const validItems = items.filter(item => 
    item.name?.trim() && 
    item.url?.trim()
  );

  // アイテムがない場合はnullを返す
  if (validItems.length === 0) {
    return null;
  }

  const jsonLd: BreadcrumbListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: validItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return jsonLd;
}

/**
 * 組織ページ用のパンくずリスト生成
 */
export function generateOrganizationBreadcrumb(
  organizationName: string,
  organizationSlug: string,
  baseUrl: string,
  additionalPath?: { name: string; path: string }[]
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { name: 'ホーム', url: baseUrl },
    { name: '企業一覧', url: `${baseUrl}/organizations` },
    { name: organizationName, url: `${baseUrl}/o/${organizationSlug}` },
  ];

  if (additionalPath) {
    items.push(...additionalPath.map(path => ({
      name: path.name,
      url: `${baseUrl}${path.path}`,
    })));
  }

  return items;
}

/**
 * 記事ページ用のパンくずリスト生成
 */
export function generateArticleBreadcrumb(
  organizationName: string,
  organizationSlug: string,
  articleTitle: string,
  articleSlug: string,
  baseUrl: string
): BreadcrumbItem[] {
  return [
    { name: 'ホーム', url: baseUrl },
    { name: '企業一覧', url: `${baseUrl}/organizations` },
    { name: organizationName, url: `${baseUrl}/o/${organizationSlug}` },
    { name: 'ブログ', url: `${baseUrl}/o/${organizationSlug}/posts` },
    { name: articleTitle, url: `${baseUrl}/o/${organizationSlug}/posts/${articleSlug}` },
  ];
}

/**
 * サービスページ用のパンくずリスト生成
 */
export function generateServiceBreadcrumb(
  organizationName: string,
  organizationSlug: string,
  serviceName: string,
  serviceId: string,
  baseUrl: string
): BreadcrumbItem[] {
  return [
    { name: 'ホーム', url: baseUrl },
    { name: '企業一覧', url: `${baseUrl}/organizations` },
    { name: organizationName, url: `${baseUrl}/o/${organizationSlug}` },
    { name: 'サービス', url: `${baseUrl}/o/${organizationSlug}/services` },
    { name: serviceName, url: `${baseUrl}/o/${organizationSlug}/services/${serviceId}` },
  ];
}

/**
 * 事例ページ用のパンくずリスト生成
 */
export function generateCaseStudyBreadcrumb(
  organizationName: string,
  organizationSlug: string,
  caseStudyTitle: string,
  caseStudyId: string,
  baseUrl: string
): BreadcrumbItem[] {
  return [
    { name: 'ホーム', url: baseUrl },
    { name: '企業一覧', url: `${baseUrl}/organizations` },
    { name: organizationName, url: `${baseUrl}/o/${organizationSlug}` },
    { name: '導入事例', url: `${baseUrl}/o/${organizationSlug}/case-studies` },
    { name: caseStudyTitle, url: `${baseUrl}/o/${organizationSlug}/case-studies/${caseStudyId}` },
  ];
}

/**
 * JSON-LD をHTML用文字列として出力
 */
export function breadcrumbJsonLdToHtml(items: BreadcrumbItem[]): string | null {
  const jsonLd = generateBreadcrumbJsonLd(items);
  if (!jsonLd) return null;
  
  return JSON.stringify(jsonLd, null, 2);
}