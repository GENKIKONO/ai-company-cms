/**
 * Feature Management Admin Page
 * プラン別機能管理画面
 */

import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FeatureManagementTabs } from '@/components/admin/FeatureManagementTabs';

export const metadata: Metadata = {
  title: 'Feature Management - Admin Console',
  description: 'プラン別機能管理',
};

export default function FeatureManagementPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="border-b border-[var(--aio-border)] pb-4">
          <h1 className="text-2xl font-semibold text-[var(--aio-text)]">
            Feature Management
          </h1>
          <p className="mt-1 text-sm text-[var(--aio-text-muted)]">
            プラン別の機能制限・有効化設定を管理します
          </p>
        </div>
        
        <FeatureManagementTabs />
      </div>
    </AdminLayout>
  );
}