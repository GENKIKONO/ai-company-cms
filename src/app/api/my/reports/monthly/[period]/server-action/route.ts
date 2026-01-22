/**
 * /api/my/reports/monthly/[period]/server-action - Server Action API Route Template
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 * @see src/lib/supabase/api-auth.ts
 *
 * このファイルは、サーバー専用処理が必要な場合のテンプレートです。
 * 例: サーバー署名、batch処理、機密データの処理
 *
 * 通常のCRUD操作はクライアントから直接 Supabase RPC を呼び出すため、
 * このAPIルートは使用しません。
 *
 * 使用例:
 * - PDF生成（サーバー側でファイル処理）
 * - 外部API連携（APIキーを隠蔽）
 * - 署名付きURL生成
 *
 * 将来の reports スキーマ移行時:
 * - このルートは変更不要（public.* が thin-wrapper として機能）
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { canUseFeature } from '@/lib/featureGate';
import { logger } from '@/lib/utils/logger';
import type { SupabaseClient, User } from '@supabase/supabase-js';

interface RouteParams {
  params: Promise<{ period: string }>;
}

// =====================================================
// Shared: Authorization
// =====================================================

async function getAuthorizedOrganization(
  supabase: SupabaseClient,
  user: User
): Promise<{ organizationId: string | null; error: string | null; status: number }> {
  // 1. Get user's organization membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    return { organizationId: null, error: 'Organization membership not found', status: 404 };
  }

  // 2. Check feature access
  const canUse = await canUseFeature(membership.organization_id, 'ai_reports');
  if (!canUse) {
    return {
      organizationId: null,
      error: 'FeatureNotAvailable',
      status: 403
    };
  }

  return { organizationId: membership.organization_id, error: null, status: 200 };
}

// =====================================================
// Shared: Period Parsing
// =====================================================

function parsePeriod(period: string): {
  periodStart: string;
  periodEnd: string;
} | null {
  // Format 1: YYYY-MM-DD_YYYY-MM-DD
  if (period.includes('_')) {
    const [start, end] = period.split('_');
    if (start && end) {
      return { periodStart: start, periodEnd: end };
    }
  }

  // Format 2: YYYY-MM
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      periodStart: `${year}-${String(month).padStart(2, '0')}-01`,
      periodEnd: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    };
  }

  return null;
}

// =====================================================
// POST: Server Action Example (Placeholder)
// =====================================================

/**
 * サーバー専用処理の例
 * - 署名付きURL生成
 * - 外部API連携
 * - バッチ処理のトリガー
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);
    const { period } = await params;

    // 1. Authorization
    const { organizationId, error, status } = await getAuthorizedOrganization(supabase, user);
    if (!organizationId) {
      return applyCookies(
        NextResponse.json({ error }, { status })
      );
    }

    // 2. Parse period
    const parsedPeriod = parsePeriod(period);
    if (!parsedPeriod) {
      return applyCookies(
        NextResponse.json(
          { error: 'Invalid period format. Use YYYY-MM or YYYY-MM-DD_YYYY-MM-DD' },
          { status: 400 }
        )
      );
    }

    // 3. Parse request body (optional)
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    // 4. Server-only processing example
    // TODO: Implement actual server-side logic here
    // Examples:
    // - Generate signed URL for file download
    // - Call external API with server-side credentials
    // - Trigger batch job with elevated permissions

    // Placeholder response
    return applyCookies(
      NextResponse.json({
        success: true,
        message: 'Server action completed',
        organizationId,
        period: parsedPeriod,
        // Add actual response data here
      })
    );

  } catch (error) {
    // ApiAuthException のハンドリング
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Server action failed:', { data: error });
    return NextResponse.json(
      {
        error: 'ServerActionFailed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET: Read-only server action (if needed)
// =====================================================

/**
 * サーバー専用の読み取り処理
 * 例: 署名付きダウンロードURL生成
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);
    const { period } = await params;

    // 1. Authorization
    const { organizationId, error, status } = await getAuthorizedOrganization(supabase, user);
    if (!organizationId) {
      return applyCookies(
        NextResponse.json({ error }, { status })
      );
    }

    // 2. Parse period
    const parsedPeriod = parsePeriod(period);
    if (!parsedPeriod) {
      return applyCookies(
        NextResponse.json(
          { error: 'Invalid period format' },
          { status: 400 }
        )
      );
    }

    // 3. Server-only read logic
    // TODO: Implement actual logic
    // Example: Generate signed URL for report download

    return applyCookies(
      NextResponse.json({
        success: true,
        organizationId,
        period: parsedPeriod,
        // Add signed URL or other server-generated data
      })
    );

  } catch (error) {
    // ApiAuthException のハンドリング
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Server action GET failed:', { data: error });
    return NextResponse.json(
      { error: 'ServerActionFailed' },
      { status: 500 }
    );
  }
}
