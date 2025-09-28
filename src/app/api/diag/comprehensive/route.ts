import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DiagnosticResult {
  success: boolean;
  error?: string;
  type?: string;
  status?: string;
  securityLevel?: string;
  assessment?: any;
  summary?: any;
  score?: any;
  recommendations?: Recommendation[];
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  action: string;
  component?: string;
}

interface Issue {
  component: string;
  severity: 'critical' | 'warning';
  message: string;
  details: any[];
}

/**
 * 統合診断API
 * 全診断機能を実行し、総合的なシステム健全性レポートを生成
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const baseUrl = new URL(request.url).origin;
  
  try {
    // 各診断APIを並列実行
    const diagnosticPromises = [
      fetch(`${baseUrl}/api/diag`, { method: 'GET' }).then(r => r.json()).catch(e => ({ error: e.message, type: 'basic' })),
      fetch(`${baseUrl}/api/diag/performance`, { method: 'GET' }).then(r => r.json()).catch(e => ({ error: e.message, type: 'performance' })),
      fetch(`${baseUrl}/api/diag/database`, { method: 'GET' }).then(r => r.json()).catch(e => ({ error: e.message, type: 'database' })),
      fetch(`${baseUrl}/api/diag/security`, { method: 'GET' }).then(r => r.json()).catch(e => ({ error: e.message, type: 'security' })),
      fetch(`${baseUrl}/api/diag/auth-context`, { method: 'GET' }).then(r => r.json()).catch(e => ({ error: e.message, type: 'auth' })),
      fetch(`${baseUrl}/api/diag/session`, { method: 'GET' }).then(r => r.json()).catch(e => ({ error: e.message, type: 'session' }))
    ];

    const [
      basicDiag,
      performanceDiag,
      databaseDiag,
      securityDiag,
      authDiag,
      sessionDiag
    ] = await Promise.all(diagnosticPromises);

    // 結果の集約と分析
    const diagnosticResults = {
      basic: basicDiag,
      performance: performanceDiag,
      database: databaseDiag,
      security: securityDiag,
      auth: authDiag,
      session: sessionDiag
    };

    // エラーカウント
    const errors = Object.entries(diagnosticResults)
      .filter(([_, result]) => result.error || !result.success)
      .map(([type, result]) => ({ type, error: result.error || 'Diagnostic failed' }));

    // 全体的なシステム健全性評価
    const healthAssessment = {
      overall: 'healthy' as 'healthy' | 'degraded' | 'critical',
      scores: {
        basic: basicDiag.success ? 100 : 0,
        performance: performanceDiag.success ? 
          (performanceDiag.assessment ? calculatePerformanceScore(performanceDiag.assessment) : 50) : 0,
        database: databaseDiag.success ? 
          (databaseDiag.summary ? (databaseDiag.summary.passed / databaseDiag.summary.totalTests) * 100 : 50) : 0,
        security: securityDiag.success ? 
          (securityDiag.score ? securityDiag.score.percentage : 50) : 0,
        auth: authDiag.success ? 100 : 0,
        session: sessionDiag.success ? 100 : 0
      }
    };

    // 総合スコア計算
    const totalScore = Object.values(healthAssessment.scores).reduce((sum, score) => sum + score, 0) / 6;

    if (totalScore >= 85) healthAssessment.overall = 'healthy';
    else if (totalScore >= 70) healthAssessment.overall = 'degraded';
    else healthAssessment.overall = 'critical';

    // 重要な問題の特定
    const criticalIssues: Issue[] = [];
    const warnings: Issue[] = [];

    if (databaseDiag.success && databaseDiag.status !== 'healthy') {
      criticalIssues.push({
        component: 'database',
        severity: 'critical',
        message: 'データベース接続または設定に問題があります',
        details: databaseDiag.recommendations || []
      });
    }

    if (securityDiag.success && securityDiag.securityLevel === 'weak') {
      criticalIssues.push({
        component: 'security',
        severity: 'critical',
        message: 'セキュリティ設定に重大な問題があります',
        details: securityDiag.recommendations || []
      });
    }

    if (performanceDiag.success && performanceDiag.assessment) {
      const perfAssess = performanceDiag.assessment;
      if (perfAssess.database?.status === 'critical' || perfAssess.memory?.status === 'critical') {
        criticalIssues.push({
          component: 'performance',
          severity: 'critical',
          message: 'パフォーマンスに重大な問題があります',
          details: performanceDiag.recommendations || []
        });
      } else if (perfAssess.database?.status === 'warning' || perfAssess.memory?.status === 'warning') {
        warnings.push({
          component: 'performance',
          severity: 'warning',
          message: 'パフォーマンスに注意が必要です',
          details: performanceDiag.recommendations || []
        });
      }
    }

    // 統合推奨事項
    const consolidatedRecommendations: Recommendation[] = [];
    
    Object.entries(diagnosticResults).forEach(([component, result]) => {
      if (result.recommendations && Array.isArray(result.recommendations)) {
        result.recommendations.forEach((rec: Recommendation) => {
          consolidatedRecommendations.push({
            component,
            ...rec
          });
        });
      }
    });

    // 優先度順にソート
    consolidatedRecommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    });

    const diagnosticTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      overall: healthAssessment.overall,
      totalScore: Math.round(totalScore),
      diagnosticTime,
      components: {
        basic: { status: basicDiag.success ? 'healthy' : 'error', score: healthAssessment.scores.basic },
        performance: { 
          status: getComponentStatus(healthAssessment.scores.performance), 
          score: Math.round(healthAssessment.scores.performance) 
        },
        database: { 
          status: getComponentStatus(healthAssessment.scores.database), 
          score: Math.round(healthAssessment.scores.database) 
        },
        security: { 
          status: getComponentStatus(healthAssessment.scores.security), 
          score: Math.round(healthAssessment.scores.security) 
        },
        auth: { status: authDiag.success ? 'healthy' : 'error', score: healthAssessment.scores.auth },
        session: { status: sessionDiag.success ? 'healthy' : 'error', score: healthAssessment.scores.session }
      },
      issues: {
        critical: criticalIssues,
        warnings: warnings,
        errors: errors
      },
      recommendations: consolidatedRecommendations.slice(0, 10), // 上位10件の推奨事項
      detailed: {
        basic: basicDiag,
        performance: performanceDiag.success ? performanceDiag : { error: performanceDiag.error },
        database: databaseDiag.success ? databaseDiag : { error: databaseDiag.error },
        security: securityDiag.success ? securityDiag : { error: securityDiag.error },
        auth: authDiag.success ? authDiag : { error: authDiag.error },
        session: sessionDiag.success ? sessionDiag : { error: sessionDiag.error }
      },
      summary: {
        totalComponents: 6,
        healthyComponents: Object.values(healthAssessment.scores).filter(score => score >= 85).length,
        degradedComponents: Object.values(healthAssessment.scores).filter(score => score >= 70 && score < 85).length,
        criticalComponents: Object.values(healthAssessment.scores).filter(score => score < 70).length,
        totalRecommendations: consolidatedRecommendations.length,
        highPriorityRecommendations: consolidatedRecommendations.filter(r => r.priority === 'high').length
      },
      meta: {
        generatedAt: new Date().toISOString(),
        diagnosticVersion: '1.0.0',
        componentsChecked: Object.keys(diagnosticResults).length
      }
    });

  } catch (error) {
    console.error('Comprehensive diagnostic failed:', error);
    
    return NextResponse.json({
      success: false,
      overall: 'critical',
      error: 'Failed to run comprehensive diagnostic',
      diagnosticTime: Date.now() - startTime,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculatePerformanceScore(assessment: any): number {
  let score = 100;
  
  if (assessment.database?.status === 'critical') score -= 30;
  else if (assessment.database?.status === 'warning') score -= 15;
  
  if (assessment.memory?.status === 'critical') score -= 30;
  else if (assessment.memory?.status === 'warning') score -= 15;
  
  if (assessment.images?.status === 'warning') score -= 10;
  
  return Math.max(0, score);
}

function getComponentStatus(score: number): 'healthy' | 'degraded' | 'critical' | 'error' {
  if (score >= 85) return 'healthy';
  if (score >= 70) return 'degraded';
  if (score >= 0) return 'critical';
  return 'error';
}