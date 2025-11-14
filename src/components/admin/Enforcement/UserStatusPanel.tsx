'use client';

import React from 'react';
import { 
  User, 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  XCircle,
  Activity,
  Calendar
} from 'lucide-react';
import { 
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardContent,
  HIGCardGrid
} from '@/components/ui/HIGCard';

interface ViolationSummary {
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
}

interface ActionSummary {
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
}

interface UserStatusData {
  user: {
    id: string;
    email: string;
    currentStatus: string;
    createdAt: string;
  };
  violations: ViolationSummary;
  actions: ActionSummary;
}

interface UserStatusPanelProps {
  userData: UserStatusData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function UserStatusPanel({ 
  userData, 
  loading, 
  error, 
  onRefresh 
}: UserStatusPanelProps) {
  if (loading) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">ユーザー情報を読み込み中...</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  if (error) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 mb-2">{error}</p>
          <button 
            onClick={onRefresh}
            className="text-sm text-primary hover:underline"
          >
            再読み込み
          </button>
        </HIGCardContent>
      </HIGCard>
    );
  }

  if (!userData) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">ユーザーを検索してください</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  const { user, violations, actions } = userData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'warned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'frozen': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'warned': return <AlertTriangle className="h-4 w-4" />;
      case 'suspended': return <Clock className="h-4 w-4" />;
      case 'frozen': return <Shield className="h-4 w-4" />;
      case 'deleted': return <XCircle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <HIGCardGrid columns={1}>
      {/* ユーザー基本情報 */}
      <HIGCard>
        <HIGCardHeader>
          <HIGCardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            ユーザー情報
          </HIGCardTitle>
        </HIGCardHeader>
        <HIGCardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-lg">{user.email}</div>
                <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                <div className="text-sm text-muted-foreground">
                  登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-1 ${getStatusColor(user.currentStatus)}`}>
                {getStatusIcon(user.currentStatus)}
                {user.currentStatus}
              </div>
            </div>
          </div>
        </HIGCardContent>
      </HIGCard>

      {/* 違反履歴サマリー */}
      <HIGCard>
        <HIGCardHeader>
          <HIGCardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            違反履歴 (合計: {violations.count.total}件)
          </HIGCardTitle>
        </HIGCardHeader>
        <HIGCardContent>
          {violations.count.total > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-lg font-semibold text-green-600">{violations.count.low}</div>
                  <div className="text-xs text-green-700">軽微</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <div className="text-lg font-semibold text-yellow-600">{violations.count.medium}</div>
                  <div className="text-xs text-yellow-700">中程度</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="text-lg font-semibold text-orange-600">{violations.count.high}</div>
                  <div className="text-xs text-orange-700">重大</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="text-lg font-semibold text-red-600">{violations.count.critical}</div>
                  <div className="text-xs text-red-700">極めて重大</div>
                </div>
              </div>

              {violations.recent.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">最近の違反</h4>
                  <div className="space-y-2">
                    {violations.recent.slice(0, 3).map((violation) => (
                      <div key={violation.id} className="p-2 border rounded text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className={`font-medium ${getSeverityColor(violation.severity)}`}>
                              {violation.severity.toUpperCase()}
                            </div>
                            <div className="text-gray-700">{violation.reason}</div>
                          </div>
                          <div className="text-xs text-muted-foreground ml-2">
                            {new Date(violation.detectedAt).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">違反履歴はありません</p>
          )}
        </HIGCardContent>
      </HIGCard>

      {/* アクション履歴 */}
      <HIGCard>
        <HIGCardHeader>
          <HIGCardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            制裁履歴 (合計: {actions.count}件)
          </HIGCardTitle>
        </HIGCardHeader>
        <HIGCardContent>
          {actions.count > 0 ? (
            <div className="space-y-4">
              {/* アクティブなアクション */}
              {actions.activeActions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    期限付きアクション
                  </h4>
                  <div className="space-y-2">
                    {actions.activeActions.map((action) => (
                      <div key={action.id} className="p-3 border-2 border-orange-200 bg-orange-50 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-orange-800">{action.action}</div>
                            <div className="text-sm text-orange-700">{action.message}</div>
                            <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              期限: {new Date(action.deadline).toLocaleString('ja-JP')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 最新のアクション */}
              {actions.lastAction && (
                <div>
                  <h4 className="font-medium mb-2">最新のアクション</h4>
                  <div className="p-3 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{actions.lastAction.action}</div>
                        <div className="text-sm text-gray-700">{actions.lastAction.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          実行者: {actions.lastAction.issuedBy?.email || '不明'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          実行日: {new Date(actions.lastAction.createdAt).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* アクション履歴 */}
              {actions.history.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">履歴 (最新5件)</h4>
                  <div className="space-y-2">
                    {actions.history.slice(0, 5).map((action) => (
                      <div key={action.id} className="p-2 border rounded text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{action.action}</div>
                            <div className="text-gray-700">{action.message}</div>
                            {action.deadline && (
                              <div className="text-xs text-muted-foreground">
                                期限: {new Date(action.deadline).toLocaleString('ja-JP')}
                                {action.processedAt && ` (処理済み)`}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground ml-2">
                            {new Date(action.createdAt).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">制裁履歴はありません</p>
          )}
        </HIGCardContent>
      </HIGCard>
    </HIGCardGrid>
  );
}