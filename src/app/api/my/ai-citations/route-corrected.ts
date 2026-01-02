/**
 * AI Citations API - DB準拠版
 * v_ai_citations_aggregates / mv_ai_citations_org_period 直接参照
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, requireOrgMember, createAuthErrorResponse } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import {
  SessionCitationsResponse,
  OrgCitationsPeriodResponse,
  AICitationsApiResponse,
  VCitationAggregate,
  MVCitationOrgPeriod,
  AICitationSource,
  SessionCitationResponse,
  OrgCitationsTotals,
  PeriodInfo,
  SessionCitationsQuerySchema,
  OrgCitationsQuerySchema,
  formatBigIntString,
  parseBigIntString
} from '@/types/ai-citations-corrected';

/**
 * VIEW生データをUIフレンドリーな形式に変換 (bigint対応)
 */
function transformCitationSource(raw: VCitationAggregate | MVCitationOrgPeriod): AICitationSource {
  return {
    sourceKey: raw.source_key,
    title: raw.title,
    url: raw.url,
    citationsCount: raw.citations_count, // すでにstring
    totalWeight: raw.total_weight,       // すでにstring
    totalQuotedTokens: raw.total_quoted_tokens, // すでにstring
    totalQuotedChars: raw.total_quoted_chars,   // すでにstring
    maxScore: raw.max_score,             // すでにstring
    avgScore: raw.avg_score,             // すでにstring
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
          model: item.model, // model_name AS model (DB互換)
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
        // max_score DESC, citations_count DESC, last_cited_at DESC (string比較)
        const aMaxScore = a.maxScore ? parseBigIntString(a.maxScore) : 0;
        const bMaxScore = b.maxScore ? parseBigIntString(b.maxScore) : 0;
        if (aMaxScore !== bMaxScore) {
          return bMaxScore - aMaxScore;
        }
        
        const aCitations = parseBigIntString(a.citationsCount);
        const bCitations = parseBigIntString(b.citationsCount);
        if (aCitations !== bCitations) {
          return bCitations - aCitations;
        }
        
        return new Date(b.lastCitedAt).getTime() - new Date(a.lastCitedAt).getTime();
      })
  }));
}

/**
 * 組織×期間集計の合計値を計算 (string bigint対応)
 */
function calculateOrgTotals(sources: AICitationSource[]): OrgCitationsTotals {
  const totalCitations = sources.reduce((sum, s) => sum + parseBigIntString(s.citationsCount), 0);
  const totalWeight = sources.reduce((sum, s) => sum + parseBigIntString(s.totalWeight), 0);
  const totalQuotedTokens = sources.reduce((sum, s) => sum + parseBigIntString(s.totalQuotedTokens), 0);
  const totalQuotedChars = sources.reduce((sum, s) => sum + parseBigIntString(s.totalQuotedChars), 0);
  
  return {
    totalCitations: totalCitations.toString(),
    totalWeight: totalWeight.toString(), 
    totalQuotedTokens: totalQuotedTokens.toString(),
    totalQuotedChars: totalQuotedChars.toString(),
    uniqueSources: sources.length
  };
}

/**
 * 日付文字列のバリデーション（YYYY-MM-DD形式）
 */
