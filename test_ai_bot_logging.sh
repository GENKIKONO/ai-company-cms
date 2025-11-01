#!/bin/bash
# AI Bot Logging 実動作確認テスト
# 組織: luxucare (ID: c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3)

echo "=== AI Bot Logging テスト開始 ==="
echo "対象組織: luxucare"
echo "想定されるログ件数: 最大9件（3ボット×3エンドポイント）"
echo ""

# --- localhost:3006 テスト ---
echo "🌐 localhost:3006 でテスト実行"

# 1. GPTBot - 組織情報API
echo "  📋 GPTBot -> organizations/luxucare"
curl -s -w "Status: %{http_code}\n" \
  "http://localhost:3006/api/public/organizations/luxucare" \
  -H "User-Agent: Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)" \
  > /dev/null

# 2. GPTBot - JSON-LD API
echo "  📄 GPTBot -> luxucare/jsonld"
curl -s -w "Status: %{http_code}\n" \
  "http://localhost:3006/api/public/luxucare/jsonld?type=organization" \
  -H "User-Agent: Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)" \
  > /dev/null

# 3. GPTBot - サービス一覧API
echo "  🔍 GPTBot -> services"
curl -s -w "Status: %{http_code}\n" \
  "http://localhost:3006/api/public/services?org=luxucare" \
  -H "User-Agent: Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)" \
  > /dev/null

# 4. Bingbot - 組織情報API
echo "  📋 Bingbot -> organizations/luxucare"
curl -s -w "Status: %{http_code}\n" \
  "http://localhost:3006/api/public/organizations/luxucare" \
  -H "User-Agent: Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" \
  > /dev/null

# 5. Bingbot - JSON-LD API
echo "  📄 Bingbot -> luxucare/jsonld"
curl -s -w "Status: %{http_code}\n" \
  "http://localhost:3006/api/public/luxucare/jsonld?type=organization" \
  -H "User-Agent: Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" \
  > /dev/null

# 6. Bingbot - サービス一覧API
echo "  🔍 Bingbot -> services"
curl -s -w "Status: %{http_code}\n" \
  "http://localhost:3006/api/public/services?org=luxucare" \
  -H "User-Agent: Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" \
  > /dev/null

# 7. PerplexityBot - 組織情報API
echo "  📋 PerplexityBot -> organizations/luxucare"
curl -s -w "Status: %{http_code}\n" \
  "http://localhost:3006/api/public/organizations/luxucare" \
  -H "User-Agent: Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai)" \
  > /dev/null

# 8. PerplexityBot - JSON-LD API
echo "  📄 PerplexityBot -> luxucare/jsonld"
curl -s -w "Status: %{http_code}\n" \
  "http://localhost:3006/api/public/luxucare/jsonld?type=organization" \
  -H "User-Agent: Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai)" \
  > /dev/null

# 9. PerplexityBot - サービス一覧API
echo "  🔍 PerplexityBot -> services"
curl -s -w "Status: %{http_code}\n" \
  "http://localhost:3006/api/public/services?org=luxucare" \
  -H "User-Agent: Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai)" \
  > /dev/null

echo ""
echo "=== localhost:3006 完了 ==="
echo ""
echo "🎉 テスト完了"
echo "💡 Supabaseでログを確認してください:"
echo "   SELECT bot_name, url, accessed_at FROM ai_bot_logs WHERE org_id = 'c53b7fae-1ae3-48f4-98c1-5c3217f9fbb3' ORDER BY accessed_at DESC LIMIT 10;"
echo "📊 ダッシュボード: http://localhost:3006/dashboard/analytics/ai-seo-report"