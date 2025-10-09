'use client';

import { useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';
import Image from 'next/image';
import LetterAvatar from './ui/LetterAvatar';
import { useToast } from './ui/toast';

interface OrgLogoUploaderProps {
  organizationId: string;
  organizationName: string;
  currentLogoUrl?: string | null;
  onUploadComplete?: (logoUrl: string) => void;
  disabled?: boolean;
}

export default function OrgLogoUploader({
  organizationId,
  organizationName,
  currentLogoUrl,
  onUploadComplete,
  disabled = false,
}: OrgLogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = supabaseBrowser;
  const { addToast } = useToast();

  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  const MAX_SIZE = 1 * 1024 * 1024; // 1MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'PNG/JPG/WebP 形式のみ対応しています。';
    }
    
    if (file.size > MAX_SIZE) {
      return '1MBまでの画像をご利用ください（PNG/JPG/WebP）。';
    }
    
    return null;
  };

  const getFileExtension = (file: File): string => {
    const type = file.type;
    if (type === 'image/png') return '.png';
    if (type === 'image/jpeg') return '.jpg';
    if (type === 'image/webp') return '.webp';
    return '.png'; // fallback
  };

  const uploadLogo = async (file: File) => {
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
      const fileExtension = getFileExtension(file);
      const fileName = `${organizationId}/logo${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('org-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Replace existing file
        });

      if (uploadError) {
        console.error('[UPLOAD]', { 
          message: uploadError.message, 
          bucket: 'org-logos', 
          path: fileName 
        });
        
        // バケット未作成エラーの場合の分岐
        if (uploadError.message.includes('Bucket not found') || 
            uploadError.message.includes('bucket does not exist')) {
          addToast({
            type: 'error',
            title: 'ストレージ設定エラー',
            message: 'バケット未作成のため失敗しました。管理者へご連絡ください。',
          });
        } else {
          // その他のエラーの場合
          addToast({
            type: 'error',
            title: 'アップロード失敗',
            message: '一時的にアップロードに失敗しました。少し時間をおいて再度お試しください。',
          });
        }
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('org-logos')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update organization logo_url in database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organizationId);

      if (updateError) {
        console.error('[UPLOAD] Database update error:', updateError);
        addToast({
          type: 'error',
          title: 'アップロード失敗',
          message: '画像のアップロードは成功しましたが、データベースの更新に失敗しました。',
        });
        return;
      }

      setLogoUrl(publicUrl);
      setImageError(false);
      onUploadComplete?.(publicUrl);

      addToast({
        type: 'success',
        title: 'ロゴアップロード完了',
        message: '企業ロゴが正常にアップロードされました。',
      });

    } catch (error) {
      console.error('[UPLOAD] Unexpected error:', error);
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
      uploadLogo(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const renderLogo = () => {
    if (logoUrl && !imageError) {
      return (
        <Image
          src={logoUrl}
          alt={`${organizationName}のロゴ`}
          width={120}
          height={120}
          className="w-full h-full object-contain bg-white ring-1 ring-gray-200 rounded"
          onError={() => setImageError(true)}
        />
      );
    } else {
      return (
        <LetterAvatar
          name={organizationName}
          size={120}
          rounded="lg"
        />
      );
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        企業ロゴ
      </label>
      
      <div className="flex items-center space-x-4">
        {/* Logo Display */}
        <div className="flex-shrink-0 w-30 h-30">
          {renderLogo()}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading || disabled}
            className="inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                アップロード中...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                ロゴをアップロード
              </>
            )}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            disabled={uploading || disabled}
            className="hidden"
          />
          
          <p className="mt-2 text-sm text-gray-500">
            PNG、JPG、WebP形式、最大1MB
          </p>
        </div>
      </div>
    </div>
  );
}