/**
 * Edge Function - Nightly Schema Diff & Alert
 * EPIC 3-7: スキーマ差分検査と自動アラート
 * 
 * 機能:
 * - information_schema/pg_catalog からスキーマ情報を抽出してJSONスナップショット作成
 * - 前回との差分計算と重大度判定
 * - Slack通知、audit_logs連携
 * 
 * Supabase Assistant 回答準拠:
 * - service_role によるフルスキーマアクセス
 * - severity ベース閾値アラート
 * - migration履歴との相関
 */

import { createServiceRoleClient, withTenantFilter, getEdgeFunctionMeta } from '../_shared/supabase.ts';
import { createEdgeLogger, type EdgeLogger } from '../_shared/logging.ts';
import { requireAuth, type AuthenticatedUser, EdgeAuthError } from '../_shared/auth.ts';
import { auditAsync } from '../_shared/audit.ts';
import { handlePreflight, createCorsResponse, createCorsErrorResponse } from '../_shared/cors.ts';
import { z } from 'npm:zod@3.22.4';

// ============================================
// 型定義
// ============================================

const RequestSchema = z.object({
  environment: z.string().min(1, 'Environment is required'),
  baseline_env: z.string().optional(),
  severity_threshold: z.enum(['info', 'warn', 'error']).default('warn'),
  dry_run: z.boolean().default(false),
  include_schemas: z.array(z.string()).default(['public']),
  exclude_schemas: z.array(z.string()).default(['extensions', 'graphql_public', 'realtime', 'supabase_migrations'])
});

type DiffRequest = z.infer<typeof RequestSchema>;

type SchemaObjectKind = 'table' | 'view' | 'column' | 'index' | 'constraint' | 'trigger' | 'function' | 'rls_policy';

type SeverityLevel = 'info' | 'warn' | 'error';

interface SchemaObject {
  kind: SchemaObjectKind;
  schema_name: string;
  object_name: string;
  parent_object?: string; // for columns, constraints etc.
  definition_hash: string;
  details: Record<string, unknown>;
}

interface SchemaSnapshot {
  environment: string;
  captured_at: string;
  schema_objects: SchemaObject[];
  metadata: {
    total_objects: number;
    schemas_included: string[];
    latest_migration?: string;
  };
}

interface SchemaDiffEntry {
  change_type: 'added' | 'removed' | 'changed';
  object_kind: SchemaObjectKind;
  schema_name: string;
  object_name: string;
  parent_object?: string;
  severity: SeverityLevel;
  details: Record<string, unknown>;
}

interface DiffSummary {
  total_changes: number;
  severity_counts: Record<SeverityLevel, number>;
  change_type_counts: Record<string, number>;
  schemas_affected: string[];
}

// ============================================
// メイン Edge Function ハンドラー
// ============================================

Deno.serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const logger = createEdgeLogger(req, 'nightly-schema-diff');
  const functionMeta = getEdgeFunctionMeta();
  
  logger.info('Nightly schema diff started', {
    function_meta: functionMeta,
    method: req.method,
    url: req.url
  });

  try {
    // ============================================
    // 1. CORS & Method Validation
    // ============================================
    
    if (req.method === 'OPTIONS') {
      return handlePreflight(req);
    }

    if (req.method !== 'POST') {
      return createCorsErrorResponse(
        { message: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
        405,
        req
      );
    }

    // ============================================
    // 2. 認証（service_roleまたはadmin権限確認）
    // ============================================

    let user: AuthenticatedUser | null = null;
    try {
      user = await logger.timed('user_authentication', () => 
        requireAuth(req, logger)
      );
    } catch (error) {
      // スケジュールされた実行の場合は認証スキップ
      if (req.headers.get('x-scheduled-task') === 'true') {
        logger.info('Scheduled task detected, skipping auth');
      } else {
        if (error instanceof EdgeAuthError) {
          logger.warn('Authentication failed', { error: error.message });
          return createCorsErrorResponse(
            { message: error.message, code: error.code },
            error.statusCode,
            req
          );
        }
        throw error;
      }
    }

    // ============================================
    // 3. リクエストパラメータ解析
    // ============================================

    let requestBody: DiffRequest;
    try {
      const rawBody = await req.json();
      requestBody = RequestSchema.parse(rawBody);
    } catch (error) {
      logger.warn('Request validation failed', {
        error: error instanceof z.ZodError ? error.errors : error.message
      });
      return createCorsErrorResponse(
        { message: 'Invalid request format', code: 'VALIDATION_ERROR' },
        400,
        req
      );
    }

    // ============================================
    // 4. スキーマDiff実行
    // ============================================

    const result = await performSchemaDiff(requestBody, functionMeta.requestId, logger);

    // ============================================
    // 5. 成功レスポンス
    // ============================================

    logger.info('Schema diff completed successfully', {
      environment: requestBody.environment,
      total_changes: result.summary.total_changes,
      severity_counts: result.summary.severity_counts,
      latency_ms: Date.now() - startTime
    });

    return createCorsResponse({
      success: true,
      environment: requestBody.environment,
      diff_id: result.diff_id,
      summary: result.summary,
      alerts_sent: result.alerts_sent,
      dry_run: requestBody.dry_run
    }, req);

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    logger.error('Nightly schema diff failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      latency_ms: latencyMs
    });

    return createCorsErrorResponse(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      500,
      req
    );
  }
});