function isValidDateString(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
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

    // パターン1: セッション単位 (?sessionId=...)
    if (sessionId) {
      // パラメータバリデーション
      const queryResult = SessionCitationsQuerySchema.safeParse({ sessionId });
      if (!queryResult.success) {
        return NextResponse.json({
          success: false,
          code: 'INVALID_PARAMS',
          message: 'Invalid sessionId parameter',
          details: queryResult.error.message
        } as AICitationsApiResponse<never>, { status: 400 });
      }

      // セッションアクセス権の簡易チェック（セッション → 組織 → メンバーシップ）
      const { data: sessionInfo, error: sessionError } = await supabase
        .from('ai_interview_sessions')
        .select('organization_id')
        .eq('id', sessionId)
        .maybeSingle(); // .single() 禁止

      if (sessionError) {
        logger.error('Session lookup failed', {
          sessionId,
          error: sessionError.message,
          userId: user.id
        });
        
        return NextResponse.json({
          success: false,
          code: 'SESSION_LOOKUP_ERROR',
          message: 'セッション情報の取得に失敗しました',
          details: sessionError.message
        } as AICitationsApiResponse<never>, { status: 500 });
      }

      if (!sessionInfo) {
        return NextResponse.json({
          success: false,
          code: 'SESSION_NOT_FOUND',
          message: 'セッションが見つかりません'
        } as AICitationsApiResponse<never>, { status: 404 });
      }

      // 組織メンバーシップ確認
      await requireOrgMember(sessionInfo.organization_id);

      // v_ai_citations_aggregatesから取得 (RLS適用)
      const { data: aggregates, error: aggregatesError } = await supabase
        .from('v_ai_citations_aggregates')
        .select('response_id, organization_id, session_id, user_id, model, response_created_at, source_key, title, url, citations_count, total_weight, total_quoted_tokens, total_quoted_chars, max_score, avg_score, last_cited_at')
        .eq('session_id', sessionId)
        .order('response_created_at', { ascending: false });

      if (aggregatesError) {
        logger.error('Failed to fetch session citations from view', {
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

    // パターン2: 組織×期間 (?orgId=...&from=YYYY-MM-DD&to=YYYY-MM-DD)
    if (orgId && from && to) {
      // パラメータバリデーション
      const queryResult = OrgCitationsQuerySchema.safeParse({ orgId, from, to });
      if (!queryResult.success) {
        return NextResponse.json({
          success: false,
          code: 'INVALID_PARAMS',
          message: 'Invalid parameters for organization period query',
          details: queryResult.error.message
        } as AICitationsApiResponse<never>, { status: 400 });
      }

      // 90日制限チェック
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 90) {
        return NextResponse.json({
          success: false,
          code: 'PERIOD_TOO_LONG',
          message: '期間は90日以内で指定してください'
        } as AICitationsApiResponse<never>, { status: 400 });
      }

      // 組織メンバーシップ確認
      await requireOrgMember(orgId);

      // mv_ai_citations_org_periodから取得 (RLS適用)
      const { data: mvData, error: mvError } = await supabase
        .from('mv_ai_citations_org_period')
        .select('organization_id, day_bucket, source_key, title, url, citations_count, total_weight, total_quoted_tokens, total_quoted_chars, max_score, avg_score, last_cited_at')
        .eq('organization_id', orgId)
        .gte('day_bucket', from)
        .lte('day_bucket', to)
        .order('day_bucket', { ascending: false })
        .order('citations_count', { ascending: false });

      if (mvError) {
        logger.error('Failed to fetch org citations from materialized view', {
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
        maxScore: number;
        avgScores: number[];
        lastCitedAt: string;
      }>();

      for (const item of mvData || []) {
        const key = item.source_key;
        const existing = sourceMap.get(key);
        
        const citationsCount = parseBigIntString(item.citations_count);
        const totalWeight = parseBigIntString(item.total_weight);
        const totalQuotedTokens = parseBigIntString(item.total_quoted_tokens);
        const totalQuotedChars = parseBigIntString(item.total_quoted_chars);
        const maxScore = parseBigIntString(item.max_score);
        const avgScore = parseBigIntString(item.avg_score);
        
        if (!existing) {
          sourceMap.set(key, {
            title: item.title,
            url: item.url,
            citationsCount,
            totalWeight,
            totalQuotedTokens,
            totalQuotedChars,
            maxScore,
            avgScores: avgScore > 0 ? [avgScore] : [],
            lastCitedAt: item.last_cited_at
          });
        } else {
          existing.citationsCount += citationsCount;
          existing.totalWeight += totalWeight;
          existing.totalQuotedTokens += totalQuotedTokens;
          existing.totalQuotedChars += totalQuotedChars;
          existing.maxScore = Math.max(existing.maxScore, maxScore);
          
          if (avgScore > 0) {
            existing.avgScores.push(avgScore);
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
          citationsCount: data.citationsCount.toString(),
          totalWeight: data.totalWeight.toString(),
          totalQuotedTokens: data.totalQuotedTokens.toString(),
          totalQuotedChars: data.totalQuotedChars.toString(),
          maxScore: data.maxScore > 0 ? data.maxScore.toString() : null,
          avgScore: data.avgScores.length > 0 ?
            (data.avgScores.reduce((sum, score) => sum + score, 0) / data.avgScores.length).toString() :
            null,
          lastCitedAt: data.lastCitedAt
        }))
        .sort((a, b) => {
          // maxScore DESC, citationsCount DESC, lastCitedAt DESC
          const aMaxScore = parseBigIntString(a.maxScore);
          const bMaxScore = parseBigIntString(b.maxScore);
          if (aMaxScore !== bMaxScore) {
            return bMaxScore - aMaxScore;
          }
          
          const aCitations = parseBigIntString(a.citationsCount);
          const bCitations = parseBigIntString(b.citationsCount);
          if (aCitations !== bCitations) {
            return bCitations - aCitations;
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
        totalCitations: totals.totalCitations,
        mvLatency: '1h max (SLA)'
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

  } catch (error: any) {
    // 認証・認可エラーの場合
    if (error.code === 'AUTH_REQUIRED' || error.code === 'ORG_ACCESS_DENIED') {
      return createAuthErrorResponse(error);
    }

    logger.error('AI citations API error', {
      error: error.message,
      stack: error.stack,
      url: request.url
    });

    return NextResponse.json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: '内部サーバーエラーが発生しました',
      details: error.message
    } as AICitationsApiResponse<never>, { status: 500 });
  }
}