// 管理者向け審査キュー画面
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Eye, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/utils/logger';

interface Organization {
  id: string;
  name: string;
  slug: string;
  corporate_number: string | null;
  status: string;
  verified: boolean;
  telephone: string;
  email: string | null;
  address_region: string;
  address_locality: string;
  created_at: string;
  updated_at: string;
  review_history: ReviewHistoryItem[];
}

interface ReviewHistoryItem {
  id: string;
  action: string;
  admin_user_id: string;
  old_status: string;
  new_status: string;
  reason: string | null;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews');
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const result = await response.json();
      setOrganizations(result.data || []);
    } catch (error) {
      logger.error('Error fetching reviews', error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "エラー",
        description: "審査データの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (orgId: string, action: 'approve' | 'reject') => {
    setActionLoading(orgId);
    
    try {
      const response = await fetch(`/api/admin/reviews?org_id=${orgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reason: reason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Review action failed');
      }

      const result = await response.json();
      
      toast({
        title: "審査完了",
        description: `組織「${selectedOrg?.name}」を${action === 'approve' ? '承認' : '却下'}しました`,
        variant: "default",
      });

      // リストを更新
      await fetchPendingReviews();
      setSelectedOrg(null);
      setReason('');
      
    } catch (error) {
      logger.error('Error performing review action', error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "エラー",
        description: "審査処理に失敗しました",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'public_unverified':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">限定公開</Badge>;
      case 'waiting_approval':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">承認待ち</Badge>;
      case 'published':
        return <Badge variant="default" className="bg-green-100 text-green-800">公開済み</Badge>;
      case 'draft':
        return <Badge variant="outline">下書き</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <Clock className="animate-spin h-6 w-6 mr-2" />
          <span>審査データを読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">組織審査キュー</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            {organizations.length}件の審査待ち
          </Badge>
          <Button
            onClick={fetchPendingReviews}
            variant="outline"
            size="sm"
          >
            更新
          </Button>
        </div>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium">審査待ちの組織はありません</h3>
            <p className="text-[var(--color-text-secondary)]">すべての審査が完了しています。</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(org.status)}
                    {org.verified && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        認証済み
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-[var(--color-text-secondary)]">法人番号:</span>
                      <p className="font-mono">{org.corporate_number || '未登録'}</p>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-secondary)]">電話番号:</span>
                      <p>{org.telephone}</p>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-secondary)]">所在地:</span>
                      <p>{org.address_region} {org.address_locality}</p>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-secondary)]">申請日:</span>
                      <p>{formatDate(org.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            詳細確認
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{org.name} - 詳細情報</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-[var(--color-text-secondary)]">組織ID:</span>
                                <p className="font-mono">{org.id}</p>
                              </div>
                              <div>
                                <span className="text-[var(--color-text-secondary)]">スラッグ:</span>
                                <p>{org.slug}</p>
                              </div>
                              <div>
                                <span className="text-[var(--color-text-secondary)]">メール:</span>
                                <p>{org.email || '未登録'}</p>
                              </div>
                              <div>
                                <span className="text-[var(--color-text-secondary)]">更新日:</span>
                                <p>{formatDate(org.updated_at)}</p>
                              </div>
                            </div>
                            
                            {org.review_history.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  審査履歴
                                </h4>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {org.review_history.map((history) => (
                                    <div key={history.id} className="text-sm border rounded p-2">
                                      <div className="flex justify-between">
                                        <span className="font-medium">{history.action}</span>
                                        <span className="text-[var(--color-text-secondary)]">
                                          {formatDate(history.created_at)}
                                        </span>
                                      </div>
                                      {history.reason && (
                                        <p className="text-[var(--color-text-secondary)] mt-1">{history.reason}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <a 
                        href={`/o/${org.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--aio-primary)] hover:underline text-sm"
                      >
                        ページを確認 →
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrg(org)}
                          >
                            審査する
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>組織審査</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">{selectedOrg?.name}</h4>
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                この組織の審査を行います
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">審査理由・コメント</label>
                              <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="承認/却下の理由を入力してください（任意）"
                                className="mt-1"
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrg(null);
                                  setReason('');
                                }}
                              >
                                キャンセル
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleReviewAction(org.id, 'reject')}
                                disabled={actionLoading === org.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                却下
                              </Button>
                              <Button
                                onClick={() => handleReviewAction(org.id, 'approve')}
                                disabled={actionLoading === org.id}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                承認
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}