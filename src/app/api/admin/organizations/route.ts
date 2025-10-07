/**
 * 管理者用組織管理API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // 管理者認証
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // TODO: 実際の組織データ取得実装（後続タスク）
    // 現在は実装基盤のみ提供
    const emptyData = {
      organizations: [],
      total: 0,
      by_plan: {
        free: 0,
        standard: 0,
        enterprise: 0
      },
      note: 'データ取得機能は次フェーズで実装予定'
    };

    return NextResponse.json(emptyData);
  } catch (error) {
    console.error('[GET /api/admin/organizations] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}