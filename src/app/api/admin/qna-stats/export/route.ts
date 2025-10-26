import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { 
  createErrorResponse,
  generateQADailyCSV,
  generateQAEntriesCSV,
  generateQAExportFileName,
  validateDateRange,
  getDefaultDateRange
} from '@/lib/qnaStats';

export async function GET(request: NextRequest) {
  try {
    // 管理者認証
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      return createErrorResponse(authResult.error || 'Unauthorized', 401);
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') as 'daily' | 'byQNA';
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const categoryId = url.searchParams.get('categoryId');
    const organizationId = url.searchParams.get('organizationId');

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
    if (organizationId) statsParams.set('organizationId', organizationId);

    // 内部API呼び出し
    const statsUrl = new URL('/api/admin/qna-stats', request.url);
    statsUrl.search = statsParams.toString();
    
    const statsRequest = new NextRequest(statsUrl, {
      headers: request.headers
    });

    // 動的にインポートして循環参照を回避
    const { GET: getQAStats } = await import('../route');
    const statsResponse = await getQAStats(statsRequest);
    
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
    console.error('Q&A Stats Export API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}