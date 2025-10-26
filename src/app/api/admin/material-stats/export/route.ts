import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import {
  MaterialStatsDailyPoint,
  MaterialStatsSummary,
  getDefaultDateRange,
  validateDateRange,
  calculatePopularityScore,
  generateDailyCSV,
  generateMaterialCSV,
  generateExportFileName,
  createErrorResponse,
  debugLog
} from '@/lib/material-stats';

/**
 * 管理者専用の営業資料統計CSVエクスポートAPI
 * GET /api/admin/material-stats/export?from=YYYY-MM-DD&to=YYYY-MM-DD&materialId=...&type=daily|byMaterial
 */
export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      debugLog('Admin auth failed for export', authResult.error);
      return createErrorResponse(authResult.error || 'Unauthorized', 401);
    }

    // パラメータ取得
    const url = new URL(request.url);
    const materialId = url.searchParams.get('materialId');
    const type = url.searchParams.get('type') as 'daily' | 'byMaterial' || 'daily';
    let from = url.searchParams.get('from');
    let to = url.searchParams.get('to');

    // エクスポートタイプバリデーション
    if (!['daily', 'byMaterial'].includes(type)) {
      return createErrorResponse('Invalid export type. Must be "daily" or "byMaterial"');
    }

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

    debugLog('CSV export request', { 
      type, 
      from, 
      to, 
      materialId, 
      adminEmail: authResult.context?.user.email 
    });

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

    // データ取得と処理
    let csvContent: string;
    let filename: string;

    if (type === 'daily') {
      const { csvContent: dailyCSV, filename: dailyFilename } = await generateDailyExport(
        supabase, from, to, materialId
      );
      csvContent = dailyCSV;
      filename = dailyFilename;
    } else {
      const { csvContent: materialCSV, filename: materialFilename } = await generateMaterialExport(
        supabase, from, to, materialId
      );
      csvContent = materialCSV;
      filename = materialFilename;
    }

    debugLog('CSV export generated', { 
      type, 
      filename, 
      size: csvContent.length 
    });

    // CSV ファイルとしてレスポンス
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return createErrorResponse('Export failed', 500);
  }
}

/**
 * 日別統計CSVエクスポート生成
 */
async function generateDailyExport(
  supabase: any,
  from: string,
  to: string,
  materialId?: string | null
): Promise<{ csvContent: string; filename: string }> {
  
  // データ取得
  let query = supabase
    .from('sales_materials_stats')
    .select('action, created_at')
    .gte('created_at', `${from}T00:00:00Z`)
    .lte('created_at', `${to}T23:59:59Z`);

  if (materialId) {
    query = query.eq('material_id', materialId);
  }

  const { data: statsData, error } = await query;
  
  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // 日別集計
  const dailyMap = new Map<string, { views: number; downloads: number }>();
  
  statsData?.forEach((item: any) => {
    const date = item.created_at.split('T')[0];
    const existing = dailyMap.get(date) || { views: 0, downloads: 0 };
    
    if (item.action === 'view') {
      existing.views++;
    } else if (item.action === 'download') {
      existing.downloads++;
    }
    
    dailyMap.set(date, existing);
  });

  // 期間内の全日付を生成
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

  // CSV生成
  const csvContent = generateDailyCSV(daily);
  const filename = generateExportFileName('daily', from, to);

  return { csvContent, filename };
}

/**
 * 資料別統計CSVエクスポート生成
 */
async function generateMaterialExport(
  supabase: any,
  from: string,
  to: string,
  materialId?: string | null
): Promise<{ csvContent: string; filename: string }> {
  
  // データ取得
  let query = supabase
    .from('sales_materials_stats')
    .select(`
      material_id,
      action,
      created_at,
      sales_materials!inner(
        id,
        title
      )
    `)
    .gte('created_at', `${from}T00:00:00Z`)
    .lte('created_at', `${to}T23:59:59Z`);

  if (materialId) {
    query = query.eq('material_id', materialId);
  }

  const { data: statsData, error } = await query;
  
  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // 資料別集計
  const materialMap = new Map<string, {
    materialId: string;
    title: string;
    views: number;
    downloads: number;
    lastActivityAt: string;
  }>();

  statsData?.forEach((item: any) => {
    const materialId = item.material_id;
    const existing = materialMap.get(materialId);
    
    if (existing) {
      if (item.action === 'view') existing.views++;
      if (item.action === 'download') existing.downloads++;
      
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

  // CSV生成
  const csvContent = generateMaterialCSV(byMaterial);
  const filename = generateExportFileName('byMaterial', from, to);

  return { csvContent, filename };
}