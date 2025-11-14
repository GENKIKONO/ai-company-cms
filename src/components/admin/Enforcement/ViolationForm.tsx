'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus,
  Shield,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { HIGButton } from '@/components/ui/HIGButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardContent
} from '@/components/ui/HIGCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
// Note: Using native select instead of shadcn Select component

interface EnforcementRecommendation {
  level: 'none' | 'warn' | 'suspend';
  reason: string;
  stats?: {
    total_violations: number;
    violations_1y: number;
    high_violations_1y: number;
    last_violation_rule: string;
  };
  nextViolationAction?: 'suspend' | 'warn' | null;
  nextViolationNote?: string | null;
}

interface ViolationFormProps {
  userId: string;
  disabled?: boolean;
  onViolationCreated?: () => void;
}

export default function ViolationForm({ 
  userId, 
  disabled = false,
  onViolationCreated
}: ViolationFormProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recommendation, setRecommendation] = useState<EnforcementRecommendation | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const resetForm = () => {
    setSeverity('low');
    setReason('');
    setEvidence('');
    setRecommendation(null);
    setShowRecommendation(false);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        userId,
        severity,
        reason: reason.trim(),
        evidence: evidence.trim() || undefined,
        autoAction: false
      };

      const response = await fetch('/api/enforcement/violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '違反登録に失敗しました');
      }

      // 推奨制裁レベルを受け取る
      if (result.enforcementRecommendation) {
        setRecommendation(result.enforcementRecommendation);
        setShowRecommendation(true);
      } else {
        // 推奨がない場合は即座にダイアログを閉じる
        setDialogOpen(false);
        resetForm();
        alert('違反を登録しました');
      }

      if (onViolationCreated) {
        onViolationCreated();
      }

    } catch (error) {
      alert(error instanceof Error ? error.message : '違反登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const executeRecommendedAction = async () => {
    if (!recommendation || recommendation.level === 'none') return;

    setSubmitting(true);
    try {
      const actionType = recommendation.level;
      const payload = {
        userId,
        message: `推奨制裁により${actionType === 'warn' ? '警告' : '一時停止'}処分を実行しました: ${recommendation.reason}`,
        deadline: actionType === 'suspend' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : undefined
      };

      const response = await fetch(`/api/enforcement/actions/${actionType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '推奨制裁の実行に失敗しました');
      }

      setDialogOpen(false);
      resetForm();
      alert(`推奨制裁(${actionType === 'warn' ? '警告' : '一時停止'})を実行しました`);

      if (onViolationCreated) {
        onViolationCreated();
      }

    } catch (error) {
      alert(error instanceof Error ? error.message : '推奨制裁の実行に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    if (!submitting) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const getRecommendationColor = (level: string) => {
    switch (level) {
      case 'none':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'suspend':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getRecommendationIcon = (level: string) => {
    switch (level) {
      case 'none':
        return <CheckCircle className="h-5 w-5" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5" />;
      case 'suspend':
        return <Shield className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  if (disabled) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">ユーザーを選択してください</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  return (
    <HIGCard>
      <HIGCardHeader>
        <HIGCardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          違反登録
        </HIGCardTitle>
      </HIGCardHeader>
      <HIGCardContent>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <HIGButton
              onClick={() => setDialogOpen(true)}
              variant="secondary"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              新しい違反を登録
            </HIGButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {showRecommendation ? '制裁推奨' : '違反登録'}
              </DialogTitle>
              <DialogDescription>
                {showRecommendation 
                  ? '違反登録が完了しました。推奨制裁レベルに基づいてアクションを実行できます。'
                  : 'ユーザーの違反を登録します。'
                }
              </DialogDescription>
            </DialogHeader>

            {!showRecommendation ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">深刻度 *</Label>
                  <select
                    id="severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="low">軽微</option>
                    <option value="medium">中程度</option>
                    <option value="high">重大</option>
                    <option value="critical">極めて重大</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">違反理由 *</Label>
                  <Textarea
                    id="reason"
                    placeholder="違反内容を詳しく入力してください"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {reason.length}/1000
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidence">証拠・補足情報</Label>
                  <Textarea
                    id="evidence"
                    placeholder="関連するURL、ログ、スクリーンショット等の情報があれば記載してください"
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    rows={2}
                    maxLength={2000}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {evidence.length}/2000
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendation && (
                  <div className={`p-4 rounded-lg border ${getRecommendationColor(recommendation.level)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getRecommendationIcon(recommendation.level)}
                      <span className="font-semibold">
                        推奨: {recommendation.level.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm">{recommendation.reason}</p>
                    {recommendation.stats && (
                      <div className="mt-3 text-xs space-y-1 opacity-75">
                        <div>総違反数: {recommendation.stats.total_violations}件</div>
                        <div>過去1年: {recommendation.stats.violations_1y}件</div>
                        <div>重大違反(1年): {recommendation.stats.high_violations_1y}件</div>
                      </div>
                    )}
                    {recommendation.nextViolationAction && (
                      <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                        <div className="font-semibold text-orange-800">
                          ⚠️ 次の違反フラグ設定済み: {recommendation.nextViolationAction === 'suspend' ? 'アカウント停止' : '厳重注意'}
                        </div>
                        {recommendation.nextViolationNote && (
                          <div className="text-orange-700 mt-1">
                            メモ: {recommendation.nextViolationNote}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {!showRecommendation ? (
                <>
                  <HIGButton
                    variant="secondary"
                    onClick={handleDialogClose}
                    disabled={submitting}
                  >
                    キャンセル
                  </HIGButton>
                  <HIGButton
                    onClick={handleSubmit}
                    disabled={submitting || !reason.trim()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        登録中...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        違反を登録
                      </>
                    )}
                  </HIGButton>
                </>
              ) : (
                <>
                  <HIGButton
                    variant="secondary"
                    onClick={handleDialogClose}
                    disabled={submitting}
                  >
                    後で判断する
                  </HIGButton>
                  {recommendation && recommendation.level !== 'none' && (
                    <HIGButton
                      onClick={executeRecommendedAction}
                      disabled={submitting}
                      variant={recommendation.level === 'suspend' ? 'danger' : 'primary'}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          実行中...
                        </>
                      ) : (
                        <>
                          {getRecommendationIcon(recommendation.level)}
                          推奨制裁を実行
                        </>
                      )}
                    </HIGButton>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </HIGCardContent>
    </HIGCard>
  );
}