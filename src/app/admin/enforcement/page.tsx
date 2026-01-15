'use client';

import React, { useState, useCallback } from 'react';
import { Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { 
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardContent,
  HIGCardGrid
} from '@/components/ui/HIGCard';
import { HIGButton } from '@/components/ui/HIGButton';
import UserSearch from '@/components/admin/Enforcement/UserSearch';
import UserStatusPanel from '@/components/admin/Enforcement/UserStatusPanel';
import ActionForm from '@/components/admin/Enforcement/ActionForm';
import ViolationStatsPanel from '@/components/admin/Enforcement/ViolationStatsPanel';
import ViolationForm from '@/components/admin/Enforcement/ViolationForm';
import NextViolationFlagPanel from '@/components/admin/Enforcement/NextViolationFlagPanel';

interface UserStatusData {
  user: {
    id: string;
    email: string;
    currentStatus: string;
    createdAt: string;
  };
  violations: {
    count: {
      total: number;
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    recent: Array<{
      id: string;
      severity: string;
      reason: string;
      detectedAt: string;
      createdAt: string;
    }>;
  };
  actions: {
    count: number;
    lastAction: {
      id: string;
      action: string;
      message: string;
      effectiveFrom: string;
      deadline?: string;
      processedAt?: string;
      createdAt: string;
      issuedBy?: {
        email: string;
      };
    } | null;
    activeActions: Array<{
      id: string;
      action: string;
      message: string;
      deadline: string;
      effectiveFrom: string;
      createdAt: string;
    }>;
    history: Array<{
      id: string;
      action: string;
      message: string;
      effectiveFrom: string;
      deadline?: string;
      processedAt?: string;
      createdAt: string;
      issuedBy?: {
        email: string;
      };
    }>;
  };
}

export default function EnforcementPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userStatusData, setUserStatusData] = useState<UserStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserStatus = useCallback(async (userId: string) => {
    if (!userId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/enforcement/users/${userId}/status`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ユーザー情報の取得に失敗しました');
      }

      setUserStatusData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
      setUserStatusData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUserSelect = useCallback((userId: string) => {
    setSelectedUserId(userId);
    loadUserStatus(userId);
  }, [loadUserStatus]);

  const handleRefresh = useCallback(() => {
    if (selectedUserId) {
      loadUserStatus(selectedUserId);
    }
  }, [selectedUserId, loadUserStatus]);

  const handleActionExecuted = useCallback(() => {
    // アクション実行後にユーザー情報を更新
    if (selectedUserId) {
      setTimeout(() => {
        loadUserStatus(selectedUserId);
      }, 500); // 少し遅延させてDB更新を待つ
    }
  }, [selectedUserId, loadUserStatus]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                制裁管理システム
              </h1>
              <p className="text-muted-foreground mt-1">
                ユーザーアカウントの制裁状況を管理します
              </p>
            </div>
            {selectedUserId && (
              <HIGButton 
                variant="secondary" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                最新情報に更新
              </HIGButton>
            )}
          </div>
        </div>

        {/* 注意事項 */}
        <HIGCard className="mb-6 border-amber-200 bg-amber-50">
          <HIGCardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <div className="font-medium mb-1">重要事項</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>制裁アクションの実行は慎重に行ってください</li>
                  <li>すべてのアクションは監査ログに記録されます</li>
                  <li>削除アクションは取り消すことができません</li>
                  <li>期限付きアクションは自動的に次の段階に進行します</li>
                </ul>
              </div>
            </div>
          </HIGCardContent>
        </HIGCard>

        <HIGCardGrid columns={1} className="lg:grid-cols-3 gap-6">
          {/* ユーザー検索 */}
          <div className="lg:col-span-1">
            <UserSearch 
              onUserSelect={handleUserSelect}
              loading={loading}
            />
            
            {/* 違反登録フォーム */}
            <div className="mt-6">
              <ViolationForm
                userId={selectedUserId || ''}
                disabled={!selectedUserId || loading}
                onViolationCreated={handleActionExecuted}
              />
            </div>
            
            {/* 次の違反フラグ管理 */}
            <div className="mt-6">
              <NextViolationFlagPanel
                userId={selectedUserId}
                onFlagUpdated={handleActionExecuted}
              />
            </div>

            {/* アクションフォーム */}
            <div className="mt-6">
              <ActionForm
                userId={selectedUserId || ''}
                currentStatus={userStatusData?.user.currentStatus || ''}
                onActionExecuted={handleActionExecuted}
                disabled={!selectedUserId || loading}
              />
            </div>
          </div>

          {/* ユーザー状態パネル */}
          <div className="lg:col-span-2">
            {/* 違反統計パネル */}
            <div className="mb-6">
              <ViolationStatsPanel
                userId={selectedUserId}
              />
            </div>
            
            <UserStatusPanel
              userData={userStatusData}
              loading={loading}
              error={error}
              onRefresh={handleRefresh}
            />
          </div>
        </HIGCardGrid>

        {/* フッター情報 */}
        {userStatusData && (
          <div className="mt-8 text-center">
            <div className="text-sm text-muted-foreground">
              最終更新: {new Date().toLocaleString('ja-JP')} |
              対象ユーザー: {userStatusData.user.email} |
              システム: AIOHub 制裁管理システム v1.0
            </div>
          </div>
        )}
      </div>
    </div>
  );
}