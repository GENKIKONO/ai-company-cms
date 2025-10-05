#!/bin/bash

# 本番/ローカル デプロイ検証スクリプト - 完全自動化版
# Usage: ./scripts/verify-deployment.sh [environment] [domain]
# Example: ./scripts/verify-deployment.sh development localhost:3001
# Example: ./scripts/verify-deployment.sh production aiohub.jp

set -e

# 設定
ENVIRONMENT=${1:-production}
DOMAIN=${2:-aiohub.jp}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"

# ログディレクトリの作成
mkdir -p "$LOGS_DIR"

# URL構築（開発環境の場合はhttp、本番環境の場合はhttps）
if [[ "$DOMAIN" == *"localhost"* ]]; then
    BASE_URL="http://${DOMAIN}"
else
    BASE_URL="https://${DOMAIN}"
fi

TIMESTAMP=$(date '+%Y%m%d%H%M%S')
LOG_FILE="$LOGS_DIR/verify-${ENVIRONMENT}-$(echo ${DOMAIN} | tr ':' '-')-${TIMESTAMP}.log"

# 色付きログ関数
log_info() { 
    echo -e "\033[0;36m[INFO]\033[0m $1" | tee -a "$LOG_FILE"
}

log_success() { 
    echo -e "\033[0;32m[SUCCESS]\033[0m $1" | tee -a "$LOG_FILE"
}

log_warning() { 
    echo -e "\033[0;33m[WARNING]\033[0m $1" | tee -a "$LOG_FILE"
}

log_error() { 
    echo -e "\033[0;31m[ERROR]\033[0m $1" | tee -a "$LOG_FILE"
}

log_retry() {
    echo -e "\033[0;35m[RETRY]\033[0m $1" | tee -a "$LOG_FILE"
}

# リトライ機能付きHTTPチェック
http_check_with_retry() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    local max_retries=3
    local retry_count=0
    local backoff=1
    
    while [ $retry_count -lt $max_retries ]; do
        if [ $retry_count -gt 0 ]; then
            log_retry "Retrying $description (attempt $((retry_count + 1))/$max_retries) after ${backoff}s..."
            sleep $backoff
            backoff=$((backoff * 2))  # 指数バックオフ
        fi
        
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [[ "$status" =~ ^$expected_status$ ]]; then
            log_success "✅ $description (HTTP $status)"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -ge $max_retries ]; then
            log_error "❌ $description failed after $max_retries attempts (HTTP $status)"
            return 1
        fi
    done
}

# JSON解析関数（jqなしでok フィールドを抽出）
extract_ok_field() {
    local json="$1"
    echo "$json" | sed -n 's/.*"ok":\s*\([^,}]*\).*/\1/p' | tr -d ' '
}

# メイン検証開始
log_info "🚀 Starting deployment verification for $ENVIRONMENT environment"
log_info "Target: $BASE_URL"
log_info "Log file: $LOG_FILE"

# カウンター初期化
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 1. ルート疎通チェック
log_info "1️⃣ Checking root connectivity..."
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if http_check_with_retry "$BASE_URL/" "200|301|302" "Root endpoint"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 2. Well-known ファイルチェック（存在するもののみ）
log_info "2️⃣ Checking well-known files..."

# robots.txt - 200 または 404 で PASS
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
robots_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/robots.txt" 2>/dev/null || echo "000")
if [[ "$robots_status" =~ ^(200|404)$ ]]; then
    log_success "✅ robots.txt (HTTP $robots_status - acceptable)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    log_error "❌ robots.txt failed (HTTP $robots_status - expected 200 or 404)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# sitemap.xml - 200 で PASS, 404 で WARN
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
sitemap_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sitemap.xml" 2>/dev/null || echo "000")
if [ "$sitemap_status" = "200" ]; then
    log_success "✅ sitemap.xml (HTTP $sitemap_status)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
elif [ "$sitemap_status" = "404" ]; then
    log_warning "⚠️ sitemap.xml (HTTP $sitemap_status - missing but not critical)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))  # 404 も PASS として扱う
