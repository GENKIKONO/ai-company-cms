import { chromium, FullConfig } from '@playwright/test';
import { supabaseTest } from '../src/lib/supabase-test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2Eテストのグローバルセットアップを開始...');

  // テスト用ユーザーとデータの準備
  const testUsers = [
    {
      email: process.env.E2E_ADMIN_EMAIL || 'admin+e2e@example.com',
      password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin123!',
      role: 'admin'
    },
    {
      email: process.env.E2E_USER_EMAIL || 'user+e2e@example.com', 
      password: process.env.E2E_USER_PASSWORD || 'TestUser123!',
      role: 'user'
    }
  ];

  try {
    const supabase = supabaseTest;

    // 既存のテストデータをクリーンアップ
    for (const testUser of testUsers) {
      await cleanupTestData(supabase, testUser.email);
    }

    // テストユーザーを作成
    const createdUsers = [];
    for (const testUser of testUsers) {
      console.log(`📝 テストユーザーを作成中: ${testUser.email}`);
      
      const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true
      });

      if (userError && !userError.message.includes('already registered')) {
        console.warn(`⚠️ ユーザー作成エラー: ${testUser.email}`, userError.message);
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
          console.warn(`⚠️ app_users作成エラー（既存の可能性）: ${testUser.email}`, appUserError.message);
        }
        
        createdUsers.push({ ...testUser, id: userId });
      }
    }

    // テストデータのseed
    await seedTestData(supabase, createdUsers);

    // ブラウザを起動してログイン状態を作成（admin userで）
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    const adminUser = testUsers[0]; // admin+e2e@example.com
    
    await page.goto(`${baseURL}/auth/signin`);

    // ログイン
    await page.fill('[name="email"]', adminUser.email);
    await page.fill('[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    // ダッシュボードページの表示を待機
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

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

async function seedTestData(supabase: any, users: any[]) {
  console.log('🌱 テストデータをseed中...');

  try {
    const adminUser = users.find(u => u.role === 'admin');
    if (!adminUser) {
      console.warn('⚠️ adminユーザーが見つからないため、seedをスキップします');
      return;
    }

    // テスト組織を作成
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: 'e2e-test-org',
        name: 'E2E Test Organization',
        slug: 'e2e-test-org',
        description: 'E2Eテスト用の組織です',
        created_by: adminUser.id,
        status: 'published',
        plan: 'free',
        // Single-org modeのため、owner_user_idではなくcreated_byを使用
        address_postal_code: '100-0001',
        address_region: '東京都',
        address_locality: '千代田区',
        address_street: '丸の内1-1-1',
        telephone: '03-1234-5678',
        email: adminUser.email,
        email_public: true,
        url: 'https://e2e-test.example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.warn('⚠️ 組織作成エラー（既存の可能性）:', orgError.message);
    }

    const orgId = organization?.id || 'e2e-test-org';
    console.log(`📝 テスト組織作成完了: ${orgId}`);

    // QAカテゴリを作成
    const { data: qaCategory, error: categoryError } = await supabase
      .from('qa_categories')
      .upsert({
        id: 'e2e-test-category',
        name: 'E2Eテストカテゴリ',
        description: 'E2Eテスト用のQAカテゴリです',
        organization_id: orgId,
        visibility: 'public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (categoryError) {
      console.warn('⚠️ QAカテゴリ作成エラー（既存の可能性）:', categoryError.message);
    }

    const categoryId = qaCategory?.id || 'e2e-test-category';
    console.log(`📝 QAカテゴリ作成完了: ${categoryId}`);

    // QAエントリを作成
    const qaEntries = [
      {
        id: 'e2e-qa-1',
        question: 'E2Eテストとは何ですか？',
        answer: 'End-to-End テストの略で、アプリケーション全体の動作を実際のユーザーの視点から検証するテスト手法です。',
        organization_id: orgId,
        category_id: categoryId,
        visibility: 'public',
        status: 'published',
        tags: ['テスト', 'E2E'],
        created_by: adminUser.id,
        last_edited_by: adminUser.id,
        published_at: new Date().toISOString()
      },
      {
        id: 'e2e-qa-2', 
        question: 'Playwrightの利点は？',
        answer: 'Playwrightは複数ブラウザサポート、高速実行、強力なセレクター、自動待機機能などの利点があります。',
        organization_id: orgId,
        category_id: categoryId,
        visibility: 'public',
        status: 'published',
        tags: ['Playwright', 'ツール'],
        created_by: adminUser.id,
        last_edited_by: adminUser.id,
        published_at: new Date().toISOString()
      }
    ];

    for (const qaEntry of qaEntries) {
      const { error: qaError } = await supabase
        .from('qa_entries')
        .upsert(qaEntry);

      if (qaError) {
        console.warn(`⚠️ QAエントリ作成エラー（既存の可能性）: ${qaEntry.id}`, qaError.message);
      }
    }

    console.log(`📝 QAエントリ作成完了: ${qaEntries.length}件`);

    // テストサービスを作成
    const { error: serviceError } = await supabase
      .from('services')
      .upsert({
        id: 'e2e-test-service',
        name: 'E2Eテストサービス',
        description: 'E2Eテスト用のサービスです',
        category: 'テスト',
        price: 10000,
        organization_id: orgId,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (serviceError) {
      console.warn('⚠️ サービス作成エラー（既存の可能性）:', serviceError.message);
    }

    console.log('📝 テストサービス作成完了');

    // テストFAQを作成
    const { error: faqError } = await supabase
      .from('faqs')
      .upsert({
        id: 'e2e-test-faq',
        question: 'テスト用のFAQです',
        answer: 'これはE2Eテスト用のFAQエントリです。',
        organization_id: orgId,
        category: 'テスト',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (faqError) {
      console.warn('⚠️ FAQ作成エラー（既存の可能性）:', faqError.message);
    }

    console.log('📝 テストFAQ作成完了');

    console.log('✅ テストデータのseedが完了しました');

  } catch (error) {
    console.warn('⚠️ テストデータのseed中にエラーが発生しましたが、続行します:', error);
  }
}

export default globalSetup;