#!/usr/bin/env node
/**
 * Edge Function admin-audit-log 検証スクリプト
 *
 * site_admins ユーザーとしてログインし、Edge Functionを呼び出してテスト
 *
 * 必要な環境変数:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - E2E_ADMIN_EMAIL
 * - E2E_ADMIN_PASSWORD
 *
 * 使用方法:
 * node scripts/test-admin-audit-edge-function.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.local を読み込み
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

// 環境変数チェック
function checkEnvVars() {
  const missingVars = [];
  if (!SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!E2E_ADMIN_EMAIL) missingVars.push('E2E_ADMIN_EMAIL');
  if (!E2E_ADMIN_PASSWORD) missingVars.push('E2E_ADMIN_PASSWORD');

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((v) => console.error(`   - ${v}`));
    console.error('\n📝 Create .env.local with:');
    console.error(`
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=your-password
`);
    process.exit(1);
  }
}

async function main() {
  checkEnvVars();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Edge Function admin-audit-log 検証');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: 認証
  console.log('🔐 Step 1: ユーザー認証...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: E2E_ADMIN_EMAIL,
    password: E2E_ADMIN_PASSWORD,
  });

  if (authError) {
    console.error('❌ 認証失敗:', authError.message);
    process.exit(1);
  }

  const accessToken = authData.session?.access_token;
  if (!accessToken) {
    console.error('❌ アクセストークンが取得できませんでした');
    process.exit(1);
  }

  console.log('✅ 認証成功');
  console.log(`   User ID: ${authData.user?.id}`);
  console.log(`   Email: ${authData.user?.email}`);

  // Step 2: site_admins 確認
  console.log('\n🔍 Step 2: site_admins 確認...');
  const { data: adminCheck, error: adminError } = await supabase
    .from('site_admins')
    .select('user_id')
    .eq('user_id', authData.user?.id)
    .maybeSingle();

  if (adminError) {
    console.warn('⚠️  site_admins テーブルへのアクセスエラー:', adminError.message);
  } else if (!adminCheck) {
    console.warn('⚠️  ユーザーは site_admins に未登録');
    console.warn('   Edge Function は動作しますが、RLS制限がある場合があります');
  } else {
    console.log('✅ ユーザーは site_admin です');
  }

  // Step 3: Edge Function 呼び出し
  console.log('\n📡 Step 3: Edge Function 呼び出し...');

  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/admin-audit-log`;
  const payload = {
    page: '/dashboard/admin/jobs',
    action: 'filter_changed',
    detail: 'status=running,q=abc',
  };

  console.log(`   URL: ${edgeFunctionUrl}`);
  console.log(`   Payload: ${JSON.stringify(payload)}`);

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = null;
    }

    console.log(`\n   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response: ${JSON.stringify(responseJson || responseText, null, 2)}`);

    if (response.ok) {
      console.log('\n✅ Edge Function 呼び出し成功!');

      // Step 4: DB確認
      console.log('\n🔍 Step 4: DB反映確認...');
      const { data: auditLogs, error: selectError } = await supabase
        .from('ops_audit')
        .select('*')
        .eq('action', 'filter_changed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (selectError) {
        console.warn('⚠️  ops_audit SELECTエラー:', selectError.message);
        console.warn('   これはRLS制限による可能性があります');
      } else if (auditLogs && auditLogs.length > 0) {
        console.log('✅ 監査ログがDBに記録されています');
        console.log('   最新エントリ:');
        console.log(`   - ID: ${auditLogs[0].id}`);
        console.log(`   - Action: ${auditLogs[0].action}`);
        console.log(`   - Target: ${auditLogs[0].target}`);
        console.log(`   - Created: ${auditLogs[0].created_at}`);
      } else {
        console.warn('⚠️  監査ログが見つかりません');
        console.warn('   INSERTは成功したがSELECT権限がない可能性があります');
      }

      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('  ✅ テスト完了: Edge Function は正常に動作しています');
      console.log('═══════════════════════════════════════════════════════════\n');
      process.exit(0);

    } else {
      console.error('\n❌ Edge Function 呼び出し失敗');
      analyzeFailure(response.status, responseJson || responseText);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ネットワークエラー:', error.message);
    console.log('\n🔍 原因分析:');
    console.log('   - ネットワーク接続を確認');
    console.log('   - Supabaseプロジェクトのステータスを確認');
    console.log('   - Edge Function がデプロイされているか確認');
    process.exit(1);
  }
}

function analyzeFailure(status, response) {
  console.log('\n🔍 原因分析:');

  switch (status) {
    case 401:
      console.log('   原因: 認証エラー');
      console.log('   対策:');
      console.log('   - JWTトークンの有効期限を確認');
      console.log('   - 正しい認証情報でログインしているか確認');
      break;

    case 403:
      console.log('   原因: 権限エラー');
      console.log('   対策:');
      console.log('   - ユーザーが site_admins に登録されているか確認');
      console.log('   - RLSポリシーを確認');
      break;

    case 404:
      console.log('   原因: Edge Function が見つからない');
      console.log('   対策:');
      console.log('   - Edge Function がデプロイされているか確認');
      console.log('   - デプロイコマンド: supabase functions deploy admin-audit-log');
      break;

    case 500:
      console.log('   原因: サーバーエラー');
      console.log('   詳細:', JSON.stringify(response, null, 2));
      console.log('   対策:');
      console.log('   - Supabase Dashboard でEdge Functionログを確認');
      console.log('   - ops_audit テーブルのカラム構造を確認');
      console.log('   - RLSポリシーがINSERTを許可しているか確認');
      break;

    default:
      console.log(`   不明なエラー (status: ${status})`);
      console.log('   詳細:', JSON.stringify(response, null, 2));
  }
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});
