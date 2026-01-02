#!/usr/bin/env bash
# any 使用箇所のカウントスクリプト（ブロックはしない、監視用）

set -euo pipefail

colon_any=$(grep -rE ":\s*any\b" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l | tr -d ' ')
as_any=$(grep -rE "as\s+any\b" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l | tr -d ' ')
total=$((colon_any + as_any))

echo "📊 any usage report:"
echo "  : any  = $colon_any"
echo "  as any = $as_any"
echo "  total  = $total"

# 閾値を超えた場合に警告（ブロックはしない）
THRESHOLD=${ANY_THRESHOLD:-500}
if [ "$total" -gt "$THRESHOLD" ]; then
  echo ""
  echo "⚠️  Warning: any count ($total) exceeds threshold ($THRESHOLD)"
fi
