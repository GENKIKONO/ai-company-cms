#!/bin/bash
#
# アーキテクチャ違反チェックスクリプト
#
# P1: Core統合 & LSP準拠ガードレール
# このスクリプトはCIで実行し、アーキテクチャ違反を検出します
#
# NOTE: --color=never を全grep呼び出しに追加（暫定回避策）
# 理由: Claude Code内部でUTF-8文字境界panicが発生した疑いあり
# 詳細: docs/debug/claude-panic-capture.md 参照
# これは回避策であり、根本原因の修正ではない
#

set -e

# grep共通オプション（カラー出力無効化）
GREP_OPTS="--color=never"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo "=========================================="
echo "アーキテクチャ違反チェック"
echo "=========================================="
echo ""

# ─────────────────────────────────────────────────────────────
# Check 1: @/lib/auth の直接import禁止（Core経由必須）
# ─────────────────────────────────────────────────────────────
echo "Check 1: @/lib/auth 直接import..."

# 許可されるファイル（lib/auth自体とCore）
ALLOWED_AUTH_IMPORTERS="lib/auth/|lib/core/"

AUTH_VIOLATIONS=$(grep -r $GREP_OPTS "from '@/lib/auth'" src/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v -E "$ALLOWED_AUTH_IMPORTERS" \
  | grep $GREP_OPTS -v "// allowed" \
  || true)

if [ -n "$AUTH_VIOLATIONS" ]; then
  echo -e "${RED}✗ @/lib/auth の直接import検出${NC}"
  echo "$AUTH_VIOLATIONS"
  echo ""
  echo "修正方法: @/lib/core/auth-state 経由でインポートしてください"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 2: isSiteAdmin の重複定義禁止
# ─────────────────────────────────────────────────────────────
echo "Check 2: isSiteAdmin 重複定義..."

# Coreのauth-state.ts以外でのisSiteAdmin関数定義を検出
# isSiteAdminWithClient は別関数なので除外
SITEADMIN_VIOLATIONS=$(grep -r $GREP_OPTS "export async function isSiteAdmin(" src/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "lib/core/auth-state.ts" \
  || true)

if [ -n "$SITEADMIN_VIOLATIONS" ]; then
  echo -e "${RED}✗ isSiteAdmin の重複定義検出${NC}"
  echo "$SITEADMIN_VIOLATIONS"
  echo ""
  echo "修正方法: @/lib/core/auth-state の isSiteAdmin を使用してください"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 3: 監査ログ直接呼び出し禁止（Core経由必須）
# ─────────────────────────────────────────────────────────────
echo "Check 3: 監査ログ直接API呼び出し..."

# Core以外からの直接fetch呼び出しを検出
# Core自体（audit-logger.client.ts）は許可
AUDIT_VIOLATIONS=$(grep -r $GREP_OPTS "fetch('/api/ops_audit" src/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "lib/core/audit-logger" \
  || true)

if [ -n "$AUDIT_VIOLATIONS" ]; then
  echo -e "${RED}✗ 監査ログAPI直接呼び出し検出${NC}"
  echo "$AUDIT_VIOLATIONS"
  echo ""
  echo "修正方法: @/lib/core/audit-logger または audit-logger.client を使用してください"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 4: orgId?: string | null パターン禁止（Subject型必須）
# ─────────────────────────────────────────────────────────────
echo "Check 4: orgId?: string | null パターン..."

# 新規ファイルでのorgId?: string | nullパターンを検出（警告のみ）
ORGID_VIOLATIONS=$(grep -r $GREP_OPTS "orgId?: string | null" src/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "// legacy" \
  | grep $GREP_OPTS -v "// deprecated" \
  || true)

if [ -n "$ORGID_VIOLATIONS" ]; then
  echo -e "${YELLOW}⚠ orgId?: string | null パターン検出（警告）${NC}"
  echo "$ORGID_VIOLATIONS"
  echo ""
  echo "推奨: Subject型 { type: 'org' | 'user', id: string } への移行を検討してください"
  echo ""
  # 警告のみなのでエラーカウントは増やさない
else
  echo -e "${GREEN}✓ OK${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 5: DashboardPageShell での認証取得直実装禁止
# ─────────────────────────────────────────────────────────────
echo "Check 5: DashboardPageShell での supabase.auth.getUser 直接呼び出し..."

SHELL_AUTH_VIOLATIONS=$(grep -n $GREP_OPTS "supabase.auth.getUser" src/components/dashboard/DashboardPageShell.tsx \
  || true)

if [ -n "$SHELL_AUTH_VIOLATIONS" ]; then
  echo -e "${YELLOW}⚠ DashboardPageShell での supabase.auth.getUser 検出（警告）${NC}"
  echo "$SHELL_AUTH_VIOLATIONS"
  echo ""
  echo "推奨: Server Gateで認証済みのため、重複チェックは不要です"
  echo ""
else
  echo -e "${GREEN}✓ OK${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check X: Supabase Auth 直叩き検出（Phase 12凍結 + Phase 13 allowlist強化）
# ─────────────────────────────────────────────────────────────
echo "Check X: Supabase Auth 直叩き（getUser/getSession/onAuthStateChange）..."

# ============================================================
# Phase 12: 上限固定（Current > LIMIT なら FAIL）
# Phase 13: allowlist 外ファイルがあれば FAIL
# Phase 14: A系集約により上限 16→9 に削減
# Phase 19: 手動testページ撤去により上限 9→3 に削減
# Phase 20: diag/auth をCore wrapper経由に移行、上限 3→1 に削減
# 許容残存: B(middleware)=1 のみ
# 詳細: docs/auth/auth-direct-calls-allowlist.md 参照
# ============================================================
AUTH_DIRECT_LIMIT=1
ALLOWLIST_DOC="docs/auth/auth-direct-calls-allowlist.md"

# 許可ディレクトリ（Core wrapper 内部は除外）
ALLOWED_AUTH_DIRS="lib/core/|lib/auth/|lib/supabase/"

