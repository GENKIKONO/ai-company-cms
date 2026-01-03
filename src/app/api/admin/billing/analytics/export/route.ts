/**
 * Analytics CSV Export API
 * アナリティクスイベントをCSVエクスポート
 *
 * POST: CSVを生成してStorageにアップロード、署名URLを返却
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSiteAdmin, SiteAdminRequiredError } from '@/lib/billing';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// バリデーションスキーマ
const exportRequestSchema = z.object({
  user_id: z.string().uuid().optional(),
  feature_id: z.string().uuid().optional(),
  event_key: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireSiteAdmin(supabase);

    const body = await request.json();
    const validated = exportRequestSchema.parse(body);

    // イベント取得
    let query = supabase
      .from('analytics_events')
      .select(`
        id,
        user_id,
        feature_id,
        event_key,
        properties,
        created_at,
        feature:features(key, name)
      `)
      .order('created_at', { ascending: false })
      .limit(10000); // 最大1万件

    if (validated.user_id) {
      query = query.eq('user_id', validated.user_id);
    }

    if (validated.feature_id) {
      query = query.eq('feature_id', validated.feature_id);
    }

    if (validated.event_key) {
      query = query.eq('event_key', validated.event_key);
    }

    if (validated.start_date) {
      query = query.gte('created_at', validated.start_date);
    }

    if (validated.end_date) {
      query = query.lte('created_at', validated.end_date);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[admin/billing/analytics/export] query error:', { data: error });
      return NextResponse.json(
        { error: 'データの取得に失敗しました', code: error.code },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'エクスポートするデータがありません', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    // データ変換（Supabaseのリレーションは配列で返ってくるため）
    const transformedData = data.map((event) => ({
      ...event,
      feature: Array.isArray(event.feature) ? event.feature[0] || null : event.feature,
    }));

    // CSV生成
    const csvContent = generateCSV(transformedData);

    // ファイル名生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `analytics-export-${timestamp}.csv`;
    const filePath = `exports/${fileName}`;

    // Storageにアップロード
    const { error: uploadError } = await supabase.storage
      .from('admin-exports')
      .upload(filePath, csvContent, {
        contentType: 'text/csv; charset=utf-8',
        upsert: false,
      });

    if (uploadError) {
      // バケットが存在しない場合の処理
      if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
        // バケットなしの場合は直接CSVを返す
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }

      logger.error('[admin/billing/analytics/export] upload error:', { data: uploadError });
      return NextResponse.json(
        { error: 'ファイルのアップロードに失敗しました', code: 'UPLOAD_ERROR' },
        { status: 500 }
      );
    }

    // 署名URL生成（1時間有効）
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('admin-exports')
      .createSignedUrl(filePath, 3600);

    if (signError) {
      logger.error('[admin/billing/analytics/export] signedUrl error:', { data: signError });
      // 署名URL失敗時は直接ダウンロードパスを返す
      return NextResponse.json({
        success: true,
        file_name: fileName,
        file_path: filePath,
        row_count: data.length,
        message: '署名URLの生成に失敗しました。手動でダウンロードしてください。',
      });
    }

    return NextResponse.json({
      success: true,
      download_url: signedUrl.signedUrl,
      file_name: fileName,
      row_count: data.length,
      expires_in: 3600,
    });
  } catch (err) {
    if (err instanceof SiteAdminRequiredError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: err.errors },
        { status: 400 }
      );
    }
    logger.error('[admin/billing/analytics/export] unexpected error:', { data: err });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

function generateCSV(
  data: Array<{
    id: string;
    user_id: string;
    feature_id: string | null;
    event_key: string;
    properties: Record<string, unknown> | null;
    created_at: string;
    feature: { key: string; name: string } | null;
  }>
): string {
  // BOM付きUTF-8
  const BOM = '\uFEFF';

  // ヘッダー
  const headers = [
    'id',
    'user_id',
    'event_key',
    'feature_key',
    'feature_name',
    'properties',
    'created_at',
  ];

  // 行データ
  const rows = data.map((event) => [
    event.id,
    event.user_id,
    event.event_key,
    event.feature?.key || '',
    event.feature?.name || '',
    event.properties ? JSON.stringify(event.properties) : '',
    event.created_at,
  ]);

  // CSV形式に変換
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        // ダブルクォートとカンマのエスケープ
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ];

  return BOM + csvRows.join('\n');
}
