/**
 * Feature Management Admin Page
 * プラン別機能管理画面
 */

import { Metadata } from 'next';
import { AdminPageShell, AdminPageHeader } from '@/components/admin';
import { FeatureManagementTabs } from '@/components/admin/FeatureManagementTabs';

export const metadata: Metadata = {
  title: 'Feature Management - Admin Console',
  description: 'プラン別機能管理',
};

export default async function FeatureManagementPage() {
  return (
    <AdminPageShell pageTitle="Feature Management">
      <AdminPageHeader
        title="Feature Management"
        description="プラン別の機能制限・有効化設定を管理します"
        breadcrumbs={[{ label: 'Features' }]}
      />
      <FeatureManagementTabs />
    </AdminPageShell>
  );
}