// ============================================
// メイン処理関数
// ============================================

async function performSchemaDiff(
  request: DiffRequest,
  requestId: string,
  logger: EdgeLogger
): Promise<{
  diff_id: string | null;
  summary: DiffSummary;
  alerts_sent: boolean;
}> {
  const supabase = createServiceRoleClient();
  
  try {
    // ============================================
    // 1. 現在のスキーマスナップショット生成
    // ============================================
    
    const currentSnapshot = await logger.timed('generate_schema_snapshot', () =>
      generateSchemaSnapshot(request.environment, request.include_schemas, request.exclude_schemas, logger)
    );

    if (!request.dry_run) {
      // スナップショットをDBに保存
      const { error: snapshotError } = await supabase
        .from('schema_snapshots')
        .insert({
          environment: request.environment,
          captured_at: currentSnapshot.captured_at,
          schema_json: currentSnapshot,
          metadata: currentSnapshot.metadata
        });

      if (snapshotError) {
        throw new Error(`Failed to save snapshot: ${snapshotError.message}`);
      }
    }

    // ============================================
    // 2. 前回スナップショットとの差分計算
    // ============================================
    
    const { data: previousSnapshot } = await supabase
      .from('schema_snapshots')
      .select('schema_json')
      .eq('environment', request.baseline_env || request.environment)
      .neq('captured_at', currentSnapshot.captured_at)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let diffEntries: SchemaDiffEntry[] = [];
    let summary: DiffSummary = {
      total_changes: 0,
      severity_counts: { info: 0, warn: 0, error: 0 },
      change_type_counts: {},
      schemas_affected: []
    };

    if (previousSnapshot) {
      diffEntries = await logger.timed('calculate_schema_diff', () =>
        calculateSchemaDiff(
          previousSnapshot.schema_json as SchemaSnapshot,
          currentSnapshot,
          logger
        )
      );

      summary = summarizeDiff(diffEntries);
      
      logger.info('Schema diff calculated', {
        total_changes: summary.total_changes,
        severity_counts: summary.severity_counts
      });
    } else {
      logger.info('No previous snapshot found, skipping diff calculation');
    }

    // ============================================
    // 3. 差分履歴保存（閾値チェック）
    // ============================================
    
    let diffId: string | null = null;
    let alertsSent = false;

    if (summary.total_changes > 0 && !request.dry_run) {
      // 重大度チェック
      const shouldAlert = shouldTriggerAlert(summary, request.severity_threshold);
      
      const { data: diffRecord, error: diffError } = await supabase
        .from('schema_diff_history')
        .insert({
          environment: request.environment,
          baseline_environment: request.baseline_env || request.environment,
          diff_at: currentSnapshot.captured_at,
          summary: summary,
          diff: diffEntries,
          severity: getMaxSeverity(diffEntries),
          request_id: requestId,
          metadata: {
            latest_migration: currentSnapshot.metadata.latest_migration,
            total_objects: currentSnapshot.metadata.total_objects
          }
        })
        .select('id')
        .single();

      if (diffError) {
        throw new Error(`Failed to save diff history: ${diffError.message}`);
      }

      diffId = diffRecord.id;

      // ============================================
      // 4. Slack通知（閾値以上の場合）
      // ============================================
      
      if (shouldAlert) {
        alertsSent = await logger.timed('send_slack_alert', () =>
          sendSlackAlert(request.environment, summary, diffEntries, diffId!, logger)
        );
      }

      // ============================================
      // 5. audit_logs連携
      // ============================================
      
      auditAsync({
        function_name: 'nightly-schema-diff',
        actor: 'system:scheduled',
        request_id: requestId,
        trigger_type: 'SCHEDULED',
        trigger_source: 'pg_cron',
        resource: `schema:${request.environment}`,
        row_count: summary.total_changes,
        latency_ms: Date.now() - Date.now(), // Will be updated by auditAsync
        success: true,
        payload: {
          environment: request.environment,
          summary: summary,
          diff_id: diffId,
          alerts_sent: alertsSent
        }
      }, logger);
    }

    return {
      diff_id: diffId,
      summary: summary,
      alerts_sent: alertsSent
    };

  } catch (error) {
    logger.error('Schema diff execution failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: request.environment
    });
    throw error;
  }
}

