#!/bin/bash
# smoke-auth.sh - 認証エンドポイントの smoke テスト
# 使用法: npm run smoke:auth または ./scripts/smoke-auth.sh [base_url]

set -e

BASE_URL="${1:-https://aiohub.jp}"

echo "=== Auth Smoke Test ==="
echo "Base URL: $BASE_URL"
echo ""

# 1. /api/auth/login ルート存在確認（GET）
echo "1. Checking /api/auth/login route exists..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/login")
if [ "$STATUS" = "200" ]; then
  echo "   OK: GET /api/auth/login returns 200"
else
  echo "   FAIL: GET /api/auth/login returns $STATUS (expected 200)"
  exit 1
fi

# 2. /api/auth/login の詳細確認
echo "2. Checking /api/auth/login response..."
RESPONSE=$(curl -s "$BASE_URL/api/auth/login")
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "   OK: Response contains ok:true"
  SHA=$(echo "$RESPONSE" | grep -o '"sha":"[^"]*"' | head -1)
  echo "   $SHA"
else
  echo "   FAIL: Response does not contain ok:true"
  echo "   Response: $RESPONSE"
  exit 1
fi

# 3. /api/health/supabase-env 確認
echo "3. Checking /api/health/supabase-env..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/supabase-env")
if [ "$STATUS" = "200" ]; then
  echo "   OK: GET /api/health/supabase-env returns 200"
  SHA=$(curl -s "$BASE_URL/api/health/supabase-env" | grep -o '"sha":"[^"]*"' | head -1)
  echo "   $SHA"
else
  echo "   FAIL: GET /api/health/supabase-env returns $STATUS"
  exit 1
fi

# 4. /api/health/auth-snapshot 確認（Cookie診断含む）
echo "4. Checking /api/health/auth-snapshot..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/auth-snapshot")
if [ "$STATUS" = "200" ]; then
  echo "   OK: GET /api/health/auth-snapshot returns 200"
  SNAPSHOT_RESPONSE=$(curl -s "$BASE_URL/api/health/auth-snapshot")
  AUTH_STATE=$(echo "$SNAPSHOT_RESPONSE" | grep -o '"authState":"[^"]*"' | head -1)
  HAS_AUTH_TOKEN=$(echo "$SNAPSHOT_RESPONSE" | grep -o '"hasAuthTokenCookie":[^,}]*' | head -1)
  HAS_REFRESH_TOKEN=$(echo "$SNAPSHOT_RESPONSE" | grep -o '"hasRefreshTokenCookie":[^,}]*' | head -1)
  COOKIE_NAMES=$(echo "$SNAPSHOT_RESPONSE" | grep -o '"cookieNames":\[[^]]*\]' | head -1)
  echo "   $AUTH_STATE"
  echo "   $HAS_AUTH_TOKEN"
  echo "   $HAS_REFRESH_TOKEN"
  # cookieNames が返っていることを確認（配列なので存在確認のみ）
  if echo "$SNAPSHOT_RESPONSE" | grep -q '"cookieNames":'; then
    echo "   OK: cookieNames field present"
  else
    echo "   WARN: cookieNames field missing"
  fi
else
  echo "   FAIL: GET /api/health/auth-snapshot returns $STATUS"
  exit 1
fi

# 5. /api/health/dashboard-probe 確認（Phase 3-A）
echo "5. Checking /api/health/dashboard-probe..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/dashboard-probe")
if [ "$STATUS" = "200" ]; then
  echo "   OK: GET /api/health/dashboard-probe returns 200"
  PROBE_RESPONSE=$(curl -s "$BASE_URL/api/health/dashboard-probe")
  AUTH_STATE=$(echo "$PROBE_RESPONSE" | grep -o '"authState":"[^"]*"' | head -1)
  WHY_BLOCKED=$(echo "$PROBE_RESPONSE" | grep -o '"whyBlocked":"[^"]*"' | head -1 || echo '"whyBlocked":null')
  echo "   $AUTH_STATE"
  echo "   $WHY_BLOCKED"
else
  echo "   FAIL: GET /api/health/dashboard-probe returns $STATUS"
  exit 1
fi

# 6. POST /api/auth/login with invalid credentials (should return 401)
echo "6. Checking POST /api/auth/login with invalid credentials..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}')
if [ "$STATUS" = "401" ]; then
  echo "   OK: POST with invalid credentials returns 401"
else
  echo "   WARN: POST with invalid credentials returns $STATUS (expected 401)"
