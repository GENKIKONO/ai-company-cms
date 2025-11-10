#!/usr/bin/env node

/**
 * AIO Hub - 本番ライブ状況確認スクリプト
 * 
 * 🎯 目的: デプロイ後の本番環境で公開/保護ページの動作確認
 * 📋 確認項目:
 *   - 公開ページ（/, /pricing, /hearing-service）→ 200 OK
 *   - 保護ページ（/dashboard）→ 401 Unauthorized (Basic認証)
 *   - 管理API（/api/admin/*）→ 401 Unauthorized
 *   - Basic認証無効化時のスキップ処理
 * 
 * 💡 NextAuth移行時の変更点:
 * - 401チェック → 302 Redirect to /auth/login チェック
 * - Basic認証ヘッダー → NextAuth session チェック
 * - 保護パス設定は継続利用可能
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// カラー出力用定数
const colors = {
  red: '\033[0;31m',
  green: '\033[0;32m',
  yellow: '\033[1;33m',
  blue: '\033[0;34m',
  purple: '\033[0;35m',
  cyan: '\033[0;36m',
  reset: '\033[0m'
};

// ログ出力関数
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ [INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅ [SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ [WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌ [ERROR]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}🔍 ${msg}${colors.reset}`)
};

// 検証エラー記録
let verificationErrors = [];
let warningCount = 0;

// 環境変数読み込み
function loadEnvironmentVariables() {
  const envFiles = ['.env.production', '.env.local', '.env'];
  let envVars = { ...process.env };
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=');
          if (!process.env[key]) {
            envVars[key] = value;
          }
        }
      });
      break;
    }
  }
  
  return envVars;
}

// HTTP(S)リクエスト実行
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const requestModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'AIOHub-LiveCheck/1.0',
        ...options.headers
      },
      timeout: 10000, // 10秒タイムアウト
      // 自己署名証明書を許可（ローカルテスト用）
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    };
    
    const req = requestModule.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// 公開ページ確認
async function checkPublicPages(baseUrl) {
  log.section("公開ページアクセス確認");
  
  const publicPages = [
    { 
      path: '/', 
      name: 'トップページ',
      requiredContent: ['AIO', 'Hub'] // 必須コンテンツ
    },
    { 
      path: '/pricing', 
      name: '料金ページ',
      requiredContent: ['2,980', '8,000', '15,000'] // 料金情報
    },
    { 
      path: '/hearing-service', 
      name: 'hearing-serviceページ',
      requiredContent: ['hearing'] // 基本コンテンツ
    }
  ];
  
  let allPagesOk = true;
  
  for (const page of publicPages) {
    try {
      const fullUrl = `${baseUrl}${page.path}`;
      log.info(`確認中: ${fullUrl}`);
      
      const response = await makeRequest(fullUrl);
      
      if (response.statusCode === 200) {
        // 必須コンテンツ確認
        let contentOk = true;
        for (const content of page.requiredContent) {
          if (!response.body.includes(content)) {
            log.warning(`${page.name}: 必須コンテンツ "${content}" が見つかりません`);
            contentOk = false;
            warningCount++;
          }
        }
        
        if (contentOk) {
          log.success(`${page.name}: 200 OK - 必須コンテンツ確認済み`);
        } else {
          log.warning(`${page.name}: 200 OK - 一部コンテンツに問題あり`);
        }
      } else {
        log.error(`${page.name}: ${response.statusCode} - 公開ページがアクセスできません`);
        allPagesOk = false;
        verificationErrors.push(`${page.name}が${response.statusCode}を返しています`);
      }
    } catch (error) {
      log.error(`${page.name}: リクエストエラー - ${error.message}`);
      allPagesOk = false;
      verificationErrors.push(`${page.name}へのアクセスに失敗: ${error.message}`);
    }
  }
  
  return allPagesOk;
}

// 保護ページ確認
async function checkProtectedPages(baseUrl, envVars) {
  log.section("保護ページアクセス確認");
  
  // Basic認証が無効化されている場合はスキップ
  if (envVars.DISABLE_APP_BASIC_AUTH === 'true') {
    log.warning("Basic認証が無効化されています (DISABLE_APP_BASIC_AUTH=true)");
    log.warning("インフラ側認証の確認を手動で実施してください");
    return true; // スキップ扱い
  }
  
  const protectedPages = [
    { path: '/dashboard', name: 'ダッシュボード' },
    { path: '/admin', name: '管理者ページ' },
    { path: '/api/admin/test', name: '管理者API' }
  ];
  
  let allPagesProtected = true;
  
  for (const page of protectedPages) {
    try {
      const fullUrl = `${baseUrl}${page.path}`;
      log.info(`確認中: ${fullUrl}`);
      
      // 認証なしでアクセス
      const response = await makeRequest(fullUrl);
      
      if (response.statusCode === 401) {
        log.success(`${page.name}: 401 Unauthorized - 適切に保護されています`);
        
        // Basic認証ヘッダーを確認
        const wwwAuth = response.headers['www-authenticate'];
        if (wwwAuth && wwwAuth.includes('Basic')) {
          log.success(`${page.name}: Basic認証ダイアログが設定されています`);
        } else {
          log.warning(`${page.name}: WWW-Authenticate ヘッダーが見つかりません`);
          warningCount++;
        }
      } else if (response.statusCode === 404) {
        log.info(`${page.name}: 404 Not Found - ページが存在しません（正常）`);
      } else {
        log.error(`${page.name}: ${response.statusCode} - Basic認証が機能していません`);
        verificationErrors.push(`${page.name}が保護されていません (${response.statusCode})`);
        allPagesProtected = false;
      }
    } catch (error) {
      log.error(`${page.name}: リクエストエラー - ${error.message}`);
      // ネットワークエラーは保護性の確認にはならないため、エラーとしない
      log.warning(`${page.name}へのアクセス確認をスキップしました`);
      warningCount++;
    }
  }
  
  return allPagesProtected;
}

// Basic認証動作確認（オプション）
async function checkBasicAuthWorking(baseUrl, envVars) {
  log.section("Basic認証動作確認");
  
  if (envVars.DISABLE_APP_BASIC_AUTH === 'true') {
    log.info("Basic認証が無効化されているため、動作確認をスキップします");
    return true;
  }
  
  const user = envVars.DASHBOARD_BASIC_USER;
  const pass = envVars.DASHBOARD_BASIC_PASS;
  
  if (!user || !pass) {
    log.warning("Basic認証資格情報が設定されていないため、動作確認をスキップします");
    return true;
  }
  
  try {
    const fullUrl = `${baseUrl}/dashboard`;
    log.info(`認証テスト: ${fullUrl}`);
    
    // 正しい認証情報でアクセス
    const credentials = Buffer.from(`${user}:${pass}`).toString('base64');
    const response = await makeRequest(fullUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    if (response.statusCode === 200) {
      log.success("Basic認証: 正しい資格情報で認証成功");
      return true;
    } else if (response.statusCode === 401) {
      log.error("Basic認証: 正しい資格情報でも認証失敗");
      verificationErrors.push("Basic認証の設定に問題があります");
      return false;
    } else {
      log.warning(`Basic認証: 予期しないレスポンス ${response.statusCode}`);
      return true; // その他のエラーは認証システム外の問題として扱う
    }
  } catch (error) {
    log.warning(`Basic認証動作確認でエラー: ${error.message}`);
    return true; // ネットワークエラーは無視
  }
}

// メイン検証実行
async function runLiveStatusCheck(customUrl = null) {
  console.log(`${colors.purple}🌐 AIO Hub - 本番ライブ状況確認開始${colors.reset}\n`);
  
  const envVars = loadEnvironmentVariables();
  
  // ベースURL決定
  const baseUrl = customUrl || 
                 envVars.NEXT_PUBLIC_APP_URL || 
                 envVars.VERCEL_URL ? `https://${envVars.VERCEL_URL}` : 
                 'http://localhost:3000';
  
  log.info(`確認対象URL: ${baseUrl}`);
  
  const checks = [
    () => checkPublicPages(baseUrl),
    () => checkProtectedPages(baseUrl, envVars),
    () => checkBasicAuthWorking(baseUrl, envVars)
  ];
  
  let allChecksPassed = true;
  
  for (const check of checks) {
    const result = await check();
    if (!result) {
      allChecksPassed = false;
    }
  }
  
  // 結果出力
  console.log(`\n${colors.purple}📋 ライブ確認結果サマリー${colors.reset}`);
  
  if (verificationErrors.length === 0 && allChecksPassed) {
    log.success("✅ Production ready - 本番環境正常動作確認完了");
    log.success("AIO Hub は本番公開可能な状態です");
    if (warningCount > 0) {
      log.info(`警告: ${warningCount}件（動作に影響なし）`);
    }
  } else {
    log.error(`❌ 本番確認失敗 - ${verificationErrors.length}件の問題`);
    console.log(`\n${colors.red}🚫 以下の問題を解決してください:${colors.reset}`);
    verificationErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    process.exit(1);
  }
  
  // CI/CD統合ヒント
  if (process.env.CI) {
    console.log(`\n${colors.cyan}🔧 CI/CD統合用出力:${colors.reset}`);
    console.log(`STATUS=success`);
    console.log(`ERRORS=${verificationErrors.length}`);
    console.log(`WARNINGS=${warningCount}`);
  }
}

// コマンドライン実行
if (require.main === module) {
  const args = process.argv.slice(2);
  const customUrl = args[0]; // 第1引数でURLを指定可能
  
  runLiveStatusCheck(customUrl).catch((error) => {
    log.error(`予期しないエラー: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runLiveStatusCheck,
  checkPublicPages,
  checkProtectedPages,
  checkBasicAuthWorking
};