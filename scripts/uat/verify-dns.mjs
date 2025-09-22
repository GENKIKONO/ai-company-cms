#!/usr/bin/env node

/**
 * UAT DNS/SSL検証スクリプト
 * 本番環境のDNS解決、SSL証明書、セキュリティヘッダーをチェック
 */

import { execSync } from 'child_process';
import https from 'https';
import tls from 'tls';
import dns from 'dns';
import { promisify } from 'util';

const TARGET_DOMAIN = 'aiohub.jp';
const TARGET_URL = 'https://aiohub.jp';

const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

console.log('🌐 AIO Hub UAT - DNS/SSL検証開始\n');

let hasErrors = false;
const results = [];

/**
 * DNS解決確認
 */
async function verifyDNS() {
  console.log('📡 DNS解決確認:');
  
  try {
    // A レコード確認
    const ips = await dnsResolve(TARGET_DOMAIN, 'A');
    console.log(`✅ A レコード: ${ips.join(', ')}`);
    
    // CNAME確認（もしあれば）
    try {
      const cnames = await dnsResolve(TARGET_DOMAIN, 'CNAME');
      console.log(`ℹ️  CNAME: ${cnames.join(', ')}`);
    } catch (e) {
      // CNAMEがないのは正常
    }
    
    // DNS lookup時間測定
    const start = Date.now();
    await dnsLookup(TARGET_DOMAIN);
    const dnsTime = Date.now() - start;
    
    if (dnsTime < 100) {
      console.log(`✅ DNS解決時間: ${dnsTime}ms (< 100ms)`);
    } else {
      console.log(`⚠️  DNS解決時間: ${dnsTime}ms (目標: < 100ms)`);
    }
    
    results.push({
      test: 'DNS解決',
      status: 'OK',
      details: `IP: ${ips.join(', ')}, 時間: ${dnsTime}ms`
    });
    
  } catch (error) {
    console.log(`❌ DNS解決失敗: ${error.message}`);
    hasErrors = true;
    results.push({
      test: 'DNS解決',
      status: 'ERROR',
      details: error.message
    });
  }
  
  console.log('');
}

/**
 * SSL証明書確認
 */
function verifySSL() {
  console.log('🔒 SSL証明書確認:');
  
  return new Promise((resolve) => {
    const options = {
      hostname: TARGET_DOMAIN,
      port: 443,
      method: 'HEAD',
      rejectUnauthorized: true
    };
    
    const socket = tls.connect(443, TARGET_DOMAIN, (error) => {
      if (error) {
        console.log(`❌ SSL接続失敗: ${error.message}`);
        hasErrors = true;
        results.push({
          test: 'SSL証明書',
          status: 'ERROR',
          details: error.message
        });
        socket.destroy();
        resolve();
        return;
      }
      
      const cert = socket.getPeerCertificate();
      
      if (cert) {
        console.log(`✅ 証明書発行者: ${cert.issuer.CN || cert.issuer.O}`);
        console.log(`✅ 証明書対象: ${cert.subject.CN}`);
        
        const now = new Date();
        const expiry = new Date(cert.valid_to);
        const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry > 30) {
          console.log(`✅ 有効期限: ${cert.valid_to} (${daysUntilExpiry}日後)`);
        } else {
          console.log(`⚠️  有効期限: ${cert.valid_to} (${daysUntilExpiry}日後) - 更新が必要`);
        }
        
        // SANチェック
        if (cert.subjectaltname) {
          const sans = cert.subjectaltname.split(', ').map(san => san.replace('DNS:', ''));
          const includesDomain = sans.includes(TARGET_DOMAIN);
          console.log(`${includesDomain ? '✅' : '❌'} SAN: ${cert.subjectaltname}`);
        }
        
        results.push({
          test: 'SSL証明書',
          status: daysUntilExpiry > 30 ? 'OK' : 'WARNING',
          details: `発行者: ${cert.issuer.CN || cert.issuer.O}, 期限: ${daysUntilExpiry}日後`
        });
        
      } else {
        console.log('❌ 証明書情報を取得できません');
        hasErrors = true;
        results.push({
          test: 'SSL証明書',
          status: 'ERROR',
          details: '証明書情報取得失敗'
        });
      }
      
      socket.end();
      resolve();
    });
    
    socket.on('error', (error) => {
      console.log(`❌ SSL接続エラー: ${error.message}`);
      hasErrors = true;
      results.push({
        test: 'SSL証明書',
        status: 'ERROR',
        details: error.message
      });
      resolve();
    });
  });
}

/**
 * HTTPレスポンス確認
 */
