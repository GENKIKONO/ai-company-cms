'use client';

/**
 * AdminLayoutContent
 * Admin領域のクライアント側レイアウトコンテンツ
 *
 * 責務:
 * - ToastProvider の提供
 * - クライアント側の共通UI機能
 *
 * NOTE: 認証・site_admin権限チェックは admin/layout.tsx（Server Component）で行う
 */

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';

interface AdminLayoutContentProps {
  children: ReactNode;
}

export function AdminLayoutContent({ children }: AdminLayoutContentProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--aio-background)]">
        {children}
      </div>
    </ToastProvider>
  );
}
