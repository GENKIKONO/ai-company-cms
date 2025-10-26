import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import {
  MaterialStatsResponse,
  MaterialStatsTotals,
  MaterialStatsDailyPoint,
  MaterialStatsSummary,
  MaterialStatsTopMaterial,
  UserAgentSummary,
  getDefaultDateRange,
  normalizeUserAgent,
  validateDateRange,
  calculatePopularityScore,
  createErrorResponse,
  createSuccessResponse,
  debugLog
} from '@/lib/material-stats';

/**
 * 管理者専用の営業資料統計取得API
 * GET /api/admin/material-stats?from=YYYY-MM-DD&to=YYYY-MM-DD&materialId=...
 */
export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      debugLog('Admin auth failed', authResult.error);
      return createErrorResponse(authResult.error || 'Unauthorized', 401);
    }

    // パラメータ取得
    const url = new URL(request.url);
    const materialId = url.searchParams.get('materialId');
    let from = url.searchParams.get('from');
    let to = url.searchParams.get('to');

    // デフォルト期間設定（直近30日）
    if (!from || !to) {
      const defaultRange = getDefaultDateRange();
      from = from || defaultRange.from;
      to = to || defaultRange.to;
    }

    // 日付バリデーション
    const dateValidation = validateDateRange(from, to);
    if (!dateValidation.valid) {
      return createErrorResponse(dateValidation.error || 'Invalid date range');
    }

    debugLog('Stats request', { from, to, materialId, adminEmail: authResult.context?.user.email });

    // Service Role でデータベースアクセス
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 基本クエリ構築
    let query = supabase
      .from('sales_materials_stats')
      .select(`
        id,
        material_id,
        action,
        user_agent,
        created_at,
        sales_materials!inner(
          id,
          title
        )
      `)
      .gte('created_at', `${from}T00:00:00Z`)
      .lte('created_at', `${to}T23:59:59Z`)
      .order('created_at', { ascending: false });

    // 特定の資料でフィルタ
    if (materialId) {
      query = query.eq('material_id', materialId);
    }

    const { data: statsData, error: statsError } = await query;

    if (statsError) {
      console.error('Stats query error:', statsError);
      return createErrorResponse('Failed to fetch statistics', 500);
    }

    debugLog('Raw stats data count', statsData?.length || 0);

    // データ集計処理
    const response = await processStatsData(statsData || [], from, to);

    debugLog('Processed response', {
      totals: response.totals,
      dailyCount: response.daily.length,
      materialCount: response.byMaterial.length
    });

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Material stats API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * 統計データを集計・匿名化して返却形式に変換
 */
async function processStatsData(
  rawData: any[],
  from: string,
  to: string
): Promise<MaterialStatsResponse> {
  
  // 1. 総計算出
  const totals: MaterialStatsTotals = {
    views: rawData.filter(item => item.action === 'view').length,
    downloads: rawData.filter(item => item.action === 'download').length
  };

  // 2. 日別集計
  const dailyMap = new Map<string, { views: number; downloads: number }>();
  
  rawData.forEach(item => {
    const date = item.created_at.split('T')[0]; // YYYY-MM-DD
    const existing = dailyMap.get(date) || { views: 0, downloads: 0 };
    
    if (item.action === 'view') {
      existing.views++;
    } else if (item.action === 'download') {
      existing.downloads++;
    }
    
    dailyMap.set(date, existing);
  });

  // 期間内の全日付を生成（データがない日も0で埋める）
  const daily: MaterialStatsDailyPoint[] = [];
  const startDate = new Date(from);
  const endDate = new Date(to);
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = dailyMap.get(dateStr) || { views: 0, downloads: 0 };
    
    daily.push({
      date: dateStr,
      views: dayData.views,
      downloads: dayData.downloads
    });
  }

  // 3. 資料別集計
  const materialMap = new Map<string, {
    materialId: string;
    title: string;
    views: number;
    downloads: number;
    lastActivityAt: string;
  }>();

  rawData.forEach(item => {
    const materialId = item.material_id;
    const existing = materialMap.get(materialId);
    
    if (existing) {
      if (item.action === 'view') existing.views++;
      if (item.action === 'download') existing.downloads++;
      
      // より新しい日時で更新
      if (item.created_at > existing.lastActivityAt) {
        existing.lastActivityAt = item.created_at;
      }
    } else {
      materialMap.set(materialId, {
        materialId,
        title: item.sales_materials.title,
        views: item.action === 'view' ? 1 : 0,
        downloads: item.action === 'download' ? 1 : 0,
        lastActivityAt: item.created_at
      });
    }
  });

  const byMaterial: MaterialStatsSummary[] = Array.from(materialMap.values())
    .sort((a, b) => calculatePopularityScore(b.views, b.downloads) - calculatePopularityScore(a.views, a.downloads));

  // 4. 人気資料TOP5
  const topMaterials: MaterialStatsTopMaterial[] = byMaterial
    .slice(0, 5)
    .map(item => ({
      materialId: item.materialId,
      title: item.title,
      score: calculatePopularityScore(item.views, item.downloads),
      views: item.views,
      downloads: item.downloads
    }));

  // 5. User-Agent集計（匿名化）
  const userAgents: UserAgentSummary = {
    Chrome: 0,
    Safari: 0,
    Firefox: 0,
    Edge: 0,
    Other: 0
  };

  rawData.forEach(item => {
    if (item.user_agent) {
      const browser = normalizeUserAgent(item.user_agent);
      userAgents[browser]++;
    }
  });

  return {
    totals,
    daily,
    byMaterial,
    topMaterials,
    userAgents,
    period: { from, to }
  };
}