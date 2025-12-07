/**
 * 監視ダッシュボード レイアウト
 * 要件定義準拠: 管理者専用アクセス
 */

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface MonitoringLayoutProps {
  children: React.ReactNode;
}

export default async function MonitoringLayout({ children }: MonitoringLayoutProps) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Server Component での cookie 設定エラーをハンドル
          }
        },
      },
    }
  );

  // セッション確認
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    notFound();
  }

  // 管理者権限確認
  const userRole = session.user.user_metadata?.role;
  
  if (userRole !== 'admin') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                システム監視
              </h1>
              <p className="text-sm text-gray-600">
                管理者専用ダッシュボード
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.email}
              </span>
              <div className="h-2 w-2 bg-green-500 rounded-full" title="オンライン" />
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}