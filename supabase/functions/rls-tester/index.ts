/**
 * RLS Tester Edge Function - 安全化リファクタ版
 * AIOHub Phase 3 - EPIC 3-2
 * 
 * 【重要な実装方針】
 * - 並列度は環境変数で調整可能（RLS_TEST_MAX_CONCURRENCY）
 * - 大量シナリオ時はバッチ分割を推奨（実行時間制限対策）
 * - service_role でDB接続、SQL Function経由でRLS下テスト実行
 * - 失敗時のリトライは慎重に（RLSエラーは仕様上の失敗）
 * - 実行状況を rls_test_runs で管理し、異常時も必ず状態更新
 * - test_data vs test_data_used: test_data (シナリオ定義) → test_data_used (実際使用データ)
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// =========================================================
// 環境変数・設定値
// =========================================================

// 並列実行数の上限（環境変数で調整可能）
const MAX_CONCURRENCY = Number(Deno.env.get('RLS_TEST_MAX_CONCURRENCY') ?? '5');

// 実行時間制限（ミリ秒）
const EXECUTION_TIMEOUT_MS = Number(Deno.env.get('RLS_TEST_TIMEOUT_MS') ?? '600000'); // 10分

// ログ出力制限（大きなJSONの出力を制限）
const MAX_LOG_SIZE = Number(Deno.env.get('RLS_TEST_MAX_LOG_SIZE') ?? '1000');

// バッチサイズ（大量シナリオ時の分割単位）
const BATCH_SIZE = Number(Deno.env.get('RLS_TEST_BATCH_SIZE') ?? '100');

// =========================================================
// 型定義
// =========================================================

interface RLSTestRequest {
  trigger_source?: string; // 'github-actions', 'super-admin-console', etc.
  git_commit?: string;
  git_branch?: string;
  suite_name?: string; // 特定のテストスイートのみ実行する場合
  environment?: string;
  max_scenarios?: number; // 実行シナリオ数の上限（デバッグ用）
}

interface TestUser {
  id: string;
  role_name: string;
  organization_id?: string;
  user_role: string;
  jwt_template: Record<string, any>;
  description?: string;
}

interface TestScenario {
  id: string;
  scenario_name: string;
  target_table: string;
  target_schema: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  expected_result: 'ALLOW' | 'DENY';
  test_data?: Record<string, any>;
  test_conditions?: string;
  category: string;
  priority: number;
  description?: string;
}

interface TestResult {
  success: boolean;
  scenario_id: string;
  test_user_id: string;
  test_run_id: string;
  scenario_name: string;
  target_table: string;
  operation: string;
  test_user_role: string;
  expected_result: 'ALLOW' | 'DENY';
  actual_result: 'ALLOW' | 'DENY' | 'ERROR';
  row_count?: number;
  execution_time_ms: number;
  error_code?: string;
  error_message?: string;
  error_details?: Record<string, any>;
  [key: string]: any;
}

interface TestRunSummary {
  test_run_id: string;
  total: number;
  passed: number;
  failed: number;
  error: number;
  success_rate: number;
  execution_time_ms: number;
  status: 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
}

// =========================================================
// 並列実行制御クラス（改良版）
// =========================================================

class PromiseLimit {
  private running = 0;
  private queue: Array<() => void> = [];
  
  constructor(private limit: number) {}
  
  async add<T>(promiseFactory: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.running++;
        try {
          const result = await promiseFactory();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };
      
      if (this.running < this.limit) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
  
  private processQueue() {
    if (this.queue.length > 0 && this.running < this.limit) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
  
  // 実行中のタスク数を取得
  getRunningCount(): number {
    return this.running;
  }
  
  // キュー内の待機タスク数を取得
  getQueuedCount(): number {
    return this.queue.length;
  }
}

// =========================================================
// ユーティリティ関数
// =========================================================

// 安全なログ出力（大きなオブジェクトを制限）
function safeLog(message: string, data?: any): void {
  if (data) {
    const jsonStr = JSON.stringify(data);
    if (jsonStr.length > MAX_LOG_SIZE) {
      console.log(`${message} [truncated, size: ${jsonStr.length}]`, 
        JSON.stringify(data, null, 2).substring(0, MAX_LOG_SIZE) + '...');
    } else {
      console.log(message, data);
    }
  } else {
    console.log(message);
  }
}

// 実行時間の人間可読形式変換
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// =========================================================
// メインエントリポイント
// =========================================================

Deno.serve(async (req: Request) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }
  
  const startTime = Date.now();
  let testRunId: string | null = null;
  
  try {
    // =========================================================
    // 1. 初期設定・認証確認
    // =========================================================
    
    // 認証チェック（service_role または適切な権限の確認）
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 環境変数確認
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // service_role でSupabaseクライアント作成
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // =========================================================
    // 2. リクエスト解析・バリデーション
    // =========================================================
    
    let requestBody: RLSTestRequest = {};
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
      } catch (error) {
        console.warn('Failed to parse request body, using defaults:', error.message);
      }
    }
    
    safeLog('RLS Tester started', {
      trigger_source: requestBody.trigger_source,
      suite_name: requestBody.suite_name,
      max_concurrency: MAX_CONCURRENCY,
      timeout_ms: EXECUTION_TIMEOUT_MS
    });
    
    // =========================================================
    // 3. テストラン開始
    // =========================================================
    
    const { data: testRun, error: runError } = await supabase
      .from('rls_test_runs')
      .insert({
        trigger_type: requestBody.trigger_source?.includes('github') ? 'CI' : 'MANUAL',
        trigger_source: requestBody.trigger_source || 'edge-function-manual',
        suite_name: requestBody.suite_name || 'default',
        git_commit_hash: requestBody.git_commit,
        git_branch: requestBody.git_branch,
        environment: requestBody.environment || 'development',
        status: 'RUNNING',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (runError) {
      console.error('Failed to create test run:', runError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create test run', 
          details: runError.message 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    testRunId = testRun.id;
    console.log(`Test run created: ${testRunId}`);
    
    // =========================================================
    // 4. テストデータ取得
    // =========================================================
    
    // テストユーザー取得
    const { data: testUsers, error: usersError } = await supabase
      .from('rls_test_users')
      .select('*')
      .eq('is_active', true)
      .order('role_name');
    
    if (usersError) {
      console.error('Failed to fetch test users:', usersError);
      await updateTestRunStatus(supabase, testRunId, 'FAILED', 'Failed to fetch test users', {
        total: 0, passed: 0, failed: 0, error: 0
      });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch test users', 
          details: usersError.message 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // テストシナリオ取得
    let scenariosQuery = supabase
      .from('rls_test_scenarios')
      .select('*')
      .eq('is_active', true);
    
    // スイート名でフィルタリング
    if (requestBody.suite_name && requestBody.suite_name !== 'default') {
      scenariosQuery = scenariosQuery.eq('category', requestBody.suite_name);
    }
    
    const { data: testScenarios, error: scenariosError } = await scenariosQuery
      .order('priority')
      .order('created_at');
    
    if (scenariosError) {
      console.error('Failed to fetch test scenarios:', scenariosError);
      await updateTestRunStatus(supabase, testRunId, 'FAILED', 'Failed to fetch test scenarios', {
        total: 0, passed: 0, failed: 0, error: 0
      });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch test scenarios', 
          details: scenariosError.message 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // =========================================================
    // 5. 実行プラン作成・制限適用
    // =========================================================
    
    // テスト組み合わせ生成
    const testCombinations: Array<{ user: TestUser; scenario: TestScenario }> = [];
    for (const user of testUsers) {
      for (const scenario of testScenarios) {
        testCombinations.push({ user, scenario });
      }
    }
    
    // 実行数制限（デバッグ用・大量実行時の安全装置）
    let effectiveCombinations = testCombinations;
    if (requestBody.max_scenarios && requestBody.max_scenarios > 0) {
      effectiveCombinations = testCombinations.slice(0, requestBody.max_scenarios);
      console.log(`Limiting execution to ${requestBody.max_scenarios} scenarios (debug mode)`);
    }
    
    const totalCombinations = effectiveCombinations.length;
    console.log(`Planning execution: ${testUsers.length} users × ${testScenarios.length} scenarios = ${totalCombinations} tests`);
    
    // 大量実行時の警告
    if (totalCombinations > BATCH_SIZE * 2) {
      console.warn(`⚠️ Large test execution detected (${totalCombinations} tests). Consider batch processing.`);
      // TODO: 将来的に自動バッチ分割実装
    }
    
    // Promise.race タイムアウト設定関数
    const createTimeoutPromise = (): Promise<never> => {
      return new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Execution timeout after ${formatDuration(EXECUTION_TIMEOUT_MS)}`));
        }, EXECUTION_TIMEOUT_MS);
      });
    };
    
    // =========================================================
    // 6. 並列テスト実行
    // =========================================================
    
    const promiseLimit = new PromiseLimit(MAX_CONCURRENCY);
    let completedTests = 0;
    let successfulResults: TestResult[] = [];
    let errors: string[] = [];
    
    // 単一テスト実行関数
    const executeTest = async (combination: { user: TestUser; scenario: TestScenario }): Promise<TestResult | null> => {
      try {
        // SQL Function 呼び出し
        const { data: result, error } = await supabase.rpc('run_single_rls_test', {
          p_scenario_id: combination.scenario.id,
          p_test_user_id: combination.user.id,
          p_test_run_id: testRunId
        });
        
        if (error) {
          const errorMsg = `${combination.scenario.scenario_name} (${combination.user.role_name}): ${error.message}`;
          console.error('Test execution failed:', errorMsg);
          errors.push(errorMsg);
          return null;
        }
        
        // 結果保存（非同期、エラーは記録するが実行は継続）
        try {
          const { error: insertError } = await supabase.rpc('insert_rls_test_result', {
            p_result: result
          });
          
          if (insertError) {
            const errorMsg = `Failed to save result for ${combination.scenario.scenario_name}: ${insertError.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        } catch (insertErr) {
          const errorMsg = `Unexpected error saving result: ${insertErr.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
        
        completedTests++;
        
        // 進捗ログ（適度な間隔で出力）
        if (completedTests % Math.max(10, Math.floor(totalCombinations / 20)) === 0) {
          console.log(`Progress: ${completedTests}/${totalCombinations} (${Math.round(completedTests / totalCombinations * 100)}%) - Running: ${promiseLimit.getRunningCount()}, Queued: ${promiseLimit.getQueuedCount()}`);
        }
        
        return result as TestResult;
        
      } catch (error) {
        const errorMsg = `Unexpected error in ${combination.scenario.scenario_name}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        
        // エラー結果もデータベースに記録
        try {
          const errorResult = {
            test_run_id: testRunId,
            scenario_id: combination.scenario.id,
            test_user_id: combination.user.id,
            scenario_name: combination.scenario.scenario_name,
            target_table: combination.scenario.target_table,
            operation: combination.scenario.operation,
            test_user_role: combination.user.user_role,
            expected_result: combination.scenario.expected_result,
            actual_result: 'ERROR' as const,
            success: false,
            execution_time_ms: 0,
            error_code: 'UNEXPECTED_ERROR',
            error_message: error.message,
            // test_data_used: シナリオの test_data を実際に使用したデータとして記録
            test_data_used: combination.scenario.test_data || null
          };
          
          await supabase.from('rls_test_results').insert(errorResult);
        } catch (insertErr) {
          console.error('Failed to insert error result:', insertErr);
        }
        
        return null;
      }
    };
    
    // 全テスト並列実行
    console.log(`Starting test execution with concurrency: ${MAX_CONCURRENCY}`);
    const testPromises = effectiveCombinations.map(combination => 
      promiseLimit.add(() => executeTest(combination))
    );
    
    // Promise.race でタイムアウト制御
    let testResults: PromiseSettledResult<TestResult | null>[];
    try {
      const allTestsPromise = Promise.allSettled(testPromises);
      testResults = await Promise.race([
        allTestsPromise,
        createTimeoutPromise()
      ]) as PromiseSettledResult<TestResult | null>[];
    } catch (timeoutError) {
      console.error('⏰ Test execution timed out:', timeoutError.message);
      await updateTestRunStatus(supabase, testRunId, 'TIMEOUT', timeoutError.message, {
        total: 0, passed: 0, failed: 0, error: effectiveCombinations.length
      });
      return new Response(
        JSON.stringify({ 
          error: 'Test execution timeout', 
          details: timeoutError.message,
          test_run_id: testRunId 
        }), 
        { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // =========================================================
    // 7. 結果集計・分析
    // =========================================================
    
    successfulResults = testResults
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value as TestResult);
    
    const passed = successfulResults.filter(r => r.success).length;
    const failed = successfulResults.filter(r => !r.success && r.actual_result !== 'ERROR').length;
    const errorResults = successfulResults.filter(r => r.actual_result === 'ERROR').length;
    const total = successfulResults.length;
    const successRate = total > 0 ? Math.round((passed / total) * 100 * 100) / 100 : 0;
    
    const executionTimeMs = Date.now() - startTime;
    
    // 結果分析
    const resultSummary = {
      by_result: {
        passed,
        failed,
        error: errorResults
      },
      by_category: groupByCategory(successfulResults, testScenarios),
      by_table: groupByTable(successfulResults),
      by_user_role: groupByUserRole(successfulResults),
      errors: errors.slice(0, 20), // 最初の20個のエラーのみ保存
      execution_info: {
        total_combinations: totalCombinations,
        executed_combinations: total,
        max_concurrency: MAX_CONCURRENCY,
        execution_time: formatDuration(executionTimeMs)
      }
    };
    
    // =========================================================
    // 8. テストラン結果更新
    // =========================================================
    
    const runStatus = (failed > 0 || errorResults > 0 || errors.length > 0) ? 'FAILED' : 'COMPLETED';
    
    const { error: updateError } = await supabase
      .from('rls_test_runs')
      .update({
        status: runStatus,
        total_scenarios: total,
        passed_scenarios: passed,
        failed_scenarios: failed,
        error_scenarios: errorResults,
        execution_time_ms: executionTimeMs,
        completed_at: new Date().toISOString(),
        result_summary: resultSummary,
        error_summary: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
      })
      .eq('id', testRunId);
    
    if (updateError) {
      console.error('Failed to update test run:', updateError);
    }
    
    // =========================================================
    // 9. レスポンス構築・通知
    // =========================================================
    
    const response: TestRunSummary = {
      test_run_id: testRunId,
      total,
      passed,
      failed: failed + errorResults, // CI判定用：failedにerrorも含める
      error: errorResults,
      success_rate: successRate,
      execution_time_ms: executionTimeMs,
      status: runStatus
    };
    
    console.log(`RLS Tester completed: ${runStatus}, ${passed}/${total} passed (${successRate}%), ${formatDuration(executionTimeMs)}`);
    
    // 失敗時の通知処理（TODO）
    if (runStatus === 'FAILED' && requestBody.trigger_source !== 'github-actions') {
      // TODO: Slack/Email通知の実装
      console.log('TODO: Send failure notification for non-CI execution');
    }
    
    return new Response(
      JSON.stringify(response), 
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('Edge Function critical error:', error);
    
    // 可能であればテストラン状態を更新
    if (testRunId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await updateTestRunStatus(supabase, testRunId, 'FAILED', `Critical error: ${error.message}`, {
            total: 0, passed: 0, failed: 0, error: 1
          });
        }
      } catch (updateErr) {
        console.error('Failed to update test run status after critical error:', updateErr);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        test_run_id: testRunId 
      }), 
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// =========================================================
// ヘルパー関数群
// =========================================================

// テストラン状態更新
async function updateTestRunStatus(
  supabase: any, 
  testRunId: string, 
  status: string, 
  errorMessage?: string,
  scenarioCounts?: { total?: number; passed?: number; failed?: number; error?: number }
): Promise<void> {
  try {
    const updateData: any = {
      status,
      completed_at: new Date().toISOString(),
      error_summary: errorMessage
    };
    
    // シナリオ数も含める場合
    if (scenarioCounts) {
      if (scenarioCounts.total !== undefined) updateData.total_scenarios = scenarioCounts.total;
      if (scenarioCounts.passed !== undefined) updateData.passed_scenarios = scenarioCounts.passed;
      if (scenarioCounts.failed !== undefined) updateData.failed_scenarios = scenarioCounts.failed;
      if (scenarioCounts.error !== undefined) updateData.error_scenarios = scenarioCounts.error;
    }
    
    await supabase
      .from('rls_test_runs')
      .update(updateData)
      .eq('id', testRunId);
  } catch (error) {
    console.error('Failed to update test run status:', error);
  }
}

// カテゴリ別集計（改良版）
function groupByCategory(results: TestResult[], scenarios: TestScenario[]): Record<string, { total: number; passed: number }> {
  const scenarioMap = new Map(scenarios.map(s => [s.id, s.category]));
  const groups: Record<string, { total: number; passed: number }> = {};
  
  results.forEach(result => {
    const category = scenarioMap.get(result.scenario_id) || 'unknown';
    if (!groups[category]) {
      groups[category] = { total: 0, passed: 0 };
    }
    groups[category].total++;
    if (result.success) {
      groups[category].passed++;
    }
  });
  
  return groups;
}

// テーブル別集計
function groupByTable(results: TestResult[]): Record<string, { total: number; passed: number }> {
  const groups: Record<string, { total: number; passed: number }> = {};
  
  results.forEach(result => {
    const table = result.target_table || 'unknown';
    if (!groups[table]) {
      groups[table] = { total: 0, passed: 0 };
    }
    groups[table].total++;
    if (result.success) {
      groups[table].passed++;
    }
  });
  
  return groups;
}

// ユーザーロール別集計
function groupByUserRole(results: TestResult[]): Record<string, { total: number; passed: number }> {
  const groups: Record<string, { total: number; passed: number }> = {};
  
  results.forEach(result => {
    const role = result.test_user_role || 'unknown';
    if (!groups[role]) {
      groups[role] = { total: 0, passed: 0 };
    }
    groups[role].total++;
    if (result.success) {
      groups[role].passed++;
    }
  });
  
  return groups;
}

// =========================================================
// 実装上の重要な注意点（コメント）
// =========================================================

/*
【Edge Function 実装における重要ポイント】

1. **並列度制御**
   - MAX_CONCURRENCY 環境変数で調整可能（デフォルト5）
   - DB接続プールの枯渇を防ぐため保守的な値を推奨
   - 大量実行時は Supabase の接続数制限に注意

2. **実行時間制限**
   - EXECUTION_TIMEOUT_MS で全体タイムアウト設定
   - 大量シナリオ時はバッチ分割を推奨
   - タイムアウト時は status='TIMEOUT' で記録

3. **エラーハンドリング**
   - 個別テストの失敗は全体実行を停止しない
   - 例外を握りつぶさず適切にログ出力
   - テストラン状態は必ず更新（異常終了時も）

4. **ログ出力制限**
   - 大きなJSONオブジェクトは切り詰め
   - 機密情報（JWT claims等）のログ出力は最小限
   - 進捗は適度な間隔で出力

5. **メモリ・パフォーマンス対策**
   - 結果データの蓄積を制限
   - 不要なデータの早期解放
   - Promise.allSettled で例外の伝播を制御

6. **今後の改善ポイント（TODO）**
   - バッチ分割処理の実装
   - リトライ機能の追加（ネットワーク一過性エラー用）
   - 実行キャンセル機能
   - Slack/Email通知の実装
   - 実行履歴の自動クリーンアップ

7. **運用上の注意**
   - 本番環境では代表的なシナリオに限定を推奨
   - 営業時間外・低負荷時の実行を検討
   - 定期的な実行結果の分析とアラート設定
*/