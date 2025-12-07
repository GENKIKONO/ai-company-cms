/**
 * Migration Correlation Analysis
 * EPIC 3-7: Supabase Review対応 - 重大度判定の精度向上
 * 
 * 機能:
 * - スキーマ変更とマイグレーションファイルの相関分析
 * - 計画された変更 vs 予期しない変更の識別
 * - 重大度レベルの動的調整
 * - 偽陽性アラートの削減
 */

import { SupabaseClient } from 'npm:@supabase/supabase-js@2.39.7';
import { type EdgeLogger } from './logging.ts';

// ============================================
// 型定義
// ============================================

export interface MigrationInfo {
  file_name: string;
  applied_at: string;
  sql_content?: string;
  checksum: string;
  version: string;
}

export interface SchemaChange {
  change_type: 'added' | 'removed' | 'modified';
  object_type: 'table' | 'column' | 'index' | 'constraint' | 'function' | 'rls_policy';
  object_path: string; // schema.table.column or schema.function_name
  old_definition?: any;
  new_definition?: any;
  severity_hint?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CorrelationResult {
  correlation_score: number; // 0.0-1.0, 1.0 = perfect correlation
  original_severity: 'info' | 'warn' | 'error' | 'critical';
  adjusted_severity: 'info' | 'warn' | 'error' | 'critical';
  explanation: string;
  matched_migrations: string[];
  risk_factors: string[];
  correlation_details: {
    time_correlation: number;
    content_correlation: number;
    pattern_correlation: number;
  };
}

export interface CorrelationOptions {
  migration_time_window_hours: number;
  min_correlation_threshold: number;
  severity_downgrade_threshold: number;
  consider_pending_migrations: boolean;
}

export const DEFAULT_CORRELATION_OPTIONS: CorrelationOptions = {
  migration_time_window_hours: 24,
  min_correlation_threshold: 0.3,
  severity_downgrade_threshold: 0.6,
  consider_pending_migrations: true
};

// ============================================
// メイン相関分析クラス
// ============================================

export class MigrationCorrelationAnalyzer {
  private supabase: SupabaseClient;
  private logger: EdgeLogger;
  private options: CorrelationOptions;

  constructor(
    supabase: SupabaseClient,
    logger: EdgeLogger,
    options: CorrelationOptions = DEFAULT_CORRELATION_OPTIONS
  ) {
    this.supabase = supabase;
    this.logger = logger;
    this.options = options;
  }

  /**
   * スキーマ変更とマイグレーションの相関分析を実行
   */
  async analyzeCorrelation(
    environment: string,
    changes: SchemaChange[],
    originalSeverity: 'info' | 'warn' | 'error' | 'critical',
    changeTimestamp: string
  ): Promise<CorrelationResult> {
    
    this.logger.info('Starting migration correlation analysis', {
      environment,
      changes_count: changes.length,
      original_severity: originalSeverity
    });

    try {
      // 最近のマイグレーション情報を取得
      const recentMigrations = await this.getRecentMigrations(environment, changeTimestamp);
      
      // 時間的相関の分析
      const timeCorrelation = this.analyzeTimeCorrelation(recentMigrations, changeTimestamp);
      
      // 内容的相関の分析
      const contentCorrelation = await this.analyzeContentCorrelation(changes, recentMigrations);
      
      // パターン的相関の分析
      const patternCorrelation = this.analyzePatternCorrelation(changes, recentMigrations);
      
      // 総合相関スコアの計算
      const overallScore = this.calculateOverallCorrelation(
        timeCorrelation,
        contentCorrelation,
        patternCorrelation
      );
      
      // 重大度の調整
      const adjustedSeverity = this.adjustSeverity(originalSeverity, overallScore, changes);
      
      // リスク要因の特定
      const riskFactors = this.identifyRiskFactors(changes, recentMigrations, overallScore);
      
      // 説明文の生成
      const explanation = this.generateExplanation(
        originalSeverity,
        adjustedSeverity,
        overallScore,
        recentMigrations.length
      );

      const result: CorrelationResult = {
        correlation_score: overallScore,
        original_severity: originalSeverity,
        adjusted_severity: adjustedSeverity,
        explanation,
        matched_migrations: recentMigrations.map(m => m.file_name),
        risk_factors: riskFactors,
        correlation_details: {
          time_correlation: timeCorrelation,
          content_correlation: contentCorrelation,
          pattern_correlation: patternCorrelation
        }
      };

      this.logger.info('Migration correlation analysis completed', {
        correlation_score: overallScore,
        severity_change: originalSeverity !== adjustedSeverity,
        matched_migrations: recentMigrations.length
      });

      return result;

    } catch (error) {
      this.logger.error('Migration correlation analysis failed', { error: error.message });
      
      // 分析失敗時は安全側に倒す（重大度を上げる）
      return {
        correlation_score: 0.0,
        original_severity: originalSeverity,
        adjusted_severity: this.escalateSeverity(originalSeverity),
        explanation: 'Unable to analyze migration correlation - treating as potentially unauthorized',
        matched_migrations: [],
        risk_factors: ['correlation_analysis_failed'],
        correlation_details: {
          time_correlation: 0.0,
          content_correlation: 0.0,
          pattern_correlation: 0.0
        }
      };
    }
  }