# ─────────────────────────────────────────────────────────────
# Step 1: Allowlist を docs から読み込み（単一ソース）
# ─────────────────────────────────────────────────────────────
ALLOWLIST_FILES=""
if [ -f "$ALLOWLIST_DOC" ]; then
  ALLOWLIST_FILES=$(sed -n '/AUTH_DIRECT_CALLS_ALLOWLIST_START/,/AUTH_DIRECT_CALLS_ALLOWLIST_END/p' "$ALLOWLIST_DOC" \
    | grep $GREP_OPTS "^- " \
    | sed 's/^- //' \
    | tr '\n' '|' \
    | sed 's/|$//')
fi

if [ -z "$ALLOWLIST_FILES" ]; then
  echo -e "${RED}✗ FAIL: Allowlist が見つかりません${NC}"
  echo "  $ALLOWLIST_DOC に AUTH_DIRECT_CALLS_ALLOWLIST ブロックがありません"
  ERRORS=$((ERRORS + 1))
else
  # ─────────────────────────────────────────────────────────────
  # Step 2: 各パターンをカウント
  # ─────────────────────────────────────────────────────────────
  GETUSER_COUNT=$(grep -r $GREP_OPTS "\.auth\.getUser" src/ --include="*.ts" --include="*.tsx" \
    | grep $GREP_OPTS -v -E "$ALLOWED_AUTH_DIRS" | wc -l | tr -d ' ')
  GETSESSION_COUNT=$(grep -r $GREP_OPTS "\.auth\.getSession" src/ --include="*.ts" --include="*.tsx" \
    | grep $GREP_OPTS -v -E "$ALLOWED_AUTH_DIRS" | wc -l | tr -d ' ')
  ONAUTHCHANGE_COUNT=$(grep -r $GREP_OPTS "\.auth\.onAuthStateChange" src/ --include="*.ts" --include="*.tsx" \
    | grep $GREP_OPTS -v -E "$ALLOWED_AUTH_DIRS" | wc -l | tr -d ' ')

  TOTAL_AUTH_DIRECT=$((GETUSER_COUNT + GETSESSION_COUNT + ONAUTHCHANGE_COUNT))
  DELTA=$((TOTAL_AUTH_DIRECT - AUTH_DIRECT_LIMIT))

  echo "  getUser:           $GETUSER_COUNT 件"
  echo "  getSession:        $GETSESSION_COUNT 件"
  echo "  onAuthStateChange: $ONAUTHCHANGE_COUNT 件"
  echo "  ─────────────────────────────────────"

  # ─────────────────────────────────────────────────────────────
  # Step 3: Auth直叩きファイル一覧を取得（パス正規化: src// → src/）
  # ─────────────────────────────────────────────────────────────
  AUTH_DIRECT_FILES=$(grep -r $GREP_OPTS "\.auth\.getUser\|\.auth\.getSession\|\.auth\.onAuthStateChange" src/ --include="*.ts" --include="*.tsx" \
    | grep $GREP_OPTS -v -E "$ALLOWED_AUTH_DIRS" \
    | cut -d: -f1 \
    | sed 's|//|/|g' \
    | sort -u)

  # ─────────────────────────────────────────────────────────────
  # Step 4: Allowlist 外のファイルを検出
  # ─────────────────────────────────────────────────────────────
  VIOLATIONS=""
  for FILE in $AUTH_DIRECT_FILES; do
    # ファイルパスが allowlist に含まれるかチェック
    if ! echo "$FILE" | grep $GREP_OPTS -qE "$ALLOWLIST_FILES"; then
      VIOLATIONS="$VIOLATIONS$FILE\n"
    fi
  done

  VIOLATION_COUNT=$(echo -e "$VIOLATIONS" | grep -c . 2>/dev/null || true)
  VIOLATION_COUNT=${VIOLATION_COUNT:-0}
  VIOLATION_COUNT=$(echo "$VIOLATION_COUNT" | tr -d '\n' | tr -d ' ')

  # ─────────────────────────────────────────────────────────────
  # Step 5: ファイル別ヒット件数（許容内）
  # ─────────────────────────────────────────────────────────────
  echo "  【許容ファイル別ヒット件数】"
  for FILE in $AUTH_DIRECT_FILES; do
    if echo "$FILE" | grep $GREP_OPTS -qE "$ALLOWLIST_FILES"; then
      FILE_COUNT=$(grep -c $GREP_OPTS "\.auth\.getUser\|\.auth\.getSession\|\.auth\.onAuthStateChange" "$FILE" || echo "0")
      # ファイル名を短縮表示
      SHORT_FILE=$(echo "$FILE" | sed 's|src/||')
      echo "    $SHORT_FILE: $FILE_COUNT"
    fi
  done
  echo "  ─────────────────────────────────────"

  echo "  Limit:    $AUTH_DIRECT_LIMIT (固定上限)"
  echo "  Current:  $TOTAL_AUTH_DIRECT"
  if [ "$DELTA" -gt 0 ]; then
    echo "  Delta:    +$DELTA (超過)"
  elif [ "$DELTA" -lt 0 ]; then
    echo "  Delta:    $DELTA (余裕あり)"
  else
    echo "  Delta:    0 (上限ちょうど)"
  fi
  echo ""

  # ─────────────────────────────────────────────────────────────
  # Step 6: 判定（Phase 12: 総数チェック + Phase 13: allowlist外チェック）
  # ─────────────────────────────────────────────────────────────
  CHECK_X_FAILED=0

  # Phase 13: Allowlist 外ファイルチェック（優先）
  if [ "$VIOLATION_COUNT" -gt "0" ]; then
    echo -e "${RED}✗ FAIL: Allowlist 外のファイルで Auth直叩きを検出${NC}"
    echo ""
    echo "【許容外ファイル一覧】($VIOLATION_COUNT 件)"
    echo -e "$VIOLATIONS" | grep . | while read -r VFILE; do
      echo "  - $VFILE"
    done
    echo ""
    echo "【該当行（上位20件）】"
    for VFILE in $(echo -e "$VIOLATIONS" | grep .); do
      grep -n $GREP_OPTS "\.auth\.getUser\|\.auth\.getSession\|\.auth\.onAuthStateChange" "$VFILE" 2>/dev/null | head -5
    done | head -20
    echo ""
    CHECK_X_FAILED=1
  fi

  # Phase 12: 総数チェック
  if [ "$TOTAL_AUTH_DIRECT" -gt "$AUTH_DIRECT_LIMIT" ]; then
    echo -e "${RED}✗ FAIL: Auth直叩きが上限を超過 (Current=$TOTAL_AUTH_DIRECT > Limit=$AUTH_DIRECT_LIMIT)${NC}"
    echo ""
    CHECK_X_FAILED=1
  fi

  if [ "$CHECK_X_FAILED" -eq 1 ]; then
    echo "【修正方法】Core auth-state wrapper を使用してください:"
    echo "  サーバー側: @/lib/core/auth-state"
    echo "    - getUserWithClient(supabase)"
    echo "    - requireUserWithClient(supabase)"
    echo "    - getUserFullWithClient(supabase)"
    echo ""
    echo "  クライアント側: @/lib/core/auth-state.client"
    echo "    - getCurrentUserClient()"
    echo "    - refreshSessionClient()"
    echo ""
    echo "  詳細: $ALLOWLIST_DOC 参照"
    echo "  境界の全体像: docs/architecture/boundaries.md"
    echo ""
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${GREEN}✓ PASS: Auth直叩きチェック合格${NC}"
    echo "  - 総数: $TOTAL_AUTH_DIRECT <= $AUTH_DIRECT_LIMIT (OK)"
    echo "  - 許容外ファイル: 0 (OK)"
    if [ "$TOTAL_AUTH_DIRECT" -lt "$AUTH_DIRECT_LIMIT" ]; then
      echo "  ※さらに削減された場合、AUTH_DIRECT_LIMIT を更新できます"
    fi
  fi
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 6: 参照禁止DBオブジェクト（BAN_AS_UNUSED）
# ─────────────────────────────────────────────────────────────
echo "Check 6: 参照禁止DBオブジェクト..."

