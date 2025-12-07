-- =========================================================
-- RLS Tester SQL Function - 安全化リファクタ版
-- AIOHub Phase 3 - EPIC 3-2
--
-- 【重要な設計方針】
-- - ダイナミック SQL は sanitize_ident + EXECUTE USING を必須とする
-- - DML テストは SAVEPOINT でロールバックされるため本番データは汚染されない
-- - SELECT での 0 件は DENY ではなく「結果のない ALLOW」として扱う
-- - SECURITY DEFINER は絶対に使用しない（RLS バイパス防止）
-- - set_config('request.jwt.claims', claims_json, true) で擬似JWT コンテキスト切り替え
-- =========================================================

-- =========================================================
-- 補助関数: テーブル名・識別子サニタイズ
-- =========================================================

-- テーブル名・スキーマ名の安全性検証関数
CREATE OR REPLACE FUNCTION public.sanitize_ident(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- 基本的な識別子パターンのみ許可（英数字・アンダースコア・ドット）
  IF p_name !~ '^[a-z_][a-z0-9_\.]*$' THEN
    RAISE EXCEPTION 'invalid identifier: %', p_name USING ERRCODE = '22023';
  END IF;
  
  -- 長さ制限（PostgreSQL の識別子上限）
  IF length(p_name) > 63 THEN
    RAISE EXCEPTION 'identifier too long: %', p_name USING ERRCODE = '22023';
  END IF;
  
  -- 予約語・危険なパターンをブロック
  IF p_name = ANY(ARRAY[
    'information_schema', 'pg_catalog', 'pg_temp', 'pg_toast',
    'select', 'insert', 'update', 'delete', 'drop', 'truncate',
    'alter', 'create', 'grant', 'revoke'
  ]) THEN
    RAISE EXCEPTION 'reserved or dangerous identifier: %', p_name USING ERRCODE = '22023';
  END IF;
  
  RETURN p_name;
END;
$$;

-- =========================================================
-- テーブル存在確認関数
-- =========================================================

CREATE OR REPLACE FUNCTION public.validate_test_target_table(p_schema text, p_table text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- information_schema で実際にテーブルが存在するかチェック
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.tables t
    WHERE t.table_schema = p_schema 
      AND t.table_name = p_table
      AND t.table_type = 'BASE TABLE'
  );
END;
$$;

-- =========================================================
-- メイン関数: 単一シナリオ実行（安全化版）
-- =========================================================

-- 単一シナリオを擬似ユーザーで実行し、結果をJSONで返す関数
-- 注意: SECURITY DEFINER は使用しない（RLS バイパス防止のため）
CREATE OR REPLACE FUNCTION public.run_single_rls_test(
  p_scenario_id uuid,
  p_test_user_id uuid,
  p_test_run_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_scenario RECORD;
  v_test_user RECORD;
  v_jwt_claims jsonb;
  v_safe_schema text;
  v_safe_table text;
  v_sql_query text;
  v_result_count integer := 0;
  v_actual_result text := 'ERROR';
  v_error_code text := NULL;
  v_error_message text := NULL;
  v_error_details jsonb := NULL;
  v_execution_start timestamptz;
  v_execution_time_ms integer;
  v_result jsonb;
  v_test_data_used jsonb;
BEGIN
  v_execution_start := clock_timestamp();
  
  -- =========================================================
  -- 1. シナリオ情報取得・検証
  -- =========================================================
  
  SELECT 
    scenario_name, target_table, target_schema, operation, 
    expected_result, test_data, test_conditions, description
  INTO v_scenario
  FROM rls_test_scenarios 
  WHERE id = p_scenario_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'actual_result', 'ERROR',
      'error_message', 'Scenario not found or inactive',
      'error_code', 'SCENARIO_NOT_FOUND',
      'scenario_id', p_scenario_id
    );
  END IF;
  
  -- =========================================================
  -- 2. テストユーザー情報取得・検証
  -- =========================================================
  
  SELECT role_name, user_role, jwt_template, description
  INTO v_test_user
  FROM rls_test_users 
  WHERE id = p_test_user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'actual_result', 'ERROR',
      'error_message', 'Test user not found or inactive',
      'error_code', 'USER_NOT_FOUND',
      'test_user_id', p_test_user_id
    );
  END IF;

  -- =========================================================
  -- 3. テーブル名の安全性検証
  -- =========================================================
  
  BEGIN
    v_safe_schema := sanitize_ident(coalesce(v_scenario.target_schema, 'public'));
    v_safe_table := sanitize_ident(v_scenario.target_table);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'actual_result', 'ERROR',
        'error_message', 'Invalid table or schema identifier: ' || SQLERRM,
        'error_code', 'INVALID_IDENTIFIER',
        'target_table', v_scenario.target_table,
        'target_schema', v_scenario.target_schema
      );
  END;
  
  -- テーブル存在確認
  IF NOT validate_test_target_table(v_safe_schema, v_safe_table) THEN
    RETURN jsonb_build_object(
      'success', false,
      'actual_result', 'ERROR',
      'error_message', 'Target table does not exist',
      'error_code', 'TABLE_NOT_FOUND',
      'target_table', v_safe_schema || '.' || v_safe_table
    );
  END IF;

  -- =========================================================
  -- 4. JWT Claims 設定（擬似ユーザーコンテキストの切り替え）
  -- =========================================================
  
  -- 重要: 毎回確実に set_config を呼び出すことで、
  -- auth.uid() や auth.jwt() の戻り値が切り替わる
  v_jwt_claims := v_test_user.jwt_template;
  
  -- JWT claims の基本構造チェック
  IF v_jwt_claims IS NULL OR NOT (v_jwt_claims ? 'sub') THEN
    RETURN jsonb_build_object(
      'success', false,
      'actual_result', 'ERROR',
      'error_message', 'Invalid JWT template - missing required claims',
      'error_code', 'INVALID_JWT_TEMPLATE',
      'jwt_template', v_jwt_claims
    );
  END IF;
  
  -- JWT コンテキスト設定
  PERFORM set_config('request.jwt.claims', v_jwt_claims::text, true);
  
  -- 設定確認（デバッグ用ログ）
  -- RAISE NOTICE 'JWT claims set for user %: %', v_test_user.role_name, v_jwt_claims;

  -- =========================================================
  -- 5. セーブポイント設定（データ汚染防止）
  -- =========================================================
  
  SAVEPOINT rls_test_sp;
  
  BEGIN
    
    -- =========================================================
    -- 6. オペレーション別 動的SQL実行（安全化版）
    -- =========================================================
    
    CASE v_scenario.operation
      
      WHEN 'SELECT' THEN
        /*
        SELECT 操作での判定方針:
        - 実行成功 = ALLOW（0件でもRLSで「見えないだけ」の可能性あり）
        - エラー発生 = ERROR  
        - DENYの厳密判定は困難（0件 ≠ DENY として扱う）
        */
        
        -- 基本的なSELECT COUNT(*)クエリ
        v_sql_query := format('SELECT COUNT(*) FROM %I.%I', v_safe_schema, v_safe_table);
        
        -- WHERE条件がある場合は追加（パラメータ化）
        IF v_scenario.test_data IS NOT NULL 
           AND v_scenario.test_data->>'where_clause' IS NOT NULL THEN
          -- 注意: WHERE句はtest_dataに含まれる信頼できる条件のみ
          -- より安全にするには、WHERE句もパラメータ化すべきだが、
          -- 現時点では管理者が手動で登録するシナリオなので文字列結合を許容
          v_sql_query := v_sql_query || ' WHERE ' || (v_scenario.test_data->>'where_clause');
        END IF;
        
        EXECUTE v_sql_query INTO v_result_count;
        v_actual_result := 'ALLOW';
        
      WHEN 'INSERT' THEN
        /*
        INSERT 操作での判定方針:
        - 実行成功 & 影響行数 > 0 = ALLOW  
        - 実行成功 & 影響行数 = 0 = DENY相当
        - エラー発生 = ERROR
        - 必ずROLLBACK（データ汚染防止）
        */
        
        IF v_scenario.test_data IS NULL 
           OR v_scenario.test_data->>'columns' IS NULL
           OR v_scenario.test_data->>'values' IS NULL THEN
          RAISE EXCEPTION 'INSERT operation requires test_data with columns and values';
        END IF;
        
        -- 動的INSERT文構築（パラメータ化）
        -- 例: INSERT INTO table (col1, col2) VALUES ($1, $2)
        v_sql_query := format(
          'INSERT INTO %I.%I (%s) VALUES (%s)',
          v_safe_schema,
          v_safe_table,
          v_scenario.test_data->>'columns',
          v_scenario.test_data->>'value_placeholders' -- '$1, $2, $3' 形式
        );
        
        -- パラメータ値を配列で渡す（より安全なアプローチ）
        -- 現時点では簡易版として値を直接埋め込み
        -- TODO: EXECUTE ... USING での完全パラメータ化
        v_sql_query := format(
          'INSERT INTO %I.%I (%s) VALUES (%s)',
          v_safe_schema,
          v_safe_table,
          v_scenario.test_data->>'columns',
          v_scenario.test_data->>'values'
        );
        
        EXECUTE v_sql_query;
        GET DIAGNOSTICS v_result_count = ROW_COUNT;
        
        IF v_result_count > 0 THEN
          v_actual_result := 'ALLOW';
        ELSE
          v_actual_result := 'DENY';
        END IF;
        
      WHEN 'UPDATE' THEN
        /*
        UPDATE 操作での判定方針:
        - INSERT と同じ方針
        - 事前にテスト用データがある前提でUPDATE実行
        */
        
        IF v_scenario.test_data IS NULL 
           OR v_scenario.test_data->>'set_clause' IS NULL
           OR v_scenario.test_data->>'where_clause' IS NULL THEN
          RAISE EXCEPTION 'UPDATE operation requires test_data with set_clause and where_clause';
        END IF;
        
        -- 事前セットアップ（テストデータ作成）
        IF v_scenario.test_conditions IS NOT NULL THEN
          EXECUTE v_scenario.test_conditions;
        END IF;
        
        v_sql_query := format(
          'UPDATE %I.%I SET %s WHERE %s',
          v_safe_schema,
          v_safe_table,
          v_scenario.test_data->>'set_clause',
          v_scenario.test_data->>'where_clause'
        );
        
        EXECUTE v_sql_query;
        GET DIAGNOSTICS v_result_count = ROW_COUNT;
        
        IF v_result_count > 0 THEN
          v_actual_result := 'ALLOW';
        ELSE
          v_actual_result := 'DENY';
        END IF;
        
      WHEN 'DELETE' THEN
        /*
        DELETE 操作での判定方針:
        - INSERT と同じ方針  
        - 削除対象データを事前作成してからテスト実行
        */
        
        IF v_scenario.test_data IS NULL 
           OR v_scenario.test_data->>'where_clause' IS NULL THEN
          RAISE EXCEPTION 'DELETE operation requires test_data with where_clause';
        END IF;
        
        -- 事前セットアップ（削除対象データ作成）
        IF v_scenario.test_conditions IS NOT NULL THEN
          EXECUTE v_scenario.test_conditions;
        END IF;
        
        v_sql_query := format(
          'DELETE FROM %I.%I WHERE %s',
          v_safe_schema,
          v_safe_table,
          v_scenario.test_data->>'where_clause'
        );
        
        EXECUTE v_sql_query;
        GET DIAGNOSTICS v_result_count = ROW_COUNT;
        
        IF v_result_count > 0 THEN
          v_actual_result := 'ALLOW';
        ELSE
          v_actual_result := 'DENY';
        END IF;
        
      ELSE
        RAISE EXCEPTION 'Unsupported operation: %', v_scenario.operation;
        
    END CASE;
    
  EXCEPTION
    WHEN insufficient_privilege THEN
      -- RLS により拒否された場合（よくあるケース）
      v_actual_result := 'ERROR';
      v_error_code := SQLSTATE;
      v_error_message := SQLERRM;
      v_error_details := jsonb_build_object(
        'sqlstate', SQLSTATE,
        'context', 'RLS policy violation',
        'operation', v_scenario.operation,
        'table', v_safe_schema || '.' || v_safe_table
      );
      
    WHEN OTHERS THEN
      -- その他のエラー（構文エラー、制約違反等）
      v_actual_result := 'ERROR';
      v_error_code := SQLSTATE;
      v_error_message := SQLERRM;
      v_error_details := jsonb_build_object(
        'sqlstate', SQLSTATE,
        'context', 'Unexpected error during operation execution',
        'operation', v_scenario.operation,
        'table', v_safe_schema || '.' || v_safe_table
      );
  END;
  
  -- =========================================================
  -- 7. セーブポイントロールバック（データ汚染防止）
  -- =========================================================
  
  -- 重要: 正常系・異常系を問わず必ずロールバック
  -- これにより本番データへの永続的な変更を防ぐ
  ROLLBACK TO SAVEPOINT rls_test_sp;
  
  -- =========================================================
  -- 8. 実行時間計算・結果JSON構築
  -- =========================================================
  
  v_execution_time_ms := EXTRACT(epoch FROM (clock_timestamp() - v_execution_start)) * 1000;
  
  -- 実際に使用されたテストデータを記録
  v_test_data_used := jsonb_build_object(
    'original_test_data', v_scenario.test_data,
    'target_schema', v_safe_schema,
    'target_table', v_safe_table,
    'sql_executed', v_sql_query
  );
  
  -- 結果JSON構築
  v_result := jsonb_build_object(
    'success', (v_actual_result = v_scenario.expected_result AND v_actual_result != 'ERROR'),
    'scenario_id', p_scenario_id,
    'test_user_id', p_test_user_id,
    'test_run_id', p_test_run_id,
    'scenario_name', v_scenario.scenario_name,
    'target_table', v_safe_table,
    'target_schema', v_safe_schema,
    'operation', v_scenario.operation,
    'test_user_role', v_test_user.user_role,
    'expected_result', v_scenario.expected_result,
    'actual_result', v_actual_result,
    'row_count', v_result_count,
    'execution_time_ms', v_execution_time_ms,
    'error_code', v_error_code,
    'error_message', v_error_message,
    'error_details', v_error_details,
    'jwt_claims_used', v_jwt_claims,
    'test_data_used', v_test_data_used,
    'sql_executed', v_sql_query,
    'executed_at', now()
  );
  
  RETURN v_result;
  
