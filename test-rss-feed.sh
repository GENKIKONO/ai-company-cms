#!/bin/bash
# RSS Feed テストスクリプト

echo "=== RSS Feed テスト ==="

# ローカルテスト
echo "1. ローカル検証..."
LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/feed.xml)
echo "HTTPステータス: $LOCAL_STATUS"

if [ "$LOCAL_STATUS" = "200" ]; then
  echo "✅ ローカル200応答"
  LOCAL_FIRST_CHAR=$(curl -s http://localhost:3001/feed.xml | head -c 1)
  if [ "$LOCAL_FIRST_CHAR" = "<" ]; then
    echo "✅ ローカルXML構造正常"
  else
    echo "❌ ローカルXML構造異常: '$LOCAL_FIRST_CHAR'"
  fi
else
  echo "❌ ローカル$LOCAL_STATUS応答"
fi

# 本番テスト
echo ""
echo "2. 本番検証..."
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aiohub.jp/feed.xml)
echo "HTTPステータス: $PROD_STATUS"

if [ "$PROD_STATUS" = "200" ]; then
  echo "✅ 本番200応答"
  PROD_FIRST_CHAR=$(curl -s https://aiohub.jp/feed.xml | head -c 1)
  if [ "$PROD_FIRST_CHAR" = "<" ]; then
    echo "✅ 本番XML構造正常"
  else
    echo "❌ 本番XML構造異常: '$PROD_FIRST_CHAR'"
  fi
else
  echo "❌ 本番$PROD_STATUS応答"
fi

echo ""
echo "=== テスト完了 ==="