# 参照禁止パターン（from('テーブル名') 形式）
# news: ファイル運用確定
# blocked_ips: ip_blocklistに統一
# intrusion_detection_rules: 静的管理
# security_incidents: システムレベル

# 各禁止テーブルを個別にチェック（macOS互換）
BANNED_VIOLATIONS=""

for TABLE in news blocked_ips intrusion_detection_rules; do
  MATCHES=$(grep -r $GREP_OPTS "from(['\"]${TABLE}['\"])" src/ --include="*.ts" --include="*.tsx" \
    | grep $GREP_OPTS -v "// banned-ok" \
    | grep $GREP_OPTS -v "\.test\." \
    || true)
  if [ -n "$MATCHES" ]; then
    BANNED_VIOLATIONS="${BANNED_VIOLATIONS}${MATCHES}\n"
  fi
done

if [ -n "$BANNED_VIOLATIONS" ]; then
  echo -e "${RED}✗ 参照禁止DBオブジェクトへのアクセス検出${NC}"
  echo "$BANNED_VIOLATIONS"
  echo ""
  echo "修正方法: docs/core-architecture.md §14.2 を参照"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 7: レガシーErrorBoundary import禁止
# ─────────────────────────────────────────────────────────────
echo "Check 7: レガシーErrorBoundary import..."

# @/components/ErrorBoundary からの import を禁止
# 正本は @/lib/core/error-boundary
# レガシーファイル自身は除外
LEGACY_EB_VIOLATIONS=$(grep -r $GREP_OPTS "from '@/components/ErrorBoundary'" src/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "components/ErrorBoundary.tsx" \
  || true)

if [ -n "$LEGACY_EB_VIOLATIONS" ]; then
  echo -e "${RED}✗ レガシーErrorBoundary import検出${NC}"
  echo "$LEGACY_EB_VIOLATIONS"
  echo ""
  echo "修正方法: @/lib/core/error-boundary を使用してください"
  echo "  - import { ErrorBoundary } from '@/components/ErrorBoundary'"
  echo "  + import { ErrorBoundary } from '@/lib/core/error-boundary'"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 8: org-features 直接 import 禁止（0件必須）
# ─────────────────────────────────────────────────────────────
echo "Check 8: org-features 直接 import（0件必須）..."

# org-features からの直接 import を禁止（0件必須）
# NOTE: [2024-12-28] ベースライン方式から0件必須に変更
# 正本は featureGate.ts、org-features への直接参照は禁止
# 除外対象:
#   - featureGate.ts: re-export用（許可）
#   - org-features/内のファイル: 内部参照（許可）
ORG_FEATURES_VIOLATIONS=$(grep -r $GREP_OPTS "from '@/lib/org-features" src/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "lib/featureGate.ts" \
  | grep $GREP_OPTS -v "lib/org-features/" \
  || true)

ORG_FEATURES_COUNT=$(echo "$ORG_FEATURES_VIOLATIONS" | grep -c . || echo "0")

echo "  直接 import 箇所: $ORG_FEATURES_COUNT 件"
echo ""