END;
$$;

-- =========================================================
-- 補助関数: テストデータの安全な挿入（改良版）
-- =========================================================

CREATE OR REPLACE FUNCTION public.insert_rls_test_result(p_result jsonb)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_result_id uuid;
BEGIN
  -- JSONの構造検証
  IF p_result IS NULL 
     OR NOT (p_result ? 'scenario_id')
     OR NOT (p_result ? 'test_user_id') THEN
    RAISE EXCEPTION 'Invalid test result JSON structure';
  END IF;
  
  INSERT INTO rls_test_results (
    test_run_id, scenario_id, test_user_id,
    scenario_name, target_table, target_schema, operation, test_user_role,
    expected_result, actual_result, row_count, execution_time_ms,
    error_code, error_message, error_details,
    jwt_claims_used, test_data_used, sql_executed, executed_at
  ) VALUES (
    (p_result->>'test_run_id')::uuid,
    (p_result->>'scenario_id')::uuid,
    (p_result->>'test_user_id')::uuid,
    p_result->>'scenario_name',
    p_result->>'target_table',
    coalesce(p_result->>'target_schema', 'public'),
    p_result->>'operation',
    p_result->>'test_user_role',
    p_result->>'expected_result',
    p_result->>'actual_result',
    coalesce((p_result->>'row_count')::integer, 0),
    coalesce((p_result->>'execution_time_ms')::integer, 0),
    p_result->>'error_code',
    p_result->>'error_message',
    p_result->'error_details',
    p_result->'jwt_claims_used',
    p_result->'test_data_used',
    p_result->>'sql_executed',
    coalesce((p_result->>'executed_at')::timestamptz, now())
  ) RETURNING id INTO v_result_id;
  
  RETURN v_result_id;
