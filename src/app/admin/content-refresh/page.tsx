/**
 * Content Refresh管理ページ
 * P4-8: 最近の公開反映イベント一覧
 */

'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
// admin-rpc.tsから移行: API route経由でserver-only処理を隠蔽
interface ContentRefreshHistoryItem {
  job_id: string;
  entity_type: string;
  entity_id: string;
  content_version: number;
  trigger_source: string;
  status: 'running' | 'succeeded' | 'failed' | 'partial_error';
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  steps: Array<{
    step: string;
    status: string;
    started_at: string;
    finished_at: string;
    duration_ms: number;
    items_processed?: number;
    error_message?: string;
  }>;
  error_message?: string;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  RefreshCcw, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

// ステータス表示用コンポーネント
function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial_error':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'running':
        return 'bg-[var(--aio-info-muted)] text-[var(--aio-info)] border-[var(--aio-info-border)]';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <XCircle className="h-3 w-3" />;
      case 'partial_error':
        return <AlertCircle className="h-3 w-3" />;
      case 'running':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge variant="outline" className={getStatusColor(status)}>
      <div className="flex items-center gap-1">
        {getStatusIcon(status)}
        <span className="capitalize">{status}</span>
      </div>
    </Badge>
  );
}

// パイプライン詳細モーダル
function PipelineDetailModal({ item }: { item: ContentRefreshHistoryItem }) {
  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>パイプライン詳細</DialogTitle>
        <DialogDescription>
          {item.entity_type} #{item.entity_id} のコンテンツ刷新プロセス詳細
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* 基本情報 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">ジョブID</label>
            <p className="text-sm font-mono">{item.job_id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">トリガー</label>
            <p className="text-sm">{item.trigger_source}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">開始日時</label>
            <p className="text-sm">{new Date(item.started_at).toLocaleString('ja-JP')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">実行時間</label>
            <p className="text-sm">{item.duration_ms ? `${item.duration_ms}ms` : 'N/A'}</p>
          </div>
        </div>

        {/* ステータス */}
        <div>
          <label className="text-sm font-medium text-gray-500">ステータス</label>
          <div className="mt-1">
            <StatusBadge status={item.status} />
          </div>
        </div>

        {/* エラーメッセージ */}
        {item.error_message && (
          <div>
            <label className="text-sm font-medium text-gray-500">エラーメッセージ</label>
            <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{item.error_message}</p>
            </div>
          </div>
        )}

        {/* ステップ詳細 */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">実行ステップ</h4>
          <div className="space-y-3">
            {item.steps.map((step, index) => (
              <div key={index} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{step.step}</span>
                    <StatusBadge status={step.status} />
                  </div>
                  <span className="text-xs text-gray-500">
                    {step.duration_ms}ms
                  </span>
                </div>
                
                {step.items_processed && (
                  <p className="text-xs text-gray-600 mb-1">
                    処理件数: {step.items_processed}
                  </p>
                )}
                
                {step.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-800">{step.error_message}</p>
                  </div>
                )}
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>開始: {new Date(step.started_at).toLocaleString('ja-JP')}</span>
                  <span>終了: {new Date(step.finished_at).toLocaleString('ja-JP')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

// 再実行ダイアログ
function RerunDialog({ item }: { item: ContentRefreshHistoryItem }) {
  const [isLoading, setIsLoading] = useState(false);
  const [targetLangs, setTargetLangs] = useState<string[]>(['ja', 'en']);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [skipEmbedding, setSkipEmbedding] = useState(false);
  const [skipCachePurge, setSkipCachePurge] = useState(false);

  const handleRerun = async () => {
    setIsLoading(true);
    
    try {
      // API route経由でserver-only処理を呼び出し
      const response = await fetch('/api/admin/content-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          target_languages: targetLangs,
          force_refresh: forceRefresh,
          skip_embedding: skipEmbedding,
          skip_cache_purge: skipCachePurge
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`再実行に失敗しました: ${errorData.error}`);
      } else {
        toast.success('コンテンツ刷新を開始しました');
        // ページをリロードして最新の状態を表示
        window.location.reload();
      }
    } catch (error) {
      toast.error('再実行でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>コンテンツ刷新の再実行</DialogTitle>
        <DialogDescription>
          {item.entity_type} #{item.entity_id} のコンテンツ刷新を再実行します
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">対象言語</label>
          <div className="flex gap-2">
            {['ja', 'en'].map(lang => (
              <label key={lang} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={targetLangs.includes(lang)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTargetLangs([...targetLangs, lang]);
                    } else {
                      setTargetLangs(targetLangs.filter(l => l !== lang));
                    }
                  }}
                />
                {lang.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={forceRefresh}
              onChange={(e) => setForceRefresh(e.target.checked)}
            />
            <span className="text-sm">強制刷新（コンテンツが変更されていなくても実行）</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipEmbedding}
              onChange={(e) => setSkipEmbedding(e.target.checked)}
            />
            <span className="text-sm">Embedding更新をスキップ</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipCachePurge}
              onChange={(e) => setSkipCachePurge(e.target.checked)}
            />
            <span className="text-sm">CDNキャッシュクリアをスキップ</span>
          </label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleRerun} 
            disabled={isLoading || targetLangs.length === 0}
            className="flex items-center gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? '実行中...' : '再実行'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function ContentRefreshPage() {
  const [items, setItems] = useState<ContentRefreshHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // API route経由でserver-only処理を呼び出し
      const response = await fetch('/api/admin/content-refresh?limit=100');
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`データの取得に失敗しました: ${errorData.error}`);
      } else {
        const result = await response.json();
        setItems(result.data || []);
      }
    } catch (error) {
      toast.error('データの取得でエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング
  const filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }
    if (entityTypeFilter !== 'all' && item.entity_type !== entityTypeFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">コンテンツ刷新管理</h1>
          <p className="text-gray-600">最近の公開反映イベント一覧</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          更新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>実行履歴</CardTitle>
          <CardDescription>
            パイプライン実行の履歴と詳細な状況
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* フィルタリング */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="succeeded">成功</SelectItem>
                  <SelectItem value="failed">失敗</SelectItem>
                  <SelectItem value="partial_error">部分的エラー</SelectItem>
                  <SelectItem value="running">実行中</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="エンティティタイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                <SelectItem value="post">投稿</SelectItem>
                <SelectItem value="service">サービス</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="news">ニュース</SelectItem>
                <SelectItem value="case_study">導入事例</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>開始日時</TableHead>
                <TableHead>エンティティ</TableHead>
                <TableHead>バージョン</TableHead>
                <TableHead>トリガー</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>実行時間</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.job_id}>
                  <TableCell>
                    <div>
                      <div className="text-sm">
                        {new Date(item.started_at).toLocaleDateString('ja-JP')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(item.started_at), { 
                          addSuffix: true, 
                          locale: ja 
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.entity_type}</div>
                      <div className="text-xs text-gray-500 font-mono">
                        {item.entity_id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>v{item.content_version}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.trigger_source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    {item.duration_ms ? `${item.duration_ms}ms` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <PipelineDetailModal item={item} />
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <RefreshCcw className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <RerunDialog item={item} />
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              フィルタ条件に一致する履歴がありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}