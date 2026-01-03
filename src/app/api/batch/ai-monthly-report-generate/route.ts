import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AiReportGenerator, getPreviousMonthPeriod } from '@/lib/ai-reports/generator';
import { logger } from '@/lib/utils/logger';

// 単一組織のレポート生成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, period_start, period_end } = body;

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    const generator = new AiReportGenerator();
    const period = period_start && period_end 
      ? { start: period_start, end: period_end }
      : getPreviousMonthPeriod();

    const report = await generator.generateReport(organization_id, period);

    return NextResponse.json({
      success: true,
      report: {
        organization_id: report.organization_id,
        plan_id: report.plan_id,
        level: report.level,
        period_start: report.period_start,
        period_end: report.period_end,
        status: 'ready',
      }
    });

  } catch (error) {
    logger.error('AI Monthly Report generation failed:', { data: error });

    return NextResponse.json(
      { 
        error: 'Report generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 全組織のレポート生成（cron用）
export async function PUT(request: NextRequest) {
  try {
    // TODO: cron認証の実装（APIキーまたはサービスロール認証）
    const supabase = await createClient();
    
    // アクティブな組織一覧を取得
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, plan')
      .neq('plan', null);

    if (!organizations) {
      return NextResponse.json({
        success: true,
        message: 'No organizations found',
        processed: 0
      });
    }

    const generator = new AiReportGenerator();
    const period = getPreviousMonthPeriod();
    
    const results = {
      total: organizations.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 各組織のレポート生成
    for (const org of organizations) {
      try {
        await generator.generateReport(org.id, period);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `${org.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        logger.error(`Failed to generate report for org ${org.id}:`, { data: error });
      }
    }

    return NextResponse.json({
      success: true,
      period: period,
      results: results,
    });

  } catch (error) {
    logger.error('Batch AI Monthly Report generation failed:', { data: error });

    return NextResponse.json(
      { 
        error: 'Batch generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ヘルスチェック用
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Monthly Report Batch API',
    endpoints: {
      'POST /': 'Generate report for single organization',
      'PUT /': 'Generate reports for all organizations (cron)',
      'GET /': 'Health check'
    }
  });
}