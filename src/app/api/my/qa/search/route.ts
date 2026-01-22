/**
 * /api/my/qa/search - QAエントリ検索
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(req);

    // ユーザーの企業IDを取得（単一組織モード）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single();

    if (orgError || !organization) {
      return applyCookies(NextResponse.json({ error: 'User organization not found' }, { status: 400 }));
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const category_id = searchParams.get('category_id');
    const status = searchParams.get('status') || 'published';

    if (!query || query.trim().length === 0) {
      return applyCookies(NextResponse.json({
        data: [],
        message: 'Search query is required'
      }));
    }

    let searchQuery = supabase
      .from('qa_entries')
      .select(`
        id,
        question,
        answer,
        tags,
        status,
        published_at,
        qa_categories!left(id, name, slug)
      `)
      .eq('organization_id', organization.id)
      .eq('status', status)
      .textSearch('search_vector', query.trim());

    if (category_id) {
      searchQuery = searchQuery.eq('category_id', category_id);
    }

    const { data: entries, error } = await searchQuery
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error searching entries', { data: error instanceof Error ? error : new Error(String(error)) });
      return applyCookies(NextResponse.json({ error: 'Search failed' }, { status: 500 }));
    }

    // Add search relevance highlighting (simple implementation)
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const processedEntries = entries?.map(entry => {
      let questionHighlight = entry.question;
      let answerHighlight = entry.answer;

      searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        questionHighlight = questionHighlight.replace(regex, '<mark>$1</mark>');
        answerHighlight = answerHighlight.replace(regex, '<mark>$1</mark>');
      });

      return {
        ...entry,
        question_highlight: questionHighlight,
        answer_highlight: answerHighlight
      };
    }) || [];

    return applyCookies(NextResponse.json({
      data: processedEntries,
      query: query.trim(),
      total: processedEntries.length
    }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
