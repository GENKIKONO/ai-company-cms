/**
 * Schema Extraction Configuration
 * EPIC 3-7: Supabaseレビュー指摘事項対応 - 対象スキーマの厳密化
 * 
 * 機能:
 * - publicスキーマ中心の監視対象設定
 * - Supabase内部スキーマの除外設定
 * - ノイズ除外による精度向上
 * - 環境別設定のカスタマイズ対応
 */

// ============================================
// スキーマフィルタ設定
// ============================================

/**
 * デフォルト監視対象スキーマ
 * public を中心とし、必要に応じて auth, storage を明示的に追加
 */
export const DEFAULT_INCLUDED_SCHEMAS = [
  'public',
  // 'auth',      // 必要に応じてコメントアウト
  // 'storage',   // 必要に応じてコメントアウト
];

/**
 * 除外対象スキーマ（ノイズ除去）
 * Supabase内部スキーマや運用に影響しないスキーマを除外
 */
export const DEFAULT_EXCLUDED_SCHEMAS = [
  // Supabase システムスキーマ
  'extensions',
  'graphql',
  'graphql_public', 
  'pgsodium',
  'pgsodium_masks',
  'realtime',
  'supabase_migrations',
  'vault',
  
  // PostgreSQL システムスキーマ
  'information_schema',
  'pg_catalog',
  'pg_toast',
  'pg_temp_1',
  'pg_toast_temp_1',
  
  // pg_cron関連
  'cron',
  
  // 分析・監視関連（頻繁に変更される）
  'analytics',
  'monitoring', 
  'metrics',
  '_analytics',
  '_monitoring',
  '_metrics',
  
  // メンテナンス・一時スキーマ
  'maintenance',
  'backup',
  'migration',
  'temp',
  'temporary',
  '_temp',
  
  // サードパーティ拡張
  'net',
  'tiger',
  'tiger_data',
  'topology',
  'postgis',
  
  // GraphQL関連
  'graphql_comments',
  
  // API関連（自動生成）
  'api',
  '_api',
  
  // テスト・開発環境
  'test',
  'testing',
  'dev',
  'development',
  '_test',
];

/**
 * 監視対象外テーブル（publicスキーマ内でも除外）
 * システム管理用やログ用テーブル
 */
export const DEFAULT_EXCLUDED_TABLES = [
  // システム監査・ログ系
  'audit_logs',
  'service_role_audit', 
  'rls_denied_events',
  'contract_violations',
  'job_runs_v2',
  'schema_snapshots',
  'schema_diff_history',
  
  // セッション・一時データ
  'sessions',
  'session_data',
  '_sessions',
  'temp_data',
  'cache_entries',
  
  // 分析・統計（頻繁に更新）
  'analytics_events',
  'page_views',
  'click_events',
  'performance_metrics',
  'usage_stats',
  
  // キュー・ジョブ系
  'job_queue', 
  'message_queue',
  'background_jobs',
  'delayed_jobs',
  
  // 設定・メタデータ（変更監視不要）
  'app_config',
  'feature_flags',
  'environment_vars',
  'secrets',
  
  // テスト・サンプルデータ
  'test_',
  'sample_',
  'demo_',
  'fixture_',
];

/**
 * 監視対象外関数パターン
 * 自動生成や内部処理関数を除外
 */
export const DEFAULT_EXCLUDED_FUNCTION_PATTERNS = [
  // Supabase自動生成
  /^handle_new_user$/,
  /^handle_updated_at$/,
  /^set_updated_at$/,
  /^trigger_updated_at$/,
  
  // RLS関数（個別監視）
  /^auth\./,
  /^current_setting$/,
  /^has_role$/,
  /^check_permission$/,
  
  // 内部処理関数
  /^_/,
  /^internal_/,
  /^system_/,
  /^admin_/,
  
  // ログ・監査関数
  /audit_/,
  /log_/,
  /_log$/,
  /_audit$/,
  
  // 一時・テスト関数
  /^temp_/,
  /^test_/,
  /^debug_/,
];

// ============================================
// スキーマ設定クラス
// ============================================

export interface SchemaFilterConfig {
  included_schemas: string[];
  excluded_schemas: string[];
  excluded_tables: string[];
  excluded_function_patterns: RegExp[];
  custom_filters?: {
    exclude_views?: boolean;
    exclude_functions?: boolean;
    exclude_triggers?: boolean;
    exclude_constraints?: boolean;
    min_table_size_kb?: number;
  };
}

export class SchemaConfig {
  private config: SchemaFilterConfig;

  constructor(customConfig?: Partial<SchemaFilterConfig>) {
    this.config = {
      included_schemas: DEFAULT_INCLUDED_SCHEMAS,
      excluded_schemas: DEFAULT_EXCLUDED_SCHEMAS,
      excluded_tables: DEFAULT_EXCLUDED_TABLES,
      excluded_function_patterns: DEFAULT_EXCLUDED_FUNCTION_PATTERNS,
      ...customConfig
    };
  }

