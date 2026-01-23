#!/bin/bash

# Forbidden Fields Checker Script
# org_id → organization_id 移行の再発防止

set -e

echo "🔍 Checking for forbidden field usage..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to report errors
report_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

report_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check 1: Database queries using org_id
echo "Checking database queries..."
ORG_ID_QUERIES=$(grep -r "\.eq('org_id'" src/ --exclude="*.bak*" 2>/dev/null || true)
if [ -n "$ORG_ID_QUERIES" ]; then
    report_error "Found .eq('org_id') database queries:"
    echo "$ORG_ID_QUERIES"
    echo "💡 Should use .eq('organization_id') instead"
    echo ""
fi

# Check 2: Insert/upsert operations with org_id
echo "Checking insert operations..."
# 除外対象:
#   - src/types/ (自動生成型定義)
#   - p_org_id (RPC引数名)
#   - src/app/admin/ (Admin内部処理)
#   - Zodスキーマ定義 (org_id: z.)
# Legacy allowlist: 以下のパターンは既存コードで許可（Gate v3で解消予定）
# - /types/ : 自動生成型定義
# - /api/admin/, /app/admin/ : Admin内部処理（信頼されたコンテキスト）
# - /api/my/ : ユーザーAPI（レスポンスメタデータ等）
# - /lib/ : 内部ライブラリ（RPC呼び出し、監査ログ等）
# - p_org_id : RPC引数名
# - org_id: z. : Zodスキーマ定義
# - target_org_id : ジョブメタデータ
ORG_ID_INSERTS=$(grep -r "org_id:" src/ --include="*.ts" --include="*.tsx" --exclude="*.bak*" 2>/dev/null | grep -v "/types/" | grep -v "p_org_id" | grep -v "/api/admin/" | grep -v "/app/admin/" | grep -v "/api/my/" | grep -v "/lib/" | grep -v "org_id: z\." | grep -v "target_org_id" | grep -v "// ALLOWED:" | grep -v "constraint\|fkey" | grep -v "\* - org_id" || true)
if [ -n "$ORG_ID_INSERTS" ]; then
    report_error "Found org_id in object/insert operations:"
    echo "$ORG_ID_INSERTS"
    echo "💡 Should use organization_id instead"
    echo "💡 If this is a FK constraint name, add comment: // ALLOWED: FK constraint"
    echo ""
fi

# Check 3: Select queries with org_id
echo "Checking select operations..."
ORG_ID_SELECTS=$(grep -r "\.select.*org_id" src/ --exclude="*.bak*" 2>/dev/null | grep -v "// ALLOWED:" || true)
if [ -n "$ORG_ID_SELECTS" ]; then
    report_error "Found .select() with org_id fields:"
    echo "$ORG_ID_SELECTS"
    echo "💡 Should use organization_id instead"
    echo ""
fi

# Check 4: Type definitions with org_id
# 注意: supabase.ts, rpc.ts などの自動生成型はDBスキーマに準拠しており、org_idは正当
# 手動で作成した型定義のみをチェック（自動生成ファイル・既知のレガシーファイルは除外）
echo "Checking type definitions..."
ORG_ID_TYPES=$(grep -r "org_id:" src/types/ --exclude="*.bak*" --exclude="supabase.ts" --exclude="rpc.ts" --exclude="supabase-admin.ts" --exclude="admin-metrics.ts" --exclude="org-groups-supabase.ts" 2>/dev/null || true)
if [ -n "$ORG_ID_TYPES" ]; then
    report_error "Found org_id in type definitions:"
    echo "$ORG_ID_TYPES"
    echo "💡 Should use organization_id instead"
    echo ""
fi

# Check 5: Hardcoded analytics URLs (should use CACHE_KEYS)
echo "Checking for hardcoded API URLs..."
HARDCODED_ANALYTICS=$(grep -r "'/api/analytics" src/ --include="*.ts" --include="*.tsx" | grep -v "CACHE_KEYS" | grep -v "comment\|TODO" 2>/dev/null || true)
if [ -n "$HARDCODED_ANALYTICS" ]; then
    report_warning "Found hardcoded analytics API URLs:"
    echo "$HARDCODED_ANALYTICS"
    echo "💡 Consider using CACHE_KEYS.analytics*() functions"
    echo ""
fi

# Check 6: Proper backward compatibility patterns
echo "Checking backward compatibility patterns..."
MISSING_FALLBACK=$(grep -r "searchParams\.get('organization_id')" src/ --include="*.ts" | grep -v "|| searchParams\.get('org_id')" 2>/dev/null || true)
if [ -n "$MISSING_FALLBACK" ]; then
    report_warning "Found organization_id param reads without org_id fallback:"
    echo "$MISSING_FALLBACK"  
    echo "💡 Consider adding: searchParams.get('organization_id') || searchParams.get('org_id')"
    echo ""
fi

# Summary
echo "=================="
if [ $ERRORS -eq 0 ]; then
    report_success "No critical forbidden field issues found!"
    exit 0
else
    report_error "Found $ERRORS critical issues that need to be fixed"
    exit 1
fi