if [ -n "$ORG_FEATURES_VIOLATIONS" ] && [ "$ORG_FEATURES_COUNT" -gt "0" ]; then
  echo -e "${RED}✗ org-features への直接 import が検出されました${NC}"
  echo ""
  echo "違反箇所:"
  echo "$ORG_FEATURES_VIOLATIONS"
  echo ""
  echo "修正方法: @/lib/featureGate を使用してください"
  echo "  - import { canUseFeature } from '@/lib/org-features'"
  echo "  + import { canUseFeature } from '@/lib/featureGate'"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK - org-features への直接 import なし（featureGate 経由のみ）${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 9: ページ内ハードコード検知（正本化方針）
# ─────────────────────────────────────────────────────────────
echo "Check 9: ページ内プラン比較ハードコード検知..."

# NOTE: [2024-12-28] 方針転換
# 以前: PLAN_LIMITS 参照カウントで増加を禁止
# 問題: ハードコードを撤去して正本（PLAN_LIMITS）参照に戻すと「増加」判定になる
# 新方針: ページ内にプラン比較のハードコード（重複データ）が存在しないことを検知
# 正本（PLAN_LIMITS, featureGate）からの参照は許可

# 禁止パターン: ページ内にプラン比較データをハードコードしている場合
# 例: const PLAN_COMPARISON = { starter: { services: 5 } }
HARDCODE_PATTERNS=$(grep -r $GREP_OPTS "PLAN_COMPARISON\|const.*=.*{.*starter:.*{.*services:" src/app/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

echo "  ページ内ハードコード: $HARDCODE_PATTERNS 件"
echo ""

if [ "$HARDCODE_PATTERNS" -gt "0" ]; then
  echo -e "${RED}✗ ページ内にプラン比較のハードコードが検出されました${NC}"
  echo ""
  echo "修正方法: ハードコードを削除し、正本（PLAN_LIMITS or featureGate）を参照してください"
  grep -r $GREP_OPTS "PLAN_COMPARISON\|const.*=.*{.*starter:.*{.*services:" src/app/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK - ページ内ハードコードなし（正本参照のみ）${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 10: プラン名分岐禁止（featureGate経由必須）
# ─────────────────────────────────────────────────────────────
echo "Check 10: プラン名分岐パターン..."

# ============================================================
# Phase 18: 単一ソース化
# Whitelist は docs/architecture/exceptions-allowlist.md から読み込み
# ============================================================
EXCEPTIONS_DOC="docs/architecture/exceptions-allowlist.md"

# docs から whitelist を読み込み
PLAN_WHITELIST=""
if [ -f "$EXCEPTIONS_DOC" ]; then
  # src/ と app/ を削除して、元のパターンと一致する形式に変換
  PLAN_WHITELIST=$(sed -n '/PLAN_BRANCH_ALLOWLIST_START/,/PLAN_BRANCH_ALLOWLIST_END/p' "$EXCEPTIONS_DOC" \
    | grep $GREP_OPTS "^- src/" \
    | sed 's/^- src\///' \
    | sed 's/^app\///' \
    | sed 's/\.tsx$//' \
    | sed 's/\.ts$//' \
    | tr '\n' '|' \
    | sed 's/|$//')
fi

# フォールバック（docs がない場合）
# NOTE: -E (extended regex) を使用するため、| をエスケープ不要
if [ -z "$PLAN_WHITELIST" ]; then
  PLAN_WHITELIST="management-console/users/page|api/oem/keys/route|api/billing/checkout-segmented/route|config/plans|config/features|organizations/page"
fi

# パターン1: plan === 'xxx'
PLAN_BRANCH_1=$(grep -r $GREP_OPTS "plan === ['\"]" src/app/ --include="*.ts" --include="*.tsx" \
  | grep -E $GREP_OPTS -v "$PLAN_WHITELIST" \
  | grep $GREP_OPTS -v "formData.plan ===" \
  || true)

# パターン2: .plan === (org.plan等)
PLAN_BRANCH_2=$(grep -r $GREP_OPTS "\.plan === ['\"]" src/app/ src/components/ --include="*.ts" --include="*.tsx" \
  | grep -E $GREP_OPTS -v "$PLAN_WHITELIST" \
  | grep $GREP_OPTS -v "formData.plan ===" \
  || true)

# パターン3: switch(plan) / switch(planKey) / switch(planTier)
PLAN_BRANCH_3=$(grep -r $GREP_OPTS "switch\s*(plan" src/app/ src/components/ --include="*.ts" --include="*.tsx" \
  | grep -E $GREP_OPTS -v "$PLAN_WHITELIST" \
  || true)

# パターン4: .includes(plan) / .includes(planKey) / .includes(planTier)
PLAN_BRANCH_4=$(grep -r $GREP_OPTS "\.includes(plan" src/app/ src/components/ --include="*.ts" --include="*.tsx" \
  | grep -E $GREP_OPTS -v "$PLAN_WHITELIST" \
  || true)

PLAN_BRANCH_VIOLATIONS=$(printf "%s\n%s\n%s\n%s" "$PLAN_BRANCH_1" "$PLAN_BRANCH_2" "$PLAN_BRANCH_3" "$PLAN_BRANCH_4" | grep . || true)
PLAN_BRANCH_COUNT=$(echo "$PLAN_BRANCH_VIOLATIONS" | grep -c . || echo "0")

echo "  プラン名分岐: $PLAN_BRANCH_COUNT 件"
echo ""

if [ -n "$PLAN_BRANCH_VIOLATIONS" ] && [ "$PLAN_BRANCH_COUNT" -gt "0" ]; then
  echo -e "${RED}✗ プラン名での分岐が検出されました${NC}"
  echo ""
  echo "違反箇所:"
  echo "$PLAN_BRANCH_VIOLATIONS"
  echo ""
  echo "修正方法: featureGate.getEffectiveFeatures + getFeatureEnabled を使用してください"
  echo "例外が必要な場合は docs/core-architecture.md Appendix D 参照"
  echo "境界の全体像: docs/architecture/boundaries.md"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK - プラン名分岐なし（featureGate経由のみ）${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 11: feature_flags直読み禁止
# ─────────────────────────────────────────────────────────────
echo "Check 11: feature_flags 直読み..."

# 禁止パターン（強化版）:
# - feature_flags[  （ブラケットアクセス）
# - feature_flags.  （ドットアクセス）
# - feature_flags?. （optional chaining）
# - .feature_flags  （org.feature_flags等）
#
# 許可ディレクトリ:
# - lib/org-features（内部実装）
# - lib/featureGate.ts（正本）
# - types/（型定義）
#
# ホワイトリストファイル: なし（完全撤廃済み）
#
# NOTE: コメント例外（// feature-flags-ok）は禁止
# NOTE: [2024-12] VerifiedBadge.tsx は純UI化により例外撤廃

FF_WHITELIST="lib/org-features\|lib/featureGate\|types/"

# パターン1: feature_flags[ （ブラケットアクセス）
FF_VIOLATIONS_1=$(grep -r $GREP_OPTS "feature_flags\[" src/app/ src/components/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "$FF_WHITELIST" \
  || true)

# パターン2: .feature_flags （org.feature_flags等のドットアクセス）
FF_VIOLATIONS_2=$(grep -r $GREP_OPTS "\.feature_flags" src/app/ src/components/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "$FF_WHITELIST" \
  | grep $GREP_OPTS -v "// type definition" \
  || true)

FEATURE_FLAGS_VIOLATIONS=$(printf "%s\n%s" "$FF_VIOLATIONS_1" "$FF_VIOLATIONS_2" | grep . || true)
FEATURE_FLAGS_COUNT=$(echo "$FEATURE_FLAGS_VIOLATIONS" | grep -c . || echo "0")

echo "  feature_flags直読み: $FEATURE_FLAGS_COUNT 件"
echo ""

if [ -n "$FEATURE_FLAGS_VIOLATIONS" ] && [ "$FEATURE_FLAGS_COUNT" -gt "0" ]; then
  echo -e "${RED}✗ feature_flags の直読みが検出されました${NC}"
  echo ""
  echo "違反箇所:"
  echo "$FEATURE_FLAGS_VIOLATIONS"
  echo ""
  echo "修正方法: featureGate.getEffectiveFeatures を使用してください"
  echo "例外が必要な場合は docs/core-architecture.md Appendix D 参照"
  echo "境界の全体像: docs/architecture/boundaries.md"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK - feature_flags直読みなし（featureGate経由のみ）${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 12: FeatureLocked ローカル定義禁止
# ─────────────────────────────────────────────────────────────
echo "Check 12: FeatureLocked ローカル定義..."

# 禁止パターン（強化版）:
# - function FeatureLocked
# - const FeatureLocked
# - export function FeatureLocked
# - export const FeatureLocked
# - FeatureLocked = (   （アロー関数代入）
#
# 許可ディレクトリ:
# - components/feature/FeatureLocked.tsx（正本）
#
# NOTE: src/app/ のみを検索対象（src/components/feature/ は正本なので除外）
# NOTE: コメント例外は禁止（ホワイトリスト方式のみ）

FL_WHITELIST="components/feature/FeatureLocked"

# パターン1: function FeatureLocked（export含む）
FL_VIOLATIONS_1=$(grep -r $GREP_OPTS "function FeatureLocked" src/app/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "$FL_WHITELIST" \
  || true)

# パターン2: const FeatureLocked（export含む）
FL_VIOLATIONS_2=$(grep -r $GREP_OPTS "const FeatureLocked" src/app/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "$FL_WHITELIST" \
  || true)

# パターン3: FeatureLocked = ( （アロー関数代入）
FL_VIOLATIONS_3=$(grep -r $GREP_OPTS "FeatureLocked = (" src/app/ --include="*.ts" --include="*.tsx" \
  | grep $GREP_OPTS -v "$FL_WHITELIST" \
  || true)

FEATURE_LOCKED_VIOLATIONS=$(printf "%s\n%s\n%s" "$FL_VIOLATIONS_1" "$FL_VIOLATIONS_2" "$FL_VIOLATIONS_3" | grep . || true)
FEATURE_LOCKED_COUNT=$(echo "$FEATURE_LOCKED_VIOLATIONS" | grep -c . || echo "0")

echo "  ローカル定義: $FEATURE_LOCKED_COUNT 件"
echo ""

if [ -n "$FEATURE_LOCKED_VIOLATIONS" ] && [ "$FEATURE_LOCKED_COUNT" -gt "0" ]; then
  echo -e "${RED}✗ FeatureLocked のローカル定義が検出されました${NC}"
  echo ""
  echo "違反箇所:"
  echo "$FEATURE_LOCKED_VIOLATIONS"
  echo ""
  echo "修正方法: @/components/feature/FeatureLocked を使用してください"
  echo "import { FeatureLocked } from '@/components/feature/FeatureLocked';"
  echo "境界の全体像: docs/architecture/boundaries.md"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK - FeatureLockedローカル定義なし（正本のみ）${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 13: /account 配下での DashboardPageShell 使用禁止
# ─────────────────────────────────────────────────────────────
echo "Check 13: /account での DashboardPageShell 使用..."

# 禁止パターン:
# - /account/** で DashboardPageShell を import/使用
# /account は user主体（UserShell）であり、org主体のDashboardPageShellは禁止
#
# 正しい使用法:
# - import { UserShell } from '@/components/account';
ACCOUNT_SHELL_VIOLATIONS=$(grep -r $GREP_OPTS "DashboardPageShell" src/app/account/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  || true)

ACCOUNT_SHELL_COUNT=$(echo "$ACCOUNT_SHELL_VIOLATIONS" | grep -c . || echo "0")

echo "  DashboardPageShell in /account: $ACCOUNT_SHELL_COUNT 件"
echo ""

if [ -n "$ACCOUNT_SHELL_VIOLATIONS" ] && [ "$ACCOUNT_SHELL_COUNT" -gt "0" ]; then
  echo -e "${RED}✗ /account 配下で DashboardPageShell が検出されました${NC}"
  echo ""
  echo "違反箇所:"
  echo "$ACCOUNT_SHELL_VIOLATIONS"
  echo ""
  echo "修正方法: /account は user主体です。UserShell を使用してください"
  echo "import { UserShell } from '@/components/account';"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ OK - /account は UserShell のみ使用${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 14: 例外リスト増加禁止 + 期限切れ警告
# ─────────────────────────────────────────────────────────────
echo "Check 14: 例外リスト管理（増加禁止/期限チェック）..."

# ============================================================
# Phase 18: 例外増加の機械的検知
# 各 allowlist の baseline を固定し、増加時は FAIL
# 減少は OK（歓迎）
# ============================================================

# Baseline 定義（現在の許容数）
# Phase 19: 手動testページ撤去により 4→2 に削減
# Phase 20: diag/auth をCore wrapper経由に移行、2→1 に削減
AUTH_ALLOWLIST_BASELINE=1
PLAN_BRANCH_ALLOWLIST_BASELINE=6
FEATURE_FLAGS_ALLOWLIST_BASELINE=0

# ─────────────────────────────────────────────────────────────
# Step 1: 各 allowlist の現在数をカウント
# ─────────────────────────────────────────────────────────────
AUTH_ALLOWLIST_DOC="docs/auth/auth-direct-calls-allowlist.md"

# Auth allowlist カウント
AUTH_CURRENT=0
if [ -f "$AUTH_ALLOWLIST_DOC" ]; then
  AUTH_CURRENT=$(sed -n '/AUTH_DIRECT_CALLS_ALLOWLIST_START/,/AUTH_DIRECT_CALLS_ALLOWLIST_END/p' "$AUTH_ALLOWLIST_DOC" \
    | grep $GREP_OPTS "^- src/" | wc -l | tr -d ' ')
fi

# Plan branch allowlist カウント
PLAN_CURRENT=0
if [ -f "$EXCEPTIONS_DOC" ]; then
  PLAN_CURRENT=$(sed -n '/PLAN_BRANCH_ALLOWLIST_START/,/PLAN_BRANCH_ALLOWLIST_END/p' "$EXCEPTIONS_DOC" \
    | grep $GREP_OPTS "^- src/" | wc -l | tr -d ' ')
fi

# Feature flags allowlist カウント
FF_CURRENT=0
if [ -f "$EXCEPTIONS_DOC" ]; then
  FF_CURRENT=$(sed -n '/FEATURE_FLAGS_ALLOWLIST_START/,/FEATURE_FLAGS_ALLOWLIST_END/p' "$EXCEPTIONS_DOC" \
    | grep $GREP_OPTS "^- src/" | wc -l | tr -d ' ')
fi

echo "  【Allowlist エントリ数】"
echo "  Auth直叩き:      Current=$AUTH_CURRENT / Baseline=$AUTH_ALLOWLIST_BASELINE"
echo "  プラン名分岐:    Current=$PLAN_CURRENT / Baseline=$PLAN_BRANCH_ALLOWLIST_BASELINE"
echo "  feature_flags:   Current=$FF_CURRENT / Baseline=$FEATURE_FLAGS_ALLOWLIST_BASELINE"
echo ""

# ─────────────────────────────────────────────────────────────
# Step 2: 増加チェック
# ─────────────────────────────────────────────────────────────
CHECK_14_FAILED=0

if [ "$AUTH_CURRENT" -gt "$AUTH_ALLOWLIST_BASELINE" ]; then
  echo -e "${RED}✗ Auth allowlist が増加しています (Current=$AUTH_CURRENT > Baseline=$AUTH_ALLOWLIST_BASELINE)${NC}"
  CHECK_14_FAILED=1
fi

if [ "$PLAN_CURRENT" -gt "$PLAN_BRANCH_ALLOWLIST_BASELINE" ]; then
  echo -e "${RED}✗ Plan branch allowlist が増加しています (Current=$PLAN_CURRENT > Baseline=$PLAN_BRANCH_ALLOWLIST_BASELINE)${NC}"
  CHECK_14_FAILED=1
fi

if [ "$FF_CURRENT" -gt "$FEATURE_FLAGS_ALLOWLIST_BASELINE" ]; then
  echo -e "${RED}✗ Feature flags allowlist が増加しています (Current=$FF_CURRENT > Baseline=$FEATURE_FLAGS_ALLOWLIST_BASELINE)${NC}"
  CHECK_14_FAILED=1
fi

if [ "$CHECK_14_FAILED" -eq 1 ]; then
  echo ""
  echo "【修正方法】例外を増やすには:"
  echo "  1. docs の該当 allowlist にエントリを追加（reason/remove_when/review_by 必須）"
  echo "  2. このスクリプトの BASELINE 値を更新"
  echo "  3. PRレビューで承認を得る"
  echo "  詳細: docs/architecture/exceptions-allowlist.md 参照"
  echo ""
  ERRORS=$((ERRORS + 1))
fi

# 減少の場合は通知
AUTH_DELTA=$((AUTH_CURRENT - AUTH_ALLOWLIST_BASELINE))
PLAN_DELTA=$((PLAN_CURRENT - PLAN_BRANCH_ALLOWLIST_BASELINE))
FF_DELTA=$((FF_CURRENT - FEATURE_FLAGS_ALLOWLIST_BASELINE))

if [ "$AUTH_DELTA" -lt 0 ] || [ "$PLAN_DELTA" -lt 0 ] || [ "$FF_DELTA" -lt 0 ]; then
  echo -e "${GREEN}✓ 例外が削減されました（BASELINE更新を推奨）${NC}"
  if [ "$AUTH_DELTA" -lt 0 ]; then echo "    Auth: $AUTH_DELTA"; fi
  if [ "$PLAN_DELTA" -lt 0 ]; then echo "    Plan: $PLAN_DELTA"; fi
  if [ "$FF_DELTA" -lt 0 ]; then echo "    FF: $FF_DELTA"; fi
  echo ""
fi

# ─────────────────────────────────────────────────────────────
# Step 3: 期限切れチェック（WARN のみ）
# Phase 18.1: node.js を使用した OS 非依存の日付比較
# ─────────────────────────────────────────────────────────────
EXPIRED_ENTRIES=""
EXPIRED_COUNT=0

# node.js で期限切れエントリを検出
# 出力形式: "ファイルパス|日付" （期限切れのみ）
check_expired() {
  local file=$1
  local start_marker=$2
  local end_marker=$3

  if [ ! -f "$file" ]; then
    return
  fi

  node -e "
    const fs = require('fs');
    const content = fs.readFileSync('$file', 'utf8');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const lines = content.split('\n');
    let inBlock = false;
    let currentFile = '';

    for (const line of lines) {
      if (line.includes('$start_marker')) { inBlock = true; continue; }
      if (line.includes('$end_marker')) { inBlock = false; continue; }

      if (inBlock) {
        if (line.startsWith('- src/')) {
          currentFile = line.slice(2).split('\n')[0].trim();
        } else if (line.includes('review_by:')) {
          const match = line.match(/review_by:\s*\"([^\"]+)\"/);
          if (match) {
            const dateStr = match[1];
            // YYYY-MM-DD 形式のみサポート
            if (/^\d{4}-\d{2}-\d{2}\$/.test(dateStr)) {
              const [y, m, d] = dateStr.split('-').map(Number);
              const reviewDate = new Date(y, m - 1, d);
              reviewDate.setHours(0, 0, 0, 0);
              if (reviewDate.getTime() < todayTime) {
                console.log(currentFile + '|' + dateStr);
              }
            } else {
              // フォーマット不正
              console.log(currentFile + '|INVALID:' + dateStr);
            }
          }
        }
      }
    }
  " 2>/dev/null || true
}

# Auth allowlist の期限切れチェック
AUTH_EXPIRED=$(check_expired "$AUTH_ALLOWLIST_DOC" "AUTH_DIRECT_CALLS_ALLOWLIST_START" "AUTH_DIRECT_CALLS_ALLOWLIST_END")
if [ -n "$AUTH_EXPIRED" ]; then
  EXPIRED_ENTRIES="$EXPIRED_ENTRIES$AUTH_EXPIRED"$'\n'
fi

# Exceptions allowlist の期限切れチェック
PLAN_EXPIRED=$(check_expired "$EXCEPTIONS_DOC" "PLAN_BRANCH_ALLOWLIST_START" "PLAN_BRANCH_ALLOWLIST_END")
if [ -n "$PLAN_EXPIRED" ]; then
  EXPIRED_ENTRIES="$EXPIRED_ENTRIES$PLAN_EXPIRED"$'\n'
fi

FF_EXPIRED=$(check_expired "$EXCEPTIONS_DOC" "FEATURE_FLAGS_ALLOWLIST_START" "FEATURE_FLAGS_ALLOWLIST_END")
if [ -n "$FF_EXPIRED" ]; then
  EXPIRED_ENTRIES="$EXPIRED_ENTRIES$FF_EXPIRED"$'\n'
fi

# 期限切れエントリのカウントと表示
EXPIRED_COUNT=$(echo "$EXPIRED_ENTRIES" | grep -c . 2>/dev/null || echo "0")
EXPIRED_COUNT=$(echo "$EXPIRED_COUNT" | tr -d '\n' | tr -d ' ')

if [ "$EXPIRED_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠ 期限切れの例外エントリがあります (${EXPIRED_COUNT}件)${NC}"
  echo "  → 例外を更新するか撤去してください"
  echo ""
  echo "  【期限切れエントリ一覧】"
  echo "$EXPIRED_ENTRIES" | grep . | while IFS='|' read -r FILE DATE; do
    if [[ "$DATE" == INVALID:* ]]; then
      echo "    - $FILE (フォーマット不正: ${DATE#INVALID:})"
    else
      echo "    - $FILE (期限: $DATE)"
    fi
  done
  echo ""
fi

# 正常完了
if [ "$CHECK_14_FAILED" -eq 0 ] && [ "$EXPIRED_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✓ OK - 例外リスト管理（増加なし/期限切れなし）${NC}"
elif [ "$CHECK_14_FAILED" -eq 0 ]; then
  echo -e "${GREEN}✓ OK - 例外リスト増加なし（期限切れは WARN）${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 15: blue-* パターン例外管理（デザイントークン統一）
# ─────────────────────────────────────────────────────────────
echo "Check 15: blue-* パターン例外管理..."

# ============================================================
# Phase 4 (PR7-E): blue-* パターンの CI ガード
# - allowlist 外の blue-* があれば FAIL
# - allowlist 件数が baseline を超えたら FAIL
# - 単一ソース: docs/architecture/exceptions-allowlist.md
# ============================================================

BLUE_EXCEPTIONS_DOC="docs/architecture/exceptions-allowlist.md"
BLUE_BASELINE=64

# ─────────────────────────────────────────────────────────────
# Step 1: 許容ファイルリストを docs から読み込み（一時ファイル使用）
# ─────────────────────────────────────────────────────────────
BLUE_ALLOWLIST_FILE=$(mktemp)
if [ -f "$BLUE_EXCEPTIONS_DOC" ]; then
  sed -n '/BLUE_EXCEPTIONS_START/,/BLUE_EXCEPTIONS_END/p' "$BLUE_EXCEPTIONS_DOC" \
    | grep $GREP_OPTS "^- src/" \
    | sed 's/^- //' \
    | cut -d: -f1 > "$BLUE_ALLOWLIST_FILE"
fi

BLUE_ALLOWLIST_COUNT=$(wc -l < "$BLUE_ALLOWLIST_FILE" | tr -d ' ')

if [ "$BLUE_ALLOWLIST_COUNT" -eq 0 ]; then
  echo -e "${RED}✗ FAIL: blue-* allowlist が見つかりません${NC}"
  echo "  $BLUE_EXCEPTIONS_DOC に BLUE_EXCEPTIONS ブロックがありません"
  ERRORS=$((ERRORS + 1))
  rm -f "$BLUE_ALLOWLIST_FILE"
else
  # ─────────────────────────────────────────────────────────────
  # Step 2: 現在の blue-* パターンを持つファイルをリストアップ
  # ─────────────────────────────────────────────────────────────
  BLUE_FILES=$(grep -r $GREP_OPTS "blue-" src/ --include="*.tsx" --include="*.ts" \
    | cut -d: -f1 \
    | sed 's|//|/|g' \
    | sort -u)

  BLUE_TOTAL=$(echo "$BLUE_FILES" | grep -c . 2>/dev/null || echo "0")
  BLUE_TOTAL=$(echo "$BLUE_TOTAL" | tr -d '\n' | tr -d ' ')

  # ─────────────────────────────────────────────────────────────
  # Step 3: allowlist 外のファイルを検出（完全一致比較）
  # ─────────────────────────────────────────────────────────────
  BLUE_VIOLATIONS=""
  for FILE in $BLUE_FILES; do
    # ファイルパスが allowlist に完全一致で含まれるかチェック（-Fx で固定文字列完全一致）
    if ! grep -qFx "$FILE" "$BLUE_ALLOWLIST_FILE"; then
      BLUE_VIOLATIONS="$BLUE_VIOLATIONS$FILE\n"
    fi
  done

  BLUE_VIOLATION_COUNT=$(echo -e "$BLUE_VIOLATIONS" | grep -c . 2>/dev/null || echo "0")
  BLUE_VIOLATION_COUNT=$(echo "$BLUE_VIOLATION_COUNT" | tr -d '\n' | tr -d ' ')

  # ─────────────────────────────────────────────────────────────
  # Step 4: カテゴリ別件数を集計
  # ─────────────────────────────────────────────────────────────
  CHART_COUNT=$(grep -c $GREP_OPTS "category=chart" "$BLUE_EXCEPTIONS_DOC" 2>/dev/null || echo "0")
  STATUS_COUNT=$(grep -c $GREP_OPTS "category=status" "$BLUE_EXCEPTIONS_DOC" 2>/dev/null || echo "0")
  DECORATIVE_COUNT=$(grep -c $GREP_OPTS "category=decorative" "$BLUE_EXCEPTIONS_DOC" 2>/dev/null || echo "0")
  ICON_COUNT=$(grep -c $GREP_OPTS "category=icon" "$BLUE_EXCEPTIONS_DOC" 2>/dev/null || echo "0")
  PRICING_COUNT=$(grep -c $GREP_OPTS "category=pricing" "$BLUE_EXCEPTIONS_DOC" 2>/dev/null || echo "0")
  PARTNERS_COUNT=$(grep -c $GREP_OPTS "category=partners" "$BLUE_EXCEPTIONS_DOC" 2>/dev/null || echo "0")

  ALLOWLIST_FILE_COUNT=$(sed -n '/BLUE_EXCEPTIONS_START/,/BLUE_EXCEPTIONS_END/p' "$BLUE_EXCEPTIONS_DOC" \
    | grep $GREP_OPTS "^- src/" | wc -l | tr -d ' ')

  echo "  【カテゴリ別件数】"
  echo "    chart:      $CHART_COUNT"
  echo "    status:     $STATUS_COUNT"
  echo "    decorative: $DECORATIVE_COUNT"
  echo "    icon:       $ICON_COUNT"
  echo "    pricing:    $PRICING_COUNT"
  echo "    partners:   $PARTNERS_COUNT"
  echo "  ─────────────────────────────────────"
  echo "  Allowlist:    $ALLOWLIST_FILE_COUNT ファイル"
  echo "  Current:      $BLUE_TOTAL ファイル（blue-*を含む）"
  echo "  Baseline:     $BLUE_BASELINE"
  echo ""

  # ─────────────────────────────────────────────────────────────
  # Step 5: 判定
  # ─────────────────────────────────────────────────────────────
  CHECK_15_FAILED=0

  # Allowlist 外ファイルチェック
  if [ "$BLUE_VIOLATION_COUNT" -gt "0" ]; then
    echo -e "${RED}✗ FAIL: Allowlist 外のファイルで blue-* パターンを検出${NC}"
    echo ""
    echo "【許容外ファイル一覧】($BLUE_VIOLATION_COUNT 件)"
    echo -e "$BLUE_VIOLATIONS" | grep . | while read -r VFILE; do
      echo "  - $VFILE"
    done
    echo ""
    echo "【修正方法】"
    echo "  (1) primaryなら → bg-[var(--aio-primary)], hover:bg-[var(--aio-primary-hover)]"
    echo "  (2) info boxなら → bg-[var(--aio-info-surface)], border-[var(--aio-info-border)]"
    echo "  (3) chartなら → docs の allowlist に追加（要レビュー）"
    echo ""
    echo "【該当箇所（上位10件）】"
    for VFILE in $(echo -e "$BLUE_VIOLATIONS" | grep . | head -5); do
      grep -n $GREP_OPTS "blue-" "$VFILE" 2>/dev/null | head -2
    done
    echo ""
    CHECK_15_FAILED=1
  fi

  # Allowlist 増加チェック
  if [ "$ALLOWLIST_FILE_COUNT" -gt "$BLUE_BASELINE" ]; then
    echo -e "${RED}✗ FAIL: blue-* allowlist が増加しています (Current=$ALLOWLIST_FILE_COUNT > Baseline=$BLUE_BASELINE)${NC}"
    echo ""
    echo "【修正方法】allowlist を増やすには:"
    echo "  1. docs/architecture/exceptions-allowlist.md に category/reason/remove_when/review_by を追加"
    echo "  2. このスクリプトの BLUE_BASELINE を更新"
    echo "  3. PRレビューで承認を得る"
    echo ""
    CHECK_15_FAILED=1
  fi

  if [ "$CHECK_15_FAILED" -eq 1 ]; then
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${GREEN}✓ PASS: blue-* パターン管理OK${NC}"
    echo "  - 許容外ファイル: 0"
    echo "  - Allowlist: $ALLOWLIST_FILE_COUNT <= $BLUE_BASELINE"

    # 削減された場合の通知
    if [ "$ALLOWLIST_FILE_COUNT" -lt "$BLUE_BASELINE" ]; then
      BLUE_DELTA=$((ALLOWLIST_FILE_COUNT - BLUE_BASELINE))
      echo -e "  ${GREEN}✓ 例外が削減されました ($BLUE_DELTA)、BASELINE更新を推奨${NC}"
    fi
  fi

  # 一時ファイルを削除
  rm -f "$BLUE_ALLOWLIST_FILE"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# Check 16: UI Exposure Gaps (WARN only)
# ─────────────────────────────────────────────────────────────
echo "Check 16: UI露出ギャップ監査（WARNレベル）..."

UI_GAPS_FILE="docs/architecture/ui-exposure-gaps.md"
if [ -f "$UI_GAPS_FILE" ]; then
  # A) UI未露出の件数を取得
  UI_UNEXPOSED_COUNT=$(grep -o '"A_ui_unexposed"' "$UI_GAPS_FILE" | wc -l || echo "0")

  # 機械可読ブロックからUI未露出件数を抽出
  if grep -q '"A_ui_unexposed"' "$UI_GAPS_FILE"; then
    # JSONブロックから件数をカウント（簡易的に "route": の数をカウント）
    UI_UNEXPOSED_COUNT=$(sed -n '/"A_ui_unexposed"/,/\]/p' "$UI_GAPS_FILE" | grep -c '"route":' || echo "0")
  fi

  if [ "$UI_UNEXPOSED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ WARN: UI未露出が ${UI_UNEXPOSED_COUNT} 件あります${NC}"
    echo "  詳細: $UI_GAPS_FILE"
    echo "  注意: 新規追加時は増加を避けてください"
  else
    echo -e "${GREEN}✓ OK - UI未露出なし${NC}"
  fi
else
  echo -e "${YELLOW}⚠ WARN: $UI_GAPS_FILE が存在しません${NC}"
  echo "  docs/architecture/ui-exposure-gaps.md を作成してください"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 結果サマリー
# ─────────────────────────────────────────────────────────────
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}アーキテクチャチェック完了（エラーなし）${NC}"
  echo ""
  echo "注意: Check X で $TOTAL_AUTH_DIRECT 件の直叩きが残存"
  echo "      新規追加は禁止、段階的に削減してください"
  exit 0
else
  echo -e "${RED}${ERRORS}件のアーキテクチャ違反を検出${NC}"
  echo ""
  echo "詳細は docs/core-architecture.md を参照してください"
  exit 1
fi
