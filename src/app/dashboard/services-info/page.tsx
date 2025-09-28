'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { PLAN_LIMITS } from '@/lib/plan-limits';

export default function ServicesInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        setUser(user);
        
        if (user) {
          // ユーザーの組織があるかチェック
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('created_by', user.id)
            .single();
          
          setOrganization(org);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">サービス紹介</h1>
        <p className="text-gray-600">AI Company CMSの機能とプランをご紹介します。</p>
      </div>

      {/* サービス概要 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Company CMSとは</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          AI Company CMSは、企業情報やサービス、導入事例を効率的に管理・公開できるコンテンツ管理システムです。
          AI技術を活用し、SEO最適化やコンテンツ生成をサポートします。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700 mb-2">企業管理</div>
            <p className="text-sm text-gray-600">企業情報の一元管理</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700 mb-2">サービス管理</div>
            <p className="text-sm text-gray-600">サービス情報の効率的管理</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700 mb-2">導入事例</div>
            <p className="text-sm text-gray-600">成功事例の管理・公開</p>
          </div>
        </div>
      </div>

      {/* プラン比較 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">プラン比較</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">機能</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">フリー</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ベーシック</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">プロ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">サービス</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.free.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.basic.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.services}</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">記事</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.free.posts}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.basic.posts}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.posts}</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">導入事例</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.free.case_studies}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.basic.case_studies}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.case_studies}</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">FAQ</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.free.faqs}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.basic.faqs}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.faqs}</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">料金</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">無料</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥5,000/月</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">近日公開</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 主要機能 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">主要機能</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🏢 企業管理</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 企業情報の一元管理</li>
              <li>• SEO最適化された企業ページ</li>
              <li>• JSON-LD構造化データ自動生成</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">⚙️ サービス管理</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• サービス詳細の管理</li>
              <li>• カテゴリー別分類</li>
              <li>• 検索エンジン最適化</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📊 導入事例管理</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 成功事例の体系的管理</li>
              <li>• ビフォー・アフター表示</li>
              <li>• 効果測定データ管理</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔍 検索・分析</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 高度な検索機能</li>
              <li>• アクセス解析</li>
              <li>• パフォーマンス監視</li>
            </ul>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {user ? (
          organization ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium"
            >
              ダッシュボードに戻る
            </button>
          ) : (
            <button
              onClick={() => router.push('/organizations/new')}
              className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium"
            >
              企業情報を登録する
            </button>
          )
        ) : (
          <>
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium"
            >
              無料で始める
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              ログイン
            </button>
          </>
        )}
      </div>
    </div>
  );
}