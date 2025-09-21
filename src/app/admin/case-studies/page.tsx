'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CaseStudyManager } from '@/components/CaseStudyManager';
import { Button } from '@/components/ui/button';

export default function AdminCaseStudiesPage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            認証が必要です
          </h1>
          <p className="text-gray-600 mb-6">
            導入事例管理にアクセスするにはログインしてください。
          </p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            ログインページへ
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin' && user.role !== 'editor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            アクセス権限がありません
          </h1>
          <p className="text-gray-600 mb-6">
            導入事例管理機能にアクセスする権限がありません。
          </p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            ダッシュボードへ戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                導入事例管理
              </h1>
              <p className="text-gray-600">
                企業の導入事例情報を管理します
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user.full_name || user.email}
              </span>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
              >
                ダッシュボードへ
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <CaseStudyManager />
        </div>
      </main>
    </div>
  );
}