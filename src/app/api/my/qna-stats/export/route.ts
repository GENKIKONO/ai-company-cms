import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';
import { 
  createErrorResponse,
  generateQADailyCSV,
  generateQAEntriesCSV,
  generateQAExportFileName,
  validateDateRange,
  getDefaultDateRange
} from '@/lib/qna-stats';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // ユーザー認証チェック
    const user = await getUserWithClient(supabase);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    // ユーザーの所属組織を確認（organization_members経由）
    const { data: membershipData, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      logger.error('Error fetching user organization membership:', { data: membershipError });
      return createErrorResponse('Failed to fetch organization membership', 500);
    }

    if (!membershipData) {
      return createErrorResponse('Organization membership not found', 404);
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') as 'daily' | 'byQNA';
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const categoryId = url.searchParams.get('categoryId');

    // パラメータ検証
    if (!type || !['daily', 'byQNA'].includes(type)) {
      return createErrorResponse('Invalid export type. Must be "daily" or "byQNA"', 400);
    }

    // 日付範囲の設定
    const defaultRange = getDefaultDateRange();
    const dateFrom = from || defaultRange.from;
    const dateTo = to || defaultRange.to;

    const dateValidation = validateDateRange(dateFrom, dateTo);
    if (!dateValidation.valid) {
      return createErrorResponse(dateValidation.error || 'Invalid date range', 400);
    }

    // Q&A統計データを取得（同じAPIを内部使用）
    const statsParams = new URLSearchParams();
    statsParams.set('from', dateFrom);
    statsParams.set('to', dateTo);
    if (categoryId) statsParams.set('categoryId', categoryId);

    // 内部API呼び出し
    const statsUrl = new URL('/api/my/qna-stats', request.url);
    statsUrl.search = statsParams.toString();
    
    const statsRequest = new NextRequest(statsUrl, {
      headers: request.headers
    });

    // 動的にインポートして循環参照を回避
    const { GET: getMyQAStats } = await import('../route');
    const statsResponse = await getMyQAStats(statsRequest);
    
    if (!statsResponse.ok) {
      return createErrorResponse('Failed to fetch Q&A stats for export', 500);
    }

    const statsData = await statsResponse.json();

    let csvContent: string;
    let filename: string;

    if (type === 'daily') {
      // 日別統計CSV
      csvContent = generateQADailyCSV(statsData.daily || []);
      filename = generateQAExportFileName('daily', dateFrom, dateTo);
    } else {
      // Q&A別統計CSV  
      csvContent = generateQAEntriesCSV(statsData.byQNA || []);
      filename = generateQAExportFileName('byQNA', dateFrom, dateTo);
    }

    // CSVレスポンスの生成
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    logger.error('Company Q&A Stats Export API error', { data: error instanceof Error ? error : new Error(String(error)) });
    return createErrorResponse('Internal server error', 500);
  }
}