// ============================================
// スキーマスナップショット生成
// ============================================

async function generateSchemaSnapshot(
  environment: string,
  includeSchemas: string[],
  excludeSchemas: string[],
  logger: EdgeLogger
): Promise<SchemaSnapshot> {
  const supabase = createServiceRoleClient();
  const schemaObjects: SchemaObject[] = [];

  try {
    // ============================================
    // 1. テーブル・ビュー情報取得
    // ============================================
    
    const { data: tables, error: tablesError } = await supabase.rpc('get_schema_tables', {
      include_schemas: includeSchemas,
      exclude_schemas: excludeSchemas
    });

    if (tablesError) {
      throw new Error(`Failed to fetch tables: ${tablesError.message}`);
    }

    // テーブル/ビューをschemaObjectsに追加
    for (const table of tables || []) {
      schemaObjects.push({
        kind: table.table_type === 'VIEW' ? 'view' : 'table',
        schema_name: table.table_schema,
        object_name: table.table_name,
        definition_hash: table.definition_hash,
        details: {
          table_type: table.table_type,
          is_partitioned: table.is_partitioned || false
        }
      });
    }

    // ============================================
    // 2. カラム情報取得
    // ============================================
    
    const { data: columns, error: columnsError } = await supabase.rpc('get_schema_columns', {
      include_schemas: includeSchemas,
      exclude_schemas: excludeSchemas
    });

    if (columnsError) {
      throw new Error(`Failed to fetch columns: ${columnsError.message}`);
    }

    // カラム情報をschemaObjectsに追加
    for (const column of columns || []) {
      schemaObjects.push({
        kind: 'column',
        schema_name: column.table_schema,
        object_name: column.column_name,
        parent_object: column.table_name,
        definition_hash: column.definition_hash,
        details: {
          data_type: column.data_type,
          is_nullable: column.is_nullable,
          column_default: column.column_default,
          character_maximum_length: column.character_maximum_length
        }
      });
    }

    // ============================================
    // 3. インデックス情報取得
    // ============================================
    
    const { data: indexes, error: indexesError } = await supabase.rpc('get_schema_indexes', {
      include_schemas: includeSchemas,
      exclude_schemas: excludeSchemas
    });

    if (indexesError) {
      throw new Error(`Failed to fetch indexes: ${indexesError.message}`);
    }

    for (const index of indexes || []) {
      schemaObjects.push({
        kind: 'index',
        schema_name: index.schema_name,
        object_name: index.index_name,
        parent_object: index.table_name,
        definition_hash: index.definition_hash,
        details: {
          is_unique: index.is_unique,
          is_primary: index.is_primary,
          index_keys: index.index_keys
        }
      });
    }

    // ============================================
    // 4. RLSポリシー情報取得
    // ============================================
    
    const { data: policies, error: policiesError } = await supabase.rpc('get_schema_rls_policies', {
      include_schemas: includeSchemas,
      exclude_schemas: excludeSchemas
    });

    if (policiesError) {
      throw new Error(`Failed to fetch RLS policies: ${policiesError.message}`);
    }

    for (const policy of policies || []) {
      schemaObjects.push({
        kind: 'rls_policy',
        schema_name: policy.schema_name,
        object_name: policy.policy_name,
        parent_object: policy.table_name,
        definition_hash: policy.definition_hash,
        details: {
          command: policy.command,
          roles: policy.roles,
          using_expression: policy.using_expression,
          with_check_expression: policy.with_check_expression
        }
      });
    }

    // ============================================
    // 5. 最新マイグレーション情報取得
    // ============================================
    
    const { data: latestMigration } = await supabase
      .from('supabase_migrations.schema_migrations')
      .select('version')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    // ============================================
    // 6. スナップショット組み立て
    // ============================================
    
    const snapshot: SchemaSnapshot = {
      environment: environment,
      captured_at: new Date().toISOString(),
      schema_objects: schemaObjects,
      metadata: {
        total_objects: schemaObjects.length,
        schemas_included: includeSchemas,
        latest_migration: latestMigration?.version || null
      }
    };

    logger.info('Schema snapshot generated', {
      environment: environment,
      total_objects: schemaObjects.length,
      schemas_included: includeSchemas,
      latest_migration: snapshot.metadata.latest_migration
    });

    return snapshot;

  } catch (error) {
    logger.error('Failed to generate schema snapshot', {
      environment: environment,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// ============================================
// スキーマ差分計算
// ============================================

async function calculateSchemaDiff(
  previousSnapshot: SchemaSnapshot,
  currentSnapshot: SchemaSnapshot,
  logger: EdgeLogger
): Promise<SchemaDiffEntry[]> {
  const diffEntries: SchemaDiffEntry[] = [];
  
  // オブジェクトの一意キー生成
  const createObjectKey = (obj: SchemaObject): string => {
    return `${obj.schema_name}:${obj.kind}:${obj.object_name}:${obj.parent_object || ''}`;
  };

  // 前回と現在のオブジェクトマップ作成
  const previousObjects = new Map<string, SchemaObject>();
  const currentObjects = new Map<string, SchemaObject>();

  for (const obj of previousSnapshot.schema_objects) {
    previousObjects.set(createObjectKey(obj), obj);
  }

  for (const obj of currentSnapshot.schema_objects) {
    currentObjects.set(createObjectKey(obj), obj);
  }

  // ============================================
  // 1. 追加されたオブジェクト
  // ============================================
  
  for (const [key, currentObj] of currentObjects) {
    if (!previousObjects.has(key)) {
      diffEntries.push({
        change_type: 'added',
        object_kind: currentObj.kind,
        schema_name: currentObj.schema_name,
        object_name: currentObj.object_name,
        parent_object: currentObj.parent_object,
        severity: determineSeverityForAddition(currentObj),
        details: {
          added_details: currentObj.details
        }
      });
    }
  }

  // ============================================
  // 2. 削除されたオブジェクト
  // ============================================
  
  for (const [key, previousObj] of previousObjects) {
    if (!currentObjects.has(key)) {
      diffEntries.push({
        change_type: 'removed',
        object_kind: previousObj.kind,
        schema_name: previousObj.schema_name,
        object_name: previousObj.object_name,
        parent_object: previousObj.parent_object,
        severity: determineSeverityForRemoval(previousObj),
        details: {
          removed_details: previousObj.details
        }
      });
    }
  }

  // ============================================
  // 3. 変更されたオブジェクト
  // ============================================
  
  for (const [key, currentObj] of currentObjects) {
    const previousObj = previousObjects.get(key);
    if (previousObj && previousObj.definition_hash !== currentObj.definition_hash) {
      diffEntries.push({
        change_type: 'changed',
        object_kind: currentObj.kind,
        schema_name: currentObj.schema_name,
        object_name: currentObj.object_name,
        parent_object: currentObj.parent_object,
        severity: determineSeverityForChange(previousObj, currentObj),
        details: {
          previous_details: previousObj.details,
          current_details: currentObj.details,
          hash_changed: {
            from: previousObj.definition_hash,
            to: currentObj.definition_hash
          }
        }
      });
    }
  }

  logger.info('Schema diff calculated', {
    total_changes: diffEntries.length,
    added: diffEntries.filter(e => e.change_type === 'added').length,
    removed: diffEntries.filter(e => e.change_type === 'removed').length,
    changed: diffEntries.filter(e => e.change_type === 'changed').length
  });

  return diffEntries;
}

// ============================================
// 重大度判定ヘルパー関数
// ============================================

function determineSeverityForAddition(obj: SchemaObject): SeverityLevel {
  switch (obj.kind) {
    case 'table':
    case 'view':
    case 'function':
      return 'info'; // 通常は問題なし
    case 'column':
      return 'info'; // カラム追加は通常問題なし
    case 'index':
      return 'info';
    case 'rls_policy':
      return 'warn'; // セキュリティ関連なので注意
    default:
      return 'info';
  }
}

function determineSeverityForRemoval(obj: SchemaObject): SeverityLevel {
  switch (obj.kind) {
    case 'table':
    case 'view':
      return 'error'; // データ損失の可能性
    case 'column':
      return 'error'; // 既存アプリケーションに影響
    case 'rls_policy':
      return 'error'; // セキュリティ脆弱性
    case 'index':
      return 'warn'; // パフォーマンス影響
    case 'function':
      return 'warn'; // 機能影響
    default:
      return 'warn';
  }
}

function determineSeverityForChange(previousObj: SchemaObject, currentObj: SchemaObject): SeverityLevel {
  switch (currentObj.kind) {
    case 'column':
      // データ型の変更は重大
      if (previousObj.details.data_type !== currentObj.details.data_type) {
        return 'error';
      }
      // NOT NULL制約の追加は警告
      if (previousObj.details.is_nullable === 'YES' && currentObj.details.is_nullable === 'NO') {
        return 'warn';
      }
      return 'info';
    case 'rls_policy':
      return 'warn'; // RLS変更は常に注意
    case 'index':
      return 'info'; // インデックス変更は通常問題なし
    case 'function':
      return 'warn'; // 関数変更は影響範囲が読めない
    default:
      return 'info';
  }
}

// ============================================
// ユーティリティ関数
// ============================================

function summarizeDiff(diffEntries: SchemaDiffEntry[]): DiffSummary {
  const summary: DiffSummary = {
    total_changes: diffEntries.length,
    severity_counts: { info: 0, warn: 0, error: 0 },
    change_type_counts: {},
    schemas_affected: []
  };

  const schemasSet = new Set<string>();

  for (const entry of diffEntries) {
    // 重大度カウント
    summary.severity_counts[entry.severity]++;
    
    // 変更タイプカウント
    const changeKey = `${entry.object_kind}_${entry.change_type}`;
    summary.change_type_counts[changeKey] = (summary.change_type_counts[changeKey] || 0) + 1;
    
    // 影響スキーマ
    schemasSet.add(entry.schema_name);
  }

  summary.schemas_affected = Array.from(schemasSet);

  return summary;
}

function shouldTriggerAlert(summary: DiffSummary, threshold: SeverityLevel): boolean {
  switch (threshold) {
    case 'error':
      return summary.severity_counts.error > 0;
    case 'warn':
      return summary.severity_counts.error > 0 || summary.severity_counts.warn > 0;
    case 'info':
      return summary.total_changes > 0;
    default:
      return false;
  }
}

function getMaxSeverity(diffEntries: SchemaDiffEntry[]): SeverityLevel {
  if (diffEntries.some(e => e.severity === 'error')) return 'error';
  if (diffEntries.some(e => e.severity === 'warn')) return 'warn';
  return 'info';
}

// ============================================
// Slack通知機能
// ============================================

async function sendSlackAlert(
  environment: string,
  summary: DiffSummary,
  diffEntries: SchemaDiffEntry[],
  diffId: string,
  logger: EdgeLogger
): Promise<boolean> {
  try {
    const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
    if (!webhookUrl) {
      logger.warn('Slack webhook URL not configured, skipping notification');
      return false;
    }

    const maxSeverity = getMaxSeverity(diffEntries);
    const severityEmoji = maxSeverity === 'error' ? '🚨' : maxSeverity === 'warn' ? '⚠️' : 'ℹ️';

    // 変更の要約文字列生成
    const changeSummary = Object.entries(summary.change_type_counts)
      .map(([key, count]) => `${key}=${count}`)
      .join(', ');

    const slackPayload = {
      text: `${severityEmoji} [schema-diff] Drift detected on ${environment} (severity: ${maxSeverity})`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `Schema Drift Detected: ${environment}`,
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Environment:*\n${environment}`
            },
            {
              type: 'mrkdwn',
              text: `*Severity:*\n${maxSeverity.toUpperCase()}`
            },
            {
              type: 'mrkdwn',
              text: `*Total Changes:*\n${summary.total_changes}`
            },
            {
              type: 'mrkdwn',
              text: `*Schemas Affected:*\n${summary.schemas_affected.join(', ')}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Summary:* ${changeSummary}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Details:* <${Deno.env.get('SUPABASE_URL')}/admin/schema-diff/${diffId}|View in Console>`
          }
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    logger.info('Slack alert sent successfully', {
      environment,
      severity: maxSeverity,
      total_changes: summary.total_changes,
      diff_id: diffId
    });

    return true;

  } catch (error) {
    logger.error('Failed to send Slack alert', {
      environment,
      error: error instanceof Error ? error.message : 'Unknown error',
      diff_id: diffId
    });
    return false;
  }
}