  // ============================================
  // マイグレーション情報取得
  // ============================================

  private async getRecentMigrations(
    environment: string,
    changeTimestamp: string
  ): Promise<MigrationInfo[]> {
    
    const windowStart = new Date(changeTimestamp);
    windowStart.setHours(windowStart.getHours() - this.options.migration_time_window_hours);
    
    const windowEnd = new Date(changeTimestamp);
    windowEnd.setHours(windowEnd.getHours() + 1); // 1時間後まで許容

    try {
      // Supabase Migration履歴から取得を試行
      const { data: migrations, error } = await this.supabase
        .from('supabase_migrations')
        .select('name, applied_at')
        .gte('applied_at', windowStart.toISOString())
        .lte('applied_at', windowEnd.toISOString())
        .order('applied_at', { ascending: false });

      if (error) {
        this.logger.warn('Failed to fetch from supabase_migrations, trying alternative sources', {
          error: error.message
        });
        return this.getAlternativeMigrationInfo(environment, windowStart, windowEnd);
      }

      return (migrations || []).map(m => ({
        file_name: m.name,
        applied_at: m.applied_at,
        checksum: '',
        version: this.extractVersionFromFilename(m.name)
      }));

    } catch (error) {
      this.logger.warn('Migration history query failed', { error: error.message });
      return [];
    }
  }

