import Link from 'next/link';

// フォールバック用ヘッダー - 副作用最小のServer Component
export default function FallbackHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl flex items-center justify-between p-3">
        <Link href="/" className="font-semibold">AIO Hub AI企業CMS</Link>
        <nav className="flex gap-3">
          <Link href="/auth/login" className="text-sm">ログイン</Link>
          <Link href="/auth/signup" className="text-sm">新規登録</Link>
        </nav>
      </div>
    </header>
  );
}