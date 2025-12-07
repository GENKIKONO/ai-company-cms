/**
 * スキーマ情報抽出ユーティリティ (Edge Functions用)
 * EPIC 3-7: information_schema/pg_catalog から直接スキーマ情報取得
 * 
 * RPC関数が利用できない場合の代替実装
 * - service_role経由でシステムカタログに直接アクセス
 * - JSON形式でスキーマオブジェクトを抽象化
 * - definition_hash生成によるオブジェクト変更検知
 */

import { SupabaseClient } from 'npm:@supabase/supabase-js@2.39.7';
import { createHash } from 'node:crypto';
import { type EdgeLogger } from './logging.ts';
import { SchemaConfig, getSchemaConfigForEnvironment } from './schema-config.ts';
import { 
  normalizeSchemaObject, 
  generateNormalizedHash,
  DEFAULT_NORMALIZATION_OPTIONS,
  type NormalizationOptions 
} from './schema-normalization.ts';

// ============================================
// 型定義
// ============================================

export interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: 'BASE TABLE' | 'VIEW';
  definition_hash: string;
  is_partitioned?: boolean;
  comment?: string;
}

export interface ColumnInfo {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  definition_hash: string;
  ordinal_position: number;
}

export interface IndexInfo {
  schema_name: string;
  table_name: string;
  index_name: string;
  is_unique: boolean;
  is_primary: boolean;
  index_keys: string[];
  definition_hash: string;
  index_definition?: string;
}

export interface ConstraintInfo {
  schema_name: string;
  table_name: string;
  constraint_name: string;
  constraint_type: string;
  definition_hash: string;
  constraint_definition?: string;
}

export interface RlsPolicyInfo {
  schema_name: string;
  table_name: string;
  policy_name: string;
  command: string;
  roles: string[];
  using_expression: string | null;
  with_check_expression: string | null;
  definition_hash: string;
}

export interface FunctionInfo {
  schema_name: string;
  function_name: string;
  argument_types: string[];
  return_type: string;
  language: string;
  definition_hash: string;
  is_security_definer: boolean;
}

// ============================================
// メイン抽出クラス
// ============================================

export class SchemaExtractor {
  private supabase: SupabaseClient;
  private logger: EdgeLogger;
  private schemaConfig: SchemaConfig;
  private normalizationOptions: NormalizationOptions;

  constructor(
    supabase: SupabaseClient, 
    logger: EdgeLogger, 
    environment?: string,
    customConfig?: SchemaConfig,
    normalizationOptions?: NormalizationOptions
  ) {
    this.supabase = supabase;
    this.logger = logger;
    this.schemaConfig = customConfig || 
      (environment ? getSchemaConfigForEnvironment(environment) : new SchemaConfig());
    this.normalizationOptions = normalizationOptions || DEFAULT_NORMALIZATION_OPTIONS;
      
    this.logger.info('Schema extractor initialized', {
      config_summary: this.schemaConfig.getConfigSummary(),
      normalization_enabled: true
    });
  }

  // ============================================
  // テーブル・ビュー情報取得
  // ============================================