function verifyHTTPResponse() {
  console.log('🌍 HTTPレスポンス確認:');
  
  return new Promise((resolve) => {
    const start = Date.now();
    
    const req = https.request(TARGET_URL, {
      method: 'HEAD',
      timeout: 10000
    }, (res) => {
      const responseTime = Date.now() - start;
      
      console.log(`✅ ステータスコード: ${res.statusCode}`);
      console.log(`✅ レスポンス時間: ${responseTime}ms`);
      
      // セキュリティヘッダーチェック
      const securityHeaders = {
        'strict-transport-security': 'HSTS',
        'x-frame-options': 'X-Frame-Options',
        'x-content-type-options': 'X-Content-Type-Options',
        'referrer-policy': 'Referrer-Policy',
        'content-security-policy': 'CSP'
      };
      
      console.log('\n🔐 セキュリティヘッダー確認:');
      Object.entries(securityHeaders).forEach(([header, name]) => {
        const value = res.headers[header];
        if (value) {
          console.log(`✅ ${name}: ${value}`);
        } else {
          console.log(`⚠️  ${name}: 未設定`);
        }
      });
      
      // キャッシュヘッダーチェック
      const cacheControl = res.headers['cache-control'];
      const etag = res.headers['etag'];
      console.log(`\n📦 キャッシュヘッダー:`);
      console.log(`   Cache-Control: ${cacheControl || '未設定'}`);
      console.log(`   ETag: ${etag || '未設定'}`);
      
      // 圧縮確認
      const encoding = res.headers['content-encoding'];
      if (encoding) {
        console.log(`✅ 圧縮: ${encoding}`);
      } else {
        console.log(`ℹ️  圧縮: 未使用（またはHEADリクエストのため不明）`);
      }
      
      results.push({
        test: 'HTTPレスポンス',
        status: res.statusCode === 200 && responseTime < 2000 ? 'OK' : 'WARNING',
        details: `ステータス: ${res.statusCode}, 時間: ${responseTime}ms`
      });
      
      resolve();
    });
    
    req.on('error', (error) => {
      console.log(`❌ HTTP接続エラー: ${error.message}`);
      hasErrors = true;
      results.push({
        test: 'HTTPレスポンス',
        status: 'ERROR',
        details: error.message
      });
      resolve();
    });
    
    req.on('timeout', () => {
      console.log('❌ HTTP接続タイムアウト');
      hasErrors = true;
      results.push({
        test: 'HTTPレスポンス',
        status: 'ERROR',
        details: 'タイムアウト（10秒）'
      });
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

/**
 * CDN確認
 */
function verifyCDN() {
  console.log('\n🚀 CDN/エッジ確認:');
  
  return new Promise((resolve) => {
    const req = https.request(TARGET_URL, {
      method: 'HEAD'
    }, (res) => {
      const server = res.headers['server'];
      const via = res.headers['via'];
      const cfRay = res.headers['cf-ray'];
      const vercel = res.headers['x-vercel-cache'] || res.headers['x-vercel-id'];
      
      if (vercel) {
        console.log(`✅ Vercel Edge: 検出`);
      } else if (cfRay) {
        console.log(`✅ Cloudflare: 検出 (${cfRay})`);
      } else if (server) {
        console.log(`ℹ️  Server: ${server}`);
      } else {
        console.log(`ℹ️  CDN情報: 検出されませんでした`);
      }
      
      if (via) {
        console.log(`ℹ️  Via: ${via}`);
      }
      
      resolve();
    });
    
    req.on('error', () => resolve());
    req.end();
  });
}

/**
 * メイン実行
 */
async function main() {
  try {
    await verifyDNS();
    await verifySSL();
    await verifyHTTPResponse();
    await verifyCDN();
    
    // 結果サマリー
    console.log('\n📊 検証結果サマリー:');
    const okCount = results.filter(r => r.status === 'OK').length;
    const warningCount = results.filter(r => r.status === 'WARNING').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    
    console.log(`✅ 正常: ${okCount}件`);
    console.log(`⚠️  警告: ${warningCount}件`);
    console.log(`❌ エラー: ${errorCount}件`);
    
    if (hasErrors) {
      console.log('\n🚨 DNS/SSLに問題があります。以下を確認してください:');
      console.log('1. ドメインのDNS設定（ネームサーバー等）');
      console.log('2. SSL証明書の有効期限');
      console.log('3. Vercelの設定（カスタムドメイン等）');
      console.log('\n🔧 修正後、以下のコマンドで再検証してください:');
      console.log('npm run uat:dns-check\n');
      process.exit(1);
    } else {
      console.log('\n🎉 DNS/SSL設定が正常です！');
      console.log('次のステップ: API疎通確認を実行してください');
      console.log('npm run uat:endpoint-check\n');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('予期しないエラー:', error);
    process.exit(1);
  }
}

main();