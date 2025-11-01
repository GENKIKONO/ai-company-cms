#!/bin/bash
# Phase 3: SEO Integration & AI×SEO 相関分析システム API テストコマンド
# 実行前に seo_search_console_metrics テーブルが作成されていることを確認してください

set -e

echo "🚀 Phase 3 API テスト開始"
echo "=================================="

# 設定
BASE_URL="http://localhost:3006"
ORG_ID="c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3"  # LuxuCare組織ID
SITE_URL="https://luxucare.co.jp"

echo "📊 1. GSC データ収集 API テスト"
echo "GET /api/analytics/seo/gsc"

# GSC データ取得（キャッシュ確認）
echo "📝 GSC データ取得（既存データ確認）..."
curl -s "${BASE_URL}/api/analytics/seo/gsc?org_id=${ORG_ID}&site_url=${SITE_URL}" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n📝 GSC データ強制リフレッシュ..."
curl -s "${BASE_URL}/api/analytics/seo/gsc?org_id=${ORG_ID}&site_url=${SITE_URL}&force_refresh=true&start_date=2025-10-27&end_date=2025-10-30" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n📝 GSC データ手動収集（POST）..."
curl -s -X POST "${BASE_URL}/api/analytics/seo/gsc" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "'${ORG_ID}'",
    "site_url": "'${SITE_URL}'",
    "start_date": "2025-10-25",
    "end_date": "2025-10-30",
    "include_queries": true,
    "force_refresh": true
  }' | jq '.'

echo -e "\n🔗 2. AI×SEO 相関分析 API テスト"
echo "GET /api/analytics/ai/combined"

# AI×SEO 統合分析
echo "📝 AI×SEO 統合分析実行..."
curl -s "${BASE_URL}/api/analytics/ai/combined?org_id=${ORG_ID}&trend_days=30&min_data_points=3" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n📝 AI×SEO 統合分析（短期間）..."
curl -s "${BASE_URL}/api/analytics/ai/combined?org_id=${ORG_ID}&trend_days=7&min_data_points=1" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n🧪 3. エラーケーステスト"

# org_id なし
echo "📝 org_id 不足エラーテスト..."
curl -s "${BASE_URL}/api/analytics/seo/gsc" \
  -H "Content-Type: application/json" | jq '.error // "No error"'

# 存在しない org_id
echo "📝 存在しない org_id エラーテスト..."
curl -s "${BASE_URL}/api/analytics/seo/gsc?org_id=00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" | jq '.error // "No error"'

echo -e "\n📈 4. パフォーマンステスト（同時リクエスト）"

echo "📝 同時実行テスト..."
for i in {1..3}; do
  curl -s "${BASE_URL}/api/analytics/ai/combined?org_id=${ORG_ID}" \
    -H "Content-Type: application/json" \
    -o "/tmp/response_${i}.json" &
done
wait

echo "同時実行完了。レスポンスファイル確認:"
for i in {1..3}; do
  echo "レスポンス ${i}:"
  jq '.summary.total_analyzed_urls // "Error"' "/tmp/response_${i}.json"
done

echo -e "\n🔍 5. データ整合性確認"

# SEO データ確認
echo "📝 SEO メトリクスデータ確認..."
curl -s "${BASE_URL}/api/analytics/seo/gsc?org_id=${ORG_ID}" \
  -H "Content-Type: application/json" | \
  jq '{
    success: .success,
    stored_records: .stored_records,
    total_impressions: .metrics.total_impressions,
    total_clicks: .metrics.total_clicks,
    average_position: .metrics.average_position,
    top_pages_count: (.top_pages | length),
    top_queries_count: (.top_queries | length)
  }'

# AI×SEO 相関データ確認
echo -e "\n📝 AI×SEO 相関データ確認..."
curl -s "${BASE_URL}/api/analytics/ai/combined?org_id=${ORG_ID}" \
  -H "Content-Type: application/json" | \
  jq '{
    org_id: .org_id,
    correlation_score: .ai_seo_correlation.correlation_score,
    correlation_strength: .ai_seo_correlation.correlation_strength,
    sample_size: .ai_seo_correlation.sample_size,
    total_analyzed_urls: .summary.total_analyzed_urls,
    high_performance_urls: .summary.high_performance_urls,
    ai_visibility_avg: .summary.ai_visibility_avg,
    seo_position_avg: .summary.seo_position_avg,
    performance_categories: {
      ai_strong_seo_strong: [.performance_matrix[] | select(.performance_category == "ai_strong_seo_strong")] | length,
      ai_strong_seo_weak: [.performance_matrix[] | select(.performance_category == "ai_strong_seo_weak")] | length,
      ai_weak_seo_strong: [.performance_matrix[] | select(.performance_category == "ai_weak_seo_strong")] | length,
      ai_weak_seo_weak: [.performance_matrix[] | select(.performance_category == "ai_weak_seo_weak")] | length
    }
  }'

echo -e "\n✅ Phase 3 API テスト完了"
echo "=================================="

# クリーンアップ
rm -f /tmp/response_*.json

echo "📋 次のステップ:"
echo "1. ダッシュボードUIでカード表示を確認"
echo "2. プロダクション環境での動作確認"
echo "3. GSC認証情報の設定確認"
echo "4. パフォーマンスモニタリング設定"