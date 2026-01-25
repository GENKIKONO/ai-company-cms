/**
 * 公開Entry Blocks一覧API
 * Public Truth: v_entry_blocks_public VIEWをSoTとする
 * VIEWは公開条件（is_published=true, deleted_at IS NULL）を既に含む
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// 公開レスポンス用の型（allowlist）
interface PublicEntryBlock {
  id: string;
  entry_type: string;
  entry_id: string;
  block_type: string;
  sort_order: number;
  lang: string | null;
  title: string | null;
  summary: string | null;
  content: string | null;
  meta: Record<string, unknown> | null;
  published_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entryType = searchParams.get('entry_type');
    const entryId = searchParams.get('entry_id');
    const lang = searchParams.get('lang');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // 必須パラメータチェック
    if (!entryType || !entryId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'entry_type and entry_id are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // v_entry_blocks_public から取得（Public Truth）
    // VIEWは既に公開条件をフィルタしているので追加条件不要
    let query = supabase
      .from('v_entry_blocks_public')
      .select(`
        id,
        entry_type,
        entry_id,
        block_type,
        sort_order,
        lang,
        title,
        summary,
        content,
        meta,
        published_at
      `, { count: 'exact' })
      .eq('entry_type', entryType)
      .eq('entry_id', entryId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true }); // 安定順序

    // 言語フィルタ（オプション）
    if (lang) {
      query = query.eq('lang', lang);
    }

    // 件数制限
    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data: blocks, error, count } = await query;

    if (error) {
      logger.error('Public Entry Blocks API error', {
        data: error instanceof Error ? error : new Error(String(error)),
        entryType,
        entryId
      });
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // レスポンス正規化（allowlist適用）
    const normalizedBlocks: PublicEntryBlock[] = (blocks || []).map(block => ({
      id: block.id || '',
      entry_type: block.entry_type || '',
      entry_id: block.entry_id || '',
      block_type: block.block_type || '',
      sort_order: block.sort_order ?? 0,
      lang: block.lang,
      title: block.title,
      summary: block.summary,
      content: block.content,
      meta: block.meta as Record<string, unknown> | null,
      published_at: block.published_at
    }));

    return NextResponse.json(
      {
        blocks: normalizedBlocks,
        total: count || 0
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300', // 5分キャッシュ
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );

  } catch (error) {
    logger.error('Public Entry Blocks API failed', {
      data: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
