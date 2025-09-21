import { Suspense } from 'react';
import Link from 'next/link';

function SuccessContent() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}

function SuccessPageContent() {
  const searchParams = new URLSearchParams();
  
  // クライアントサイドでURLパラメータを取得
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      searchParams.set(key, value);
    });
  }

  const action = searchParams.get('action');
  const organization = searchParams.get('organization');
  const slug = searchParams.get('slug');

  const isApproved = action === 'approved';
  const isRejected = action === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${
            isApproved ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isApproved ? (
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isApproved ? '承認完了' : '申請を拒否しました'}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {organization && (
              <span className="font-medium">{organization}</span>
            )}
            {isApproved && ' の企業情報ページが公開されました。'}
            {isRejected && ' の公開申請を拒否しました。申請者に修正を依頼してください。'}
          </p>
        </div>

        <div className="space-y-4">
          {isApproved && slug && (
            <div className="text-center">
              <a
                href={`/o/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                公開ページを確認
                <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-500">
              このページは閉じていただいて構いません。
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            次のステップ
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            {isApproved && (
              <>
                <li>• 企業情報ページが検索エンジンにインデックスされます</li>
                <li>• JSON-LD構造化データが有効になります</li>
                <li>• Google検索結果に表示される可能性があります</li>
              </>
            )}
            {isRejected && (
              <>
                <li>• 申請者にメールで通知されます</li>
                <li>• 申請者は内容を修正して再申請できます</li>
                <li>• 修正後、再度承認依頼が送信されます</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalSuccessPage() {
  return <SuccessContent />;
}