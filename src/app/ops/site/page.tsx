/**
 * サイト文言管理ページ - 管理者専用
 * パス: /ops/site
 */
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { env } from '@/lib/env';
import SiteSettingsForm from './SiteSettingsForm';

// 管理者チェック関数
function isAdmin(userEmail?: string): boolean {
  return userEmail?.toLowerCase().trim() === env.ADMIN_EMAIL;
}

export default async function SiteSettingsPage() {
  const supabase = await supabaseServer();
  
  // 認証確認
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/login?redirect=%2Fops%2Fsite');
  }
  
  // 管理者確認
  if (!isAdmin(user.email)) {
    redirect('/dashboard');
  }

  // 現在のサイト設定を取得
  let currentSettings = null;
  try {
    const response = await fetch(`${env.APP_URL}/api/ops/site-settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token=${JSON.stringify({
          access_token: 'mock', // SSRでは実際のトークンアクセスが困難なため、フォームで再取得
          refresh_token: 'mock'
        })}`
      },
      cache: 'no-store'
    });
    
    if (response.ok) {
      const result = await response.json();
      currentSettings = result.data;
    }
  } catch (e) {
    console.error('Failed to fetch site settings:', e);
    // フォールバック用デフォルト値
    currentSettings = {
      hero_title: 'AIO Hub AI企業CMS',
      hero_subtitle: 'AI技術を活用した企業情報の統合管理プラットフォーム',
      representative_message: '私たちは、AI技術を通じて企業の情報発信を支援し、より良いビジネス成果の実現をお手伝いします。',
      footer_links: []
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* ヘッダー */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  サイト文言管理
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  トップページの文言やメッセージを編集できます
                </p>
              </div>
              <div className="flex space-x-3">
                <a
                  href="/ops/probe"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  診断に戻る
                </a>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  プレビュー
                </a>
              </div>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* 左側: フォーム */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                文言設定
              </h2>
              <SiteSettingsForm initialData={currentSettings} />
            </div>

            {/* 右側: プレビュー */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                プレビュー
              </h2>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  {/* Hero Section Preview */}
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4" id="preview-hero-title">
                      {currentSettings?.hero_title || 'AIO Hub AI企業CMS'}
                    </h1>
                    <p className="text-xl text-gray-600 mb-8" id="preview-hero-subtitle">
                      {currentSettings?.hero_subtitle || 'AI技術を活用した企業情報の統合管理プラットフォーム'}
                    </p>
                  </div>
                  
                  {/* Representative Message Preview */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">代表メッセージ</h3>
                    <p className="text-gray-700 leading-relaxed" id="preview-representative-message">
                      {currentSettings?.representative_message || '私たちは、AI技術を通じて企業の情報発信を支援し、より良いビジネス成果の実現をお手伝いします。'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}