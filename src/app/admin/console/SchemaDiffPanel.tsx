/**
 * Schema Diff Panel for Super Admin Console
 * EPIC 3-7: 統合観測性ダッシュボード用コンポーネント
 * 
 * 機能:
 * - 最新のスキーマDiff状況表示
 * - 重大度別の統計表示
 * - 詳細画面へのリンク
 * - Nightlyジョブ実行状況との連携
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Database,
  GitBranch,
  AlertTriangle,
  Info,
  Ban,
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// ============================================
// 型定義
// ============================================

interface SchemaDiffSummary {
  id: string;
  environment: string;
  diff_at: string;
  severity: 'info' | 'warn' | 'error';
  total_changes: number;
  schemas_affected: string[];
  last_job_status: 'success' | 'failed' | 'running' | null;
  last_job_at: string | null;
}

interface SchemaDiffStats {
  total_diffs_24h: number;
  error_count_24h: number;
  warn_count_24h: number;
  environments_monitored: number;
  last_successful_run: string | null;
  last_failed_run: string | null;
  avg_changes_per_diff: number;
}

// ============================================
// メインコンポーネント
// ============================================

interface SchemaDiffPanelProps {
  className?: string;
}

export default function SchemaDiffPanel({ className }: SchemaDiffPanelProps) {
  const [recentDiffs, setRecentDiffs] = useState<SchemaDiffSummary[]>([]);
  const [stats, setStats] = useState<SchemaDiffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // データ取得
  // ============================================

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 最新のスキーマDiff情報を取得
      const [diffsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/schema-diff/recent'),
        fetch('/api/admin/schema-diff/stats'),
      ]);

      if (!diffsResponse.ok || !statsResponse.ok) {
        throw new Error('データ取得に失敗しました');
      }

      const [diffsData, statsData] = await Promise.all([
        diffsResponse.json(),
        statsResponse.json(),
      ]);

      setRecentDiffs(diffsData.diffs || []);
      setStats(statsData.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // 5分ごとに自動更新
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // ヘルパー関数
  // ============================================

  const getSeverityColor = (severity: 'info' | 'warn' | 'error') => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warn': return 'outline';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: 'info' | 'warn' | 'error') => {
    switch (severity) {
      case 'error': return Ban;
      case 'warn': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getJobStatusIcon = (status: 'success' | 'failed' | 'running' | null) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'failed': return XCircle;
      case 'running': return RefreshCw;
      default: return Clock;
    }
  };

  const getJobStatusColor = (status: 'success' | 'failed' | 'running' | null) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  // ============================================
  // レンダリング
  // ============================================

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            スキーマ変更監視
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>データ読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            スキーマ変更監視
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchData} className="mt-4" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            スキーマ変更監視
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <a 
              href="/admin/schema-diff"
              className="inline-flex items-center justify-center h-10 px-3 py-2 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 rounded-md transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              詳細
            </a>
          </div>
        </CardTitle>
        <CardDescription>
          過去24時間のスキーマ変更検知状況
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* ============================================ */}
        {/* 統計サマリー */}
        {/* ============================================ */}
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_diffs_24h}
              </div>
              <div className="text-sm text-muted-foreground">検知数</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.error_count_24h}
              </div>
              <div className="text-sm text-muted-foreground">エラー級</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {stats.warn_count_24h}
              </div>
              <div className="text-sm text-muted-foreground">警告級</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.environments_monitored}
              </div>
              <div className="text-sm text-muted-foreground">監視環境</div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* 最新のDiff履歴 */}
        {/* ============================================ */}
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">最新の変更検知</h4>
          
          {recentDiffs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">環境</TableHead>
                  <TableHead>検知日時</TableHead>
                  <TableHead>重大度</TableHead>
                  <TableHead>変更数</TableHead>
                  <TableHead>ジョブ状況</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDiffs.slice(0, 5).map((diff) => {
                  const SeverityIcon = getSeverityIcon(diff.severity);
                  const JobStatusIcon = getJobStatusIcon(diff.last_job_status);
                  
                  return (
                    <TableRow key={diff.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {diff.environment}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {format(new Date(diff.diff_at), 'MM/dd HH:mm', { locale: ja })}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center">
                          <SeverityIcon className="h-3 w-3 mr-1" />
                          <Badge 
                            variant={getSeverityColor(diff.severity)}
                            className="text-xs"
                          >
                            {diff.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{diff.total_changes}</div>
                          <div className="text-xs text-muted-foreground">
                            {diff.schemas_affected.length} スキーマ
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center">
                          <JobStatusIcon 
                            className={`h-3 w-3 mr-1 ${getJobStatusColor(diff.last_job_status)} ${
                              diff.last_job_status === 'running' ? 'animate-spin' : ''
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {diff.last_job_status || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>過去24時間でスキーマ変更は検知されていません</p>
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* ジョブ実行状況 */}
        {/* ============================================ */}
        
        {stats && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Nightlyジョブ実行状況
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">最終成功:</span>
                <span className="text-green-600">
                  {stats.last_successful_run 
                    ? format(new Date(stats.last_successful_run), 'MM/dd HH:mm', { locale: ja })
                    : 'N/A'
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">最終失敗:</span>
                <span className="text-red-600">
                  {stats.last_failed_run
                    ? format(new Date(stats.last_failed_run), 'MM/dd HH:mm', { locale: ja })
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* アクションボタン */}
        {/* ============================================ */}
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3 mr-1" />
              <span>EPIC 3-7: Nightly Schema Diff</span>
            </div>
            
            <div className="flex space-x-2">
              <a 
                href="/admin/schema-diff"
                className="inline-flex items-center justify-center h-10 px-3 py-2 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 rounded-md transition-colors"
              >
                すべて表示
              </a>
              
              <a 
                href="/admin/console#jobs"
                className="inline-flex items-center justify-center h-10 px-3 py-2 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 rounded-md transition-colors"
              >
                ジョブ履歴
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}