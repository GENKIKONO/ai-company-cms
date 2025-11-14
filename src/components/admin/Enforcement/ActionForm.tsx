'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Pause, 
  Trash2, 
  CheckCircle, 
  Calendar,
  MessageSquare,
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

type ActionType = 'warn' | 'suspend' | 'freeze' | 'reinstate' | 'delete';

interface ActionFormProps {
  userId: string;
  currentStatus: string;
  onActionExecuted: () => void;
  disabled?: boolean;
}

interface ActionConfig {
  type: ActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  allowDeadline: boolean;
  confirmMessage: string;
}

const ACTION_CONFIGS: ActionConfig[] = [
  {
    type: 'warn',
    label: '警告',
    description: 'ユーザーに警告を発行します',
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: 'secondary',
    allowDeadline: true,
    confirmMessage: 'このユーザーに警告を発行しますか？'
  },
  {
    type: 'suspend',
    label: '一時停止',
    description: 'アカウントを一時停止状態にします',
    icon: <Pause className="h-4 w-4" />,
    variant: 'primary',
    allowDeadline: true,
    confirmMessage: 'このユーザーのアカウントを一時停止しますか？'
  },
  {
    type: 'freeze',
    label: '凍結',
    description: 'アカウントを凍結状態にします',
    icon: <Shield className="h-4 w-4" />,
    variant: 'danger',
    allowDeadline: true,
    confirmMessage: 'このユーザーのアカウントを凍結しますか？'
  },
  {
    type: 'reinstate',
    label: '復帰',
    description: 'アカウントを通常状態に戻します',
    icon: <CheckCircle className="h-4 w-4" />,
    variant: 'primary',
    allowDeadline: false,
    confirmMessage: 'このユーザーのアカウントを復帰させますか？'
  },
  {
    type: 'delete',
    label: '削除',
    description: 'アカウントを削除状態にします（取消不可）',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'danger',
    allowDeadline: false,
    confirmMessage: '⚠️ このユーザーのアカウントを削除しますか？この操作は取り消すことができません。'
  }
];

export default function ActionForm({ 
  userId, 
  currentStatus, 
  onActionExecuted, 
  disabled = false 
}: ActionFormProps) {
  const [selectedAction, setSelectedAction] = useState<ActionConfig | null>(null);
  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState('');
  const [executing, setExecuting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getAvailableActions = () => {
    // 現在の状態に応じて使用可能なアクションをフィルタリング
    return ACTION_CONFIGS.filter(action => {
      switch (currentStatus) {
        case 'active':
          return ['warn', 'suspend', 'freeze', 'delete'].includes(action.type);
        case 'warned':
          return ['suspend', 'freeze', 'reinstate', 'delete'].includes(action.type);
        case 'suspended':
          return ['freeze', 'reinstate', 'delete'].includes(action.type);
        case 'frozen':
          return ['reinstate', 'delete'].includes(action.type);
        case 'deleted':
          return ['reinstate'].includes(action.type);
        default:
          return false;
      }
    });
  };

  const handleActionClick = (action: ActionConfig) => {
    setSelectedAction(action);
    setMessage('');
    setDeadline('');
    setDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedAction) return;

    setExecuting(true);
    try {
      const payload: any = {
        userId,
        message: message.trim() || `${selectedAction.label}処分を実行しました`
      };

      if (selectedAction.allowDeadline && deadline) {
        payload.deadline = new Date(deadline).toISOString();
      }

      const response = await fetch(`/api/enforcement/actions/${selectedAction.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `${selectedAction.label}処分の実行に失敗しました`);
      }

      // 成功時の処理
      setDialogOpen(false);
      onActionExecuted();
      
      // フォームをリセット
      setSelectedAction(null);
      setMessage('');
      setDeadline('');

      // 成功通知（簡易版）
      if (window.confirm) {
        alert(`${selectedAction.label}処分を実行しました`);
      }

    } catch (error) {
      alert(error instanceof Error ? error.message : `${selectedAction.label}処分の実行に失敗しました`);
    } finally {
      setExecuting(false);
    }
  };

  const availableActions = getAvailableActions();

  if (disabled) {
    return (
      <HIGCard>
        <HIGCardContent className="text-center py-8">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">ユーザーを選択してください</p>
        </HIGCardContent>
      </HIGCard>
    );
  }

  return (
    <HIGCard>
      <HIGCardHeader>
        <HIGCardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          制裁アクション
        </HIGCardTitle>
      </HIGCardHeader>
      <HIGCardContent>
        {availableActions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              現在の状態: <span className="font-medium">{currentStatus}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableActions.map((action) => (
                <Dialog key={action.type} open={dialogOpen && selectedAction?.type === action.type} onOpenChange={(open) => {
                  if (!open) {
                    setDialogOpen(false);
                    setSelectedAction(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <HIGButton
                      onClick={() => handleActionClick(action)}
                      variant={action.variant}
                      className="justify-start h-auto p-3 flex-col items-start"
                      disabled={executing}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {action.icon}
                        <span className="font-medium">{action.label}</span>
                      </div>
                      <span className="text-xs opacity-80 text-left">
                        {action.description}
                      </span>
                    </HIGButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {action.icon}
                        {action.label}処分の実行
                      </DialogTitle>
                      <DialogDescription>
                        {action.confirmMessage}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="message">メッセージ *</Label>
                        <Textarea
                          id="message"
                          placeholder={`${action.label}の理由を入力してください`}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          maxLength={2000}
                        />
                        <div className="text-xs text-muted-foreground text-right">
                          {message.length}/2000
                        </div>
                      </div>

                      {action.allowDeadline && (
                        <div className="space-y-2">
                          <Label htmlFor="deadline" className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            期限（オプション）
                          </Label>
                          <Input
                            id="deadline"
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <div className="text-xs text-muted-foreground">
                            期限を設定すると、自動的に次の段階に移行されます
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <HIGButton
                        variant="secondary"
                        onClick={() => setDialogOpen(false)}
                        disabled={executing}
                      >
                        キャンセル
                      </HIGButton>
                      <HIGButton
                        variant={action.variant}
                        onClick={executeAction}
                        disabled={executing || !message.trim()}
                      >
                        {executing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            実行中...
                          </>
                        ) : (
                          <>
                            {action.icon}
                            {action.label}を実行
                          </>
                        )}
                      </HIGButton>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              現在の状態 ({currentStatus}) では実行可能なアクションがありません
            </p>
          </div>
        )}
      </HIGCardContent>
    </HIGCard>
  );
}