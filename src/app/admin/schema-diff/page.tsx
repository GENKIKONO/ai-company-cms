/**
 * Super Admin Console - スキーマ変更履歴
 * EPIC 3-7: v_schema_diff_recent ダッシュボード
 * 
 * 機能:
 * - 直近30日のスキーマDiff履歴表示
 * - severity/タイプ別フィルタリング
 * - Diff詳細のJSON表示
 * - マイグレーション適用との相関表示
 * - 統合観測性ダッシュボードへのリンク
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Database, 
  Eye, 
  Filter, 
  AlertTriangle, 
  Info, 
  Ban,
  RefreshCw,
  ExternalLink,
  GitCommit
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// ============================================
// 型定義
// ============================================

interface SchemaDiffRecord {
  id: string;
  environment: string;
  baseline_environment: string;
  diff_at: string;
  summary: {
    total_changes: number;
    severity_counts: Record<'info' | 'warn' | 'error', number>;
    change_type_counts: Record<string, number>;
    schemas_affected: string[];
  };
  severity: 'info' | 'warn' | 'error';
  diff: Array<{
    change_type: 'added' | 'removed' | 'changed';
    object_kind: string;
    schema_name: string;
    object_name: string;
    severity: 'info' | 'warn' | 'error';
    details: Record<string, unknown>;
  }>;
  metadata?: {
    latest_migration?: string;
    total_objects?: number;
  };
  request_id?: string;
}

interface FilterState {
  environment: string;
  severity: string;
  objectKind: string;
  dateRange: string;
  searchTerm: string;
}

// ============================================
// メインコンポーネント
// ============================================

export default function SchemaDiffPage() {
  const [records, setRecords] = useState<SchemaDiffRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<SchemaDiffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SchemaDiffRecord | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    environment: 'all',
    severity: 'all',
    objectKind: 'all',
    dateRange: '30d',
    searchTerm: ''
  });
  const [activeTab, setActiveTab] = useState('summary');

  const supabase = supabaseBrowser;

  // ============================================
  // データ取得
  // ============================================

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('v_schema_diff_recent')
        .select('*')
        .order('diff_at', { ascending: false });

      if (queryError) {
        throw new Error(`データ取得エラー: ${queryError.message}`);
      }

      setRecords(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ============================================
  // フィルタリング
  // ============================================

  useEffect(() => {
    let filtered = [...records];

    // 環境フィルター
    if (filters.environment !== 'all') {
      filtered = filtered.filter(r => r.environment === filters.environment);
    }

    // 重大度フィルター
    if (filters.severity !== 'all') {
      filtered = filtered.filter(r => r.severity === filters.severity);
    }

    // 検索語フィルター
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.environment.toLowerCase().includes(term) ||
        r.summary.schemas_affected.some(schema => schema.toLowerCase().includes(term)) ||
        r.metadata?.latest_migration?.toLowerCase().includes(term)
      );
    }

    // 日付範囲フィルター
    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange.replace('d', ''));
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => new Date(r.diff_at) >= cutoff);
    }

    setFilteredRecords(filtered);
  }, [records, filters]);

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

  const getUniqueValues = (key: keyof SchemaDiffRecord | 'objectKind') => {
    const values = new Set<string>();
    records.forEach(record => {
      if (key === 'objectKind') {
        record.diff?.forEach(d => values.add(d.object_kind));
      } else if (key in record) {
        values.add(String(record[key as keyof SchemaDiffRecord]));
      }
    });
    return Array.from(values).sort();
  };

  // ============================================
  // レンダリング
  // ============================================

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">スキーマDiff履歴を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchRecords} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          再試行
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">スキーマ変更履歴</h1>
        <p className="text-muted-foreground">
          データベーススキーマの差分検知履歴と詳細分析
        </p>
      </div>

      {/* ============================================ */}
      {/* サマリーカード */}
      {/* ============================================ */}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総変更数</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredRecords.reduce((sum, r) => sum + r.summary.total_changes, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              過去30日間
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">エラー級変更</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {filteredRecords.filter(r => r.severity === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground">
              重大な変更検知
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">警告級変更</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {filteredRecords.filter(r => r.severity === 'warn').length}
            </div>
            <p className="text-xs text-muted-foreground">
              注意が必要な変更
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">環境数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredRecords.map(r => r.environment)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              監視対象環境
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* フィルター */}
      {/* ============================================ */}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">環境</label>
              <Select 
                value={filters.environment} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, environment: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {getUniqueValues('environment').map(env => (
                    <SelectItem key={env} value={env}>{env}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">重大度</label>
              <Select 
                value={filters.severity} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">期間</label>
              <Select 
                value={filters.dateRange} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">過去7日</SelectItem>
                  <SelectItem value="30d">過去30日</SelectItem>
                  <SelectItem value="90d">過去90日</SelectItem>
                  <SelectItem value="all">すべて</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">検索</label>
              <Input
                placeholder="環境名、スキーマ名、マイグレーション等で検索..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* 履歴テーブル */}
      {/* ============================================ */}
      
      <Card>
        <CardHeader>
          <CardTitle>差分履歴 ({filteredRecords.length}件)</CardTitle>
          <CardDescription>
            過去のスキーマ変更検知結果一覧
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>検知日時</TableHead>
                <TableHead>環境</TableHead>
                <TableHead>重大度</TableHead>
                <TableHead>変更数</TableHead>
                <TableHead>影響スキーマ</TableHead>
                <TableHead>マイグレーション</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const SeverityIcon = getSeverityIcon(record.severity);
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {format(new Date(record.diff_at), 'yyyy-MM-dd HH:mm', { locale: ja })}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">{record.environment}</Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={getSeverityColor(record.severity)}>
                        <SeverityIcon className="h-3 w-3 mr-1" />
                        {record.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{record.summary.total_changes}</div>
                        <div className="text-muted-foreground text-xs">
                          {Object.entries(record.summary.change_type_counts)
                            .map(([type, count]) => `${type}:${count}`)
                            .join(', ')
                          }
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {record.summary.schemas_affected.slice(0, 2).map(schema => (
                          <Badge key={schema} variant="secondary" className="mr-1 mb-1">
                            {schema}
                          </Badge>
                        ))}
                        {record.summary.schemas_affected.length > 2 && (
                          <span className="text-muted-foreground text-xs">
                            +{record.summary.schemas_affected.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {record.metadata?.latest_migration ? (
                        <div className="flex items-center text-sm">
                          <GitCommit className="h-3 w-3 mr-1" />
                          <span className="font-mono text-xs">
                            {record.metadata.latest_migration.slice(0, 8)}...
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            詳細
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>
                              スキーマDiff詳細: {record.environment}
                            </DialogTitle>
                            <DialogDescription>
                              {format(new Date(record.diff_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })} 検知
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="summary">サマリー</TabsTrigger>
                              <TabsTrigger value="changes">変更詳細</TabsTrigger>
                              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="summary" className="mt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">基本情報</h4>
                                  <div className="space-y-1 text-sm">
                                    <div>環境: {record.environment}</div>
                                    <div>ベースライン: {record.baseline_environment}</div>
                                    <div>総変更数: {record.summary.total_changes}</div>
                                    <div>重大度: {record.severity}</div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">影響範囲</h4>
                                  <div className="space-y-1 text-sm">
                                    <div>スキーマ数: {record.summary.schemas_affected.length}</div>
                                    <div className="flex flex-wrap gap-1">
                                      {record.summary.schemas_affected.map(schema => (
                                        <Badge key={schema} variant="secondary">
                                          {schema}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="changes" className="mt-4">
                              <ScrollArea className="h-96">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>種別</TableHead>
                                      <TableHead>オブジェクト</TableHead>
                                      <TableHead>変更内容</TableHead>
                                      <TableHead>重大度</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {record.diff?.map((change, index) => (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Badge variant="outline">{change.change_type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                          <div className="text-sm">
                                            <div className="font-medium">{change.object_kind}</div>
                                            <div className="text-muted-foreground">
                                              {change.schema_name}.{change.object_name}
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <pre className="text-xs bg-muted p-2 rounded max-w-md overflow-auto">
                                            {JSON.stringify(change.details, null, 2)}
                                          </pre>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={getSeverityColor(change.severity)}>
                                            {change.severity}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </ScrollArea>
                            </TabsContent>
                            
                            <TabsContent value="raw" className="mt-4">
                              <ScrollArea className="h-96">
                                <pre className="text-xs bg-muted p-4 rounded">
                                  {JSON.stringify(record, null, 2)}
                                </pre>
                              </ScrollArea>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              フィルター条件に一致する履歴がありません
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* 統合ダッシュボードリンク */}
      {/* ============================================ */}
      
      <div className="mt-6 flex justify-end">
        <a 
          href="/admin/console" 
          className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 rounded-md transition-colors"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          統合観測性ダッシュボードへ
        </a>
      </div>
    </div>
  );
}