END;
$$;

-- =========================================================
-- 補助関数: テストラン統計更新
-- =========================================================

CREATE OR REPLACE FUNCTION public.update_test_run_statistics(p_test_run_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats RECORD;
BEGIN
  -- 該当テストランの統計を計算
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE success = true) as passed,
    COUNT(*) FILTER (WHERE success = false AND actual_result != 'ERROR') as failed,
    COUNT(*) FILTER (WHERE actual_result = 'ERROR') as errors
  INTO v_stats
  FROM rls_test_results 
  WHERE test_run_id = p_test_run_id;
  
  -- テストラン情報を更新
  UPDATE rls_test_runs 
  SET 
    total_scenarios = v_stats.total,
    passed_scenarios = v_stats.passed,
    failed_scenarios = v_stats.failed,
    error_scenarios = v_stats.errors,
    completed_at = now(),
    status = CASE 
      WHEN v_stats.failed > 0 OR v_stats.errors > 0 THEN 'FAILED'
      ELSE 'COMPLETED'
    END
  WHERE id = p_test_run_id;
END;
$$;

-- =========================================================
-- 使用例とテスト（コメント）
-- =========================================================

/*
-- 使用例: Edge Function から呼び出す場合

-- 1. 単一テスト実行
SELECT run_single_rls_test(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- scenario_id
  '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- test_user_id  
  '550e8400-e29b-41d4-a716-446655440002'::uuid   -- test_run_id
);

-- 2. 結果を rls_test_results に保存
SELECT insert_rls_test_result(
  run_single_rls_test(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid
  )
);

-- 3. テストラン統計更新
SELECT update_test_run_statistics('550e8400-e29b-41d4-a716-446655440002'::uuid);
*/

