#!/bin/bash
# smoke-auth.sh - 認証エンドポイントの smoke テスト
# 使用法: npm run smoke:auth または ./scripts/smoke-auth.sh [base_url]
#
# CIではHealth Onlyで実行（ログイン検証は手動または障害対応時のみ）
#
# オプション環境変数（手動実行時のみ）:
#   SMOKE_EMAIL, SMOKE_PASSWORD - 認証テスト用アカウント

set -e

BASE_URL="${1:-https://aiohub.jp}"

echo "=== Auth Smoke Test ==="
echo "Base URL: $BASE_URL"
echo ""

# 0. /auth/signin が 308 リダイレクトを返すことを確認（経路統一の保護）
echo "0. Checking /auth/signin returns 308 redirect..."
SIGNIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/signin")
if [ "$SIGNIN_STATUS" = "308" ] || [ "$SIGNIN_STATUS" = "307" ]; then
  echo "   OK: /auth/signin returns $SIGNIN_STATUS (redirect to /auth/login)"
else
  echo "   FAIL: /auth/signin returns $SIGNIN_STATUS (expected 307 or 308)"
  echo "   /auth/signin must redirect to /auth/login to prevent dual login paths"
  exit 1
fi

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

  # 7a. ログイン実行（Cookie取得 + Set-Cookie ヘッダー検証）
  echo "7a. Logging in with SMOKE_EMAIL..."
  COOKIE_JAR=$(mktemp)
  HEADER_FILE=$(mktemp)

  # Set-Cookie ヘッダーも取得（-D でヘッダーをファイルに保存）
  LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -D "$HEADER_FILE" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"$SMOKE_PASSWORD\"}")

  if echo "$LOGIN_RESPONSE" | grep -q '"ok":true'; then
    echo "   OK: Login response ok:true"

    # Set-Cookie ヘッダーの検証（最重要）
    echo ""
    echo "   === Set-Cookie Header Analysis ==="
    SET_COOKIE_COUNT=$(grep -i "^Set-Cookie:" "$HEADER_FILE" | wc -l | tr -d ' ')
    echo "   Set-Cookie count: $SET_COOKIE_COUNT"

    # auth-token の存在確認（chunk も含む）
    HAS_AUTH_TOKEN=$(grep -i "^Set-Cookie:.*auth-token" "$HEADER_FILE" | head -1 || echo "")
    if [ -n "$HAS_AUTH_TOKEN" ]; then
      echo "   OK: auth-token found in Set-Cookie"
      # auth-token の名前を表示
      AUTH_TOKEN_NAME=$(echo "$HAS_AUTH_TOKEN" | grep -o 'sb-[^=]*auth-token[^=]*' | head -1)
      echo "   auth-token cookie name: $AUTH_TOKEN_NAME"
    else
      echo "   FAIL: auth-token NOT found in Set-Cookie headers!"
      echo "   Set-Cookie headers:"
      grep -i "^Set-Cookie:" "$HEADER_FILE" | head -5
      rm -f "$COOKIE_JAR" "$HEADER_FILE"
      exit 1
    fi

    # refresh-token の存在確認
    HAS_REFRESH_TOKEN=$(grep -i "^Set-Cookie:.*refresh-token" "$HEADER_FILE" | head -1 || echo "")
    if [ -n "$HAS_REFRESH_TOKEN" ]; then
      echo "   OK: refresh-token found in Set-Cookie"
    else
      echo "   WARN: refresh-token not found in Set-Cookie"
    fi

    # 診断ヘッダーの確認（Task A-1）
    echo ""
    echo "   === Diagnostic Headers (x-auth-*) ==="
    X_AUTH_SET_COOKIE_NAMES=$(grep -i "^x-auth-set-cookie-names:" "$HEADER_FILE" | head -1 || echo "")
    X_AUTH_HAS_AUTH_TOKEN=$(grep -i "^x-auth-has-auth-token:" "$HEADER_FILE" | head -1 || echo "")
    X_AUTH_HAS_REFRESH_TOKEN=$(grep -i "^x-auth-has-refresh-token:" "$HEADER_FILE" | head -1 || echo "")
    X_AUTH_FALLBACK_USED=$(grep -i "^x-auth-fallback-used:" "$HEADER_FILE" | head -1 || echo "")

    echo "   $X_AUTH_SET_COOKIE_NAMES"
    echo "   $X_AUTH_HAS_AUTH_TOKEN"
    echo "   $X_AUTH_HAS_REFRESH_TOKEN"
    echo "   $X_AUTH_FALLBACK_USED"

    # フォールバック使用時は警告
    if echo "$X_AUTH_FALLBACK_USED" | grep -qi "true"; then
      echo ""
      echo "   ⚠️  WARNING: Fallback was used (Supabase SSR did not set auth-token)"
      echo "   This indicates Supabase SSR's setAll did not include auth-token."
    fi

    rm -f "$HEADER_FILE"
    echo "   ==================================="
    echo ""

    # 7b. login-cookie-contract 確認（Cookie がブラウザに保存されているか）
    echo "7b. Checking /api/health/login-cookie-contract..."
    CONTRACT_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/health/login-cookie-contract")
    CONTRACT_STATUS=$(echo "$CONTRACT_RESPONSE" | grep -o '"contractStatus":"[^"]*"' | sed 's/"contractStatus":"\([^"]*\)"/\1/')
    CONTRACT_HAS_AUTH=$(echo "$CONTRACT_RESPONSE" | grep -o '"hasAuthTokenCookie":[^,}]*' | head -1)
    CONTRACT_AUTH_NAMES=$(echo "$CONTRACT_RESPONSE" | grep -o '"authTokenCookieNames":\[[^]]*\]' | head -1)

    echo "   contractStatus: $CONTRACT_STATUS"
    echo "   $CONTRACT_HAS_AUTH"
    echo "   $CONTRACT_AUTH_NAMES"

    if [ "$CONTRACT_STATUS" = "VALID" ]; then
      echo "   OK: Cookie contract is VALID"
    else
      echo "   FAIL: Cookie contract is $CONTRACT_STATUS"
      echo "   Full response: $CONTRACT_RESPONSE"
      rm -f "$COOKIE_JAR"
      exit 1
    fi

    # 7c. auth-snapshot確認（ログイン後）
    echo "7c. Checking auth-snapshot after login..."
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

    # 7d. dashboard-probe確認（ログイン後）
    echo "7d. Checking dashboard-probe after login..."
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

    # 7e. /api/dashboard/init 確認（ログイン後）- 最重要テスト
    echo "7e. Checking /api/dashboard/init after login..."
    INIT_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/dashboard/init")
    INIT_OK=$(echo "$INIT_RESPONSE" | grep -o '"ok":[^,]*' | head -1)
    INIT_WHICH_STEP=$(echo "$INIT_RESPONSE" | grep -o '"whichStep":"[^"]*"' | head -1)
    INIT_SESSION_RECOVERED=$(echo "$INIT_RESPONSE" | grep -o '"sessionRecovered":[^,}]*' | head -1)
    INIT_HAS_AUTH=$(echo "$INIT_RESPONSE" | grep -o '"hasAuthTokenCookie":[^,}]*' | head -1)

    echo "   $INIT_OK"
    echo "   $INIT_WHICH_STEP"
    echo "   $INIT_SESSION_RECOVERED"
    echo "   $INIT_HAS_AUTH"

    if echo "$INIT_RESPONSE" | grep -q '"ok":true'; then
      echo "   OK: /api/dashboard/init returns ok:true"
    else
      echo "   FAIL: /api/dashboard/init returns ok:false"
      echo "   Response: $INIT_RESPONSE"
      rm -f "$COOKIE_JAR"
      exit 1
    fi

    # 7f. /dashboard/posts ページ確認
    echo "7f. Checking /dashboard/posts page..."
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
  echo "   SKIP: Authenticated tests (SMOKE_EMAIL/SMOKE_PASSWORD not set)"
  echo "   Note: CI uses Health Only. Login verification is manual only."
fi

echo ""
echo "=== All smoke tests passed ==="
