#!/usr/bin/env bash
# select('*') 検出スクリプト
# CI/pre-commit で使用し、select('*') があれば失敗させる

set -euo pipefail

# 除外パターン（動的テーブル名を扱う内部ヘルパー）
# これらは設計上 select('*') が必要なため除外
EXCLUDE_PATTERN="db-boundary\.ts|supabase\.ts"

# 除外リスト以外で select('*') を検出
results=$(grep -rE "\.select\(['\"]?\*['\"]?\)" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | grep -vE "$EXCLUDE_PATTERN" || true)

# 結果が空でない場合のみカウント
if [ -n "$results" ]; then
  count=$(echo "$results" | wc -l | tr -d ' ')
else
  count=0
fi

if [ "$count" -gt 0 ]; then
  echo "❌ Found $count select('*') instances (excluding dynamic helpers):"
  echo ""
  echo "$results"
  echo ""
  echo "Please replace select('*') with explicit column lists."
  echo ""
  echo "Note: Excluded files (dynamic table helpers):"
  echo "  - db-boundary.ts"
  echo "  - supabase.ts"
  exit 1
fi

echo "✅ No select('*') found (excluding dynamic helpers)"
echo ""
echo "Excluded files (dynamic table helpers):"
echo "  - db-boundary.ts"
echo "  - supabase.ts"
