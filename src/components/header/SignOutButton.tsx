'use client';

import { auth } from '@/lib/auth';

export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
      console.log('[SignOutButton] ログアウト開始');
      await auth.signOut();
      
      // Cookieがクリアされるまで少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[SignOutButton] ホームページにリダイレクト');
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
    >
      ログアウト
    </button>
  );
}