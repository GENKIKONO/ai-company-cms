import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { logger } from '@/lib/utils/logger';
import {
  unauthorizedError,
  forbiddenError,
  validationError,
  handleApiError,
} from '@/lib/api/error-responses';

export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;

    if (!file) {
      return validationError([{ field: 'file', message: 'ファイルが指定されていません' }]);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return validationError([{ field: 'file', message: 'ファイルは画像形式である必要があります' }]);
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return validationError([{ field: 'file', message: 'ファイルサイズは5MB以下にしてください' }]);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${organizationId}-${Date.now()}.${fileExt}`;
    
    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Upload to Supabase Storage using service role (bypasses RLS)
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(`logos/${fileName}`, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      logger.error('[Logo Upload] Upload failed', { error });
      return handleApiError(new Error('ファイルのアップロードに失敗しました'));
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        publicUrl: publicUrl
      }
    });

  } catch (error) {
    logger.error('[Logo Upload] Unexpected error', { error });
    return handleApiError(error);
  }
}