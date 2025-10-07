/**
 * OEM APIキー管理エンドポイント（Phase 3用スケルトン）
 * GET /api/oem/keys - APIキー一覧取得
 * POST /api/oem/keys - 新規APIキー生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';

// Phase 3で本格実装予定
export const dynamic = 'force-dynamic';

interface OEMApiKey {
  id: string;
  name: string;
  key: string;
  partnerId: string;
  partnerName: string;
  plan: 'basic' | 'professional' | 'enterprise';
  isActive: boolean;
  usageLimit: {
    monthly: number;
    current: number;
  };
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 管理者認証
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Phase 3実装予定: 実際のAPIキー取得
    const placeholderData: OEMApiKey[] = [
      {
        id: 'oem_001',
        name: 'パートナーA - 本番環境',
        key: 'lxc_' + 'a'.repeat(32),
        partnerId: 'partner_001',
        partnerName: 'パートナーA株式会社',
        plan: 'professional',
        isActive: true,
        usageLimit: {
          monthly: 100000,
          current: 45230
        },
        permissions: ['embed:read', 'organizations:read', 'analytics:read'],
        createdAt: '2025-10-01T00:00:00Z',
        lastUsed: '2025-10-08T12:30:00Z'
      }
    ];

    return NextResponse.json({
      success: true,
      data: placeholderData,
      total: placeholderData.length,
      note: 'Phase 3で実装予定 - 現在はプレースホルダーデータ'
    });

  } catch (error) {
    console.error('[GET /api/oem/keys] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 管理者認証
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, partnerId, plan, permissions } = body;

    // バリデーション
    if (!name || !partnerId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: name, partnerId, plan' },
        { status: 400 }
      );
    }

    // Phase 3実装予定: 実際のAPIキー生成
    const newKey: OEMApiKey = {
      id: `oem_${Date.now()}`,
      name,
      key: `lxc_${Math.random().toString(36).substring(2, 34)}`,
      partnerId,
      partnerName: `Partner ${partnerId}`,
      plan,
      isActive: true,
      usageLimit: {
        monthly: plan === 'basic' ? 10000 : plan === 'professional' ? 100000 : -1,
        current: 0
      },
      permissions: permissions || ['embed:read'],
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newKey,
      note: 'Phase 3で実装予定 - 現在はモックデータ'
    });

  } catch (error) {
    console.error('[POST /api/oem/keys] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// APIキー削除
export async function DELETE(request: NextRequest) {
  try {
    // 管理者認証
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { error: 'Missing key ID' },
        { status: 400 }
      );
    }

    // Phase 3実装予定: 実際のAPIキー削除
    return NextResponse.json({
      success: true,
      message: `API key ${keyId} deleted successfully`,
      note: 'Phase 3で実装予定 - 現在はモック応答'
    });

  } catch (error) {
    console.error('[DELETE /api/oem/keys] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}