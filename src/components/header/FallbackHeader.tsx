import Link from 'next/link';

// フォールバック用ヘッダー - 副作用最小のServer Component
export default function FallbackHeader() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-2xl font-bold text-gray-900 hover:text-blue-600"
            >
              AIO Hub AI企業CMS
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              ログイン
            </Link>
            <Link
              href="/auth/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}