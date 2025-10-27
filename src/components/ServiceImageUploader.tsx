'use client';

import { useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
import Image from 'next/image';
import { logger } from '@/lib/utils/logger';

interface ServiceImageUploaderProps {
  serviceId?: string; // 新規作成時はundefined
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  disabled?: boolean;
}

export default function ServiceImageUploader({ 
  serviceId, 
  currentImageUrl, 
  onImageChange, 
  disabled = false 
}: ServiceImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
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
      const tempServiceId = serviceId || `temp-${timestamp}-${randomId}`;
      const key = `${tempServiceId}/main.webp`;

      // 既存ファイルがあれば削除
      if (currentImageUrl) {
        try {
          await supabaseBrowser.storage
            .from('service-images')
            .remove([key]);
        } catch (removeError) {
          logger.warn('Failed to remove existing service image', removeError);
        }
      }

      // 新しいファイルをアップロード
      const { data, error: uploadError } = await supabaseBrowser.storage
        .from('service-images')
        .upload(key, file, {
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) {
        throw uploadError;
      }

      // 公開URLを取得
      const { data: publicUrlData } = supabaseBrowser.storage
        .from('service-images')
        .getPublicUrl(key);

      const publicUrl = publicUrlData.publicUrl;
      
      // 親コンポーネントに通知
      onImageChange(publicUrl);
      
      // プレビューを更新
      setPreviewUrl(publicUrl);

    } catch (uploadError) {
      logger.error('Service image upload error:', uploadError);
      setError('サービス画像のアップロードに失敗しました');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    if (!serviceId) {
      // 新規作成時はプレビューのみクリア
      setPreviewUrl(null);
      onImageChange(null);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const key = `${serviceId}/main.webp`;
      
      // Storageから削除
      const { error: removeError } = await supabaseBrowser.storage
        .from('service-images')
        .remove([key]);

      if (removeError) {
        logger.warn('Failed to remove service image from storage', removeError);
      }

      // プレビューをクリア
      setPreviewUrl(null);
      
      // 親コンポーネントに通知 (image_url = null で保存APIを呼ぶ)
      onImageChange(null);

    } catch (clearError) {
      logger.error('Service image clear error:', clearError);
      setError('サービス画像の削除に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        サービス画像
      </label>
      
      {/* プレビュー表示 */}
      {previewUrl ? (
        <div className="mb-4">
          <div className="relative w-48 h-32 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={previewUrl}
              alt="サービス画像"
              fill
              className="object-cover"
              sizes="192px"
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={uploading || disabled}
            className="mt-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {uploading ? '処理中...' : '画像を削除'}
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-600 mb-1">サービス画像</p>
              <p className="text-xs text-gray-500">未設定</p>
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
        {uploading ? 'アップロード中...' : previewUrl ? '画像を変更' : '画像をアップロード'}
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