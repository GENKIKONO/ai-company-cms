import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'セキュリティとデータ保護 | AIO Hub',
  description: 'AIO Hubのセキュリティポリシー、データ保護の取り組みについて説明します。',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">セキュリティとデータ保護</h1>
          <p className="text-xl text-gray-600">
            お客様の大切な情報を安全に保護するための取り組み
          </p>
        </div>

        <div className="prose prose-lg mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">🔒 セキュリティ第一</h2>
            <p className="text-blue-800">
              AIO Hubは、お客様の企業情報とプライバシーの保護を最優先に考え、
              業界標準のセキュリティ対策を実装しています。
            </p>
          </div>

          <h2>データ保護の取り組み</h2>
          <h3>暗号化</h3>
          <ul>
            <li><strong>通信の暗号化</strong> - すべての通信はTLS 1.3で保護</li>
            <li><strong>データベース暗号化</strong> - 保存データは256ビットAES暗号化</li>
            <li><strong>バックアップ暗号化</strong> - バックアップデータも同様に暗号化</li>
          </ul>

          <h3>アクセス制御</h3>
          <ul>
            <li><strong>多要素認証</strong> - 管理者アカウントは2FA必須</li>
            <li><strong>権限管理</strong> - 最小権限の原則に基づいたアクセス制御</li>
            <li><strong>定期的な権限見直し</strong> - アクセス権の定期監査を実施</li>
          </ul>

          <h2>プライバシーポリシー</h2>
          <h3>収集する情報</h3>
          <ul>
            <li>企業情報（会社名、サービス内容、連絡先等）</li>
            <li>利用状況データ（アクセスログ、機能利用状況等）</li>
            <li>技術的情報（IPアドレス、ブラウザ情報等）</li>
          </ul>

          <h3>情報の利用目的</h3>
          <ul>
            <li>AIO Hubサービスの提供・改善</li>
            <li>カスタマーサポートの提供</li>
            <li>利用状況の分析とサービス最適化</li>
            <li>法令遵守のための記録保持</li>
          </ul>

          <h2>インフラストラクチャセキュリティ</h2>
          <h3>クラウド基盤</h3>
          <p>
            AIO HubはSOC 2 Type IIコンプライアントなクラウドプロバイダーを使用し、
            24時間365日の監視体制でインフラを保護しています。
          </p>

          <h3>監視・検知</h3>
          <ul>
            <li><strong>リアルタイム監視</strong> - システムの異常を即座に検知</li>
            <li><strong>脅威検出</strong> - 不審なアクティビティの自動検出</li>
            <li><strong>ログ保持</strong> - セキュリティイベントの詳細記録</li>
          </ul>

          <h2>コンプライアンス</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">GDPR準拠</h3>
              <p className="text-gray-700">
                EU一般データ保護規則（GDPR）に準拠したデータ処理を行っています。
                データの削除要求や移転要求にも適切に対応します。
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">個人情報保護法対応</h3>
              <p className="text-gray-700">
                日本の個人情報保護法に完全準拠し、適切な個人情報の取り扱いを行っています。
              </p>
            </div>
          </div>

          <h2>インシデント対応</h2>
          <p>
            万一セキュリティインシデントが発生した場合は、
            以下の手順で迅速に対応いたします：
          </p>
          <ol>
            <li><strong>即座の封じ込め</strong> - 被害拡大の防止</li>
            <li><strong>影響範囲の調査</strong> - 詳細な被害状況の把握</li>
            <li><strong>お客様への通知</strong> - 透明性を持った報告</li>
            <li><strong>復旧と改善</strong> - サービス復旧と再発防止策の実装</li>
          </ol>

          <h2>お問い合わせ</h2>
          <p>
            セキュリティに関するご質問やご報告は、
            <a href="/contact" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]">
              お問い合わせページ
            </a>
            またはセキュリティ専用メール（security@aiohub.jp）までご連絡ください。
          </p>
        </div>
      </div>
    </div>
  );
}