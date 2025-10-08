// 本番環境でのデバッグログ抑制
const isProd = process.env.NODE_ENV === 'production';

export function vLog(message: string, data?: any) {
  if (isProd) return;
  console.log(`[VERIFY] ${message}`, data);
}

export function vErr(message: string, data?: any) {
  if (isProd) return;
  console.error(`[VERIFY] ${message}`, data);
}