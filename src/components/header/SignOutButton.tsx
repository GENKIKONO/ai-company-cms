'use client';

import { auth } from '@/lib/auth';

export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
      console.log('[SignOutButton] Complete logout starting...');
      
      // 完全なログアウト処理
      await auth.signOut();
      
      console.log('[SignOutButton] Logout completed, redirecting to home...');
      
      // 強制的にホームページにリダイレクト
      window.location.href = '/';
    } catch (error) {
      console.error('[SignOutButton] Logout failed:', error);
      
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