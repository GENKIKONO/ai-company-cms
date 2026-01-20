// CMS アセット管理 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { logger } from '@/lib/utils/logger';
import { handleApiError, handleZodError, handleDatabaseError, validationError } from '@/lib/api/error-responses';
import { z } from 'zod';

// Zodスキーマ: アセット作成用
const createAssetSchema = z.object({
  filename: z.string().min(1, 'ファイル名は必須です').max(255),
  original_name: z.string().max(255).optional(),
  file_path: z.string().min(1, 'ファイルパスは必須です').max(1024),
  file_size: z.number().int().positive().optional(),
  mime_type: z.string().max(100).optional(),
  alt_text: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  is_active: z.boolean().default(true),
});

// アセット一覧取得
export async function GET(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active_only') === 'true';
    const mimeType = url.searchParams.get('mime_type');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('cms_assets')
      .select('id, filename, original_name, file_path, file_size, mime_type, alt_text, description, tags, is_active, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (mimeType) {
      query = query.like('mime_type', `${mimeType}%`);
    }

    const { data: assets, error } = await query;

    if (error) {
      logger.error('[CMS Assets] Failed to fetch assets', { data: error });
      
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'CMS tables not yet created'
        });
      }
      
      return handleDatabaseError(error);
    }

    return NextResponse.json({
      success: true,
      data: assets || [],
      total: assets?.length || 0,
      pagination: {
        limit,
        offset,
        has_more: (assets?.length || 0) === limit
      }
    });

  } catch (error) {
    logger.error('[CMS Assets] Unexpected error', { data: error });
    return handleApiError(error);
  }
}

// アセット作成・登録
export async function POST(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();
    const body = await request.json();

    // Zodスキーマでバリデーション
    const parseResult = createAssetSchema.safeParse(body);
    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const validatedData = parseResult.data;
    const assetData = {
      ...validatedData,
      original_name: validatedData.original_name || validatedData.filename,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('cms_assets')
      .insert(assetData)
      .select()
      .single();

    if (error) {
      logger.error('[CMS Assets] Failed to save asset', { data: error });
      
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json(
          { error: 'CMS tables not yet created. Please run migration first.' },
          { status: 503 }
        );
      }
      
      return handleDatabaseError(error);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Asset saved successfully'
    });

  } catch (error) {
    logger.error('[CMS Assets] POST error', { data: error });
    return handleApiError(error);
  }
}

// アセット削除
export async function DELETE(request: NextRequest) {
  // 管理者認証チェック
  const authResult = await requireAdmin();
  if (!isAuthorized(authResult)) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const assetId = url.searchParams.get('id');

    if (!assetId) {
      return validationError([
        { field: 'id', message: 'Asset ID is required' }
      ]);
    }

    const { error } = await supabase
      .from('cms_assets')
      .delete()
      .eq('id', assetId);

    if (error) {
      logger.error('[CMS Assets] Failed to delete asset', { data: error });
      return handleDatabaseError(error);
    }

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    });

  } catch (error) {
    logger.error('[CMS Assets] DELETE error', { data: error });
    return handleApiError(error);
  }
}