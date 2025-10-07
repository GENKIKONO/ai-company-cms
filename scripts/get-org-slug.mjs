#!/usr/bin/env node

/**
 * 実在のorg-slug取得スクリプト
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
  
  Object.assign(process.env, envVars);
} catch (error) {
  console.log('⚠️  .env.local ファイルが見つかりません');
}

async function getOrgSlug() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL_RO;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL が設定されていません');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl
  });

  try {
    await client.connect();
    
    const query = `
      SELECT slug 
      FROM public.organizations 
      WHERE slug IS NOT NULL 
      ORDER BY updated_at DESC 
      LIMIT 1;
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length > 0) {
      console.log(result.rows[0].slug);
    } else {
      console.error('NONE');
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

getOrgSlug().catch(console.error);