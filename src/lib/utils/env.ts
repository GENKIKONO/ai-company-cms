/**
 * 環境変数ユーティリティ（商用レベル統一版）
 * プレビュー/開発でも常にhttps://aiohub.jpを返し、localStorage混入を防ぐ
 */

// サーバー専用定数: 常にhttps://aiohub.jpを返す（プレビューでも誤リンクを避けるため）
export const APP_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // 本番では必須
  if (process.env.NODE_ENV === 'production' && !envUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL must be set in production');
  }
  
  // localhost検出時のガード（本番混入防止）
  if (process.env.NODE_ENV === 'production' && envUrl?.includes('localhost')) {
    throw new Error('localhost URLs are not allowed in production');
  }
  
  // 常にhttps://aiohub.jpを返す（プレビューでの誤リンク防止）
  return 'https://aiohub.jp';
})();

// クライアント用（必要に応じて）
export const getAppUrl = () => APP_URL;

// 環境判定
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';