/**
 * Edge Function - Schema Snapshots (Interactive Mode)
 * スキーマスナップショット作成＋対話型パラメータ収集
 *
 * 機能:
 * - 必要なパラメータが不足している場合、質問リストを返却
 * - 充足時は従来どおり即実行（後方互換性）
 * - service_role または x-api-key 認証対応
 */

import { createServiceRoleClient, getEdgeFunctionMeta } from '../_shared/supabase.ts';
import { createEdgeLogger, type EdgeLogger } from '../_shared/logging.ts';
import { requireAuth, type AuthenticatedUser, EdgeAuthError } from '../_shared/auth.ts';
import { auditAsync } from '../_shared/audit.ts';
import { handlePreflight, createCorsResponse, createCorsErrorResponse } from '../_shared/cors.ts';
import { z } from 'npm:zod@3.22.4';
import { createSchemaExtractor } from '../_shared/schema-extractor.ts';

// ============================================
// 型定義
// ============================================

const RequestSchema = z.object({
  env: z.enum(['local', 'development', 'staging', 'production']).optional(),
  git_ref: z.string().optional(),
  app_version: z.string().optional(),
  source: z.enum(['manual', 'ci', 'cron']).optional(),
  dry_run: z.boolean().default(false),
  include_schemas: z.array(z.string()).default(['public']),
  exclude_schemas: z.array(z.string()).default(['extensions', 'graphql_public', 'realtime', 'supabase_migrations'])
});

type SnapshotRequest = z.infer<typeof RequestSchema>;

interface InputQuestion {
  key: string;
  prompt: string;
  accepted?: string[];
  example: string;
  required: boolean;
}

interface NeedInputResponse {
  status: 'need_input';
  message: string;
  questions: InputQuestion[];
  next_action: string;
  partial_data?: Partial<SnapshotRequest>;
}

interface SuccessResponse {
  status: 'success';
  snapshot_id: string;
  environment: string;
  captured_at: string;
  metadata: {
    total_objects: number;
    schemas_included: string[];
    latest_migration: string | null;
    git_ref: string | null;
    app_version: string | null;
    source: string;
  };
}

// ============================================
// 質問定義
// ============================================

const INPUT_QUESTIONS: InputQuestion[] = [
  {
    key: 'env',
    prompt: 'Which environment are we snapshotting?',
    accepted: ['local', 'development', 'staging', 'production'],
    example: 'development',
    required: true
  },
  {
    key: 'git_ref',
    prompt: 'What git ref (branch or commit) should we tag?',
    accepted: ['branch', 'commit'],
    example: 'main',
    required: false
  },
  {
    key: 'app_version',
    prompt: 'What app version should we record?',
    example: '2025.12.28+build.1',
    required: false
  },
  {
    key: 'source',
    prompt: 'Where is this request initiated?',
    accepted: ['manual', 'ci', 'cron'],
    example: 'manual',
    required: true
  }
];

// ============================================
// メイン Edge Function ハンドラー
// ============================================

