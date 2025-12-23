/**
 * Monthly Reports - Server Action API Route Template
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canUseFeature } from '@/lib/org-features';

interface RouteParams {
  params: Promise<{ period: string }>;
}

// =====================================================
// Shared: Authentication & Authorization
// =====================================================

async function getAuthorizedOrganization(supabase: Awaited<ReturnType<typeof createClient>>) {
  // 1. Get authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { organizationId: null, error: 'Unauthorized', status: 401 };
  }

  // 2. Get user's organization membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    return { organizationId: null, error: 'Organization membership not found', status: 404 };
  }

  // 3. Check feature access
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
    const supabase = await createClient();
    const { period } = await params;

    // 1. Authorization
    const { organizationId, error, status } = await getAuthorizedOrganization(supabase);
    if (!organizationId) {
      return NextResponse.json({ error }, { status });
    }

    // 2. Parse period
    const parsedPeriod = parsePeriod(period);
    if (!parsedPeriod) {
      return NextResponse.json(
        { error: 'Invalid period format. Use YYYY-MM or YYYY-MM-DD_YYYY-MM-DD' },
        { status: 400 }
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
    return NextResponse.json({
      success: true,
      message: 'Server action completed',
      organizationId,
      period: parsedPeriod,
      // Add actual response data here
    });

  } catch (error) {
    console.error('Server action failed:', error);
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
    const supabase = await createClient();
    const { period } = await params;

    // 1. Authorization
    const { organizationId, error, status } = await getAuthorizedOrganization(supabase);
    if (!organizationId) {
      return NextResponse.json({ error }, { status });
    }

    // 2. Parse period
    const parsedPeriod = parsePeriod(period);
    if (!parsedPeriod) {
      return NextResponse.json(
        { error: 'Invalid period format' },
        { status: 400 }
      );
    }

    // 3. Server-only read logic
    // TODO: Implement actual logic
    // Example: Generate signed URL for report download

    return NextResponse.json({
      success: true,
      organizationId,
      period: parsedPeriod,
      // Add signed URL or other server-generated data
    });

  } catch (error) {
    console.error('Server action GET failed:', error);
    return NextResponse.json(
      { error: 'ServerActionFailed' },
      { status: 500 }
    );
  }
}
