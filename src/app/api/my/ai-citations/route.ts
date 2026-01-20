/**
 * P2-5: AI引用ログAPI
 * GET /api/my/ai-citations?sessionId=... または ?orgId=...&from=...&to=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, requireOrgMember, createAuthErrorResponse } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type {
  SessionCitationsResponse,
  OrgCitationsPeriodResponse,
  AICitationsApiResponse,
  VCitationAggregate,
  MVCitationOrgPeriod,
  AICitationSource,
  SessionCitationResponse,
  OrgCitationsTotals,
  PeriodInfo
} from '@/types/ai-citations';

/**
 * Supabase VIEW の生データをUIフレンドリーな形式に変換
 */
function transformCitationSource(raw: VCitationAggregate | MVCitationOrgPeriod): AICitationSource {
  return {
    sourceKey: raw.source_key,
    title: raw.title,
    url: raw.url,
    citationsCount: raw.citations_count,
    totalWeight: raw.total_weight,
    totalQuotedTokens: raw.total_quoted_tokens,
    totalQuotedChars: raw.total_quoted_chars,
    maxScore: raw.max_score,
    avgScore: raw.avg_score,
    lastCitedAt: raw.last_cited_at
  };
}

/**
 * セッション単位でresponse_idごとにグループ化
 */
function groupByResponseId(aggregates: VCitationAggregate[]): SessionCitationResponse[] {
  const grouped = new Map<string, {
    responseInfo: Omit<VCitationAggregate, 'source_key' | 'title' | 'url' | 'citations_count' | 'total_weight' | 'total_quoted_tokens' | 'total_quoted_chars' | 'max_score' | 'avg_score' | 'last_cited_at'>;
    sources: VCitationAggregate[];
  }>();

  for (const item of aggregates) {
    const responseId = item.response_id;
    
    if (!grouped.has(responseId)) {
      grouped.set(responseId, {
        responseInfo: {
          response_id: item.response_id,
          organization_id: item.organization_id,
          session_id: item.session_id,
          user_id: item.user_id,
          model: item.model,
          response_created_at: item.response_created_at
        },
        sources: []
      });
    }

    grouped.get(responseId)!.sources.push(item);
  }

  return Array.from(grouped.values()).map(({ responseInfo, sources }) => ({
    responseId: responseInfo.response_id,
    organizationId: responseInfo.organization_id,
    sessionId: responseInfo.session_id,
    userId: responseInfo.user_id,
    model: responseInfo.model,
    responseCreatedAt: responseInfo.response_created_at,
    sources: sources
      .map(transformCitationSource)
      .sort((a, b) => {
        // maxScore DESC, citationsCount DESC, lastCitedAt DESC
        if (a.maxScore !== b.maxScore) {
          if (a.maxScore === null) return 1;
          if (b.maxScore === null) return -1;
          return b.maxScore - a.maxScore;
        }
        if (a.citationsCount !== b.citationsCount) {
          return b.citationsCount - a.citationsCount;
        }
        return new Date(b.lastCitedAt).getTime() - new Date(a.lastCitedAt).getTime();
      })
  }));
}

/**
 * 組織×期間集計の合計値を計算
 */
function calculateOrgTotals(sources: AICitationSource[]): OrgCitationsTotals {
  return {
    totalCitations: sources.reduce((sum, s) => sum + s.citationsCount, 0),
    totalWeight: sources.reduce((sum, s) => sum + s.totalWeight, 0),
    totalQuotedTokens: sources.reduce((sum, s) => sum + s.totalQuotedTokens, 0),
    totalQuotedChars: sources.reduce((sum, s) => sum + s.totalQuotedChars, 0),
    uniqueSources: sources.length
  };
}

/**
 * 日付文字列のバリデーション（ISO8601形式）
 */