  async getTables(): Promise<TableInfo[]> {
    const schemaFilter = this.schemaConfig.buildTableFilterClause('t.table_schema', 't.table_name');
    
    const query = `
      SELECT 
        t.table_schema,
        t.table_name,
        t.table_type,
        COALESCE(obj_description(c.oid), '') as comment,
        CASE WHEN pt.partrelid IS NOT NULL THEN true ELSE false END as is_partitioned
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
      LEFT JOIN pg_partitioned_table pt ON pt.partrelid = c.oid
      WHERE ${schemaFilter}
      ORDER BY t.table_schema, t.table_name
    `;

    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: query
      });

      if (error) throw error;

      return data.map((row: any) => ({
        table_schema: row.table_schema,
        table_name: row.table_name,
        table_type: row.table_type,
        is_partitioned: row.is_partitioned,
        comment: row.comment,
        definition_hash: this.hashString(`${row.table_type}:${row.is_partitioned}:${row.comment}`)
      }));

    } catch (error) {
      this.logger.error('Failed to fetch tables', { error: error.message });
      throw error;
    }
  }

  // ============================================
  // カラム情報取得
  // ============================================

  async getColumns(): Promise<ColumnInfo[]> {
    const schemaFilter = this.schemaConfig.buildTableFilterClause('table_schema', 'table_name');
    
    const query = `
      SELECT 
        table_schema,
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        ordinal_position
      FROM information_schema.columns
      WHERE ${schemaFilter}
      ORDER BY table_schema, table_name, ordinal_position
    `;

    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: query
      });

      if (error) throw error;

      return data.map((row: any) => ({
        table_schema: row.table_schema,
        table_name: row.table_name,
        column_name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable,
        column_default: row.column_default,
        character_maximum_length: row.character_maximum_length,
        ordinal_position: row.ordinal_position,
        definition_hash: this.hashString(
          `${row.data_type}:${row.is_nullable}:${row.column_default}:${row.character_maximum_length}`
        )
      }));

    } catch (error) {
      this.logger.error('Failed to fetch columns', { error: error.message });
      throw error;
    }
  }

  // ============================================
  // インデックス情報取得
  // ============================================

  async getIndexes(): Promise<IndexInfo[]> {
    const schemaFilter = this.schemaConfig.buildTableFilterClause('schemaname', 'tablename');
    
    const query = `
      SELECT 
        schemaname as schema_name,
        tablename as table_name,
        indexname as index_name,
        indexdef as index_definition
      FROM pg_indexes
      WHERE ${schemaFilter}
      ORDER BY schemaname, tablename, indexname
    `;

    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: query
      });

      if (error) throw error;

      return data.map((row: any) => {
        const isUnique = row.index_definition?.includes('UNIQUE') || false;
        const isPrimary = row.index_definition?.includes('PRIMARY KEY') || false;
        
        // インデックスキーの抽出（簡易版）
        const keyMatch = row.index_definition?.match(/\((.*?)\)/);
        const indexKeys = keyMatch ? [keyMatch[1].trim()] : [];

        // 正規化されたハッシュの生成
        const normalizedResult = normalizeSchemaObject('index', {
          index_definition: row.index_definition || ''
        }, this.normalizationOptions);

        return {
          schema_name: row.schema_name,
          table_name: row.table_name,
          index_name: row.index_name,
          is_unique: isUnique,
          is_primary: isPrimary,
          index_keys: indexKeys,
          index_definition: row.index_definition,
          definition_hash: normalizedResult.normalized_hash
        };
      });

    } catch (error) {
      this.logger.error('Failed to fetch indexes', { error: error.message });
      throw error;
    }
  }

  // ============================================
  // 制約情報取得
  // ============================================

  async getConstraints(): Promise<ConstraintInfo[]> {
    const schemaFilter = this.schemaConfig.buildTableFilterClause('tc.constraint_schema', 'tc.table_name');
    
    const query = `
      SELECT 
        tc.constraint_schema as schema_name,
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        COALESCE(cc.check_clause, rc.delete_rule, kcu.column_name) as constraint_definition
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      LEFT JOIN information_schema.referential_constraints rc 
        ON tc.constraint_name = rc.constraint_name
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE ${schemaFilter}
      ORDER BY tc.constraint_schema, tc.table_name, tc.constraint_name
    `;

    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: query
      });

      if (error) throw error;

      return data.map((row: any) => {
        // 正規化されたハッシュの生成
        const normalizedResult = normalizeSchemaObject('constraint', {
          constraint_type: row.constraint_type,
          constraint_definition: row.constraint_definition
        }, this.normalizationOptions);

        return {
          schema_name: row.schema_name,
          table_name: row.table_name,
          constraint_name: row.constraint_name,
          constraint_type: row.constraint_type,
          constraint_definition: row.constraint_definition,
          definition_hash: normalizedResult.normalized_hash
        };
      });

    } catch (error) {
      this.logger.error('Failed to fetch constraints', { error: error.message });
      throw error;
    }
  }

  // ============================================
  // RLSポリシー情報取得
  // ============================================

  async getRlsPolicies(): Promise<RlsPolicyInfo[]> {
    const schemaFilter = this.schemaConfig.buildTableFilterClause('schemaname', 'tablename');
    
    const query = `
      SELECT 
        schemaname as schema_name,
        tablename as table_name,
        policyname as policy_name,
        cmd as command,
        roles,
        qual as using_expression,
        with_check as with_check_expression
      FROM pg_policies
      WHERE ${schemaFilter}
      ORDER BY schemaname, tablename, policyname
    `;

    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: query
      });

      if (error) throw error;

      return data.map((row: any) => {
        const roles = Array.isArray(row.roles) ? row.roles : [row.roles].filter(Boolean);
        
        // 正規化されたハッシュの生成
        const normalizedResult = normalizeSchemaObject('rls_policy', {
          command: row.command,
          roles: roles,
          using_expression: row.using_expression,
          with_check_expression: row.with_check_expression
        }, this.normalizationOptions);

        return {
          schema_name: row.schema_name,
          table_name: row.table_name,
          policy_name: row.policy_name,
          command: row.command,
          roles: roles,
          using_expression: row.using_expression,
          with_check_expression: row.with_check_expression,
          definition_hash: normalizedResult.normalized_hash
        };
      });

    } catch (error) {
      this.logger.error('Failed to fetch RLS policies', { error: error.message });
      throw error;
    }
  }

  // ============================================
  // 関数情報取得
  // ============================================

  async getFunctions(): Promise<FunctionInfo[]> {
    const schemaFilter = this.schemaConfig.buildSchemaFilterClause('n.nspname');
    
    const query = `
      SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_arguments(p.oid) as argument_types,
        pg_get_function_result(p.oid) as return_type,
        l.lanname as language,
        p.prosecdef as is_security_definer
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE ${schemaFilter.replace('schema_name', 'n.nspname')}
        AND p.prokind = 'f'  -- functions only, not procedures
      ORDER BY n.nspname, p.proname
    `;

    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: query
      });

      if (error) throw error;

      return data.map((row: any) => {
        const argumentTypes = row.argument_types ? [row.argument_types] : [];
        
        // 正規化されたハッシュの生成
        const normalizedResult = normalizeSchemaObject('function', {
          function_name: row.function_name,
          argument_types: argumentTypes,
          return_type: row.return_type,
          language: row.language,
          is_security_definer: row.is_security_definer
        }, this.normalizationOptions);

        return {
          schema_name: row.schema_name,
          function_name: row.function_name,
          argument_types: argumentTypes,
          return_type: row.return_type,
          language: row.language,
          is_security_definer: row.is_security_definer,
          definition_hash: normalizedResult.normalized_hash
        };
      });

    } catch (error) {
      this.logger.error('Failed to fetch functions', { error: error.message });
      throw error;
    }
  }

  // ============================================
  // ヘルパー関数
  // ============================================


  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex').substring(0, 16);
  }

  // ============================================
  // バッチ取得メソッド
  // ============================================

  async getAllSchemaObjects(): Promise<{
    tables: TableInfo[];
    columns: ColumnInfo[];
    indexes: IndexInfo[];
    constraints: ConstraintInfo[];
    rls_policies: RlsPolicyInfo[];
    functions: FunctionInfo[];
  }> {
    this.logger.info('Starting schema extraction', {
      config_summary: this.schemaConfig.getConfigSummary()
    });

    const [
      tables,
      columns,
      indexes,
      constraints,
      rls_policies,
      functions
    ] = await Promise.all([
      this.getTables(),
      this.getColumns(),
      this.getIndexes(),
      this.getConstraints(),
      this.getRlsPolicies(),
      this.getFunctions()
    ]);

    this.logger.info('Schema extraction completed', {
      tables_count: tables.length,
      columns_count: columns.length,
      indexes_count: indexes.length,
      constraints_count: constraints.length,
      rls_policies_count: rls_policies.length,
      functions_count: functions.length
    });

    return {
      tables,
      columns,
      indexes,
      constraints,
      rls_policies,
      functions
    };
  }
}

// ============================================
// 便利ヘルパー関数
// ============================================

/**
 * SchemaExtractorインスタンス作成
 */
export function createSchemaExtractor(
  supabase: SupabaseClient,
  logger: EdgeLogger,
  environment?: string,
  normalizationOptions?: NormalizationOptions
): SchemaExtractor {
  return new SchemaExtractor(supabase, logger, environment, undefined, normalizationOptions);
}