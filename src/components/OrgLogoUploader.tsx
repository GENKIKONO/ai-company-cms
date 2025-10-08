'use client';

import { useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
import Image from 'next/image';

interface OrgLogoUploaderProps {
  orgId?: string; // 新規作成時はundefined
  currentLogoUrl?: string;
  onLogoChange: (logoUrl: string | null) => void;
  disabled?: boolean;
}

export default function OrgLogoUploader({ 
  orgId, 
  currentLogoUrl, 
  onLogoChange, 
  disabled = false 
}: OrgLogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // ファイルサイズチェック (512KB = 512 * 1024 bytes)
    const maxSize = 512 * 1024;
    if (file.size > maxSize) {
      setError('ファイルサイズが512KBを超えています');
      return;
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    setUploading(true);

    try {
      // プレビュー表示用のローカルURL作成
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);

      // WebP変換 (簡易実装 - そのままアップロード)
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const tempOrgId = orgId || `temp-${timestamp}-${randomId}`;
      const key = `${tempOrgId}/logo.webp`;

      // 既存ファイルがあれば削除
      if (currentLogoUrl) {
        try {
          await supabaseBrowser.storage
            .from('org-logos')
            .remove([key]);
        } catch (removeError) {
          console.warn('Failed to remove existing logo:', removeError);
        }
      }

      // 新しいファイルをアップロード
      const { data, error: uploadError } = await supabaseBrowser.storage
        .from('org-logos')
        .upload(key, file, {
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) {
        throw uploadError;
      }

      // 公開URLを取得
      const { data: publicUrlData } = supabaseBrowser.storage
        .from('org-logos')
        .getPublicUrl(key);

      const publicUrl = publicUrlData.publicUrl;
      
      // 親コンポーネントに通知
      onLogoChange(publicUrl);
      
      // プレビューを更新
      setPreviewUrl(publicUrl);

    } catch (uploadError) {
      console.error('Logo upload error:', uploadError);
      setError('ロゴのアップロードに失敗しました');
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    if (!orgId) {
      // 新規作成時はプレビューのみクリア
      setPreviewUrl(null);
      onLogoChange(null);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const key = `${orgId}/logo.webp`;
      
      // Storageから削除
      const { error: removeError } = await supabaseBrowser.storage
        .from('org-logos')
        .remove([key]);

      if (removeError) {
        console.warn('Failed to remove logo from storage:', removeError);
      }

      // プレビューをクリア
      setPreviewUrl(null);
      
      // 親コンポーネントに通知 (logo_url = null で保存APIを呼ぶ)
      onLogoChange(null);

    } catch (clearError) {
      console.error('Logo clear error:', clearError);
      setError('ロゴの削除に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        企業ロゴ
      </label>
      
      {/* プレビュー表示 */}
      {previewUrl ? (
        <div className="mb-4">
          <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={previewUrl}
              alt="企業ロゴ"
              fill
              className="object-contain"
              sizes="128px"
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={uploading || disabled}
            className="mt-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {uploading ? '処理中...' : 'ロゴを削除'}
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-xs text-gray-500">ロゴなし</p>
            </div>
          </div>
        </div>
      )}

      {/* ファイル選択 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading || disabled}
        className="hidden"
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || disabled}
        className="btn-secondary text-sm disabled:opacity-50"
      >
        {uploading ? 'アップロード中...' : previewUrl ? 'ロゴを変更' : 'ロゴをアップロード'}
      </button>

      {/* エラー表示 */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* 説明テキスト */}
      <p className="mt-2 text-xs text-gray-500">
        最大512KB、JPG・PNG・WebP形式をサポート
      </p>
    </div>
  );
}