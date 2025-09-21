import { FullConfig } from '@playwright/test';
import { supabaseAdmin } from '../src/lib/supabase-server';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 E2Eテストのグローバルクリーンアップを開始...');

  try {
    // テスト用データのクリーンアップ
    await cleanupTestData();

    // 認証状態ファイルを削除
    const authFile = 'tests/auth.json';
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
      console.log('✅ 認証状態ファイルを削除しました');
    }

    // テスト結果の整理
    await organizeTestResults();

    console.log('✅ グローバルクリーンアップが完了しました');

  } catch (error) {
    console.error('❌ グローバルクリーンアップでエラーが発生しました:', error);
  }
}

async function cleanupTestData() {
  console.log('🗑️ テストデータのクリーンアップ中...');

  try {
    const supabase = supabaseAdmin();

    // テスト用メールアドレスパターンでユーザーを検索
    const testEmailPattern = /^test@example\.com$/;
    const { data: users } = await supabase.auth.admin.listUsers();
    
    if (users?.users) {
      for (const user of users.users) {
        if (testEmailPattern.test(user.email || '')) {
          console.log(`🗑️ テストユーザーを削除中: ${user.email}`);
          
          try {
            const userId = user.id;

            // 関連データを削除
            await Promise.all([
              supabase.from('consent_records').delete().eq('user_id', userId),
              supabase.from('approval_history').delete().eq('actor_user_id', userId),
            ]);

            // 組織関連データ
            const { data: orgs } = await supabase
              .from('organizations')
              .select('id')
              .eq('owner_user_id', userId);

            if (orgs && orgs.length > 0) {
              const orgIds = orgs.map((org: any) => org.id);
              
              await Promise.all([
                supabase.from('services').delete().in('org_id', orgIds),
                supabase.from('faqs').delete().in('org_id', orgIds),
                supabase.from('case_studies').delete().in('org_id', orgIds),
                supabase.from('subscriptions').delete().in('org_id', orgIds),
              ]);

              await supabase.from('organizations').delete().in('id', orgIds);
            }

            await supabase.from('app_users').delete().eq('id', userId);
            await supabase.auth.admin.deleteUser(userId);

          } catch (error) {
            console.warn(`⚠️ ユーザー ${user.email} の削除中にエラー:`, error);
          }
        }
      }
    }

    console.log('✅ テストデータのクリーンアップが完了しました');

  } catch (error) {
    console.warn('⚠️ テストデータクリーンアップ中にエラーが発生しました:', error);
  }
}

async function organizeTestResults() {
  console.log('📊 テスト結果を整理中...');

  try {
    const resultsDir = 'test-results';
    const reportDir = 'test-reports';

    // レポートディレクトリを作成
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // 結果ファイルが存在する場合は移動
    if (fs.existsSync(resultsDir)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveDir = path.join(reportDir, `run-${timestamp}`);
      
      fs.mkdirSync(archiveDir, { recursive: true });
      
      // ファイルを移動
      const files = fs.readdirSync(resultsDir);
      for (const file of files) {
        const srcPath = path.join(resultsDir, file);
        const destPath = path.join(archiveDir, file);
        
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      console.log(`📁 テスト結果を ${archiveDir} にアーカイブしました`);
    }

    // CI環境の場合はアーティファクトとして保存
    if (process.env.CI) {
      console.log('🔄 CI環境でのアーティファクト準備中...');
      
      // JUnit形式のレポート統合
      const junitFile = path.join(resultsDir, 'junit.xml');
      if (fs.existsSync(junitFile)) {
        const junitReport = fs.readFileSync(junitFile, 'utf-8');
        console.log('📋 JUnitレポートサマリー:');
        
        // テスト結果の簡易サマリーを表示
        const testcaseMatches = junitReport.match(/<testcase/g);
        const failureMatches = junitReport.match(/<failure/g);
        const errorMatches = junitReport.match(/<error/g);
        
        console.log(`  - 総テスト数: ${testcaseMatches?.length || 0}`);
        console.log(`  - 失敗数: ${failureMatches?.length || 0}`);
        console.log(`  - エラー数: ${errorMatches?.length || 0}`);
      }
    }

    console.log('✅ テスト結果の整理が完了しました');

  } catch (error) {
    console.warn('⚠️ テスト結果整理中にエラーが発生しました:', error);
  }
}

export default globalTeardown;