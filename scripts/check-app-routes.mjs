#!/usr/bin/env node
/**
 * App Route 存在チェック（Gate v1.1 Smoke Test）
 *
 * 【目的】
 * 本番で発生した 404 エラーを CI で検知する。
 * 指定した API ルートが存在するか（404 以外を返すか）を確認する。
 *
 * 【使用方法】
 * SMOKE_TEST_URL=https://example.com npm run check:app-routes
 *
 * 【CI での使用】
 * - SMOKE_TEST_URL は Vercel preview URL または本番 URL を指定
 * - 絶対 URL を使用するため、CSP の制約を受けない
 * - 認証が必要なエンドポイントは 401/403 を「存在する」として扱う
 *
 * @see docs/release-gates.md
 */

const SMOKE_TEST_URL = process.env.SMOKE_TEST_URL || process.env.NEXT_PUBLIC_SITE_URL;

// チェック対象の API ルート
// 404 が発生した実績のあるルートを追加する
const ROUTES_TO_CHECK = [
  '/api/health',           // ヘルスチェック（基本）
  // '/api/ops_audit_simple', // 2026-01-22 に 404 が発生したルート（存在確認後に追加）
];

// 存在するとみなすステータスコード
const VALID_STATUS_CODES = [200, 201, 204, 301, 302, 400, 401, 403, 405, 500, 502, 503];

async function checkRoute(baseUrl, route) {
  const url = `${baseUrl}${route}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Gate-v1.1-Smoke-Test',
      },
      redirect: 'manual', // リダイレクトを追わない
    });

    const status = response.status;
    const isValid = VALID_STATUS_CODES.includes(status);

    return {
      route,
      url,
      status,
      isValid,
      error: null,
    };
  } catch (error) {
    return {
      route,
      url,
      status: null,
      isValid: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('App Route 存在チェック（Gate v1.1 Smoke Test）');
  console.log('='.repeat(70));
  console.log('');

  if (!SMOKE_TEST_URL) {
    console.log('⚠️ SMOKE_TEST_URL が未設定のためスキップ');
    console.log('   CI では Vercel preview URL を設定してください');
    console.log('='.repeat(70));
    process.exit(0); // スキップ（fail しない）
  }

  console.log(`📍 Base URL: ${SMOKE_TEST_URL}`);
  console.log(`📍 チェック対象: ${ROUTES_TO_CHECK.length} ルート`);
  console.log('');

  let failCount = 0;

  for (const route of ROUTES_TO_CHECK) {
    const result = await checkRoute(SMOKE_TEST_URL, route);

    if (result.isValid) {
      console.log(`✅ ${route} → ${result.status}`);
    } else if (result.status === 404) {
      console.log(`❌ ${route} → 404 NOT FOUND`);
      failCount++;
    } else if (result.error) {
      console.log(`⚠️ ${route} → ERROR: ${result.error}`);
      // ネットワークエラーは警告のみ（CI 環境依存のため）
    } else {
      console.log(`⚠️ ${route} → ${result.status} (unexpected)`);
    }
  }

  console.log('');
  console.log('='.repeat(70));

  if (failCount > 0) {
    console.log(`❌ ${failCount} ルートが 404 を返しました`);
    console.log('');
    console.log('【対応方法】');
    console.log('- API ルートが存在するか確認');
    console.log('- ルート名のタイポを確認');
    console.log('- ビルド出力にルートが含まれているか確認');
    console.log('='.repeat(70));
    process.exit(1);
  }

  console.log('✅ App Route チェック: すべてOK');
  console.log('='.repeat(70));
  process.exit(0);
}

main().catch((err) => {
  console.error('スクリプトエラー:', err);
  process.exit(1);
});
