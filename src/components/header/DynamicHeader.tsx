import { getServerUserWithStatus } from '@/lib/auth/server';
import Link from "next/link";
import SignOutButton from './SignOutButton';

export default async function DynamicHeader() {
  const userProfile = await getServerUserWithStatus();
  const isAuthenticated = !!userProfile;

  return (
    <header className="hidden lg:block w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors">AIO Hub</Link>
          </div>
          <nav className="hidden lg:flex space-x-8">
            <Link href="/pricing" className="text-gray-700 hover:text-gray-900">料金プラン</Link>
            <Link href="/organizations" className="text-gray-700 hover:text-gray-900">企業ディレクトリ</Link>
            <Link href="/hearing-service" className="text-gray-700 hover:text-gray-900">ヒアリング代行</Link>
          </nav>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">ダッシュボード</Link>
                <SignOutButton />
              </>
            ) : (
              <Link href="/auth/login" className="bg-[var(--aio-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--aio-primary-hover)]">ログイン</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}