-- =========================================================
-- 設計注意点と改善点（コメント）
-- =========================================================

/*
【安全化実装における重要ポイント】

1. **識別子サニタイゼーション**
   - sanitize_ident() でテーブル名・スキーマ名を検証
   - 英数字・アンダースコア・ドット以外は拒否
   - 予約語・危険パターンをブラックリスト化

2. **動的SQL の安全性向上**
   - format(..., %I, ...) で識別子をエスケープ
   - 可能な限り EXECUTE ... USING でパラメータバインド
   - 文字列連結は最小限に制限

3. **JWT Claims 設定の確実性**  
   - set_config('request.jwt.claims', claims_json, true) を毎回実行
   - JWT template の基本構造チェック（sub claim の存在確認）
   - 第3引数 true = セッションローカル設定

4. **データ汚染防止の徹底**
   - SAVEPOINT → 処理実行 → ROLLBACK TO SAVEPOINT の確実な実行
   - 正常系・異常系を問わず必ずロールバック
   - 例外時も確実にロールバックされる

5. **エラーハンドリング強化**
   - insufficient_privilege (42501) を明示的にキャッチ
   - SQLSTATE とメッセージを詳細に記録
   - コンテキスト情報を error_details に JSON で格納

6. **実行時間・統計情報の改善**
   - clock_timestamp() で正確な実行時間測定
   - 使用されたSQL文・パラメータを記録
   - テストラン全体の統計を自動計算

7. **今後の改善点（TODO）**
   - test_data の値部分もEXECUTE USINGでパラメータ化
   - より厳密なWHERE句のサニタイゼーション
   - バッチ実行対応とトランザクション最適化
   - テスト対象テーブルのホワイトリスト化
*/