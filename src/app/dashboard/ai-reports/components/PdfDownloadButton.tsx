/* eslint-disable no-console */
'use client';

import { useState } from 'react';
import { Download, FileText, AlertCircle, Loader } from 'lucide-react';

interface PdfDownloadButtonProps {
  period: string; // YYYY-MM format
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function PdfDownloadButton({ 
  period, 
  disabled = false,
  size = 'md' 
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (loading || disabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/my/reports/monthly/${period}/pdf`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.details || 'PDFの生成に失敗しました');
      }

      // Check content-type to ensure it's actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        // Try to get error details from response text (limit to avoid large content)
        let errorDetail = 'サーバーの応答形式が正しくありません';
        try {
          const text = await response.text();
          if (text.length < 500) {
            const jsonData = JSON.parse(text);
            if (jsonData.message) errorDetail = jsonData.message;
          }
        } catch {
          // Ignore parse errors
        }
        throw new Error(errorDetail);
      }

      // PDFファイルをダウンロード
      const blob = await response.blob();
      
      // Validate blob type as additional safety check
      if (blob.type && !blob.type.includes('application/pdf')) {
        throw new Error('ダウンロードデータがPDF形式ではありません');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-monthly-report-${period}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('PDF download failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'PDFダウンロードに失敗しました';
      setError(errorMessage);
      
      // エラーを3秒後にクリア
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
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
    if (error) {
      return 'bg-[var(--aio-danger-muted)] text-[var(--aio-danger)] border border-[var(--aio-danger)]';
    }
    if (loading) {
      return 'bg-[var(--aio-surface)] text-[var(--color-text-secondary)] border border-[var(--input-border)]';
    }
    return 'bg-[var(--aio-primary)] text-white hover:bg-[var(--aio-primary)]/90';
  };

  const getIcon = () => {
    if (loading) {
      return <Loader className="w-4 h-4 animate-spin" />;
    }
    if (error) {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Download className="w-4 h-4" />;
  };

  const getButtonText = () => {
    if (loading) return 'PDF生成中...';
    if (error) return 'エラー';
    return 'PDFダウンロード';
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={disabled || loading}
        className={`${getButtonClasses()} ${getButtonColor()}`}
        title={disabled ? 'PDFダウンロードできません' : `${period}のレポートをPDFでダウンロード`}
      >
        {getIcon()}
        <span>{getButtonText()}</span>
      </button>

      {/* エラーメッセージ */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-[var(--aio-danger-muted)] border border-[var(--aio-danger)] rounded-lg shadow-lg z-10 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--aio-danger)]" />
            <span className="text-sm text-[var(--aio-danger)]">{error}</span>
          </div>
          <div className="absolute top-0 left-4 -mt-1 w-2 h-2 bg-[var(--aio-danger-muted)] border-l border-t border-[var(--aio-danger)] rotate-45"></div>
        </div>
      )}

      {/* PDFアイコン付きの説明（オプション） */}
      {!loading && !error && size === 'md' && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3" />
            <span>レポートをPDF形式でダウンロード</span>
          </div>
          <div className="absolute top-0 left-4 -mt-1 w-2 h-2 bg-[var(--tooltip-bg)] rotate-45"></div>
        </div>
      )}
    </div>
  );
}