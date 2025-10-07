#!/bin/bash

# ===============================================
# Phase 2 Embed Migration 手動適用スクリプト
# ===============================================

set -e

echo "🚀 Phase 2 Embed Migration 適用を開始..."

# 環境変数チェック
if [ -z "$SUPABASE_DB_URL_RO" ]; then
    echo "❌ SUPABASE_DB_URL_RO が設定されていません"
    echo "💡 .env.local ファイルを確認してください"
    exit 1
fi

# URL変換（READ-ONLY -> WRITE接続）
DB_URL_WRITE=$(echo "$SUPABASE_DB_URL_RO" | sed 's/:5432\/postgres/:5432\/postgres?sslmode=require/')

echo "📋 適用予定のDBオブジェクト:"
echo "   テーブル: 4個 (embed_usage, embed_usage_daily, embed_usage_monthly, embed_configurations)"
echo "   関数: 3個 (get_top_embed_sources, get_realtime_embed_stats, update_daily_embed_stats)" 
echo "   インデックス: 8個"
echo "   RLSポリシー: 7個"
echo "   トリガー: 1個"

echo ""
echo "⚠️  本番データベースに適用します。続行しますか？ (y/N)"
read -r confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "❌ 処理をキャンセルしました"
    exit 1
fi

echo ""
echo "📡 マイグレーション実行中..."

# PostgreSQL接続確認
if ! command -v psql &> /dev/null; then
    echo "❌ psql コマンドが見つかりません"
    echo "💡 PostgreSQL クライアントをインストールしてください:"
    echo "   brew install postgresql"
    exit 1
fi

# マイグレーション実行
if psql "$DB_URL_WRITE" -f supabase/migrations/20251008_embed_usage.sql; then
    echo ""
    echo "✅ マイグレーション実行成功！"
    
    # 確認
    echo "🔍 適用結果を確認中..."
    node scripts/check-embed-tables.mjs
    
    echo ""
    echo "🎉 Phase 2 データベース要件が満たされました！"
    echo "📋 次のステップ:"
    echo "   1. Embed API エンドポイントのテスト"
    echo "   2. 管理画面での使用状況確認"
    echo "   3. CORS設定の本番対応"
    
else
    echo ""
    echo "❌ マイグレーション実行に失敗しました"
    echo "💡 手動で以下を実行してください:"
    echo "   psql \"\$SUPABASE_DB_URL_RO\" -f supabase/migrations/20251008_embed_usage.sql"
    exit 1
fi