fi

# 7. ログイン後のテスト（SMOKE_EMAIL/SMOKE_PASSWORD設定時のみ）
if [ -n "$SMOKE_EMAIL" ] && [ -n "$SMOKE_PASSWORD" ]; then
  echo ""
  echo "=== Authenticated Tests (SMOKE_EMAIL set) ==="

  # 7a. ログイン実行（Cookie取得）
  echo "7a. Logging in with SMOKE_EMAIL..."
  COOKIE_JAR=$(mktemp)
  LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"$SMOKE_PASSWORD\"}")

  if echo "$LOGIN_RESPONSE" | grep -q '"ok":true'; then
    echo "   OK: Login successful"

    # 7b. auth-snapshot確認（ログイン後）
    echo "7b. Checking auth-snapshot after login..."
    AUTH_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/health/auth-snapshot")
    AUTH_STATE=$(echo "$AUTH_RESPONSE" | grep -o '"authState":"[^"]*"' | sed 's/"authState":"\([^"]*\)"/\1/')

    echo "   authState: $AUTH_STATE"

    if [ "$AUTH_STATE" = "AUTHENTICATED_READY" ]; then
      echo "   OK: authState is AUTHENTICATED_READY"
    elif [ "$AUTH_STATE" = "AUTHENTICATED_NO_ORG" ]; then
      echo "   WARN: authState is AUTHENTICATED_NO_ORG (user has no organization)"
    else
      echo "   FAIL: authState is $AUTH_STATE (expected AUTHENTICATED_READY)"
      rm -f "$COOKIE_JAR"
      exit 1
    fi

    # 7c. dashboard-probe確認（ログイン後）
    echo "7c. Checking dashboard-probe after login..."
    PROBE_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/health/dashboard-probe")
    PROBE_STATE=$(echo "$PROBE_RESPONSE" | grep -o '"authState":"[^"]*"' | sed 's/"authState":"\([^"]*\)"/\1/')
    WHY_BLOCKED=$(echo "$PROBE_RESPONSE" | grep -o '"whyBlocked":"[^"]*"' | sed 's/"whyBlocked":"\([^"]*\)"/\1/' || echo "null")

    echo "   authState: $PROBE_STATE"
    echo "   whyBlocked: $WHY_BLOCKED"

    if [ "$PROBE_STATE" = "AUTHENTICATED_READY" ]; then
      echo "   OK: dashboard-probe shows AUTHENTICATED_READY"
    else
      echo "   WARN: dashboard-probe shows $PROBE_STATE"
    fi

    # 7d. /api/dashboard/init 確認（ログイン後）- 最重要テスト
    echo "7d. Checking /api/dashboard/init after login..."
    INIT_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/dashboard/init")
    INIT_OK=$(echo "$INIT_RESPONSE" | grep -o '"ok":[^,]*' | head -1)
    INIT_WHICH_STEP=$(echo "$INIT_RESPONSE" | grep -o '"whichStep":"[^"]*"' | head -1)
    INIT_SESSION_RECOVERED=$(echo "$INIT_RESPONSE" | grep -o '"sessionRecovered":[^,}]*' | head -1)

    echo "   $INIT_OK"
    echo "   $INIT_WHICH_STEP"
    echo "   $INIT_SESSION_RECOVERED"

    if echo "$INIT_RESPONSE" | grep -q '"ok":true'; then
      echo "   OK: /api/dashboard/init returns ok:true"
    else
      echo "   FAIL: /api/dashboard/init returns ok:false"
      echo "   Response: $INIT_RESPONSE"
      rm -f "$COOKIE_JAR"
      exit 1
    fi

    # 7e. /dashboard/posts ページ確認
    echo "7e. Checking /dashboard/posts page..."
    DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/dashboard/posts")
    if [ "$DASHBOARD_STATUS" = "200" ]; then
      echo "   OK: /dashboard/posts returns 200"
    else
      echo "   FAIL: /dashboard/posts returns $DASHBOARD_STATUS"
      rm -f "$COOKIE_JAR"
      exit 1
    fi

  else
    echo "   FAIL: Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    rm -f "$COOKIE_JAR"
    exit 1
  fi

  rm -f "$COOKIE_JAR"
  echo ""
  echo "=== Authenticated tests passed ==="
else
  echo ""
  echo "   SKIP: Authenticated tests (set SMOKE_EMAIL and SMOKE_PASSWORD to enable)"
fi

echo ""
echo "=== All smoke tests passed ==="
