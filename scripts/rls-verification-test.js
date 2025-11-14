/**
 * RLS Verification Script
 * 
 * 実際のSupabaseデータベースに接続して、RLSが正しく動作しているかを検証する
 * 
 * 必要な環境変数:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabaseプロジェクトの URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service Role Key (管理者権限)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Anonymous Key (任意、パブリックアクセステスト用)
 * 
 * 使用方法:
 * NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
 * SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..." \
 * NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..." \
 * node scripts/rls-verification-test.js
 * 
 * または .env ファイルで環境変数を設定してから：
 * node scripts/rls-verification-test.js
 * 
 * 実行後の結果は docs/rls-verification-report.md の「実行結果記録」セクションにコピペしてください
 */

const { createClient } = require('@supabase/supabase-js');

// 環境変数チェック
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Required environment variables not found:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL (required)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY (required)');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY (optional, for public access tests)');
  console.error('');
  console.error('Example:');
  console.error('NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \\');
  console.error('SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..." \\');
  console.error('node scripts/rls-verification-test.js');
  process.exit(1);
}

// Supabase管理者クライアント（RLS回避）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Supabase匿名クライアント（RLS適用）
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);

async function main() {
  console.log('🔍 RLS Protection Verification Test');
  console.log('=====================================\n');

  const testResults = [];

  try {
    // テストユーザーとコンテンツの作成
    console.log('1. Creating test user and content...');
    
    const testUserId = `rls-test-${Date.now()}`;
    const testOrgId = `rls-test-org-${Date.now()}`;
    
    // 管理者権限でテストデータ作成
    const { data: testUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: testUserId,
        email: `${testUserId}@example.com`,
        name: 'RLS Test User',
        account_status: 'active'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Failed to create test user:', userError);
      return;
    }

    const { data: testOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        id: testOrgId,
        name: 'RLS Test Organization',
        slug: `rls-test-org-${Date.now()}`,
        description: 'Test organization for RLS verification',
        created_by: testUserId,
        is_published: true,
        status: 'published'
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ Failed to create test organization:', orgError);
      return;
    }

    console.log('✅ Test data created successfully');

    // テスト 1: 正常状態での公開API確認
    console.log('\n2. Testing normal published content access...');
    
    const { data: publicOrgs1, error: publicError1 } = await supabaseAnon
      .from('organizations')
      .select('*')
      .eq('is_published', true)
      .eq('status', 'published');

    const foundOrg = publicOrgs1?.find(org => org.id === testOrgId);
    if (foundOrg) {
      console.log('✅ Published content is accessible via public API');
      testResults.push({ test: 'Public access to published content', status: 'PASS' });
    } else {
      console.log('❌ Published content not found in public API');
      testResults.push({ test: 'Public access to published content', status: 'FAIL' });
    }

    // テスト 2: ユーザーをsuspendedに変更
    console.log('\n3. Changing user status to suspended...');
    
    const { error: suspendError } = await supabaseAdmin
      .from('profiles')
      .update({ account_status: 'suspended' })
      .eq('id', testUserId);

    if (suspendError) {
      console.error('❌ Failed to suspend user:', suspendError);
      return;
    }

    // auto-unpublish関数の実行（手動）
    console.log('\n4. Executing auto-unpublish function...');
    
    const { error: unpublishError } = await supabaseAdmin
      .rpc('unpublish_org_public_content_for_user', {
        p_user_id: testUserId
      });

    if (unpublishError) {
      console.log('⚠️ Auto-unpublish function failed:', unpublishError.message);
      testResults.push({ test: 'Auto-unpublish RPC execution', status: 'FAIL', error: unpublishError.message });
    } else {
      console.log('✅ Auto-unpublish function executed successfully');
      testResults.push({ test: 'Auto-unpublish RPC execution', status: 'PASS' });
    }

    // テスト 3: suspended後の公開API確認
    console.log('\n5. Testing content access after suspension...');
    
    // 少し待ってからチェック
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: publicOrgs2, error: publicError2 } = await supabaseAnon
      .from('organizations')
      .select('*')
      .eq('is_published', true)
      .eq('status', 'published');

    const foundOrgAfterSuspension = publicOrgs2?.find(org => org.id === testOrgId);
    if (!foundOrgAfterSuspension) {
      console.log('✅ Suspended user content is hidden from public API');
      testResults.push({ test: 'Content hidden after suspension', status: 'PASS' });
    } else {
      console.log('❌ Suspended user content is still visible in public API');
      testResults.push({ test: 'Content hidden after suspension', status: 'FAIL' });
    }

    // テスト 4: 管理者権限での確認
    console.log('\n6. Testing admin access to unpublished content...');
    
    const { data: adminOrg, error: adminError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', testOrgId)
      .single();

    if (adminError) {
      console.log('❌ Admin cannot access organization:', adminError);
      testResults.push({ test: 'Admin access to unpublished content', status: 'FAIL' });
    } else {
      console.log('✅ Admin can access organization data');
      console.log(`   Organization status: is_published=${adminOrg.is_published}, status=${adminOrg.status}`);
      
      if (adminOrg.is_published === false) {
        console.log('✅ Auto-unpublish correctly set is_published=false');
        testResults.push({ test: 'Auto-unpublish sets is_published=false', status: 'PASS' });
      } else {
        console.log('❌ Auto-unpublish did not set is_published=false');
        testResults.push({ test: 'Auto-unpublish sets is_published=false', status: 'FAIL' });
      }
    }

    // クリーンアップ
    console.log('\n7. Cleaning up test data...');
    await supabaseAdmin.from('organizations').delete().eq('id', testOrgId);
    await supabaseAdmin.from('profiles').delete().eq('id', testUserId);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('💥 Test execution failed:', error);
    testResults.push({ test: 'Overall test execution', status: 'ERROR', error: error.message });
  }

  // 結果サマリー
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  let passCount = 0;
  let failCount = 0;
  let errorCount = 0;

  testResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : '💥';
    
    console.log(`${status} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.status === 'PASS') passCount++;
    else if (result.status === 'FAIL') failCount++;
    else errorCount++;
  });

  console.log(`\nTotal: ${testResults.length} tests`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`💥 Errors: ${errorCount}`);

  // docs/rls-verification-report.md にコピペしやすい形式でも出力
  console.log('\n' + '='.repeat(50));
  console.log('📋 COPY TO docs/rls-verification-report.md');
  console.log('='.repeat(50));
  console.log(`実行日時: ${new Date().toISOString()}`);
  console.log(`環境: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/https:\/\/([^.]+)\..*/, 'Project: $1')}`);
  console.log('');
  console.log('実行結果:');
  console.log('```');
  testResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : '💥';
    console.log(`${status} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  console.log('```');
  console.log('');
  console.log(`総合判定: ${failCount === 0 && errorCount === 0 ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(50));

  if (failCount === 0 && errorCount === 0) {
    console.log('\n🎉 All tests passed! RLS protection is working correctly.');
    console.log('\n📝 Please copy the above section to docs/rls-verification-report.md');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Please review the results above.');
    console.log('\n📝 Please copy the above section to docs/rls-verification-report.md');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});