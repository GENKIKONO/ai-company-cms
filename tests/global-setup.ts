import { chromium, FullConfig } from '@playwright/test';
import { supabaseAdmin } from '../src/lib/supabase-server';

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2Eテストのグローバルセットアップを開始...');

  // テスト用ユーザーとデータの準備
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'user'
  };

  try {
    const supabase = supabaseAdmin();

    // 既存のテストデータをクリーンアップ
    await cleanupTestData(supabase, testUser.email);

    // テストユーザーを作成
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true
    });

    if (userError && !userError.message.includes('already registered')) {
      throw userError;
    }

    const userId = user?.user?.id;
    if (userId) {
      // app_users テーブルにエントリを作成
      const { error: appUserError } = await supabase
        .from('app_users')
        .upsert({
          id: userId,
          email: testUser.email,
          role: testUser.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (appUserError) {
        console.warn('app_users作成エラー（既存の可能性）:', appUserError.message);
      }
    }

    // ブラウザを起動してログイン状態を作成
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    await page.goto(`${baseURL}/login`);

    // ログイン
    await page.fill('[name="email"]', testUser.email);
    await page.fill('[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // ダッシュボードページの表示を待機
    await page.waitForURL('**/dashboard**');

    // 認証状態を保存
    await context.storageState({ path: 'tests/auth.json' });

    await browser.close();

    console.log('✅ テストユーザーとログイン状態の準備が完了しました');

    // テスト環境の健全性チェック
    await healthCheck(baseURL);

    console.log('✅ グローバルセットアップが完了しました');

  } catch (error) {
    console.error('❌ グローバルセットアップでエラーが発生しました:', error);
    throw error;
  }
}

async function cleanupTestData(supabase: any, testEmail: string) {
  console.log('🧹 既存のテストデータをクリーンアップ中...');

  try {
    // テストユーザーIDを取得
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users?.users?.find((u: any) => u.email === testEmail);
    
    if (testUser) {
      const userId = testUser.id;

      // 関連データを削除（外部キー制約の順序に従って）
      await supabase.from('consent_records').delete().eq('user_id', userId);
      await supabase.from('approval_history').delete().eq('actor_user_id', userId);
      await supabase.from('webhook_events').delete().eq('created_by', userId);
      
      // 組織関連データ
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_user_id', userId);

      if (orgs && orgs.length > 0) {
        const orgIds = orgs.map((org: any) => org.id);
        
        await supabase.from('services').delete().in('org_id', orgIds);
        await supabase.from('faqs').delete().in('org_id', orgIds);
        await supabase.from('case_studies').delete().in('org_id', orgIds);
        await supabase.from('subscriptions').delete().in('org_id', orgIds);
        await supabase.from('organizations').delete().in('id', orgIds);
      }

      await supabase.from('app_users').delete().eq('id', userId);
      
      // ユーザー削除
      await supabase.auth.admin.deleteUser(userId);
    }

    console.log('✅ テストデータのクリーンアップが完了しました');
  } catch (error) {
    console.warn('⚠️ クリーンアップ中にエラーが発生しましたが、続行します:', error);
  }
}

async function healthCheck(baseURL: string) {
  console.log('🔍 テスト環境の健全性をチェック中...');

  try {
    // ヘルスチェックエンドポイントを確認
    const response = await fetch(`${baseURL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const health = await response.json();
    console.log('📊 ヘルスチェック結果:', {
      status: health.status,
      supabase: health.checks?.supabase ? '✅' : '❌',
      stripe: health.checks?.stripe ? '✅' : '❌'
    });

    if (health.status !== 'healthy') {
      console.warn('⚠️ 一部のサービスが利用できません。テストに影響する可能性があります。');
    }

  } catch (error) {
    console.warn('⚠️ ヘルスチェックに失敗しましたが、テストを続行します:', error);
  }
}

export default globalSetup;