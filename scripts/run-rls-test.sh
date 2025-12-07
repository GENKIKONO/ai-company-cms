#!/bin/bash

# =========================================================
# RLS Tester 簡単実行スクリプト
# AIOHub Phase 3 - EPIC 3-2
# =========================================================

set -e  # エラー時に停止

# 環境変数チェック
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required"
  echo "Example:"
  echo "export SUPABASE_URL='https://your-project.supabase.co'"
  echo "export SUPABASE_ANON_KEY='your-anon-key'"
  exit 1
fi

# デフォルト値設定
TRIGGER_SOURCE=${TRIGGER_SOURCE:-"manual-script"}
GIT_COMMIT=${GIT_COMMIT:-$(git rev-parse HEAD 2>/dev/null || echo "unknown")}
GIT_BRANCH=${GIT_BRANCH:-$(git branch --show-current 2>/dev/null || echo "unknown")}
SUITE_NAME=${SUITE_NAME:-"default"}
ENVIRONMENT=${ENVIRONMENT:-"development"}

echo "🔍 Starting RLS Policy Test..."
echo "Trigger Source: $TRIGGER_SOURCE"
echo "Git Commit: $GIT_COMMIT"
echo "Git Branch: $GIT_BRANCH"
echo "Test Suite: $SUITE_NAME"
echo "Environment: $ENVIRONMENT"
echo "=================================="

# Edge Function 呼び出し
TEMP_FILE=$(mktemp)
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$TEMP_FILE" -X POST \
  "$SUPABASE_URL/functions/v1/rls-tester" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"trigger_source\": \"$TRIGGER_SOURCE\",
    \"git_commit\": \"$GIT_COMMIT\",
    \"git_branch\": \"$GIT_BRANCH\",
    \"suite_name\": \"$SUITE_NAME\",
    \"environment\": \"$ENVIRONMENT\"
  }")

# レスポンス内容取得
RESPONSE=$(cat "$TEMP_FILE")
rm "$TEMP_FILE"

echo "HTTP Status: $HTTP_CODE"

# ステータスコードチェック
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "❌ Edge Function call failed with status $HTTP_CODE"
  echo "Response: $RESPONSE"
  exit 1
fi

# JSON パース（jqが利用可能な場合）
if command -v jq >/dev/null 2>&1; then
  TOTAL=$(echo "$RESPONSE" | jq -r '.total // 0')
  PASSED=$(echo "$RESPONSE" | jq -r '.passed // 0')
  FAILED=$(echo "$RESPONSE" | jq -r '.failed // 0')
  ERROR_COUNT=$(echo "$RESPONSE" | jq -r '.error // 0')
  SUCCESS_RATE=$(echo "$RESPONSE" | jq -r '.success_rate // 0')
  TEST_RUN_ID=$(echo "$RESPONSE" | jq -r '.test_run_id // "unknown"')
  STATUS=$(echo "$RESPONSE" | jq -r '.status // "UNKNOWN"')
  EXECUTION_TIME=$(echo "$RESPONSE" | jq -r '.execution_time_ms // 0')
else
  # jqが無い場合は基本的な文字列処理（非推奨）
  echo "Warning: jq not found. Install jq for better JSON parsing."
  echo "Raw response: $RESPONSE"
  TOTAL=0
  PASSED=0
  FAILED=1  # 安全のためfailedとして扱う
  ERROR_COUNT=0
  SUCCESS_RATE=0
  STATUS="UNKNOWN"
fi

# 結果表示
echo ""
echo "🔍 RLS Policy Test Results"
echo "=========================="
echo "Test Run ID: $TEST_RUN_ID"
echo "Total scenarios: $TOTAL"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "🔥 Errors: $ERROR_COUNT"
echo "📊 Success rate: $SUCCESS_RATE%"
echo "⏱️  Execution time: ${EXECUTION_TIME}ms"
echo "🏁 Status: $STATUS"
echo "=========================="

# Super Admin Console リンク
echo ""
echo "📖 View detailed results:"
echo "$SUPABASE_URL/admin/console"

# 終了コード判定
if [ "$FAILED" -gt 0 ] || [ "$ERROR_COUNT" -gt 0 ] || [ "$STATUS" = "FAILED" ]; then
  echo ""
  echo "❌ RLS Policy validation failed!"
  echo "   - Failed scenarios: $FAILED"
  echo "   - Error scenarios: $ERROR_COUNT"
  echo "   - Check the Super Admin Console for details"
  exit 1
else
  echo ""
  echo "✅ All RLS policy tests passed successfully!"
  exit 0
fi