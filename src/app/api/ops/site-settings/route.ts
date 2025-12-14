/**
 * サイト文言設定API - 管理者専用
 * 
 * 責務:
 * - サイトの文言設定を管理（hero_title、hero_subtitle、representative_message等）
 * - 管理者のみアクセス可能
 * - RLSとmanual認証の二重チェック
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 管理者チェック関数
function isAdmin(userEmail?: string): boolean {
  return userEmail?.toLowerCase().trim() === env.ADMIN_EMAIL;
}

// サイト設定のZodスキーマ
const siteSettingsSchema = z.object({
  hero_title: z.string().max(255).optional(),
  hero_subtitle: z.string().max(500).optional(),
  representative_message: z.string().max(2000).optional(),
  footer_links: z.array(z.object({
    label: z.string().max(100),
    url: z.string().url(),
    order: z.number().optional()
  })).optional(),
});

// GET - 現在のサイト設定を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { 
          code: 'UNAUTHORIZED', 
          reason: 'Authentication required for site settings access'
        },
        { status: 401 }
      );
    }

    // 管理者チェック
    if (!isAdmin(authData.user.email)) {
      return NextResponse.json(
        { 
          code: 'FORBIDDEN', 
          reason: 'Admin access required for site settings'
        },
        { status: 403 }
      );
    }

    // サイト設定を取得
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.error('Database error', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { 
          code: 'DATABASE_ERROR',
          reason: 'Failed to retrieve site settings',
          details: error.message
        },
        { status: 500 }
      );
    }

    // データがない場合はデフォルト値を返す
    const defaultSettings = {
      hero_title: 'AIO Hub AI企業CMS',
      hero_subtitle: 'AI技術を活用した企業情報の統合管理プラットフォーム',
      representative_message: '私たちは、AI技術を通じて企業の情報発信を支援し、より良いビジネス成果の実現をお手伝いします。',
      footer_links: []
    };

    return NextResponse.json({
      data: data || defaultSettings
    });

  } catch (error) {
    logger.error('[GET /api/ops/site-settings] Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { 
        code: 'INTERNAL_ERROR',
        reason: 'Site settings retrieval failed'
      },
      { status: 500 }
    );
  }
}

// POST/PUT - サイト設定を作成・更新
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { 
          code: 'UNAUTHORIZED', 
          reason: 'Authentication required for site settings update'
        },
        { status: 401 }
      );
    }

    // 管理者チェック
    if (!isAdmin(authData.user.email)) {
      return NextResponse.json(
        { 
          code: 'FORBIDDEN', 
          reason: 'Admin access required for site settings'
        },
        { status: 403 }
      );
    }

    // リクエストボディの検証
    const body = await request.json();
    let validatedData;
    
    try {
      validatedData = siteSettingsSchema.parse(body);
    } catch (error) {
      const zodError = error as z.ZodError;
      return NextResponse.json(
        { 
          code: 'VALIDATION_ERROR',
          reason: 'Invalid site settings data',
          details: zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    // 管理者コンテキストを設定（RLS用）
    await supabase.rpc('set_admin_email_context');

    // 既存のレコードがあるかチェック
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .maybeSingle();

    let result;
    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from('site_settings')
        .update(validatedData)
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      
      if (error) {
        logger.error('Database update error', { data: error instanceof Error ? error : new Error(String(error)) });
        return NextResponse.json(
          { 
            code: 'DATABASE_ERROR',
            reason: 'Failed to update site settings',
            details: error.message
          },
          { status: 500 }
        );
      }
      
      if (!data) {
        return NextResponse.json(
          { 
            code: 'NOT_FOUND',
            reason: 'Site settings record not found after update'
          },
          { status: 500 }
        );
      }
      
      result = { data, message: 'updated' };
    } else {
      // 新規作成
      const { data, error } = await supabase
        .from('site_settings')
        .insert([validatedData])
        .select()
        .maybeSingle();
      
      if (error) {
        logger.error('Database insert error', { data: error instanceof Error ? error : new Error(String(error)) });
        return NextResponse.json(
          { 
            code: 'DATABASE_ERROR',
            reason: 'Failed to create site settings',
            details: error.message
          },
          { status: 500 }
        );
      }
      
      if (!data) {
        return NextResponse.json(
          { 
            code: 'INSERT_FAILED',
            reason: 'Site settings creation failed - no data returned'
          },
          { status: 500 }
        );
      }
      
      result = { data, message: 'created' };
    }

    return NextResponse.json(result, { status: result.message === 'created' ? 201 : 200 });

  } catch (error) {
    logger.error('[POST /api/ops/site-settings] Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { 
        code: 'INTERNAL_ERROR',
        reason: 'Site settings update failed'
      },
      { status: 500 }
    );
  }
}

// PUT は POST と同じ処理
export const PUT = POST;

// DELETE - サイト設定をリセット（デフォルトに戻す）
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { 
          code: 'UNAUTHORIZED', 
          reason: 'Authentication required for site settings reset'
        },
        { status: 401 }
      );
    }

    // 管理者チェック
    if (!isAdmin(authData.user.email)) {
      return NextResponse.json(
        { 
          code: 'FORBIDDEN', 
          reason: 'Admin access required for site settings'
        },
        { status: 403 }
      );
    }

    // 管理者コンテキストを設定（RLS用）
    await supabase.rpc('set_admin_email_context');

    // 全てのサイト設定を削除
    const { error } = await supabase
      .from('site_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 全削除

    if (error) {
      logger.error('Database delete error', { data: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { 
          code: 'DATABASE_ERROR',
          reason: 'Failed to reset site settings',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Site settings reset to default'
    });

  } catch (error) {
    logger.error('[DELETE /api/ops/site-settings] Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { 
        code: 'INTERNAL_ERROR',
        reason: 'Site settings reset failed'
      },
      { status: 500 }
    );
  }
}