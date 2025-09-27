import Link from 'next/link';
import { BackLink } from '@/components/ui/back-link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BackLink fallbackUrl="/" />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            プライバシーポリシー
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            最終更新日: 2025年9月22日
          </p>
          
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. 基本方針</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                LuxuCare株式会社（以下「当社」）は、お客様の個人情報を適切に保護することの重要性を深く認識し、
                個人情報の保護に関する法律、その他の関係法令等を遵守するとともに、以下のプライバシーポリシー（以下「本ポリシー」）に従って、
                個人情報を適切に取り扱います。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. 個人情報の定義</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                本ポリシーにおいて「個人情報」とは、個人情報の保護に関する法律第2条第1項に定義された個人情報、
                すなわち生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により特定の個人を識別することができるもの
                （他の情報と容易に照合することができ、それにより特定の個人を識別することができることとなるものを含む）を意味します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. 収集する個人情報</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、AIO Hub（以下「本サービス」）の提供にあたり、以下の個人情報を収集いたします。
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">3.1 利用者から直接収集する情報</h3>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>氏名</li>
                <li>メールアドレス</li>
                <li>会社名・組織名</li>
                <li>電話番号</li>
                <li>住所</li>
                <li>その他お客様が入力・送信する情報</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">3.2 本サービスの利用により自動的に収集される情報</h3>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>IPアドレス</li>
                <li>ブラウザの種類とバージョン</li>
                <li>オペレーティングシステム</li>
                <li>アクセス日時</li>
                <li>閲覧ページのURL</li>
                <li>リファラー情報</li>
                <li>Cookie情報</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. 個人情報の利用目的</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、収集した個人情報を以下の目的で利用いたします。
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>本サービスの提供・運営・維持・改善</li>
                <li>利用者への連絡・通知</li>
                <li>利用者からのお問い合わせへの対応</li>
                <li>本サービスの利用状況の分析</li>
                <li>本サービスの品質向上・機能改善</li>
                <li>マーケティング・宣伝活動</li>
                <li>不正利用の防止・検出</li>
                <li>法令に基づく対応</li>
                <li>その他本サービスの適切な運営に必要な業務</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. 個人情報の第三者提供</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、以下の場合を除き、あらかじめお客様の同意を得ることなく、第三者に個人情報を提供することはありません。
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難である場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがある場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. 個人情報の委託</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、本サービスの運営に必要な業務の一部を外部に委託する場合があります。
                この場合、委託先における個人情報の安全管理が図られるよう、適切な監督を行います。
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">主な委託先</h3>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>クラウドインフラ提供事業者（Vercel Inc.、Supabase Inc.等）</li>
                <li>メール配信サービス提供事業者（Resend等）</li>
                <li>決済処理事業者（Stripe Inc.等）</li>
                <li>分析ツール提供事業者</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">7. 個人情報の保存期間</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、個人情報を利用目的の達成に必要な期間に限り保存し、その後は適切に削除または匿名化いたします。
                ただし、法令により保存が義務付けられている場合は、当該期間中保存いたします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Cookieの使用について</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                本サービスでは、サービスの利便性向上およびサービス利用状況の分析のため、Cookieを使用しています。
                Cookieの使用を希望されない場合は、ブラウザの設定により無効にすることができますが、
                一部の機能をご利用いただけない場合があります。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">9. 個人情報の開示・訂正・削除</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社が保有する個人情報について、開示・訂正・利用停止・削除をご希望される場合は、
                お問い合わせフォームよりご連絡ください。適切な本人確認を行った上で、合理的な期間内に対応いたします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">10. セキュリティ対策</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、個人情報の不正アクセス、紛失、破壊、改ざん、漏洩等を防ぐため、
                適切な技術的・組織的安全管理措置を講じています。
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>データの暗号化</li>
                <li>アクセス制御</li>
                <li>定期的なセキュリティ監査</li>
                <li>従業員への教育・研修</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">11. 海外への個人情報の移転</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                本サービスでは、サービス提供のため海外のクラウドサービス等を利用しており、
                お客様の個人情報が海外に移転される場合があります。
                この場合、適切な保護措置を講じた上で移転を行います。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">12. プライバシーポリシーの変更</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、必要に応じて本ポリシーを変更する場合があります。
                重要な変更については、本サービス上での通知またはメールにてお知らせいたします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">13. お問い合わせ</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                本ポリシーに関するお問い合わせ、個人情報の開示・訂正・削除等のご依頼は、
                以下よりお気軽にご連絡ください。
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>LuxuCare株式会社</strong><br />
                  個人情報取扱責任者<br />
                  <Link href="/contact" className="text-blue-600 hover:text-blue-500 underline">お問い合わせフォーム</Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}