  /**
   * 環境別設定の適用
   */
  static forEnvironment(environment: string): SchemaConfig {
    switch (environment.toLowerCase()) {
      case 'production':
      case 'prod':
        return new SchemaConfig({
          included_schemas: ['public'],
          // 本番環境では最小限のスキーマのみ監視
          excluded_tables: [
            ...DEFAULT_EXCLUDED_TABLES,
            // 本番環境専用の追加除外
            'debug_logs',
            'trace_data',
            'performance_logs'
          ]
        });

      case 'staging':
      case 'stage':
        return new SchemaConfig({
          included_schemas: ['public', 'auth'],
          // ステージング環境では認証関連も監視
        });

      case 'development':
      case 'dev':
      case 'local':
        return new SchemaConfig({
          included_schemas: ['public', 'auth', 'storage'],
          // 開発環境では幅広く監視
          excluded_schemas: DEFAULT_EXCLUDED_SCHEMAS.filter(s => 
            !['test', 'testing', 'dev', 'development'].includes(s)
          )
        });

      default:
        return new SchemaConfig();
    }
  }

  /**
   * スキーマが監視対象かチェック
   */
  shouldIncludeSchema(schemaName: string): boolean {
    // 除外リストチェック
    if (this.config.excluded_schemas.includes(schemaName)) {
      return false;
    }

    // 包含リストチェック
    return this.config.included_schemas.includes(schemaName);
  }

  /**
   * テーブルが監視対象かチェック
   */
  shouldIncludeTable(schemaName: string, tableName: string): boolean {
    // スキーマ自体が対象外の場合
    if (!this.shouldIncludeSchema(schemaName)) {
      return false;
    }

    // 除外テーブルチェック
    return !this.config.excluded_tables.some(excluded => {
      if (excluded.endsWith('_')) {
        return tableName.startsWith(excluded);
      }
      return tableName === excluded;
    });
  }

  /**
   * 関数が監視対象かチェック
   */
  shouldIncludeFunction(schemaName: string, functionName: string): boolean {
    // スキーマ自体が対象外の場合
    if (!this.shouldIncludeSchema(schemaName)) {
      return false;
    }

    // カスタムフィルタで関数除外設定がある場合
    if (this.config.custom_filters?.exclude_functions) {
      return false;
    }

    // 除外パターンチェック
    return !this.config.excluded_function_patterns.some(pattern => 
      pattern.test(functionName)
    );
  }

  /**
   * SQL WHERE句用のスキーマフィルタ文字列生成
   */
  buildSchemaFilterClause(schemaColumnName: string = 'table_schema'): string {
    const includeConditions = this.config.included_schemas
      .map(schema => `${schemaColumnName} = '${schema}'`)
      .join(' OR ');

    const excludeConditions = this.config.excluded_schemas
      .map(schema => `${schemaColumnName} != '${schema}'`)
      .join(' AND ');

    if (includeConditions && excludeConditions) {
      return `(${includeConditions}) AND (${excludeConditions})`;
    } else if (includeConditions) {
      return `(${includeConditions})`;
    } else if (excludeConditions) {
      return `(${excludeConditions})`;
    } else {
      return '1=1';
    }
  }

  /**
   * テーブルフィルタ用SQL WHERE句生成
   */
  buildTableFilterClause(
    schemaColumnName: string = 'table_schema',
    tableColumnName: string = 'table_name'
  ): string {
    const schemaFilter = this.buildSchemaFilterClause(schemaColumnName);
    
    const tableExclusions = this.config.excluded_tables
      .map(table => {
        if (table.endsWith('_')) {
          return `${tableColumnName} NOT LIKE '${table}%'`;
        } else {
          return `${tableColumnName} != '${table}'`;
        }
      });

    const tableFilter = tableExclusions.length > 0 
      ? `(${tableExclusions.join(' AND ')})` 
      : '1=1';

    return `(${schemaFilter}) AND (${tableFilter})`;
  }

  /**
   * 設定の可視化（デバッグ用）
   */
  getConfigSummary(): {
    included_schemas: string[];
    excluded_schemas_count: number;
    excluded_tables_count: number;
    excluded_function_patterns_count: number;
  } {
    return {
      included_schemas: this.config.included_schemas,
      excluded_schemas_count: this.config.excluded_schemas.length,
      excluded_tables_count: this.config.excluded_tables.length,
      excluded_function_patterns_count: this.config.excluded_function_patterns.length
    };
  }
}

// ============================================
// 便利ファクトリー関数
// ============================================

/**
 * デフォルトスキーマ設定を取得
 */
export function getDefaultSchemaConfig(): SchemaConfig {
  return new SchemaConfig();
}

/**
 * 環境別スキーマ設定を取得
 */
export function getSchemaConfigForEnvironment(environment: string): SchemaConfig {
  return SchemaConfig.forEnvironment(environment);
}