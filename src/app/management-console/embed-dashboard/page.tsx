/**
 * 管理者用 埋め込み利用状況ダッシュボード
 * 全組織の埋め込み使用状況を監視・分析
 */

import React from 'react';
import { EmbedUsageChart } from '@/components/admin/EmbedUsageChart';
import { EmbedLimitCard } from '@/components/admin/EmbedLimitCard';
import { EmbedTopSources } from '@/components/admin/EmbedTopSources';
import { EmbedRealtimeStats } from '@/components/admin/EmbedRealtimeStats';
import { HIGButton } from '@/design-system';

export default async function EmbedDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            埋め込み利用状況ダッシュボード
          </h1>
          <p className="text-gray-600">
            全組織のWidget/iframe埋め込み使用状況を監視・分析します
          </p>
        </div>

        {/* リアルタイム統計 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            リアルタイム統計
          </h2>
          <EmbedRealtimeStats />
        </div>

        {/* 利用制限と警告 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            プラン制限と警告
          </h2>
          <EmbedLimitCard />
        </div>

        {/* 使用状況チャート */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            使用状況トレンド（過去30日）
          </h2>
          <EmbedUsageChart />
        </div>

        {/* 人気の埋め込み元サイト */}
        <div className="mb-8">
          <h2 className="text-xl font-semibent text-gray-900 mb-4">
            人気の埋め込み元サイト
          </h2>
          <EmbedTopSources />
        </div>

        {/* アクション */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            管理アクション
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HIGButton variant="primary" size="medium">
              埋め込み設定をエクスポート
            </HIGButton>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              使用状況レポート生成
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
              プラン制限設定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}