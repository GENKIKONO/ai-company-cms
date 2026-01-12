'use client';

import { useState, useRef } from 'react';
import { DashboardButton } from '@/components/dashboard/ui';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/utils/logger';

interface DocumentUploadProps {
  organizationId: string;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ 
  organizationId, 
  onUploadComplete 
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const ALLOWED_TYPES = ['application/pdf'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'PDF形式のみ対応しています。';
    }
    
    if (file.size > MAX_SIZE) {
      return '10MBまでのファイルをご利用ください。';
    }
    
    return null;
  };

  const uploadDocument = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      addToast({
        type: 'error',
        title: 'アップロードエラー',
        message: validationError,
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);

      const response = await fetch('/api/my/org-docs/files', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json().catch(() => ({ success: false, error: 'Invalid response format' }));

      if (!response.ok || !result.success) {
        logger.error('[UPLOAD] API error:', { data: result });
        
        if (response.status === 401) {
          addToast({
            type: 'error',
            title: 'ログインが必要です',
            message: '再度ログインしてからお試しください。',
          });
        } else if (response.status === 403) {
          addToast({
            type: 'error',
            title: 'アクセス権限がありません',
            message: 'この組織のファイルをアップロードする権限がありません。',
          });
        } else if (response.status === 400) {
          addToast({
            type: 'error',
            title: 'ファイルエラー',
            message: result.error || 'ファイル形式またはサイズに問題があります。',
          });
        } else {
          addToast({
            type: 'error',
            title: 'アップロード失敗',
            message: result.error || 'ファイルのアップロードに失敗しました。',
          });
        }
        return;
      }

      addToast({
        type: 'success',
        title: 'アップロード完了',
        message: 'ファイルが正常にアップロードされました。処理が完了するまでお待ちください。',
      });

      onUploadComplete?.();

    } catch (error) {
      logger.error('[UPLOAD] Unexpected error', { 
        data: error instanceof Error ? error : new Error(String(error)) 
      });
      addToast({
        type: 'error',
        title: 'アップロード失敗',
        message: '予期しないエラーが発生しました。',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocument(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadDocument(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
        文書アップロード
      </h3>
      
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-[var(--aio-indigo)] bg-[var(--aio-info-muted)]' 
            : 'border-[var(--input-border)] hover:border-[var(--aio-indigo)] hover:bg-[var(--aio-surface)]'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={uploading ? undefined : handleClick}
      >
        <svg 
          className="mx-auto h-12 w-12 text-[var(--color-icon-muted)] mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>
        
        {uploading ? (
          <div>
            <div className="flex justify-center mb-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--aio-indigo)]"></div>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">アップロード中...</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              PDFファイルをドラッグ&ドロップ
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
              または クリックして選択
            </p>
            <DashboardButton size="sm" disabled={uploading}>
              ファイルを選択
            </DashboardButton>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
      
      <div className="mt-4 text-xs text-[var(--color-text-tertiary)]">
        <p>• PDF形式のみ対応</p>
        <p>• 最大ファイルサイズ: 10MB</p>
        <p>• アップロード後、自動的にAI検索に利用可能になります</p>
      </div>
    </div>
  );
}