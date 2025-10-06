#!/bin/bash

# RLS/スキーマ監査 & APIスモークテスト 統合実行スクリプト
# 目的: audit-rls.mjsとsmoke-api.mjsを連続実行して総合判定

set -e  # エラー時に即座に終了

echo "🚀 RLS/API総合監査を開始します..."
echo "=============================================="

# 現在のディレクトリを確認
if [[ ! -f "package.json" ]]; then
    echo "❌ package.jsonが見つかりません。プロジェクトルートで実行してください。"
    exit 1
fi

# 環境変数ファイルの確認
ENV_FILE=""
if [[ -f ".env.local" ]]; then
    ENV_FILE=".env.local"
elif [[ -f ".env.development" ]]; then
    ENV_FILE=".env.development"
else
    echo "❌ 環境変数ファイル (.env.local または .env.development) が見つかりません。"
    echo "💡 以下の環境変数を設定してください:"
    echo "   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

echo "📁 環境変数ファイル: $ENV_FILE"

# 必須環境変数の確認
source "$ENV_FILE"

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" 
    "SUPABASE_SERVICE_ROLE_KEY"
)

echo "🔍 必須環境変数を確認中..."
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ 環境変数 $var が設定されていません"
        exit 1
    else
        # URLとキーの一部のみ表示（セキュリティ対策）
        if [[ $var == *"URL"* ]]; then
            echo "✅ $var: ${!var}"
        else
            echo "✅ $var: ${!var:0:10}..."
        fi
    fi
done

# ログディレクトリの作成
echo "📁 ログディレクトリを準備中..."
mkdir -p logs

# タイムスタンプ
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
echo "⏰ 実行タイムスタンプ: $TIMESTAMP"

echo ""
echo "=============================================="
echo "🔍 ステップ 1: RLS/スキーマ監査"
echo "=============================================="

# RLS監査実行
if npm run audit:rls; then
    echo "✅ RLS/スキーマ監査: 成功"
    RLS_STATUS="OK"
else
    echo "❌ RLS/スキーマ監査: 失敗"
    RLS_STATUS="FAILED"
fi

echo ""
echo "=============================================="
echo "🧪 ステップ 2: APIスモークテスト"
echo "=============================================="

# APIスモークテスト実行
if npm run smoke:api; then
    echo "✅ APIスモークテスト: 成功"
    SMOKE_STATUS="OK"
else
    echo "❌ APIスモークテスト: 失敗"
    SMOKE_STATUS="FAILED"
fi

echo ""
echo "=============================================="
echo "📊 総合結果サマリ"
echo "=============================================="

# 結果サマリ
echo "🔍 RLS/スキーマ監査: $RLS_STATUS"
echo "🧪 APIスモークテスト: $SMOKE_STATUS"
echo "⏰ 実行時刻: $(date)"
echo "📁 ログディレクトリ: ./logs/"

# 最新のログファイルを表示
echo ""
echo "📋 最新のログファイル:"
ls -lt logs/ | head -5

# 総合判定
if [[ "$RLS_STATUS" == "OK" && "$SMOKE_STATUS" == "OK" ]]; then
    echo ""
    echo "🎉 すべての検証に成功しました！"
    echo "✅ データベースのRLS設定が正常です"
    echo "✅ APIエンドポイントが正常に動作しています"
    echo "✅ 本番デプロイの準備が整っています"
    
    # 成功ログの作成
    SUCCESS_LOG="logs/verify-success-$TIMESTAMP.txt"
    cat > "$SUCCESS_LOG" << EOF
=== RLS/API総合監査 成功レポート ===
実行日時: $(date)
RLS監査: $RLS_STATUS
API テスト: $SMOKE_STATUS

✅ すべての検証項目に合格
✅ セキュリティポリシーが正常に動作
✅ APIエンドポイントが期待通りに応答
✅ 本番環境への移行準備完了

詳細ログ:
$(ls -1 logs/rls-audit-* logs/smoke-* 2>/dev/null | tail -2)
EOF
    echo "📄 成功レポート: $SUCCESS_LOG"
    
    exit 0
else
    echo ""
    echo "💥 検証で問題が発見されました"
    
    if [[ "$RLS_STATUS" != "OK" ]]; then
        echo "🔥 RLS/スキーマ監査で問題発生"
        echo "   💡 対処: 必須カラム、RLS設定、ポリシーを確認してください"
    fi
    
    if [[ "$SMOKE_STATUS" != "OK" ]]; then
        echo "🔥 APIスモークテストで問題発生"  
        echo "   💡 対処: API設定、認証設定、RLS動作を確認してください"
    fi
    
    echo ""
    echo "📚 トラブルシューティング:"
    echo "   1. npm run audit:rls の詳細ログを確認"
    echo "   2. npm run smoke:api の詳細ログを確認"
    echo "   3. Supabaseダッシュボードでテーブル・ポリシー状態を確認"
    echo "   4. 環境変数（URL・キー）の設定を再確認"
    
    # 失敗ログの作成
    FAILURE_LOG="logs/verify-failure-$TIMESTAMP.txt"
    cat > "$FAILURE_LOG" << EOF
=== RLS/API総合監査 失敗レポート ===
実行日時: $(date)
RLS監査: $RLS_STATUS
API テスト: $SMOKE_STATUS

❌ 検証で問題が発見されました

次のステップ:
1. 個別ログファイルの詳細確認
2. Supabase設定の見直し
3. 必要に応じてマイグレーション再実行
4. 修正後の再テスト実行

詳細ログ:
$(ls -1 logs/rls-audit-* logs/smoke-* 2>/dev/null | tail -2)
EOF
    echo "📄 失敗レポート: $FAILURE_LOG"
    
    exit 1
fi