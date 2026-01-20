/**
 * Organization Diagnostic API
 * 企業ページ404問題の診断API（機微値は返さない）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { diagGuard, diagErrorResponse } from '@/lib/api/diag-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guardResult = await diagGuard(request);
  if (!guardResult.authorized) {
    return guardResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Service role client (RLSバイパス)
    const supabaseService = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // Anonymous client (RLS適用)
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // Service roleでDB存在確認（RLSバイパス）
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('organizations')
      .select('id, slug, status, is_published')
      .eq('slug', slug)
      .single();

    const exists_db = !serviceError && !!serviceData;

    // Anonymous roleでRLS通過確認
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('organizations')
      .select('id, slug, status, is_published')
      .eq('slug', slug)
      .single();

    const visible_anon = !anonError && !!anonData;

    // RLSポリシー推定（現在の実装ベース）
    const rls_policy = {
      needs_status: true,
      allowed_status: ['published', 'public_unverified']
    };

    const result = {
      ok: true,
      slug,
      exists_db,
      visible_anon,
      status: visible_anon && anonData?.status ? anonData.status : null,
      is_published: visible_anon && anonData?.is_published !== undefined ? anonData.is_published : null,
      rls_policy,
      // デバッグ情報（本番では削除可能）
      debug: {
        service_error: serviceError?.message || null,
        anon_error: anonError?.message || null,
        service_status: serviceData?.status || null,
        service_is_published: serviceData?.is_published || null
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    return diagErrorResponse(error, 'Organization diagnostic');
  }
}