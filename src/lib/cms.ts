// CMS データ取得ユーティリティ
// TODO: [SUPABASE_CMS_MIGRATION] 新しい型に段階的に移行予定
// import type { CmsSiteSettingsRow, CmsSectionRow } from '@/types/cms-supabase';

// TODO: [SUPABASE_CMS_MIGRATION] key-value から構造化設定に移行予定
export interface CMSSettings {
  [key: string]: any;
}

// TODO: [SUPABASE_CMS_MIGRATION] この型は CmsSectionRow に統合予定
export interface CMSSection {
  section_key: string;
  section_type: string;
  title?: string;
  content: Record<string, any>;
  display_order: number;
  is_active: boolean;
}

export interface CMSData {
  settings: CMSSettings;
  sections: CMSSection[];
}

// サーバーサイドでCMSデータを取得
export async function getCMSData(page: string = 'homepage'): Promise<CMSData> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/cms?page=${page}`, {
      cache: 'force-cache',
      next: { revalidate: 300 } // 5分間キャッシュ
    });

    if (!response.ok) {
      throw new Error(`CMS API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    // Failed to fetch CMS data: error
    
    // フォールバック用のデフォルトデータ
    return {
      settings: {
        site_title: 'AIOHub - AI Visibility Platform',
        site_description: 'AIによるコンテンツ可視性最適化プラットフォーム',
        company_name: 'LuxuCare株式会社',
        hero_title: 'AI Visibility で\nコンテンツを最適化',
        hero_subtitle: 'AIによる検索エンジン可視性分析で、あなたのコンテンツを最大限に活用'
      },
      sections: [
        {
          section_key: 'hero',
          section_type: 'hero',
          title: 'ヒーローセクション',
          content: {
            title: 'AI Visibility で\nコンテンツを最適化',
            subtitle: 'AIによる検索エンジン可視性分析で、あなたのコンテンツを最大限に活用',
            cta_text: '無料で始める',
            cta_url: '/register'
          },
          display_order: 1,
          is_active: true
        },
        {
          section_key: 'features',
          section_type: 'feature_list',
          title: '主な機能',
          content: {
            items: [
              {
                icon: '🤖',
                title: 'AI分析',
                description: '最新のAI技術で検索エンジンでの可視性を分析'
              },
              {
                icon: '📊',
                title: '詳細レポート',
                description: '改善点を具体的に提示する詳細なレポート'
              },
              {
                icon: '⚡',
                title: 'リアルタイム',
                description: 'リアルタイムでの可視性モニタリング'
              }
            ]
          },
          display_order: 2,
          is_active: true
        }
      ]
    };
  }
}

// クライアントサイドでCMSデータを取得
export async function getCMSDataClient(page: string = 'homepage'): Promise<CMSData> {
  try {
    const response = await fetch(`/api/public/cms?page=${page}`);

    if (!response.ok) {
      throw new Error(`CMS API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    // Failed to fetch CMS data (client): error
    throw error;
  }
}

// 特定の設定値を取得
export function getSetting(settings: CMSSettings, key: string, defaultValue: any = null): any {
  return settings[key] ?? defaultValue;
}

// 特定のセクションを取得
export function getSection(sections: CMSSection[], sectionKey: string): CMSSection | null {
  return sections.find(section => section.section_key === sectionKey && section.is_active) || null;
}

// セクションをタイプで取得
export function getSectionsByType(sections: CMSSection[], sectionType: string): CMSSection[] {
  return sections
    .filter(section => section.section_type === sectionType && section.is_active)
    .sort((a, b) => a.display_order - b.display_order);
}

// セクションコンテンツの型安全な取得
export function getSectionContent<T = any>(section: CMSSection | null, key?: string, defaultValue?: T): T {
  if (!section) return defaultValue as T;
  
  if (key) {
    return (section.content[key] ?? defaultValue) as T;
  }
  
  return section.content as T;
}