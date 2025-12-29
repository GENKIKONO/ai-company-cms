/**
 * Billing Admin Console
 * 課金・機能フラグ・クォータ管理画面
 */

import { Metadata } from 'next';
import { AdminPageShell, AdminPageHeader } from '@/components/admin';
import { BillingAdminTabs } from '@/components/admin/billing/BillingAdminTabs';

export const metadata: Metadata = {
  title: 'Billing Management - Admin Console',
  description: '課金・プラン・機能管理',
};

export default async function BillingAdminPage() {
  return (
    <AdminPageShell pageTitle="Billing Management">
      <AdminPageHeader
        title="Billing Management"
        description="プラン・機能・サブスクリプション・クォータを管理します"
        breadcrumbs={[{ label: 'Billing' }]}
      />
      <BillingAdminTabs />
    </AdminPageShell>
  );
}
