'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { PLAN_LIMITS } from '@/lib/plan-limits';
import { logger } from '@/lib/utils/logger';

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
        logger.error('Auth check failed', error instanceof Error ? error : new Error(String(error)));
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Starter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">サービス</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.starter.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.services}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.business.services}</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">記事</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.starter.posts}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.posts}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.business.posts}</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">導入事例</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.starter.case_studies}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.case_studies}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.business.case_studies}</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">FAQ</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.starter.faqs}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.pro.faqs}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{PLAN_LIMITS.business.faqs}</td></tr>
              <tr><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">料金</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥2,980/月</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥8,000/月</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥15,000/月</td></tr>
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
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              サービス管理
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• サービス詳細の管理</li>
              <li>• カテゴリー別分類</li>
              <li>• 検索エンジン最適化</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              導入事例管理
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 成功事例の体系的管理</li>
              <li>• ビフォー・アフター表示</li>
              <li>• 効果測定データ管理</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              検索・分析
            </h4>
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
              className="px-6 py-3 bg-[var(--color-blue-600)] text-white rounded-md hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] font-medium"
            >
              ダッシュボードに戻る
            </button>
          ) : (
            <button
              onClick={() => router.push('/organizations/new')}
              className="px-6 py-3 bg-[var(--color-blue-600)] text-white rounded-md hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] font-medium"
            >
              企業情報を登録する
            </button>
          )
        ) : (
          <>
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-6 py-3 bg-[var(--color-blue-600)] text-white rounded-md hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] font-medium"
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