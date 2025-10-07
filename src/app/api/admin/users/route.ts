/**
 * 管理者用ユーザー管理API
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

    // TODO: 実際のユーザーデータ取得実装（後続タスク）
    // 現在は実装基盤のみ提供
    const emptyData = {
      users: [],
      total: 0,
      active: 0,
      suspended: 0,
      note: 'データ取得機能は次フェーズで実装予定'
    };

    return NextResponse.json(emptyData);
  } catch (error) {
    console.error('[GET /api/admin/users] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}