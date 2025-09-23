import 'server-only';

const getEnv = (key: string, fallback?: string) => {
  const v = process.env[key] ?? fallback;
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const APP_URL = (() => {
  const url = getEnv('NEXT_PUBLIC_APP_URL');
  if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
    throw new Error('NEXT_PUBLIC_APP_URL must not contain localhost in production');
  }
  return url.replace(/\/$/, '');
})();

/**
 * Get application URL with production environment validation
 * @deprecated Use APP_URL constant instead
 */
export function getAppUrl(): string {
  return APP_URL;
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    appUrl: APP_URL,
    isProduction: isProduction(),
    hasLocalhostRefs: APP_URL.includes('localhost')
  };
}