Deno.serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const logger = createEdgeLogger(req, 'schema-snapshots');
  const functionMeta = getEdgeFunctionMeta();

  logger.info('Schema snapshots request received', {
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
    // 2. 認証チェック
    // ============================================

    const authResult = await checkAuthentication(req, logger);
    if (!authResult.authenticated) {
      // 認証情報不足の場合は質問リストを返却
      return createCorsResponse({
        status: 'need_input',
        message: 'Missing authentication.',
        questions: [
          {
            key: 'auth_token',
            prompt: 'Provide a Supabase service_role JWT in Authorization: Bearer <token> or x-api-key header.',
            accepted: ['Authorization: Bearer <service_role>', 'x-api-key'],
            example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...',
            required: true
          }
        ],
        next_action: 'Reply with a POST containing the authentication header as indicated.'
      } as NeedInputResponse, req, 400);
    }

    // ============================================
    // 3. リクエストボディ解析
    // ============================================

    let requestBody: Partial<SnapshotRequest> = {};
    try {
      const rawBody = await req.text();
      if (rawBody.trim()) {
        requestBody = JSON.parse(rawBody);
      }
    } catch {
      // 空またはJSON解析失敗は空オブジェクトとして扱う
      requestBody = {};
    }

    // ============================================
    // 4. 不足パラメータチェック
    // ============================================

    const missingInputs = checkMissingInputs(requestBody);

    if (missingInputs.length > 0) {
      logger.info('Missing inputs detected, returning question list', {
        missing_keys: missingInputs.map(q => q.key),
        partial_data: requestBody
      });

      return createCorsResponse({
        status: 'need_input',
        message: 'Missing required inputs.',
        questions: missingInputs,
        next_action: 'Reply with a POST containing the missing fields in JSON or headers as indicated.',
        partial_data: requestBody
      } as NeedInputResponse, req, 400);
    }

    // ============================================
    // 5. バリデーション通過 → 実行
    // ============================================

    const validatedRequest = RequestSchema.parse(requestBody);

    const result = await performSchemaSnapshot(
      validatedRequest,
      functionMeta.requestId,
      logger
    );

    // ============================================
    // 6. 成功レスポンス
    // ============================================

    const latencyMs = Date.now() - startTime;

    logger.info('Schema snapshot completed successfully', {
      snapshot_id: result.snapshot_id,
      environment: validatedRequest.env,
      total_objects: result.metadata.total_objects,
      latency_ms: latencyMs
    });

    return createCorsResponse({
      status: 'success',
      ...result
    } as SuccessResponse, req);

  } catch (error) {
    const latencyMs = Date.now() - startTime;

    logger.error('Schema snapshot failed', {
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
// 認証チェック
// ============================================

async function checkAuthentication(
  req: Request,
  logger: EdgeLogger
): Promise<{ authenticated: boolean; user?: AuthenticatedUser }> {
  // x-api-key ヘッダーチェック
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    const expectedKey = Deno.env.get('SCHEMA_SNAPSHOT_API_KEY');
    if (expectedKey && apiKey === expectedKey) {
      logger.info('Authenticated via x-api-key');
      return { authenticated: true };
    }
  }

  // Authorization Bearer トークンチェック
  try {
    const user = await requireAuth(req, logger);
    return { authenticated: true, user };
  } catch (error) {
    if (error instanceof EdgeAuthError) {
      logger.warn('Authentication failed', { error: error.message });
      return { authenticated: false };
    }
    throw error;
  }
}

// ============================================
// 不足パラメータチェック
// ============================================

function checkMissingInputs(
  requestBody: Partial<SnapshotRequest>
): InputQuestion[] {
  const missing: InputQuestion[] = [];

  for (const question of INPUT_QUESTIONS) {
    const key = question.key as keyof SnapshotRequest;
    const value = requestBody[key];

    if (question.required && (value === undefined || value === null || value === '')) {
      missing.push(question);
    }
  }

  return missing;
}

// ============================================
// スキーマスナップショット実行
// ============================================

async function performSchemaSnapshot(
  request: SnapshotRequest,
  requestId: string,
  logger: EdgeLogger
): Promise<Omit<SuccessResponse, 'status'>> {
  const supabase = createServiceRoleClient();

  try {
    // ============================================
    // 1. スキーマ情報抽出
    // ============================================

    const extractor = createSchemaExtractor(supabase, logger, request.env);

    const schemaObjects = await logger.timed('extract_schema_objects', () =>
      extractor.getAllSchemaObjects()
    );

    // ============================================
    // 2. 最新マイグレーション情報取得
    // ============================================

    let latestMigration: string | null = null;
    try {
      const { data: migrationData } = await supabase
        .rpc('execute_sql', {
          query: `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 1`
        });
      if (migrationData && migrationData.length > 0) {
        latestMigration = migrationData[0].version;
      }
    } catch {
      // マイグレーションテーブルがない場合はスキップ
      logger.warn('Could not fetch migration version');
    }

    // ============================================
    // 3. スナップショット組み立て
    // ============================================

    const totalObjects =
      schemaObjects.tables.length +
      schemaObjects.columns.length +
      schemaObjects.indexes.length +
      schemaObjects.constraints.length +
      schemaObjects.rls_policies.length +
      schemaObjects.functions.length;

    const capturedAt = new Date().toISOString();

    const snapshotData = {
      environment: request.env,
      captured_at: capturedAt,
      schema_objects: schemaObjects,
      metadata: {
        total_objects: totalObjects,
        schemas_included: request.include_schemas,
        latest_migration: latestMigration,
        git_ref: request.git_ref || null,
        app_version: request.app_version || null,
        source: request.source || 'manual'
      }
    };

    // ============================================
    // 4. DBに保存（dry_runでなければ）
    // ============================================

    let snapshotId: string;

    if (!request.dry_run) {
      const { data: insertedSnapshot, error: insertError } = await supabase
        .from('schema_snapshots')
        .insert({
          environment: request.env,
          captured_at: capturedAt,
          schema_json: snapshotData,
          metadata: snapshotData.metadata,
          git_ref: request.git_ref || null,
          app_version: request.app_version || null,
          source: request.source || 'manual'
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Failed to save snapshot: ${insertError.message}`);
      }

      snapshotId = insertedSnapshot.id;

      // ============================================
      // 5. 監査ログ記録
      // ============================================

      auditAsync({
        function_name: 'schema-snapshots',
        actor: 'system:api',
        request_id: requestId,
        trigger_type: 'API',
        trigger_source: request.source || 'manual',
        resource: `schema:${request.env}`,
        row_count: totalObjects,
        latency_ms: 0, // auditAsyncで更新
        success: true,
        payload: {
          environment: request.env,
          snapshot_id: snapshotId,
          total_objects: totalObjects,
          git_ref: request.git_ref,
          app_version: request.app_version
        }
      }, logger);
    } else {
      snapshotId = `dry-run-${requestId}`;
      logger.info('Dry run mode - snapshot not saved', {
        total_objects: totalObjects
      });
    }

    // ============================================
    // 6. 結果返却
    // ============================================

    return {
      snapshot_id: snapshotId,
      environment: request.env!,
      captured_at: capturedAt,
      metadata: {
        total_objects: totalObjects,
        schemas_included: request.include_schemas,
        latest_migration: latestMigration,
        git_ref: request.git_ref || null,
        app_version: request.app_version || null,
        source: request.source || 'manual'
      }
    };

  } catch (error) {
    logger.error('Schema snapshot execution failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: request.env
    });
    throw error;
  }
}
