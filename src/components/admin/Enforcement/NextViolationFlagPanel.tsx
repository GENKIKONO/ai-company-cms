'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Flag, 
  AlertTriangle, 
  Shield, 
  Save,
  Clock,
  User,
  FileText,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { HIGButton } from '@/components/ui/HIGButton';
import { Textarea } from '@/components/ui/textarea';
import { 
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardContent
} from '@/components/ui/HIGCard';
import { Label } from '@/components/ui/label';

interface NextViolationData {
  userId: string;
  email: string;
  accountStatus: string;
  nextViolationAction: 'suspend' | 'warn' | null;
  nextViolationNote: string | null;
  nextViolationSetAt: string | null;
  nextViolationSetBy: string | null;
  setByAdminEmail: string | null;
}

interface NextViolationFlagPanelProps {
  userId: string | null;
  onFlagUpdated?: () => void;
}

export default function NextViolationFlagPanel({ 
  userId, 
  onFlagUpdated 
}: NextViolationFlagPanelProps) {
  const [data, setData] = useState<NextViolationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'suspend' | 'warn' | 'none'>('none');
  const [note, setNote] = useState('');

  const resetForm = () => {
    setSelectedAction('none');
    setNote('');
  };

  const loadNextViolationFlag = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/enforcement/users/${id}/next-violation`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '次の違反フラグの取得に失敗しました');
      }

      setData(result.data);
      
      // フォームに現在の値を設定
      const currentAction = result.data.nextViolationAction;
      setSelectedAction(currentAction || 'none');
      setNote(result.data.nextViolationNote || '');

    } catch (err) {
      setError(err instanceof Error ? err.message : '次の違反フラグの取得に失敗しました');
      setData(null);
      resetForm();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadNextViolationFlag(userId);
    } else {
      setData(null);
      setError(null);
      resetForm();
    }
  }, [userId, loadNextViolationFlag]);

  const handleSave = useCallback(async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const payload = {
        action: selectedAction,
        note: note.trim() || undefined
      };

      const response = await fetch(`/api/enforcement/users/${userId}/next-violation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '次の違反フラグの更新に失敗しました');
      }

      // データを再取得
      await loadNextViolationFlag(userId);
      
      if (onFlagUpdated) {
        onFlagUpdated();
      }

      alert('次の違反フラグを更新しました');

    } catch (error) {
      alert(error instanceof Error ? error.message : '次の違反フラグの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  }, [userId, selectedAction, note, loadNextViolationFlag, onFlagUpdated]);

  const getActionColor = (action: string | null) => {
    switch (action) {
      case 'suspend':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (action: string | null) => {
    switch (action) {
      case 'suspend':
        return <Shield className="h-4 w-4" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string | null) => {
    switch (action) {
      case 'suspend':
        return '次の違反で停止';
      case 'warn':
        return '次の違反で注意';
      default:
        return '設定なし';
    }
  };

  if (!userId) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">ユーザーを選択してください</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  if (loading) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">次の違反フラグを読み込み中...</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  if (error) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 mb-2">{error}</p>
          <button 
            onClick={() => userId && loadNextViolationFlag(userId)}
            className="text-sm text-primary hover:underline"
          >
            再読み込み
          </button>
        </HIGCardContent>
      </HIGCard>
    );
  }

  if (!data) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">データが見つかりません</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  return (
    <HIGCard>
      <HIGCardHeader>
        <HIGCardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          次の違反フラグ管理
        </HIGCardTitle>
      </HIGCardHeader>
      <HIGCardContent>
        <div className="space-y-6">
          {/* 現在の設定表示 */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              現在の設定
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">状態:</span>
                <div className={`px-2 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getActionColor(data.nextViolationAction)}`}>
                  {getActionIcon(data.nextViolationAction)}
                  {getActionLabel(data.nextViolationAction)}
                </div>
              </div>

              {data.nextViolationNote && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">メモ:</span>
                  <p className="text-sm text-gray-700 mt-1 p-2 bg-white border rounded">
                    {data.nextViolationNote}
                  </p>
                </div>
              )}

              {data.nextViolationSetAt && (
                <div className="mt-2 text-xs text-gray-500">
                  <div>設定日時: {new Date(data.nextViolationSetAt).toLocaleString('ja-JP')}</div>
                  {data.setByAdminEmail && (
                    <div>設定者: {data.setByAdminEmail}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 設定フォーム */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">新しい設定</h4>
            
            <div className="space-y-3">
              {/* アクション選択 */}
              <div className="space-y-2">
                <Label>アクション</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="action"
                      value="none"
                      checked={selectedAction === 'none'}
                      onChange={(e) => setSelectedAction(e.target.value as 'none')}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">設定しない</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="action"
                      value="warn"
                      checked={selectedAction === 'warn'}
                      onChange={(e) => setSelectedAction(e.target.value as 'warn')}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">次の違反で厳重注意</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="action"
                      value="suspend"
                      checked={selectedAction === 'suspend'}
                      onChange={(e) => setSelectedAction(e.target.value as 'suspend')}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm">次の違反でアカウント停止</span>
                  </label>
                </div>
              </div>

              {/* メモ入力 */}
              {selectedAction !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="note" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    メモ（任意）
                  </Label>
                  <Textarea
                    id="note"
                    placeholder="設定理由や注意事項があれば記載してください"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {note.length}/500
                  </div>
                </div>
              )}
            </div>

            {/* 保存ボタン */}
            <HIGButton
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  設定を保存
                </>
              )}
            </HIGButton>
          </div>
        </div>
      </HIGCardContent>
    </HIGCard>
  );
}