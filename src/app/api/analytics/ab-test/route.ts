/**
 * A/Bテスト分析API (K2)
 * A/Bテストの割り当て・コンバージョンデータ収集
 */

import { NextRequest, NextResponse } from 'next/server';

interface ABTestEvent {
  event: 'ab_test_assignment' | 'ab_test_conversion';
  data: {
    testId: string;
    variantId: string;
    userId?: string;
    sessionId?: string;
    timestamp: string;
    conversionType?: string;
    value?: number;
    attributes?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const eventData: ABTestEvent = await request.json();

    // データ検証
    if (!eventData.event || !eventData.data) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    const { event, data } = eventData;

    // 必須フィールドの検証
    if (!data.testId || !data.variantId || !data.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 環境情報の取得
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';

    // イベントログ出力（本番環境では構造化ログに送信）
    const logData = {
      event,
      testId: data.testId,
      variantId: data.variantId,
      userId: data.userId,
      sessionId: data.sessionId,
      timestamp: data.timestamp,
      userAgent,
      referer,
      ...(event === 'ab_test_conversion' && {
        conversionType: data.conversionType,
        value: data.value
      }),
      ...(data.attributes && { attributes: data.attributes }),
      ...(data.metadata && { metadata: data.metadata })
    };

    if (event === 'ab_test_assignment') {
      console.info('A/B Test Assignment:', logData);
    } else if (event === 'ab_test_conversion') {
      console.info('A/B Test Conversion:', logData);
    }

    // 分析データの保存（実際の実装では外部ストレージに保存）
    await saveABTestEvent(logData);

    // Slack通知（重要なコンバージョン時）
    if (event === 'ab_test_conversion' && data.value && data.value > 1000) {
      await notifyHighValueConversion(data);
    }

    return NextResponse.json({
      success: true,
      message: 'Event recorded',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('A/B Test API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process A/B test event'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // A/Bテスト統計の取得（認証必要）
    let user;
    try {
      const { getCurrentUser } = await import('@/lib/auth');
      user = await getCurrentUser();
    } catch {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const period = searchParams.get('period') || '7d';

    // A/Bテスト統計データの生成（実際の実装では外部ストレージから取得）
    const stats = generateABTestStats(testId, period);

    return NextResponse.json({
      data: stats,
      testId,
      period,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('A/B Test stats API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch A/B test stats'
      },
      { status: 500 }
    );
  }
}

/**
 * A/Bテストイベントの保存
 */
async function saveABTestEvent(eventData: any): Promise<void> {
  // 実際の実装ではデータベースや分析プラットフォームに保存
  // 現在は簡易的なログ出力のみ
  
  try {
    // 将来的にはSupabaseやBigQueryなどに保存
    console.log('A/B Test Event Saved:', {
      timestamp: new Date().toISOString(),
      ...eventData
    });
  } catch (error) {
    console.error('Failed to save A/B test event:', error);
  }
}

/**
 * 高額コンバージョンのSlack通知
 */
async function notifyHighValueConversion(data: {
  testId: string;
  variantId: string;
  conversionType?: string;
  value?: number;
  userId?: string;
}): Promise<void> {
  try {
    const { slackNotifier } = await import('@/lib/utils/slack-notifier');
    
    await slackNotifier.notifyBusinessEvent({
      type: 'payment_success',
      title: 'High Value A/B Test Conversion',
      description: `Test: ${data.testId}, Variant: ${data.variantId}, Value: ¥${data.value}`,
      userId: data.userId,
      amount: data.value,
      currency: 'JPY'
    });
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}

/**
 * A/Bテスト統計データ生成（モック）
 */
function generateABTestStats(testId?: string | null, period = '7d') {
  // 実際の実装では外部ストレージから統計データを取得
  
  const tests = [
    {
      id: 'hero_cta_text',
      name: 'Hero CTA Text Test',
      status: 'running',
      variants: [
        {
          id: 'control',
          name: 'Control: "今すぐ始める"',
          assignments: 1250 + Math.floor(Math.random() * 100),
          conversions: 87 + Math.floor(Math.random() * 10),
          conversionRate: 0.0696,
          revenue: 45000 + Math.floor(Math.random() * 5000)
        },
        {
          id: 'variant_a',
          name: 'Variant A: "無料で体験"',
          assignments: 1240 + Math.floor(Math.random() * 100),
          conversions: 103 + Math.floor(Math.random() * 10),
          conversionRate: 0.0831,
          revenue: 52000 + Math.floor(Math.random() * 5000)
        }
      ],
      significance: 0.85,
      confidenceInterval: { lower: -0.01, upper: 0.03 },
      startDate: '2025-01-20',
      endDate: null
    }
  ];

  if (testId) {
    const test = tests.find(t => t.id === testId);
    return test || null;
  }

  return {
    activeTests: tests.length,
    totalAssignments: tests.reduce((sum, test) => 
      sum + test.variants.reduce((vSum, variant) => vSum + variant.assignments, 0), 0
    ),
    totalConversions: tests.reduce((sum, test) => 
      sum + test.variants.reduce((vSum, variant) => vSum + variant.conversions, 0), 0
    ),
    tests: tests
  };
}