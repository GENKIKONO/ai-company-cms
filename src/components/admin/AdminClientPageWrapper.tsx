/**
 * AdminClientPageWrapper
 * クライアントコンポーネントのAdminページ用ラッパー
 *
 * AdminPageShellはサーバーコンポーネントなので、
 * クライアントページはこのラッパーでサーバー側のshellに包む
 */

import { ReactNode } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { AdminPageHeader } from './AdminPageHeader';

interface AdminClientPageWrapperProps {
  /** ページタイトル */
  title: string;
  /** ページ説明 */
  description?: string;
  /** パンくずリスト */
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** 必要な機能キー */
  requiredFeature?: string;
  /** クライアントコンポーネント */
  children: ReactNode;
}

export async function AdminClientPageWrapper({
  title,
  description,
  breadcrumbs,
  requiredFeature,
  children,
}: AdminClientPageWrapperProps) {
  return (
    <AdminPageShell pageTitle={title} requiredFeature={requiredFeature}>
      <AdminPageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />
      {children}
    </AdminPageShell>
  );
}
