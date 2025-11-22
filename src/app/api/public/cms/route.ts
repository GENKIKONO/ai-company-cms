// 公開CMS データ取得API（認証不要）
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

// 公開CMS データ取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const url = new URL(request.url);
    
    const page = url.searchParams.get('page') || 'homepage';
    const section = url.searchParams.get('section');
    const setting = url.searchParams.get('setting');

    let result: any = {};

    // サイト設定取得
    if (!section || setting) {
      const { data: settings, error: settingsError } = await supabase
        .from('cms_site_settings')
        .select('key, value, data_type')
        .eq('is_public', true);

      if (settingsError) {
        if (settingsError.code === 'PGRST205' || settingsError.message?.includes('Could not find the table')) {
          // CMS テーブルが存在しない場合のデフォルト値
          result.settings = {
            site_title: 'AIOHub - AI Visibility Platform',
            site_description: 'AIによるコンテンツ可視性最適化プラットフォーム',
            company_name: 'LuxuCare株式会社',
            hero_title: 'AI Visibility で\nコンテンツを最適化',
            hero_subtitle: 'AIによる検索エンジン可視性分析で、あなたのコンテンツを最大限に活用'
          };
        } else {
          logger.error('[CMS Public] Settings error', { data: settingsError });
          result.settings = {};
        }
      } else {
        // 設定データをkey-valueオブジェクトに変換
        result.settings = (settings || []).reduce((acc: any, setting: any) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {});
      }

      // 特定の設定が要求された場合
      if (setting) {
        const settingValue = result.settings[setting];
        return NextResponse.json({
          success: true,
          key: setting,
          value: settingValue || null
        });
      }
    }

    // セクションデータ取得
    if (!setting) {
      let sectionsQuery = supabase
        .from('cms_sections')
        .select('*')
        .eq('page_key', page)
        .eq('is_active', true)
        .order('display_order');

      if (section) {
        sectionsQuery = sectionsQuery.eq('section_key', section);
      }

      const { data: sections, error: sectionsError } = await sectionsQuery;

      if (sectionsError) {
        if (sectionsError.code === 'PGRST205' || sectionsError.message?.includes('Could not find the table')) {
          // CMS テーブルが存在しない場合のデフォルトセクション
          if (page === 'homepage') {
            result.sections = [
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
            ];
          } else {
            result.sections = [];
          }
        } else {
          logger.error('[CMS Public] Sections error', { data: sectionsError });
          result.sections = [];
        }
      } else {
        result.sections = sections || [];
      }

      // 特定のセクションが要求された場合
      if (section) {
        const sectionData = result.sections.find((s: any) => s.section_key === section);
        return NextResponse.json({
          success: true,
          data: sectionData || null
        });
      }
    }

    // キャッシュヘッダーを設定（5分間）
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');

    return NextResponse.json({
      success: true,
      page,
      data: result,
      generated_at: new Date().toISOString()
    }, { headers });

  } catch (error) {
    logger.error('[CMS Public] Unexpected error', { data: error });
    
    // エラー時もデフォルトデータを返す
    const defaultData = {
      settings: {
        site_title: 'AIOHub - AI Visibility Platform',
        hero_title: 'AI Visibility で\nコンテンツを最適化'
      },
      sections: []
    };

    return NextResponse.json({
      success: false,
      page: 'homepage',
      data: defaultData,
      error: 'CMS data unavailable, using defaults'
    });
  }
}