#!/usr/bin/env node

/**
 * Phase 2 検証：埋め込み関連テーブルの存在確認
 * DATABASE_URL を使用してPostgreSQLに直接接続
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

// .env.local から環境変数を読み込み
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^"|"$/g, '');
      envVars[key] = value;
    }
  });
  
  // 環境変数を設定
  Object.assign(process.env, envVars);
  console.log('📄 .env.local から環境変数を読み込みました');
} catch (error) {
  console.log('⚠️  .env.local ファイルが見つかりません。環境変数を直接使用します');
}

async function checkEmbedTables() {
  console.log('🔍 Embed テーブル存在確認を開始...\n');

  // DATABASE_URL または SUPABASE_DB_URL_RO を使用
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL_RO;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL または SUPABASE_DB_URL_RO が設定されていません');
    console.log('💡 .env.local ファイルに SUPABASE_DB_URL_RO を設定してください');
    process.exit(1);
  }

  console.log(`🔗 接続先: ${dbUrl.replace(/:[^:@]*@/, ':***@')}`);

  const client = new Client({
    connectionString: dbUrl
  });

  try {
    await client.connect();
    console.log('✅ データベース接続成功');

    // embed関連テーブルをチェック
    const embedTables = [
      'embed_usage',
      'embed_usage_daily', 
      'embed_usage_monthly',
      'embed_configurations'
    ];

    console.log('\n📋 必要なテーブル一覧:');
    for (const tableName of embedTables) {
      console.log(`   - ${tableName}`);
    }

    console.log('\n🔍 存在確認結果:');
    
    const results = {};
    for (const tableName of embedTables) {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `;
      
      const result = await client.query(query, [tableName]);
      const exists = result.rows[0].exists;
      results[tableName] = exists;
      
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
    }

    // embed関連関数をチェック
    console.log('\n🔍 関数存在確認:');
    const functions = [
      'get_top_embed_sources',
      'get_realtime_embed_stats',
      'update_daily_embed_stats'
    ];

    for (const funcName of functions) {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = $1
        );
      `;
      
      const result = await client.query(query, [funcName]);
      const exists = result.rows[0].exists;
      results[funcName] = exists;
      
      console.log(`   ${exists ? '✅' : '❌'} ${funcName}()`);
    }

    // RLSポリシーをチェック
    console.log('\n🔍 RLSポリシー確認:');
    for (const tableName of embedTables) {
      if (results[tableName]) {
        const query = `
          SELECT pol.polname 
          FROM pg_policy pol
          JOIN pg_class cls ON pol.polrelid = cls.oid
          JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
          WHERE nsp.nspname = 'public' AND cls.relname = $1;
        `;
        
        const result = await client.query(query, [tableName]);
        const policies = result.rows.map(row => row.polname);
        
        console.log(`   📋 ${tableName}: ${policies.length > 0 ? policies.join(', ') : 'ポリシーなし'}`);
      }
    }

    // 結果サマリー
    const missingTables = embedTables.filter(table => !results[table]);
    const missingFunctions = functions.filter(func => !results[func]);

    console.log('\n📊 結果サマリー:');
    console.log(`   テーブル: ${embedTables.length - missingTables.length}/${embedTables.length} 存在`);
    console.log(`   関数: ${functions.length - missingFunctions.length}/${functions.length} 存在`);

    if (missingTables.length > 0 || missingFunctions.length > 0) {
      console.log('\n⚠️  不足しているオブジェクト:');
      if (missingTables.length > 0) {
        console.log(`   テーブル: ${missingTables.join(', ')}`);
      }
      if (missingFunctions.length > 0) {
        console.log(`   関数: ${missingFunctions.join(', ')}`);
      }
      
      console.log('\n🔧 手動実行が必要:');
      console.log('   npx supabase db push --include-all');
      console.log('   または:');
      console.log('   psql "$DATABASE_URL" -f supabase/migrations/20251008_embed_usage.sql');
      
      process.exit(1);
    } else {
      console.log('\n🎉 全ての必要なオブジェクトが存在します！');
      console.log('   Phase 2 のデータベース要件は満たされています。');
    }

  } catch (error) {
    console.error('❌ データベース確認エラー:', error.message);
    
    if (error.message.includes('connection')) {
      console.log('\n💡 解決策:');
      console.log('   1. DATABASE_URL 環境変数を確認');
      console.log('   2. Supabase プロジェクトのネットワーク設定を確認');
      console.log('   3. VPN接続が必要な場合は接続を確認');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkEmbedTables().catch(console.error);