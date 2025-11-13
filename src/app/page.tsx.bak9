import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import I18nHomePage from './I18nHomePage';

// 認証状態を毎回評価するため動的SSRに設定
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// サイト設定の型定義
interface SiteSettings {
  hero_title: string;
  hero_subtitle: string;
  representative_message: string;
  hero_background_image?: string;
  footer_links: Array<{
    label: string;
    url: string;
    order?: number;
  }>;
}

// デフォルト設定
const defaultSettings: SiteSettings = {
  hero_title: 'AIO Hub AI企業CMS',
  hero_subtitle: 'AI技術を活用した企業情報の統合管理プラットフォーム',
  representative_message: '私たちは、AI技術を通じて企業の情報発信を支援し、より良いビジネス成果の実現をお手伝いします。',
  hero_background_image: undefined,
  footer_links: []
};

export default async function HomePage() {
  // サイト設定を取得
  let siteSettings = defaultSettings;
  
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single();
    
    if (data && !error) {
      siteSettings = {
        hero_title: data.hero_title || defaultSettings.hero_title,
        hero_subtitle: data.hero_subtitle || defaultSettings.hero_subtitle,
        representative_message: data.representative_message || defaultSettings.representative_message,
        hero_background_image: data.hero_background_image || defaultSettings.hero_background_image,
        footer_links: data.footer_links || defaultSettings.footer_links
      };
    }
  } catch (e) {
    // Settings load failed - using default values
  }

  return <I18nHomePage siteSettings={{
    title: siteSettings.hero_title,
    tagline: siteSettings.hero_subtitle,
    representative_message: siteSettings.representative_message,
    hero_background_image: siteSettings.hero_background_image
  }} />;
}