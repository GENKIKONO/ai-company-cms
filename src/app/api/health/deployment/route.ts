// 本番デプロイ用健全性チェックAPI - 強化版
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import fs from 'fs';
import path from 'path';

interface HealthCheckResult {
  ok: boolean;
  reason?: string;
  details?: any;
}

interface EnvCheckResult {
  [key: string]: boolean;
}

interface InternalApiResult {
  [key: string]: {
    ok: boolean;
    status?: number;
    reason?: string;
  };
}

interface VersionInfo {
  sha?: string;
  pkg: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // タイムアウト設定（10秒）
  const timeout = 10000;
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Health check timeout')), timeout)
  );

  try {
    const healthCheck = await Promise.race([performHealthCheck(), timeoutPromise]);
    return NextResponse.json(healthCheck, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // タイムアウトや例外時も200で返す（ok: false）
    return NextResponse.json({
      ok: false,
      env: {},
      supabase: { ok: false, reason: 'Health check failed' },
      auth: { ok: false, reason: 'Health check failed' },
      internalApis: {},
      version: getVersionInfo(),
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}

async function performHealthCheck() {
  const startTime = Date.now();
  
  // 1. 環境変数チェック
  const env = checkEnvironmentVariables();
  
  // 2. Supabase接続チェック
  const supabase = await checkSupabaseConnection();
  
  // 3. 認証システムチェック
  const auth = await checkAuthSystem();
  
  // 4. 内部APIチェック
  const internalApis = await checkInternalApis();
  
  // 5. バージョン情報
  const version = getVersionInfo();
  
  // 総合判定
  const overallOk = env.NEXT_PUBLIC_SUPABASE_URL && 
                    env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                    supabase.ok && 
                    auth.ok;

  return {
    ok: overallOk,
    env,
    supabase,
    auth,
    internalApis,
    version,
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime
  };
}

function checkEnvironmentVariables(): EnvCheckResult {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    // SUPABASE_SERVICE_ROLE_KEY と RESEND_API_KEY は必須でなくても健全性チェックを通す
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY'
  ];
  
  const result: EnvCheckResult = {};
  
  for (const envVar of requiredEnvVars) {
    result[envVar] = !!(process.env[envVar] && process.env[envVar].trim() !== '');
  }
  
  return result;
}

async function checkSupabaseConnection(): Promise<HealthCheckResult> {
  try {
    const supabase = await createClient();
    
    // 最小限のクエリ（select 1相当）
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (error) {
      return {
        ok: false,
        reason: `Database query failed: ${error.message}`,
        details: { error: error.message }
      };
    }
    
    return {
      ok: true,
      details: { querySuccessful: true }
    };
  } catch (error) {
    return {
      ok: false,
      reason: `Supabase connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function checkAuthSystem(): Promise<HealthCheckResult> {
  try {
    const supabase = await createClient();

    // getUser()の実行可否をチェック（未ログインでもOK）
    const user = await getUserWithClient(supabase);

    return {
      ok: true,
      reason: 'Auth system functional',
      details: {
        loggedIn: !!user,
        userCheckSuccessful: true
      }
    };
  } catch (error) {
    return {
      ok: false,
      reason: `Auth system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function checkInternalApis(): Promise<InternalApiResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
  const result: InternalApiResult = {};
  
  // /api/my/organization GET チェック
  try {
    const response = await fetch(`${baseUrl}/api/my/organization`, {
      method: 'GET',
      headers: { 
        'User-Agent': 'Health-Check-Internal',
        'Accept': 'application/json'
      },
      // 5秒タイムアウト
      signal: AbortSignal.timeout(5000)
    });
    
    result.myOrganizationGET = {
      ok: response.status === 401 || response.status === 200, // 401も正常（未認証）
      status: response.status,
      reason: response.status === 401 ? 'Correctly returns 401 for unauthenticated' : 
              response.status === 200 ? 'Endpoint accessible' :
              `Unexpected status: ${response.status}`
    };
  } catch (error) {
    result.myOrganizationGET = {
      ok: false,
      reason: `API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
  
  // 追加でwhoamiもチェック
  try {
    const response = await fetch(`${baseUrl}/api/debug/whoami`, {
      method: 'GET',
      headers: { 
        'User-Agent': 'Health-Check-Internal',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    result.debugWhoami = {
      ok: response.status === 200,
      status: response.status,
      reason: response.status === 200 ? 'Debug endpoint accessible' :
              `Debug endpoint returned: ${response.status}`
    };
  } catch (error) {
    result.debugWhoami = {
      ok: false,
      reason: `Debug API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
  
  return result;
}

function getVersionInfo(): VersionInfo & { buildTime: string; env: string } {
  const version: VersionInfo & { buildTime: string; env: string } = {
    sha: process.env.VERCEL_GIT_COMMIT_SHA ||
         process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
         'unknown',
    pkg: '0.1.0', // package.jsonから取得
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    env: process.env.VERCEL_ENV ||
         process.env.NODE_ENV ||
         'development'
  };

  // package.jsonからバージョンを読み取る
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      version.pkg = packageJson.version || '0.1.0';
    }
  } catch (error) {
    // エラーの場合はデフォルト値を使用
  }

  return version;
}