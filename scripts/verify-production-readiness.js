#!/usr/bin/env node

/**
 * AIO Hub - 本番デプロイ前検証スクリプト
 * 
 * 🎯 目的: デプロイ前に設定・ファイル・セキュリティ要件を自動確認
 * 📋 確認項目:
 *   - Basic認証環境変数設定
 *   - 必須ページファイル存在確認
 *   - middleware.ts保護パス設定確認
 *   - Phase 4.5設定の整合性チェック
 * 
 * TODO: Supabase Auth統合時の置き換え候補
 * - NextAuth導入時: checkBasicAuthConfig → checkNextAuthConfig
 * - Supabase Auth導入時: DASHBOARD_BASIC_* → SUPABASE_AUTH_* 設定チェック
 * - 保護パスリスト（BASIC_AUTH_PROTECTED_PATHS）は継続利用可能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// エラー記録関数
function addError(message) {
  verificationErrors.push(message);
  log.error(message);
}

function addWarning(message) {
  warningCount++;
  log.warning(message);
}

// 環境変数読み込み（.env.production優先、.env.localフォールバック）
function loadEnvironmentVariables() {
  log.section("環境変数読み込み");
  
  const envFiles = ['.env.production', '.env.local', '.env'];
  let envVars = process.env;
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      log.info(`環境変数ファイル読み込み: ${envFile}`);
      const envContent = fs.readFileSync(envFile, 'utf8');
      
      // 簡易的な.env解析（コメント行と空行を除外）
      envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=');
          if (!process.env[key]) {  // プロセス環境変数を優先
            envVars[key] = value;
          }
        }
      });
      break;
    }
  }
  
  return envVars;
}

// Basic認証設定確認
function checkBasicAuthConfig(envVars) {
  log.section("Basic認証設定確認");
  
  const user = envVars.DASHBOARD_BASIC_USER;
  const pass = envVars.DASHBOARD_BASIC_PASS;
  const disabled = envVars.DISABLE_APP_BASIC_AUTH;
  
  // 無効化設定チェック
  if (disabled === 'true') {
    log.warning("Basic認証が無効化されています (DISABLE_APP_BASIC_AUTH=true)");
    log.warning("インフラ側認証（Vercel/Cloudflare）の設定を確認してください");
    return true; // 無効化は正常な状態
  }
  
  // Basic認証設定チェック
  if (!user || !pass) {
    addError("Basic認証設定が不完全です:");
    if (!user) addError("  - DASHBOARD_BASIC_USER が未設定");
    if (!pass) addError("  - DASHBOARD_BASIC_PASS が未設定");
    addError("本番環境では管理画面が無防備になります");
    return false;
  }
  
  // パスワード強度チェック
  if (pass.length < 8) {
    addWarning("DASHBOARD_BASIC_PASS が8文字未満です。より強固なパスワードを推奨");
  }
  
  if (pass === 'change_me' || pass === 'admin' || pass === 'password') {
    addError("DASHBOARD_BASIC_PASS にデフォルト値が設定されています。必ず変更してください");
    return false;
  }
  
  log.success(`Basic認証設定確認済み (ユーザー: ${user})`);
  return true;
}

// 必須ページファイル確認
function checkRequiredPages() {
  log.section("必須ページファイル確認");
  
  const requiredPages = [
    { path: 'src/app/page.tsx', description: 'トップページ' },
    { path: 'src/app/pricing/page.tsx', description: '料金ページ' },
    { path: 'src/app/hearing-service/page.tsx', description: 'hearing-serviceページ' },
    { path: 'src/components/pricing/PricingTable.tsx', description: '料金テーブルコンポーネント' }
  ];
  
  let allPagesExist = true;
  
  for (const page of requiredPages) {
    if (fs.existsSync(page.path)) {
      log.success(`${page.description}: ${page.path}`);
    } else {
      addError(`必須ページが見つかりません: ${page.path} (${page.description})`);
      allPagesExist = false;
    }
  }
  
  return allPagesExist;
}

// 料金設定確認
function checkPricingValues() {
  log.section("料金設定確認");
  
  const pricingTablePath = 'src/components/pricing/PricingTable.tsx';
  
  if (!fs.existsSync(pricingTablePath)) {
    addError("料金テーブルファイルが見つかりません");
    return false;
  }
  
  const content = fs.readFileSync(pricingTablePath, 'utf8');
  
  // 必須料金の確認
  const requiredPrices = ['2,980', '8,000', '15,000'];
  let allPricesFound = true;
  
  for (const price of requiredPrices) {
    if (content.includes(price)) {
      log.success(`料金確認済み: ¥${price}`);
    } else {
      addError(`必須料金が見つかりません: ¥${price}`);
      allPricesFound = false;
    }
  }
  
  return allPricesFound;
}

// middleware.ts保護パス設定確認
function checkMiddlewareConfig() {
  log.section("middleware.ts保護パス設定確認");
  
  const middlewarePath = 'middleware.ts';
  
  if (!fs.existsSync(middlewarePath)) {
    addError("middleware.ts が見つかりません");
    return false;
  }
  
  const content = fs.readFileSync(middlewarePath, 'utf8');
  
  // 保護パス設定確認
  const requiredPaths = [
    { pattern: '/^\/dashboard/', description: 'ダッシュボード保護' },
    { pattern: '/^\/admin/', description: '管理者ページ保護' },
    { pattern: '/^\/api\/admin/', description: '管理者API保護' }
  ];
  
  // 公開パス設定確認
  const requiredPublicPaths = [
    { pattern: "'/'", description: 'トップページ公開' },
    { pattern: "'/pricing'", description: '料金ページ公開' },
    { pattern: "'/hearing-service'", description: 'hearing-serviceページ公開' }
  ];
  
  let configValid = true;
  
  // 保護パス確認
  for (const pathConfig of requiredPaths) {
    if (content.includes(pathConfig.pattern)) {
      log.success(`${pathConfig.description}: ${pathConfig.pattern}`);
    } else {
      addError(`保護パス設定が見つかりません: ${pathConfig.pattern}`);
      configValid = false;
    }
  }
  
  // 公開パス確認
  for (const pathConfig of requiredPublicPaths) {
    if (content.includes(pathConfig.pattern)) {
      log.success(`${pathConfig.description}: ${pathConfig.pattern}`);
    } else {
      addError(`公開パス設定が見つかりません: ${pathConfig.pattern}`);
      configValid = false;
    }
  }
  
  // Basic認証機能確認
  if (content.includes('checkBasicAuthentication')) {
    log.success("Basic認証関数が実装されています");
  } else {
    addError("Basic認証関数 (checkBasicAuthentication) が見つかりません");
    configValid = false;
  }
  
  return configValid;
}

// ビルド確認
function checkBuildHealth() {
  log.section("ビルドヘルス確認");
  
  try {
    log.info("TypeScript型チェック実行中...");
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    log.success("TypeScript型チェック: OK");
  } catch (error) {
    addError("TypeScript型エラーが検出されました");
    addError(error.stdout?.toString() || error.message);
    return false;
  }
  
  try {
    log.info("ESLint実行中...");
    execSync('npm run lint', { stdio: 'pipe' });
    log.success("ESLint: OK");
  } catch (error) {
    addWarning("ESLintで警告が検出されました（ビルド継続可能）");
  }
  
  return true;
}

// メイン検証実行
async function runVerification() {
  console.log(`${colors.purple}🚀 AIO Hub - 本番デプロイ前検証開始${colors.reset}\n`);
  
  const envVars = loadEnvironmentVariables();
  
  const checks = [
    () => checkBasicAuthConfig(envVars),
    () => checkRequiredPages(),
    () => checkPricingValues(),
    () => checkMiddlewareConfig(),
    () => checkBuildHealth()
  ];
  
  let allChecksPassed = true;
  
  for (const check of checks) {
    const result = await check();
    if (!result) {
      allChecksPassed = false;
    }
  }
  
  // 結果出力
  console.log(`\n${colors.purple}📋 検証結果サマリー${colors.reset}`);
  
  if (verificationErrors.length === 0 && allChecksPassed) {
    log.success("✅ 本番デプロイ前検証完了 - 全項目クリア");
    log.success("デプロイ実行可能です");
    if (warningCount > 0) {
      log.info(`警告: ${warningCount}件（デプロイに影響なし）`);
    }
  } else {
    log.error(`❌ 検証失敗 - ${verificationErrors.length}件のエラー`);
    console.log(`\n${colors.red}🚫 デプロイ前に以下の問題を解決してください:${colors.reset}`);
    verificationErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    process.exit(1);
  }
  
  // NextAuth移行準備ヒント
  console.log(`\n${colors.yellow}💡 NextAuth/Supabase Auth移行時のヒント:${colors.reset}`);
  console.log("  - checkBasicAuthConfig → checkNextAuthConfig に置き換え");
  console.log("  - BASIC_AUTH_PROTECTED_PATHS → AUTH_PROTECTED_PATHS として再利用");
  console.log("  - PUBLIC_PATHS_BASIC_AUTH → PUBLIC_PATHS として継続利用");
}

// 実行
if (require.main === module) {
  runVerification().catch(console.error);
}

module.exports = {
  runVerification,
  checkBasicAuthConfig,
  checkRequiredPages,
  checkPricingValues,
  checkMiddlewareConfig
};