function isValidDateString(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}/) !== null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 認証確認
    const user = await requireAuthUser();
    
    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const orgId = searchParams.get('orgId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const supabase = await createClient();

    // パターン1: セッション単位
    if (sessionId) {
      // セッションアクセス権の簡易チェック（セッション → 組織 → メンバーシップ）
      const { data: sessionInfo, error: sessionError } = await supabase
        .from('ai_interview_sessions')
        .select('organization_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionInfo) {
        return NextResponse.json({
          success: false,
          code: 'SESSION_NOT_FOUND',
          message: 'セッションが見つかりません'
        } as AICitationsApiResponse<never>, { status: 404 });
      }

      // 組織メンバーシップ確認
      await requireOrgMember(sessionInfo.organization_id);

      // v_ai_citations_aggregatesから取得
      const { data: aggregates, error: aggregatesError } = await supabase
        .from('v_ai_citations_aggregates')
        .select('response_id, organization_id, session_id, user_id, model, response_created_at, source_key, title, url, citations_count, total_weight, total_quoted_tokens, total_quoted_chars, max_score, avg_score, last_cited_at')
        .eq('session_id', sessionId)
        .order('max_score', { ascending: false, nullsFirst: false })
        .order('citations_count', { ascending: false })
        .order('last_cited_at', { ascending: false });

      if (aggregatesError) {
        logger.error('Failed to fetch session citations', {
          error: aggregatesError.message,
          sessionId,
          userId: user.id
        });
        
        return NextResponse.json({
          success: false,
          code: 'CITATION_FETCH_ERROR',
          message: 'セッションの引用データの取得に失敗しました',
          details: aggregatesError.message
        } as AICitationsApiResponse<never>, { status: 500 });
      }

      // レスポンス構築
      const responses = groupByResponseId(aggregates || []);
      const totalSources = responses.reduce((sum, r) => sum + r.sources.length, 0);

      const response: SessionCitationsResponse = {
        sessionId,
        responses,
        totalResponses: responses.length,
        totalSources
      };

      logger.info('Session citations fetched successfully', {
        sessionId,
        userId: user.id,
        responsesCount: responses.length,
        totalSources
      });

      return NextResponse.json({
        success: true,
        data: response
      } as AICitationsApiResponse<SessionCitationsResponse>);
    }

    // パターン2: 組織×期間
    if (orgId && from && to) {
      // パラメータバリデーション
      if (!isValidDateString(from) || !isValidDateString(to)) {
        return NextResponse.json({
          success: false,
          code: 'INVALID_DATE_RANGE',
          message: 'from/toパラメータは有効なISO8601日付形式で指定してください'
        } as AICitationsApiResponse<never>, { status: 400 });
      }

      // 組織メンバーシップ確認
      await requireOrgMember(orgId);

      // mv_ai_citations_org_periodから取得
      const { data: mvData, error: mvError } = await supabase
        .from('mv_ai_citations_org_period')
        .select('organization_id, day_bucket, source_key, title, url, citations_count, total_weight, total_quoted_tokens, total_quoted_chars, max_score, avg_score, last_cited_at')
        .eq('organization_id', orgId)
        .gte('day_bucket', from)
        .lt('day_bucket', to);

      if (mvError) {
        logger.error('Failed to fetch org citations', {
          error: mvError.message,
          orgId,
          from,
          to,
          userId: user.id
        });
        
        return NextResponse.json({
          success: false,
          code: 'CITATION_FETCH_ERROR',
          message: '組織の引用データの取得に失敗しました',
          details: mvError.message
        } as AICitationsApiResponse<never>, { status: 500 });
      }

      // source_keyごとに集計（MVは日バケツ別になっているため）
      const sourceMap = new Map<string, {
        title: string | null;
        url: string | null;
        citationsCount: number;
        totalWeight: number;
        totalQuotedTokens: number;
        totalQuotedChars: number;
        maxScore: number | null;
        avgScores: number[];
        lastCitedAt: string;
      }>();

      for (const item of mvData || []) {
        const key = item.source_key;
        const existing = sourceMap.get(key);
        
        if (!existing) {
          sourceMap.set(key, {
            title: item.title,
            url: item.url,
            citationsCount: item.citations_count,
            totalWeight: item.total_weight,
            totalQuotedTokens: item.total_quoted_tokens,
            totalQuotedChars: item.total_quoted_chars,
            maxScore: item.max_score,
            avgScores: item.avg_score !== null ? [item.avg_score] : [],
            lastCitedAt: item.last_cited_at
          });
        } else {
          existing.citationsCount += item.citations_count;
          existing.totalWeight += item.total_weight;
          existing.totalQuotedTokens += item.total_quoted_tokens;
          existing.totalQuotedChars += item.total_quoted_chars;
          
          if (item.max_score !== null) {
            existing.maxScore = existing.maxScore === null ? 
              item.max_score : 
              Math.max(existing.maxScore, item.max_score);
          }
          
          if (item.avg_score !== null) {
            existing.avgScores.push(item.avg_score);
          }
          
          if (new Date(item.last_cited_at) > new Date(existing.lastCitedAt)) {
            existing.lastCitedAt = item.last_cited_at;
          }
        }
      }

      // 最終的なAICitationSourceに変換
      const sources: AICitationSource[] = Array.from(sourceMap.entries())
        .map(([sourceKey, data]) => ({
          sourceKey,
          title: data.title,
          url: data.url,
          citationsCount: data.citationsCount,
          totalWeight: data.totalWeight,
          totalQuotedTokens: data.totalQuotedTokens,
          totalQuotedChars: data.totalQuotedChars,
          maxScore: data.maxScore,
          avgScore: data.avgScores.length > 0 ?
            data.avgScores.reduce((sum, score) => sum + score, 0) / data.avgScores.length :
            null,
          lastCitedAt: data.lastCitedAt
        }))
        .sort((a, b) => {
          // maxScore DESC, citationsCount DESC, lastCitedAt DESC
          if (a.maxScore !== b.maxScore) {
            if (a.maxScore === null) return 1;
            if (b.maxScore === null) return -1;
            return b.maxScore - a.maxScore;
          }
          if (a.citationsCount !== b.citationsCount) {
            return b.citationsCount - a.citationsCount;
          }
          return new Date(b.lastCitedAt).getTime() - new Date(a.lastCitedAt).getTime();
        });

      const period: PeriodInfo = { from, to };
      const totals = calculateOrgTotals(sources);

      const response: OrgCitationsPeriodResponse = {
        organizationId: orgId,
        period,
        sources,
        totals
      };

      logger.info('Org citations fetched successfully', {
        orgId,
        from,
        to,
        userId: user.id,
        sourcesCount: sources.length,
        totalCitations: totals.totalCitations
      });

      return NextResponse.json({
        success: true,
        data: response
      } as AICitationsApiResponse<OrgCitationsPeriodResponse>);
    }

    // パラメータが不正
    return NextResponse.json({
      success: false,
      code: 'BAD_REQUEST',
      message: 'sessionId か (orgId + from + to) のいずれかを指定してください'
    } as AICitationsApiResponse<never>, { status: 400 });

  } catch (error) {
    // 認証・認可エラーの場合
    const err = error as { code?: string; message?: string };
    if (err.code === 'AUTH_REQUIRED' || err.code === 'ORG_ACCESS_DENIED') {
      return createAuthErrorResponse(error);
    }

    logger.error('AI citations API error', {
      data: error instanceof Error ? error : new Error(String(error))
    });

    return NextResponse.json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: '内部サーバーエラーが発生しました'
    } as AICitationsApiResponse<never>, { status: 500 });
  }
}