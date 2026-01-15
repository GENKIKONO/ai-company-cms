#!/bin/bash
#
# Tailwind色直書きチェックスクリプト
#
# 目的: Tailwind色クラス（text-gray-*, bg-red-*等）の直書きを検出し、
#       増加を防止する（止血）
#
# 使用方法:
#   ./scripts/check-tailwind-colors.sh
#
# ベースライン:
#   scripts/baselines/tailwind-colors.json に各ディレクトリの許容件数を記録
#   現在の件数がベースラインを超えると失敗
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

BASELINE_FILE="$SCRIPT_DIR/baselines/tailwind-colors.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo "=========================================="
echo "Tailwind色直書きチェック"
echo "=========================================="
echo ""

# grep共通オプション
GREP_OPTS="--color=never"

# 検出対象パターン
PATTERNS="text-gray-\|text-red-\|text-green-\|text-blue-\|text-yellow-\|text-orange-\|text-purple-\|bg-gray-\|bg-red-\|bg-green-\|bg-blue-\|bg-yellow-\|bg-orange-\|bg-purple-\|border-gray-\|border-red-\|border-green-"

# ─────────────────────────────────────────────────────────────
# Check: Dashboard配下（目標: 0件維持）
# ─────────────────────────────────────────────────────────────
echo "Check: Dashboard配下の直書き..."

DASHBOARD_COUNT=$(grep -r $GREP_OPTS "$PATTERNS" \
  --include="*.tsx" --include="*.ts" \
  src/app/dashboard src/components/dashboard 2>/dev/null | wc -l | tr -d ' ')

DASHBOARD_BASELINE=0

if [ "$DASHBOARD_COUNT" -gt "$DASHBOARD_BASELINE" ]; then
  echo -e "${RED}✗ Dashboard配下で直書き検出: $DASHBOARD_COUNT 件（許容: $DASHBOARD_BASELINE）${NC}"
  echo ""
  echo "違反箇所:"
  grep -r $GREP_OPTS "$PATTERNS" \
    --include="*.tsx" --include="*.ts" \
    src/app/dashboard src/components/dashboard 2>/dev/null | head -20 || true
  echo ""
  echo "修正方法: docs/ai-implementation-guard.md のマッピング表を参照"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK（$DASHBOARD_COUNT 件）${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check: Public配下（目標: 増加禁止、ベースライン1210件）
# ─────────────────────────────────────────────────────────────
echo "Check: Public配下の直書き..."

PUBLIC_COUNT=$(grep -r $GREP_OPTS "$PATTERNS" \
  --include="*.tsx" --include="*.ts" \
  src/app/\(public\) 2>/dev/null | wc -l | tr -d ' ')

PUBLIC_BASELINE=1210

PUBLIC_DIFF=$((PUBLIC_COUNT - PUBLIC_BASELINE))

echo "  現件数: $PUBLIC_COUNT / ベースライン: $PUBLIC_BASELINE / 差分: $PUBLIC_DIFF"

if [ "$PUBLIC_COUNT" -gt "$PUBLIC_BASELINE" ]; then
  echo -e "${RED}✗ Public配下で直書き増加検出: $PUBLIC_COUNT 件（許容上限: $PUBLIC_BASELINE）${NC}"
  echo ""
  echo "新規追加された違反箇所を確認してください:"
  grep -r $GREP_OPTS "$PATTERNS" \
    --include="*.tsx" --include="*.ts" \
    src/app/\(public\) 2>/dev/null | head -20 || true
  echo ""
  echo "修正方法: docs/ai-implementation-guard.md のマッピング表を参照"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK（増加なし）${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
echo "=========================================="
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}結果: $ERRORS 件の違反${NC}"
  exit 1
else
  echo -e "${GREEN}結果: 全チェック通過${NC}"
  exit 0
fi
