'use client';

/**
 * AdminAuditContext
 * 管理操作の監査ログ記録用コンテキスト
 */

import { createContext, useContext, ReactNode, useCallback } from 'react';

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  orgId?: string | null;
}

interface AdminAuditContextValue {
  userId: string;
  pageTitle?: string;
  /** 監査ログを記録する */
  logAudit: (params: AuditLogParams) => Promise<void>;
}

const AdminAuditContext = createContext<AdminAuditContextValue | null>(null);

interface AdminAuditProviderProps {
  children: ReactNode;
  userId: string;
  pageTitle?: string;
}

export function AdminAuditProvider({
  children,
  userId,
  pageTitle,
}: AdminAuditProviderProps) {
  const logAudit = useCallback(
    async (params: AuditLogParams) => {
      try {
        await fetch('/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            actor_user_id: userId,
          }),
        });
      } catch {
        // 監査ログの失敗は操作をブロックしない（ただしログは残す）
        // eslint-disable-next-line no-console
        console.error('[AdminAudit] Failed to log audit event:', params.action);
      }
    },
    [userId]
  );

  return (
    <AdminAuditContext.Provider value={{ userId, pageTitle, logAudit }}>
      {children}
    </AdminAuditContext.Provider>
  );
}

export function useAdminAudit() {
  const context = useContext(AdminAuditContext);
  if (!context) {
    throw new Error('useAdminAudit must be used within AdminAuditProvider');
  }
  return context;
}
