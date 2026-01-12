/* eslint-disable no-console */
'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface RegenerateButtonProps {
  period: string; // YYYY-MM format
  disabled?: boolean;
  onRegenerated?: () => void;
  size?: 'sm' | 'md';
}

export function RegenerateButton({ 
  period, 
  disabled = false, 
  onRegenerated,
  size = 'sm'
}: RegenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleRegenerate = async () => {
    if (loading || disabled) return;

    try {
      setLoading(true);
      setStatus('idle');
      setMessage('');

      const response = await fetch(`/api/my/reports/monthly/${period}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.details || error.message || 'レポートの再生成に失敗しました');
      }

      const result = await response.json();
      setStatus('success');
      setMessage('レポートを再生成しました');
      
      // 成功時のコールバック
      if (onRegenerated) {
        setTimeout(() => {
          onRegenerated();
        }, 1000);
      }

    } catch (error) {
      console.error('Regenerate failed:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '再生成に失敗しました');
    } finally {
      setLoading(false);
      
      // 3秒後にステータスをリセット
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = `
      inline-flex items-center gap-2 rounded-lg font-medium transition-colors
      ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90'}
    `;
    
    if (size === 'sm') {
      return `${baseClasses} px-3 py-1.5 text-sm`;
    } else {
      return `${baseClasses} px-4 py-2`;
    }
  };

  const getButtonColor = () => {
    if (status === 'success') {
      return 'bg-[var(--aio-success-muted)] text-[var(--aio-success)] border border-[var(--aio-success)]';
    }
    if (status === 'error') {
      return 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)] border border-[var(--aio-danger)]';
    }
    return 'bg-[var(--aio-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--dashboard-card-border)] border border-[var(--input-border)]';
  };

  const getIcon = () => {
    if (loading) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    if (status === 'success') {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (status === 'error') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <RefreshCw className="w-4 h-4" />;
  };

  const getButtonText = () => {
    if (loading) return '再生成中...';
    if (status === 'success') return '完了';
    if (status === 'error') return 'エラー';
    return '再生成';
  };

  return (
    <div className="relative">
      <button
        onClick={handleRegenerate}
        disabled={disabled || loading}
        className={`${getButtonClasses()} ${getButtonColor()}`}
        title={disabled ? '再生成できません' : `${period}のレポートを再生成`}
      >
        {getIcon()}
        <span>{getButtonText()}</span>
      </button>

      {/* ステータスメッセージ */}
      {message && (
        <div className={`
          absolute top-full left-0 mt-2 p-2 rounded text-xs whitespace-nowrap z-10
          ${status === 'success' ? 'bg-[var(--aio-success-muted)] text-[var(--aio-success)] border border-[var(--aio-success)]' : ''}
          ${status === 'error' ? 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)] border border-[var(--aio-danger)]' : ''}
        `}>
          {message}
        </div>
      )}
    </div>
  );
}