  private async getAlternativeMigrationInfo(
    environment: string,
    windowStart: Date,
    windowEnd: Date
  ): Promise<MigrationInfo[]> {
    
    // 代替手段: job_runs_v2 からマイグレーション実行履歴を取得
    try {
      const { data: jobs, error } = await this.supabase
        .from('job_runs_v2')
        .select('job_name, started_at, metadata')
        .like('job_name', '%migration%')
        .gte('started_at', windowStart.toISOString())
        .lte('started_at', windowEnd.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;

      return (jobs || []).map(job => ({
        file_name: job.metadata?.migration_file || job.job_name,
        applied_at: job.started_at,
        checksum: '',
        version: this.extractVersionFromFilename(job.job_name)
      }));

    } catch (error) {
      this.logger.warn('Alternative migration info query failed', { error: error.message });
      return [];
    }
  }

  private extractVersionFromFilename(filename: string): string {
    const versionMatch = filename.match(/(\d{14}_\d{6}|\d{8}_\d{6}|\d{14})/);
    return versionMatch ? versionMatch[1] : '0';
  }

  // ============================================
  // 相関分析実装
  // ============================================

  private analyzeTimeCorrelation(migrations: MigrationInfo[], changeTimestamp: string): number {
    if (migrations.length === 0) return 0.0;

    const changeTime = new Date(changeTimestamp).getTime();
    const toleranceMs = 30 * 60 * 1000; // 30分の許容範囲

    let bestCorrelation = 0.0;

    for (const migration of migrations) {
      const migrationTime = new Date(migration.applied_at).getTime();
      const timeDiff = Math.abs(changeTime - migrationTime);
      
      if (timeDiff <= toleranceMs) {
        // 30分以内なら高い相関
        bestCorrelation = Math.max(bestCorrelation, 1.0);
      } else if (timeDiff <= 3600000) {
        // 1時間以内なら中程度の相関
        bestCorrelation = Math.max(bestCorrelation, 0.7);
      } else if (timeDiff <= 7200000) {
        // 2時間以内なら低い相関
        bestCorrelation = Math.max(bestCorrelation, 0.3);
      }
    }

    return bestCorrelation;
  }

  private async analyzeContentCorrelation(
    changes: SchemaChange[],
    migrations: MigrationInfo[]
  ): Promise<number> {
    
    if (migrations.length === 0 || changes.length === 0) return 0.0;

    // SQLパターンベースの相関分析
    const changePatterns = this.extractChangePatterns(changes);
    let totalCorrelation = 0.0;
    let checkedMigrations = 0;

    for (const migration of migrations) {
      if (migration.sql_content) {
        const migrationPatterns = this.extractSqlPatterns(migration.sql_content);
        const correlation = this.calculatePatternSimilarity(changePatterns, migrationPatterns);
        totalCorrelation += correlation;
        checkedMigrations++;
      }
    }

    return checkedMigrations > 0 ? totalCorrelation / checkedMigrations : 0.0;
  }

  private analyzePatternCorrelation(changes: SchemaChange[], migrations: MigrationInfo[]): number {
    if (migrations.length === 0) return 0.0;

    // 変更パターンの分析
    const changeTypes = changes.map(c => c.change_type);
    const objectTypes = changes.map(c => c.object_type);

    // 一般的なマイグレーションパターンとの一致度
    const commonPatterns = [
      'table_creation', 'column_addition', 'index_creation',
      'constraint_addition', 'rls_policy_update', 'function_modification'
    ];

    let patternScore = 0.0;

    // 追加操作が多い場合（典型的なマイグレーション）
    if (changeTypes.filter(t => t === 'added').length / changes.length > 0.6) {
      patternScore += 0.4;
    }

    // テーブル・インデックス関連の変更（構造的変更）
    if (objectTypes.includes('table') || objectTypes.includes('index')) {
      patternScore += 0.3;
    }

    // RLS・関数の更新（セキュリティ・ロジック関連）
    if (objectTypes.includes('rls_policy') || objectTypes.includes('function')) {
      patternScore += 0.2;
    }

    // 複数の関連オブジェクトの同時変更（計画的変更の特徴）
    if (changes.length > 1 && new Set(objectTypes).size > 1) {
      patternScore += 0.1;
    }

    return Math.min(patternScore, 1.0);
  }

  private extractChangePatterns(changes: SchemaChange[]): string[] {
    return changes.map(change => {
      return `${change.change_type}_${change.object_type}_${change.object_path.split('.')[0]}`;
    });
  }

  private extractSqlPatterns(sqlContent: string): string[] {
    const patterns: string[] = [];
    const sql = sqlContent.toLowerCase();

    // DDL操作の検出
    if (sql.includes('create table')) patterns.push('create_table');
    if (sql.includes('alter table')) patterns.push('alter_table');
    if (sql.includes('create index')) patterns.push('create_index');
    if (sql.includes('add constraint')) patterns.push('add_constraint');
    if (sql.includes('create policy')) patterns.push('create_policy');
    if (sql.includes('create function')) patterns.push('create_function');

    return patterns;
  }

  private calculatePatternSimilarity(patterns1: string[], patterns2: string[]): number {
    if (patterns1.length === 0 || patterns2.length === 0) return 0.0;

    const set1 = new Set(patterns1);
    const set2 = new Set(patterns2);
    const intersection = new Set([...set1].filter(p => set2.has(p)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  // ============================================
  // 重大度調整ロジック
  // ============================================

  private calculateOverallCorrelation(
    timeCorrelation: number,
    contentCorrelation: number,
    patternCorrelation: number
  ): number {
    
    // 重み付き平均（時間相関を最重視）
    const weights = { time: 0.5, content: 0.3, pattern: 0.2 };
    
    return (
      timeCorrelation * weights.time +
      contentCorrelation * weights.content +
      patternCorrelation * weights.pattern
    );
  }

  private adjustSeverity(
    originalSeverity: 'info' | 'warn' | 'error' | 'critical',
    correlationScore: number,
    changes: SchemaChange[]
  ): 'info' | 'warn' | 'error' | 'critical' {
    
    // 高い相関がある場合は重大度を下げる
    if (correlationScore >= this.options.severity_downgrade_threshold) {
      return this.downgradeSevertiy(originalSeverity);
    }

    // 低い相関でリスキーな変更がある場合は重大度を上げる
    if (correlationScore < this.options.min_correlation_threshold) {
      const hasRiskyChanges = changes.some(change => 
        change.object_type === 'rls_policy' || 
        change.change_type === 'removed' ||
        change.severity_hint === 'high' ||
        change.severity_hint === 'critical'
      );
      
      if (hasRiskyChanges) {
        return this.escalateSeverity(originalSeverity);
      }
    }

    return originalSeverity;
  }

  private downgradeSevertiy(severity: string): 'info' | 'warn' | 'error' | 'critical' {
    const levels = ['info', 'warn', 'error', 'critical'];
    const currentIndex = levels.indexOf(severity);
    const newIndex = Math.max(0, currentIndex - 1);
    return levels[newIndex] as any;
  }

  private escalateSeverity(severity: string): 'info' | 'warn' | 'error' | 'critical' {
    const levels = ['info', 'warn', 'error', 'critical'];
    const currentIndex = levels.indexOf(severity);
    const newIndex = Math.min(levels.length - 1, currentIndex + 1);
    return levels[newIndex] as any;
  }

  private identifyRiskFactors(
    changes: SchemaChange[],
    migrations: MigrationInfo[],
    correlationScore: number
  ): string[] {
    
    const risks: string[] = [];

    // 時間的リスク
    if (migrations.length === 0) {
      risks.push('no_recent_migrations');
    }

    // 変更内容のリスク
    const hasRlsChanges = changes.some(c => c.object_type === 'rls_policy');
    if (hasRlsChanges) {
      risks.push('rls_policy_changes');
    }

    const hasDropOperations = changes.some(c => c.change_type === 'removed');
    if (hasDropOperations) {
      risks.push('destructive_changes');
    }

    const hasProductionData = changes.some(c => c.object_path.includes('production'));
    if (hasProductionData) {
      risks.push('production_schema_changes');
    }

    // 相関スコアに基づくリスク
    if (correlationScore < this.options.min_correlation_threshold) {
      risks.push('low_migration_correlation');
    }

    // 大量変更のリスク
    if (changes.length > 10) {
      risks.push('bulk_schema_changes');
    }

    return risks;
  }

  private generateExplanation(
    originalSeverity: string,
    adjustedSeverity: string,
    correlationScore: number,
    migrationCount: number
  ): string {
    
    if (originalSeverity === adjustedSeverity) {
      return `Schema changes maintain ${originalSeverity} severity (correlation: ${(correlationScore * 100).toFixed(0)}%, ${migrationCount} recent migrations)`;
    }

    if (adjustedSeverity < originalSeverity) {
      return `Severity downgraded from ${originalSeverity} to ${adjustedSeverity} due to strong correlation with recent migrations (score: ${(correlationScore * 100).toFixed(0)}%)`;
    } else {
      return `Severity escalated from ${originalSeverity} to ${adjustedSeverity} due to suspicious patterns and low migration correlation (score: ${(correlationScore * 100).toFixed(0)}%)`;
    }
  }
}

// ============================================
// 便利関数
// ============================================

/**
 * MigrationCorrelationAnalyzer インスタンス作成
 */
export function createMigrationCorrelationAnalyzer(
  supabase: SupabaseClient,
  logger: EdgeLogger,
  options?: CorrelationOptions
): MigrationCorrelationAnalyzer {
  return new MigrationCorrelationAnalyzer(supabase, logger, options);
}

/**
 * スキーマ変更から SchemaChange オブジェクトを生成
 */
export function createSchemaChanges(
  diffSummary: any,
  oldSnapshot: any,
  newSnapshot: any
): SchemaChange[] {
  
  const changes: SchemaChange[] = [];

  // テーブル変更の抽出
  if (diffSummary.tables_added > 0) {
    // 追加されたテーブルの詳細を抽出（実装は diff 結果に依存）
    changes.push({
      change_type: 'added',
      object_type: 'table',
      object_path: 'unknown.table', // 実際の実装では具体的なテーブル名
      severity_hint: 'medium'
    });
  }

  if (diffSummary.rls_policies_modified > 0) {
    changes.push({
      change_type: 'modified',
      object_type: 'rls_policy',
      object_path: 'public.policies',
      severity_hint: 'high'
    });
  }

  // より詳細な変更抽出は実際の diff 実装と統合する際に実装

  return changes;
}