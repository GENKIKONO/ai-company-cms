import { Suspense } from 'react';

function ErrorContent() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ErrorPageContent />
    </Suspense>
  );
}

function ErrorPageContent() {
  const searchParams = new URLSearchParams();
  
  // クライアントサイドでURLパラメータを取得
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      searchParams.set(key, value);
    });
  }

  const message = searchParams.get('message') || '承認処理中にエラーが発生しました';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            エラーが発生しました
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            考えられる原因
          </h3>
          <ul className="text-xs text-red-700 space-y-1">
            <li>• 承認リンクの有効期限が切れています（15分間のみ有効）</li>
            <li>• 承認リンクが既に使用済みです</li>
            <li>• 対象の企業情報が既に処理済みです</li>
            <li>• システムの一時的な不具合が発生しています</li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            対処方法
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 承認リンクの有効期限が切れている場合は、申請者に再申請を依頼してください</li>
            <li>• 問題が続く場合は、サポートまでお問い合わせください</li>
            <li>• ブラウザを更新して再度お試しください</li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            このページは閉じていただいて構いません。
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalErrorPage() {
  return <ErrorContent />;
}