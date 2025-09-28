'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SignoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export default function SignoutButton({ className, children, onClick }: SignoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // カスタムonClickハンドラがあれば実行
        if (onClick) onClick();
        
        // 303リダイレクトの場合、手動でホームに移動
        router.push('/');
        router.refresh(); // Server Componentを更新
      } else {
        console.error('Signout failed:', await response.text());
        alert('ログアウトに失敗しました');
      }
    } catch (error) {
      console.error('Signout error:', error);
      alert('ログアウトに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignout}
      disabled={isLoading}
      className={className}
    >
      {children || (isLoading ? 'ログアウト中...' : 'ログアウト')}
    </button>
  );
}