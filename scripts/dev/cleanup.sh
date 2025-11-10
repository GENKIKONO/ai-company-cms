#!/bin/bash
#
# Phase 4 - 開発環境プロセス整流化スクリプト
# npm run dev 重複起動を検出・解消し、単一プロセスで運用
#
# 🔧 【開発環境】グループ: プロセス管理スクリプト
# 📊 使用場面: 開発開始前の環境クリーンアップ
# ⚡ 実行: `./scripts/dev/cleanup.sh` 
# 🎯 目的: npm run dev プロセス重複を防ぎ開発環境を最適化
#

set -euo pipefail

# カラー出力定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[DEV-CLEANUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Node.js / Next.js 開発サーバープロセス検出
detect_dev_processes() {
    log "開発サーバープロセスを検出中..."
    
    # npm run dev, next dev, node processes
    local npm_processes=$(pgrep -f "npm run dev" 2>/dev/null || true)
    local next_processes=$(pgrep -f "next dev" 2>/dev/null || true)
    local node_next_processes=$(ps aux | grep "node.*next" | grep -v grep | awk '{print $2}' || true)
    
    echo "$npm_processes"
    echo "$next_processes" 
    echo "$node_next_processes"
}

# プロセス数カウント
count_processes() {
    local processes=$(detect_dev_processes | grep -v "^$" | wc -l)
    echo "$processes"
}

# プロセス詳細表示
show_process_details() {
    log "現在のNext.js開発プロセス:"
    ps aux | grep -E "(npm run dev|next dev)" | grep -v grep | while read line; do
        echo "  → $line"
    done
}

# 重複プロセス削除（最新を残す）
cleanup_duplicate_processes() {
    local process_count=$(count_processes)
    
    if [ "$process_count" -le 1 ]; then
        success "プロセス重複なし (count: $process_count)"
        return 0
    fi
    
    warn "重複プロセス検出: $process_count 個"
    show_process_details
    
    log "最新プロセス以外を終了中..."
    
    # npm run dev プロセスを取得（作成時間順）
    local npm_pids=$(ps -eo pid,lstart,cmd | grep "npm run dev" | grep -v grep | sort -k2 | awk '{print $1}')
    
    if [ ! -z "$npm_pids" ]; then
        # 最新以外のプロセスを終了
        local pids_array=($npm_pids)
        local total=${#pids_array[@]}
        
        if [ $total -gt 1 ]; then
            for ((i=0; i<total-1; i++)); do
                local pid=${pids_array[$i]}
                log "PID $pid を終了中..."
                kill -TERM "$pid" 2>/dev/null || true
                sleep 1
                
                # SIGTERM で終了しない場合は SIGKILL
                if kill -0 "$pid" 2>/dev/null; then
                    warn "SIGTERM失敗、SIGKILL送信中... PID: $pid"
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            done
        fi
    fi
    
    # Next.js プロセスも同様に整理
    local next_pids=$(pgrep -f "next dev" 2>/dev/null || true)
    if [ ! -z "$next_pids" ]; then
        local next_array=($next_pids)
        local next_total=${#next_array[@]}
        
        if [ $next_total -gt 1 ]; then
            for ((i=0; i<next_total-1; i++)); do
                local pid=${next_array[$i]}
                log "Next.js PID $pid を終了中..."
                kill -TERM "$pid" 2>/dev/null || true
                sleep 1
            done
        fi
    fi
    
    sleep 2
    local final_count=$(count_processes)
    
    if [ "$final_count" -le 1 ]; then
        success "プロセス整理完了 (残り: $final_count)"
    else
        error "プロセス整理失敗 (残り: $final_count)"
        return 1
    fi
}

# ポート使用状況確認
check_port_usage() {
    log "ポート3000の使用状況:"
    lsof -i :3000 2>/dev/null || echo "  ポート3000: 使用なし"
    
    log "ポート3001-3010の使用状況:"
    for port in {3001..3010}; do
        local usage=$(lsof -i :$port 2>/dev/null || true)
        if [ ! -z "$usage" ]; then
            echo "  ポート$port: $usage"
        fi
    done
}

# 開発サーバー正常性チェック
health_check() {
    log "開発サーバー正常性チェック..."
    
    sleep 3
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        success "✅ http://localhost:3000/ - 正常稼働"
        return 0
    else
        error "❌ http://localhost:3000/ - 応答なし (code: $response)"
        return 1
    fi
}

# リソース使用量表示
show_resource_usage() {
    log "現在のリソース使用量:"
    
    # CPU使用率 (Node.js プロセス)
    local node_cpu=$(ps aux | grep -E "(node|npm)" | grep -v grep | awk '{sum += $3} END {printf "%.1f", sum}')
    echo "  CPU使用率 (Node.js): ${node_cpu:-0.0}%"
    
    # メモリ使用量 (Node.js プロセス) 
    local node_mem=$(ps aux | grep -E "(node|npm)" | grep -v grep | awk '{sum += $6} END {printf "%.1f", sum/1024}')
    echo "  メモリ使用量 (Node.js): ${node_mem:-0.0}MB"
    
    # 全体システム負荷
    echo "  システム負荷: $(uptime | awk -F'load average:' '{print $2}')"
}

# メイン処理
main() {
    echo "=================================================="
    echo "🛠️  AIO Hub 開発環境プロセス整流化"
    echo "=================================================="
    echo ""
    
    log "Phase 4 - 運用安定化プロセス開始"
    
    # 現状確認
    show_process_details
    show_resource_usage
    check_port_usage
    
    echo ""
    log "プロセス重複解消を実行中..."
    
    # プロセス整理
    if cleanup_duplicate_processes; then
        echo ""
        log "整理後の状況確認..."
        show_process_details
        show_resource_usage
        
        echo ""
        if health_check; then
            echo ""
            success "🎉 開発環境整流化完了!"
            success "   単一プロセスでの安定稼働を確認"
        else
            error "開発サーバーの再起動が必要です"
            log "実行: npm run dev"
        fi
    else
        error "プロセス整理に失敗しました"
        return 1
    fi
    
    echo ""
    echo "=================================================="
    log "このスクリプトを定期実行する場合:"
    log "  crontab -e"
    log "  */30 * * * * /path/to/this/script"
    echo "=================================================="
}

# スクリプト実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi