'use client';

import { signOutClient } from '@/lib/core/auth-state.client';
import { logger } from '@/lib/utils/logger';

export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
      logger.debug('[SignOutButton] Complete logout starting...');

      // 完全なログアウト処理（Core経由）
      await signOutClient();
      
      logger.debug('[SignOutButton] Logout completed, redirecting to home...');
      
      // 強制的にホームページにリダイレクト
      window.location.href = '/';
    } catch (error) {
      logger.error('[SignOutButton] Logout failed', { data: error instanceof Error ? error : new Error(String(error)) });
      
      // エラーが発生した場合でも強制的にリロード
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
      data-testid="logout-button"
    >
      ログアウト
    </button>
  );
}