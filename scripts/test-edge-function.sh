#!/bin/bash
# Test admin-audit-log Edge Function

set -e

# Load environment variables
source .env.local

# Get fresh token via Supabase Auth API
echo "Getting access token..."
AUTH_RESPONSE=$(curl -s -X POST "https://chyicolujwhkycpkxbej.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${E2E_ADMIN_EMAIL}\",\"password\":\"${E2E_ADMIN_PASSWORD}\"}")

ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | node -e "
let d='';
process.stdin.on('data',c=>d+=c);
process.stdin.on('end',()=>{
  try{console.log(JSON.parse(d).access_token||'')}
  catch{console.log('')}
})
")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Failed to get access token"
  echo "Auth response: $AUTH_RESPONSE"
  exit 1
fi

echo "Token acquired (first 50 chars): ${ACCESS_TOKEN:0:50}..."
echo ""

# Test Edge Function
echo "=== POST /functions/v1/admin-audit-log ==="
HTTP_CODE=$(curl -s -X POST "https://chyicolujwhkycpkxbej.supabase.co/functions/v1/admin-audit-log" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"page":"/dashboard/manage/jobs","action":"filter_changed","detail":"status=running,q=abc"}' \
  -o /tmp/edge-response.json -w "%{http_code}")

echo "HTTP_CODE: $HTTP_CODE"
echo "Response:"
cat /tmp/edge-response.json
echo ""
