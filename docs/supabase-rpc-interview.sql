-- AIインタビューセッション管理用のRPC関数（オプション）

-- セッション詳細取得（質問データ込み）
CREATE OR REPLACE FUNCTION get_interview_session_with_questions(
  p_session_id uuid
) RETURNS jsonb AS $$
DECLARE
  session_data jsonb;
  questions_data jsonb;
BEGIN
  -- セッション基本情報
  SELECT to_jsonb(s.*) INTO session_data
  FROM ai_interview_sessions s
  WHERE s.id = p_session_id;
  
  IF session_data IS NULL THEN
    RETURN jsonb_build_object('error', 'Session not found');
  END IF;
  
  -- 関連する質問データ（answersのキーから取得）
  SELECT jsonb_agg(to_jsonb(q.*)) INTO questions_data
  FROM ai_interview_questions q
  WHERE q.id = ANY(
    SELECT jsonb_object_keys(session_data->'answers')::uuid[]
  )
  ORDER BY q.sort_order;
  
  RETURN jsonb_build_object(
    'session', session_data,
    'questions', COALESCE(questions_data, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
REVOKE ALL ON FUNCTION get_interview_session_with_questions FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_interview_session_with_questions TO authenticated;

-- ユーザー別セッション一覧取得
CREATE OR REPLACE FUNCTION get_user_interview_sessions(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
) RETURNS jsonb AS $$
DECLARE
  sessions_data jsonb;
  total_count integer;
BEGIN
  -- 総数取得
  SELECT COUNT(*) INTO total_count
  FROM ai_interview_sessions
  WHERE user_id = p_user_id;
  
  -- セッション一覧
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'organization_id', s.organization_id,
      'content_type', s.content_type,
      'status', s.status,
      'answer_count', jsonb_object_keys(s.answers)::text[] && array_length(jsonb_object_keys(s.answers)::text[], 1),
      'answered_count', (
        SELECT COUNT(*)
        FROM jsonb_each_text(s.answers) AS answer(key, value)
        WHERE trim(answer.value) != ''
      ),
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'has_generated_content', (s.generated_content IS NOT NULL)
    )
    ORDER BY s.updated_at DESC
  ) INTO sessions_data
  FROM ai_interview_sessions s
  WHERE s.user_id = p_user_id
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object(
    'sessions', COALESCE(sessions_data, '[]'::jsonb),
    'total', total_count,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
REVOKE ALL ON FUNCTION get_user_interview_sessions FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_interview_sessions TO authenticated;

-- セッション回答の部分更新（JSONB merge）
CREATE OR REPLACE FUNCTION update_interview_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_answer text,
  p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
  session_exists boolean;
  updated_answers jsonb;
BEGIN
  -- セッション存在確認とアクセス権限チェック
  SELECT EXISTS(
    SELECT 1 FROM ai_interview_sessions
    WHERE id = p_session_id AND user_id = p_user_id AND status != 'completed'
  ) INTO session_exists;
  
  IF NOT session_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found or access denied'
    );
  END IF;
  
  -- 回答更新
  UPDATE ai_interview_sessions
  SET 
    answers = jsonb_set(
      COALESCE(answers, '{}'::jsonb),
      ARRAY[p_question_id::text],
      to_jsonb(p_answer)
    ),
    status = CASE 
      WHEN status = 'draft' THEN 'in_progress'::text
      ELSE status 
    END,
    updated_at = now()
  WHERE id = p_session_id
  RETURNING answers INTO updated_answers;
  
  RETURN jsonb_build_object(
    'success', true,
    'answers', updated_answers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
REVOKE ALL ON FUNCTION update_interview_answer FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_interview_answer TO authenticated;

-- セッション完了処理
CREATE OR REPLACE FUNCTION finalize_interview_session(
  p_session_id uuid,
  p_generated_content text,
  p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
  session_exists boolean;
  answer_count integer;
BEGIN
  -- セッション存在確認とアクセス権限チェック
  SELECT EXISTS(
    SELECT 1 FROM ai_interview_sessions
    WHERE id = p_session_id AND user_id = p_user_id
  ) INTO session_exists;
  
  IF NOT session_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found or access denied'
    );
  END IF;
  
  -- 回答数チェック
  SELECT COUNT(*)
  FROM ai_interview_sessions s,
  LATERAL jsonb_each_text(s.answers) AS answer(key, value)
  WHERE s.id = p_session_id AND trim(answer.value) != ''
  INTO answer_count;
  
  IF answer_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No answers provided'
    );
  END IF;
  
  -- セッション完了
  UPDATE ai_interview_sessions
  SET 
    status = 'completed',
    generated_content = p_generated_content,
    updated_at = now()
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'answer_count', answer_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
REVOKE ALL ON FUNCTION finalize_interview_session FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_interview_session TO authenticated;

-- インタビューセッション統計
CREATE OR REPLACE FUNCTION get_interview_statistics(
  p_user_id uuid DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_start_date timestamp DEFAULT NULL,
  p_end_date timestamp DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  WITH session_stats AS (
    SELECT
      COUNT(*) as total_sessions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_sessions,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_sessions,
      AVG(
        (SELECT COUNT(*)
         FROM jsonb_each_text(answers) AS answer(key, value)
         WHERE trim(answer.value) != '')
      )::numeric as avg_answers_per_session,
      COUNT(CASE WHEN generated_content IS NOT NULL THEN 1 END) as sessions_with_content
    FROM ai_interview_sessions
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_organization_id IS NULL OR organization_id = p_organization_id)
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
  ),
  content_type_stats AS (
    SELECT
      content_type,
      COUNT(*) as count
    FROM ai_interview_sessions
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_organization_id IS NULL OR organization_id = p_organization_id)
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
    GROUP BY content_type
  )
  SELECT jsonb_build_object(
    'overview', to_jsonb(s.*),
    'by_content_type', jsonb_agg(to_jsonb(c.*))
  ) INTO stats
  FROM session_stats s
  CROSS JOIN content_type_stats c
  GROUP BY s.total_sessions, s.completed_sessions, s.in_progress_sessions, 
           s.draft_sessions, s.avg_answers_per_session, s.sessions_with_content;
  
  RETURN COALESCE(stats, jsonb_build_object(
    'overview', jsonb_build_object(
      'total_sessions', 0,
      'completed_sessions', 0,
      'in_progress_sessions', 0,
      'draft_sessions', 0,
      'avg_answers_per_session', 0,
      'sessions_with_content', 0
    ),
    'by_content_type', '[]'::jsonb
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限設定
REVOKE ALL ON FUNCTION get_interview_statistics FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_interview_statistics TO authenticated;