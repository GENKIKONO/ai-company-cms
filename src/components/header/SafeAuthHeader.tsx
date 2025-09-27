// 安全なAuthHeader - Server Component
import FallbackHeader from './FallbackHeader';
import AuthHeader from './AuthHeader';

export default async function SafeAuthHeader() {
  try {
    // AuthHeader はそのまま呼ぶ（SSR）
    return <AuthHeader />;
  } catch (e) {
    console.error('[SafeAuthHeader] AuthHeader render failed:', e);
    return <FallbackHeader />;
  }
}