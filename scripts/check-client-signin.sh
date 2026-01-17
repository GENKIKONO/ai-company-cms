#!/bin/bash
# check-client-signin.sh - クライアントサイド signInWithPassword の使用を禁止
#
# 目的:
# supabaseBrowser.auth.signInWithPassword の使用を検出し、CI で Fail にする
# ログインは /api/auth/login 経由のみを許可
#
# 使用法: npm run check:client-signin

set -e

echo "=== Checking for forbidden client-side signInWithPassword ==="

# supabaseBrowser.auth.signInWithPassword を検出
PATTERN="supabaseBrowser\.auth\.signInWithPassword"
MATCHES=$(grep -rn "$PATTERN" --include="*.ts" --include="*.tsx" src/ 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "ERROR: Found forbidden supabaseBrowser.auth.signInWithPassword usage!"
  echo ""
  echo "$MATCHES"
  echo ""
  echo "Fix: Use POST /api/auth/login instead of client-side signInWithPassword"
  exit 1
fi

echo "OK: No forbidden client-side signInWithPassword found"
exit 0
