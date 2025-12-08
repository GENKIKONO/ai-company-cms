#!/usr/bin/env node

/**
 * 本番リリース前スモークテスト
 * 
 * 基本的なルートの動作確認を行い、デプロイ前の品質ゲートとして機能します。
 * - 代表的なページが正常にレスポンスを返すか
 * - 認証が必要なページで適切なリダイレクトが発生するか
 * - ヘルスチェックAPIが正常に動作するか
 */

class SmokeTestRunner {
  constructor() {
    this.baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
    this.results = [];
    this.timeouts = {
      default: 10000,  // 10秒
      api: 5000,       // API系は5秒
    };
    console.log(`🚨 スモークテスト開始: ${this.baseUrl}`);
    console.log('================================================');
  }

  getTestRoutes() {
    return [
      // 公開系 - 正常表示期待
      {
        path: '/',
        description: 'トップページ',
        expectedCodes: [200, 301, 302], // リダイレクトも許容
      },
      {
        path: '/pricing',
        description: '料金ページ',
        expectedCodes: [200],
      },
      {
        path: '/about',
        description: '会社情報ページ',
        expectedCodes: [200],
      },

      // 認証系 - サインインフォーム表示期待
      {
        path: '/auth/signin',
        description: 'ログインページ',
        expectedCodes: [200],
      },
      {
        path: '/auth/signup', 
        description: '新規登録ページ',
        expectedCodes: [200],
      },

      // ダッシュボード系 - 認証へリダイレクト期待
      {
        path: '/dashboard',
        description: 'ユーザーダッシュボード（要認証）',
        expectedCodes: [302, 307, 401, 403], // リダイレクトまたは認証エラー期待
      },

      // 管理系 - 認証へリダイレクト期待
      {
        path: '/management-console',
        description: '管理コンソール（要管理者権限）',
        expectedCodes: [302, 307, 401, 403], // リダイレクトまたは認証エラー期待
      },

      // ヘルスチェックAPI
      {
        path: '/api/health',
        description: 'システムヘルスチェック',
        expectedCodes: [200, 206, 503], // healthy/degraded/unhealthy
        timeout: 5000,
      },
    ];
  }

  async testRoute(route) {
    const url = `${this.baseUrl}${route.path}`;
    const startTime = Date.now();
    
    try {
      console.log(`\n🔍 テスト中: ${route.path} (${route.description})`);
      
      const controller = new AbortController();
      const timeout = route.timeout || this.timeouts.default;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'manual', // リダイレクトを手動制御
        headers: {
          'User-Agent': 'AIO-Hub-Smoke-Test/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      const success = route.expectedCodes.includes(response.status);
      const finalUrl = response.headers.get('location') || url;

      const result = {
        path: route.path,
        description: route.description,
        status: response.status,
        finalUrl,
        responseTime,
        success,
      };

      // 結果表示
      const statusIcon = success ? '✅' : '❌';
      const redirectInfo = response.status >= 300 && response.status < 400 
        ? ` → ${response.headers.get('location') || 'unknown'}`
        : '';
      
      console.log(`${statusIcon} ${response.status}${redirectInfo} (${responseTime}ms)`);
      
      if (!success) {
        console.log(`   期待ステータス: [${route.expectedCodes.join(', ')}]`);
      }

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      let errorMessage;
      if (error.name === 'AbortError') {
        errorMessage = `Timeout after ${route.timeout || this.timeouts.default}ms`;
      } else {
        errorMessage = error.message;
      }

      console.log(`❌ ERROR: ${errorMessage} (${responseTime}ms)`);

      return {
        path: route.path,
        description: route.description,
        status: 0,
        finalUrl: url,
        responseTime,
        success: false,
        error: errorMessage,
      };
    }
  }

  printSummary() {
    console.log('\n================================================');
    console.log('📊 スモークテスト結果サマリー');
    console.log('================================================');

    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;

    console.log(`総テスト数: ${total}`);
    console.log(`成功: ${passed}`);
    console.log(`失敗: ${failed}`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ 失敗したテスト:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.path}: ${r.error || `HTTP ${r.status}`}`);
        });
    }

    console.log('\n📈 パフォーマンス:');
    const avgTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / total;
    const maxTime = Math.max(...this.results.map(r => r.responseTime));
    console.log(`  平均応答時間: ${avgTime.toFixed(0)}ms`);
    console.log(`  最大応答時間: ${maxTime}ms`);

    if (failed === 0) {
      console.log('\n🎉 すべてのスモークテストが正常に完了しました！');
    } else {
      console.log('\n🚨 スモークテストで問題が検出されました。本番デプロイ前に修正してください。');
    }
  }

  async run() {
    const routes = this.getTestRoutes();
    
    for (const route of routes) {
      const result = await this.testRoute(route);
      this.results.push(result);
      
      // 短時間の待機（サーバー負荷軽減）
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.printSummary();

    const allPassed = this.results.every(r => r.success);
    return allPassed;
  }
}

// メイン実行
async function main() {
  try {
    const runner = new SmokeTestRunner();
    const success = await runner.run();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 スモークテストで予期しないエラーが発生しました:');
    console.error(error);
    process.exit(1);
  }
}

// スクリプト実行
main();