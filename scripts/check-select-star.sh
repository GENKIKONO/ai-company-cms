#!/usr/bin/env bash
# select('*') 検出スクリプト
# CI/pre-commit で使用し、select('*') があれば失敗させる

set -euo pipefail

count=$(grep -rE "\.select\(['\"]?\*['\"]?\)" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l | tr -d ' ')

if [ "$count" -gt 0 ]; then
  echo "❌ Found $count select('*') instances:"
  echo ""
  grep -rEn "\.select\(['\"]?\*['\"]?\)" --include="*.ts" --include="*.tsx" src/ || true
  echo ""
  echo "Please replace select('*') with explicit column lists."
  exit 1
fi

echo "✅ No select('*') found"
