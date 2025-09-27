import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// メモリ内エラーログストア（本番では外部ストレージ推奨）
const errorLogs: any[] = [];
const MAX_LOGS = 50; // 最大50件保持

// UI component state tracking
const componentRegistry = {
  'LoadingSkeleton': {
    variants: ['default', 'card', 'list', 'table', 'grid', 'hero', 'form'],
    features: ['shimmer-animation', 'multiple-lines', 'customizable-classes'],
    status: 'active'
  },
  'OptimizedImage': {
    variants: ['LogoImage', 'CoverImage', 'AvatarImage'],
    features: ['next/image-optimized', 'fallback-handling', 'loading-states', 'blur-placeholder'],
    status: 'active'
  },
  'Toast': {
    variants: ['success', 'error', 'warning', 'info'],
    features: ['context-provider', 'auto-dismiss', 'stacking', 'convenience-hooks'],
    status: 'active'
  },
  'TabbedDashboard': {
    variants: ['overview', 'posts', 'services', 'case-studies', 'faqs'],
    features: ['content-stats', 'quick-actions', 'empty-states', 'preview-links'],
    status: 'active'
  },
  'JsonLdModal': {
    variants: ['single-schema', 'multiple-schemas'],
    features: ['schema-validation', 'copy-to-clipboard', 'syntax-highlighting'],
    status: 'active'
  },
  'ErrorDisplay': {
    variants: ['default', 'compact'],
    features: ['unified-error-ui', 'api-integration'],
    status: 'active'
  },
  'OrganizationPreview': {
    variants: ['dashboard-overview'],
    features: ['public-page-links', 'json-ld-modal-integration'],
    status: 'active'
  }
};

export async function GET() {
  try {
    const diagnosis = {
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      deployId: process.env.VERCEL_DEPLOYMENT_ID || null,
      timestamp: new Date().toISOString(),
      flags: {
        layoutHasSafeHeader: true,
        toastProviderActive: true,
        optimizedImagesEnabled: true,
        skeletonLoadingEnabled: true,
        tabbedDashboardEnabled: true,
        jsonLdModalEnabled: true,
        previewFunctionalityEnabled: true
      },
      components: componentRegistry,
      uiFeatures: {
        navigationUnified: true,
        dashboardTabIntegration: true,
        inputValidationNormalized: true,
        publicPageReciprocity: true,
        experienceImprovements: true,
        acceptanceTestingInProgress: true
      },
      phases: {
        A: { name: 'Navigation/Header Unification', status: 'completed' },
        B: { name: 'Dashboard Empty State & Tab Integration', status: 'completed' },
        C: { name: 'Input Validation/Normalization', status: 'completed' },
        D: { name: 'Public Page Reciprocity', status: 'completed' },
        E: { name: 'Experience Improvements', status: 'completed' },
        F: { name: 'Acceptance Testing Implementation', status: 'in-progress' }
      },
      recentErrors: errorLogs.slice(-10) // 直近10件のエラーを返す
    };

    return NextResponse.json(diagnosis, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      deployId: process.env.VERCEL_DEPLOYMENT_ID || null,
      timestamp: new Date().toISOString(),
      flags: {
        layoutHasSafeHeader: true
      },
      recentErrors: []
    }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // エラーログを収集
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: body.type || 'unknown',
      ...body
    };

    // ログを先頭に追加（最新が先頭）
    errorLogs.unshift(logEntry);

    // 最大件数を超えた場合は古いログを削除
    if (errorLogs.length > MAX_LOGS) {
      errorLogs.splice(MAX_LOGS);
    }

    // コンソールにも出力
    console.log('[DIAG] Error logged:', {
      id: logEntry.id,
      type: logEntry.type,
      errorId: logEntry.errorId,
      endpoint: logEntry.endpoint
    });

    return NextResponse.json({
      success: true,
      logId: logEntry.id,
      totalLogs: errorLogs.length
    }, { status: 201 });

  } catch (error: any) {
    console.error('[DIAG] Failed to log error:', error);
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to log error'
    }, { status: 500 });
  }
}