import { BackLink } from '@/components/ui/back-link';
import { PrimaryCTA } from '@/design-system';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BackLink fallbackUrl="/" />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            ヘルプセンター
          </h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                よくある質問
              </h2>
              <div className="space-y-4">
                <details className="border border-gray-200 rounded-lg p-4">
                  <summary className="font-medium text-gray-800 cursor-pointer">
                    AIO Hubとは何ですか？
                  </summary>
                  <p className="mt-2 text-gray-600">
                    AIO Hubは、AI企業の情報を一元管理し、構造化データとして公開できるプラットフォームです。
                    企業情報をJSON-LD形式で出力し、検索エンジンでの表示を最適化します。
                  </p>
                </details>
                
                <details className="border border-gray-200 rounded-lg p-4">
                  <summary className="font-medium text-gray-800 cursor-pointer">
                    アカウントの作成方法を教えてください
                  </summary>
                  <p className="mt-2 text-gray-600">
                    「新規登録」ページからメールアドレスとパスワードを入力してアカウントを作成できます。
                    登録後、確認メールが送信されますので、メール内のリンクをクリックしてアカウントを有効化してください。
                  </p>
                </details>
                
                <details className="border border-gray-200 rounded-lg p-4">
                  <summary className="font-medium text-gray-800 cursor-pointer">
                    確認メールが届かない場合はどうすればよいですか？
                  </summary>
                  <p className="mt-2 text-gray-600">
                    迷惑メールフォルダをご確認ください。それでも見つからない場合は、
                    メールアドレスが正しく入力されているかご確認の上、再度登録をお試しください。
                  </p>
                </details>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                機能ガイド
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-2">企業情報の管理</h3>
                  <p className="text-gray-600 text-sm">
                    企業の基本情報、サービス内容、事例などを登録・管理できます。
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-2">JSON-LD出力</h3>
                  <p className="text-gray-600 text-sm">
                    登録した情報を構造化データとして自動的にJSON-LD形式で出力します。
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-2">SEO最適化</h3>
                  <p className="text-gray-600 text-sm">
                    検索エンジンでの表示を最適化し、企業の認知度向上をサポートします。
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-2">承認フロー</h3>
                  <p className="text-gray-600 text-sm">
                    企業担当者による承認を経て、情報を安全に公開できます。
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                お困りの際は
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-800 mb-4">
                  上記で解決しない場合は、お気軽にお問い合わせください。
                </p>
                <PrimaryCTA 
                  href="/contact"
                  size="medium"
                >
                  お問い合わせフォームへ
                </PrimaryCTA>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}