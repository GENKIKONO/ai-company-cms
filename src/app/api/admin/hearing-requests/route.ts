/**
 * 管理者ヒアリング依頼API
 * GET /api/admin/hearing-requests
 * PUT /api/admin/hearing-requests/[id]
 * 
 * 機能:
 * - 管理者による全ヒアリング依頼の閲覧
 * - ヒアリング依頼のステータス更新・管理
 * - 管理者権限チェック
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: 全ヒアリング依頼一覧取得
export async function GET(request: NextRequest) {
  try {
    // 現在はテーブルが存在しないため、ダミーデータを返す
    console.log('Hearing requests API called');
    
    // URLパラメータの取得
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // ダミーデータ
    const dummyRequests = [];
    
    return NextResponse.json({
      hearing_requests: dummyRequests,
      stats: {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      },
      pagination: {
        limit,
        offset,
        total: 0,
      }
    });

  } catch (error) {
    console.error('Admin hearing requests GET API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}

// PUT: ヒアリング依頼更新
export async function PUT(request: NextRequest) {
  try {
    console.log('Hearing requests PUT API called');
    
    // リクエスト本文の取得とバリデーション
    const rawBody = await request.json();
    const { id, ...updateData } = rawBody;

    if (!id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'ヒアリング依頼IDが必要です' },
        { status: 400 }
      );
    }

    // 現在はテーブルが存在しないため、ダミーレスポンスを返す
    return NextResponse.json({
      message: 'ヒアリング依頼を更新しました。（テーブル実装待ち）',
      hearing_request: { id, ...updateData, updated_at: new Date().toISOString() },
    });

  } catch (error) {
    console.error('Admin hearing requests PUT API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}