else
    log_error "❌ sitemap.xml failed (HTTP $sitemap_status)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 3. 健全性チェックAPI
log_info "3️⃣ Running comprehensive health check API..."
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

HEALTH_RESPONSE=""
HEALTH_OK="false"
max_retries=3
retry_count=0
backoff=1

while [ $retry_count -lt $max_retries ]; do
    if [ $retry_count -gt 0 ]; then
        log_retry "Retrying health check (attempt $((retry_count + 1))/$max_retries) after ${backoff}s..."
        sleep $backoff
        backoff=$((backoff * 2))
    fi
    
    HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health/deployment" 2>/dev/null || echo '{"ok":false,"error":"Connection failed"}')
    HEALTH_OK=$(extract_ok_field "$HEALTH_RESPONSE")
    
    if [ "$HEALTH_OK" = "true" ]; then
        log_success "✅ Health check API passed"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        break
    fi
    
    retry_count=$((retry_count + 1))
    if [ $retry_count -ge $max_retries ]; then
        log_error "❌ Health check API failed after $max_retries attempts"
        echo "Response: $HEALTH_RESPONSE" | tee -a "$LOG_FILE"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
done

# 4. 組織API確認
log_info "4️⃣ Testing organization API..."
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if http_check_with_retry "$BASE_URL/api/my/organization" "401|200" "Organization API (expecting 401 for unauthenticated or 200)"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 5. 認証エンドポイント確認
log_info "5️⃣ Testing authentication endpoints..."
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if http_check_with_retry "$BASE_URL/api/debug/whoami" "200" "Debug whoami endpoint"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# サマリー開始マーカー
echo "=== SUMMARY BEGIN ===" | tee -a "$LOG_FILE"

# 結果サマリー
echo "" | tee -a "$LOG_FILE"
echo "🔍 DEPLOYMENT VERIFICATION SUMMARY" | tee -a "$LOG_FILE"
echo "==================================" | tee -a "$LOG_FILE"
echo "Environment: $ENVIRONMENT" | tee -a "$LOG_FILE"
echo "Domain: $DOMAIN" | tee -a "$LOG_FILE"
echo "Target URL: $BASE_URL" | tee -a "$LOG_FILE"
echo "Timestamp: $(date)" | tee -a "$LOG_FILE"
echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Results:" | tee -a "$LOG_FILE"
echo "  Total checks: $TOTAL_CHECKS" | tee -a "$LOG_FILE"
echo "  Passed: $PASSED_CHECKS" | tee -a "$LOG_FILE"
echo "  Failed: $FAILED_CHECKS" | tee -a "$LOG_FILE"
echo "  Success rate: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 詳細結果
if [ "$HEALTH_OK" = "true" ]; then
    echo "✅ Health check API: PASSED" | tee -a "$LOG_FILE"
else
    echo "❌ Health check API: FAILED" | tee -a "$LOG_FILE"
fi

# 最終判定
if [ $FAILED_CHECKS -eq 0 ]; then
    log_success "🎉 ✅ $(echo $ENVIRONMENT | tr '[:lower:]' '[:upper:]') verification passed"
    echo "✅ All critical systems operational" | tee -a "$LOG_FILE"
    echo "✅ Ready for traffic" | tee -a "$LOG_FILE"
    FINAL_RESULT="PASSED"
    EXIT_CODE=0
else
    log_error "❌ Verification failed"
    echo "❌ $FAILED_CHECKS/$TOTAL_CHECKS checks failed" | tee -a "$LOG_FILE"
    echo "❌ Review logs before proceeding" | tee -a "$LOG_FILE"
    FINAL_RESULT="FAILED"
    EXIT_CODE=1
fi

echo "" | tee -a "$LOG_FILE"
echo "Final Result: $FINAL_RESULT" | tee -a "$LOG_FILE"

# サマリー終了マーカー
echo "=== SUMMARY END ===" | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
log_info "Verification complete. Log saved to: $LOG_FILE"

exit $EXIT_CODE