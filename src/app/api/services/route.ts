// サービス作成API
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  summary: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional().nullable(),
  duration_months: z.number().optional().nullable(),
  category: z.string().optional().nullable(),
  slug: z.string().optional(), // スラッグは任意（自動生成される）
  is_published: z.boolean().optional()
});

// サービス名からスラッグを生成するユーティリティ
function generateServiceSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) + '-' + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ユーザー認証（Core経由）
    const user = await getUserWithClient(supabase);
    if (!user) {
      return NextResponse.json({
        error: '認証が必要です'
      }, { status: 401 });
    }

    // 組織情報取得
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json({
        error: '企業情報が見つかりません',
        code: 'ORG_NOT_FOUND'
      }, { status: 404 });
    }

    // リクエストボディ解析とバリデーション
    const body = await request.json();
    
    // 数値フィールドの変換
    const normalizedBody = {
      ...body,
      price: body.price ? parseInt(body.price, 10) : null,
      duration_months: body.duration_months ? parseInt(body.duration_months, 10) : null
    };
    
    const validatedData = createServiceSchema.parse(normalizedBody);
    
    logger.debug('[services POST] Service data validated', {
      userId: user.id,
      orgId: orgData.id,
      name: validatedData.name,
      slug: validatedData.slug
    });

    // スラッグの生成または検証
    const slug = validatedData.slug && validatedData.slug.trim() 
      ? validatedData.slug.trim()
      : generateServiceSlug(validatedData.name);

    // スラッグの重複チェック
    const { data: existingService, error: slugCheckError } = await supabase
      .from('services')
      .select('id')
      .eq('organization_id', orgData.id)
      .eq('slug', slug)
      .maybeSingle();

    if (slugCheckError) {
      logger.error('[services POST] Failed to check slug uniqueness', {
        userId: user.id,
        orgId: orgData.id,
        slug: slug,
        error: slugCheckError,
        code: slugCheckError.code,
        details: slugCheckError.details
      });
      return NextResponse.json({ 
        error: 'スラッグの重複チェックに失敗しました',
        code: slugCheckError.code
      }, { status: 500 });
    }

    if (existingService) {
      logger.warn('[services POST] Duplicate slug detected', {
        userId: user.id,
        orgId: orgData.id,
        slug: slug,
        existingServiceId: existingService.id
      });
      return NextResponse.json({ 
        error: 'このスラッグは既に使用されています',
        code: 'DUPLICATE_SLUG'
      }, { status: 400 });
    }

    // データベース挿入
    try {
      const payload = {
        organization_id: orgData.id,
        name: validatedData.name,
        summary: validatedData.summary || null,
        description: validatedData.description || null,
        price: validatedData.price,
        duration_months: validatedData.duration_months,
        category: validatedData.category,
        slug: slug,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('services')
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        logger.error('[services POST] Failed to create service', {
          userId: user.id,
          orgId: orgData.id,
          serviceData: { ...payload, description: '[内容省略]' },
          error: error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message
        });

        // Postgres error 42P01 = relation does not exist
        if (error.code === '42P01') {
          return NextResponse.json({
            error: 'servicesテーブルが存在しません',
            code: error.code
          }, { status: 500 });
        }

        // Postgres error 23502 = not null violation
        if (error.code === '23502') {
          return NextResponse.json({
            error: '必須フィールドが不足しています',
            code: error.code,
            details: error.details
          }, { status: 400 });
        }

        // その他のデータベースエラー
        return NextResponse.json({
          error: 'サービスの作成に失敗しました',
          code: error.code,
          details: error.details,
          hint: error.hint
        }, { status: 500 });
      }

      logger.info('[services POST] Service created successfully', {
        userId: user.id,
        orgId: orgData.id,
        serviceId: data.id,
        name: data.name,
        slug: data.slug
      });

      return NextResponse.json({
        ok: true,
        data,
        message: 'サービスを作成しました'
      }, { status: 201 });

    } catch (dbError) {
      logger.error('[services POST] Database error', {
        userId: user.id,
        orgId: orgData.id,
        error: dbError instanceof Error ? dbError : new Error(String(dbError))
      });
      return NextResponse.json({
        error: 'データベースエラーが発生しました'
      }, { status: 500 });
    }

  } catch (error) {
    // Zod バリデーションエラー
    if (error instanceof z.ZodError) {
      logger.warn('[services POST] Validation error', {
        issues: error.issues
      });
      return NextResponse.json({
        error: '入力データが無効です',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 });
    }

    logger.error('[services POST] Unexpected error', { 
      data: error instanceof Error ? error : new Error(String(error)) 
    });
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラーが発生しました'
    }, { status: 500 });
  }
}