import Link from 'next/link';
import { BackLink } from '@/components/ui/back-link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BackLink fallbackUrl="/" />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            利用規約
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            最終更新日: 2025年9月22日
          </p>
          
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第1条（適用）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                本利用規約（以下「本規約」）は、LuxuCare株式会社（以下「当社」）が提供するAIO Hub（以下「本サービス」）の利用に関して、
                本サービスを利用するお客様（以下「利用者」）と当社との間の権利義務関係を定めることを目的とし、
                利用者と当社との間の本サービスの利用に関わる一切の関係に適用されます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第2条（利用登録）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                1. 本サービスの利用を希望する者は、本規約に同意の上、当社の定める方法によって利用登録を申請するものとします。
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                2. 当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                <li>本規約に違反したことがある者からの申請である場合</li>
                <li>その他、当社が利用登録を相当でないと判断した場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第3条（禁止事項）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本サービスの内容等、本サービスに含まれる著作権、商標権等の知的財産権を侵害する行為</li>
                <li>当社、他の利用者、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>本サービスによって得られた情報を商業的に利用する行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他の利用者に関する個人情報等を収集または蓄積する行為</li>
                <li>違法、不正または不当な目的を持って本サービスを利用する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第4条（本サービスの提供の停止等）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、以下のいずれかの事由があると判断した場合、利用者に事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第5条（著作権）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                1. 利用者は、自ら著作権等の必要な知的財産権を有するか、または必要な権利者の許諾を得た文章、画像や映像等の情報に関してのみ、本サービスを利用し、投稿ないしアップロードすることができるものとします。
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                2. 利用者が本サービスを利用して投稿ないしアップロードした文章、画像、映像等の著作権については、当該利用者その他既存の権利者に留保されるものとします。
                ただし、当社は、本サービスを利用して投稿ないしアップロードされた文章、画像、映像等について、本サービスの改良、品質の向上、または不備の補正等とそれらに関連する目的に必要な範囲内において、
                利用、複製、修正、翻案、配布、譲渡、貸与、翻訳および二次的著作物の作成等をすることができるものとし、利用者はこれに同意するものとします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第6条（利用制限および登録抹消）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、利用者が以下のいずれかに該当する場合には、事前の通知なく、投稿データを削除し、当該利用者に対して本サービスの全部もしくは一部の利用を制限しまたは利用者としての登録を抹消することができるものとします。
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 mb-4">
                <li>本規約のいずれかの条項に違反した場合</li>
                <li>登録事項に虚偽の事実があることが判明した場合</li>
                <li>決済手段として当該利用者が届け出たクレジットカードが利用停止となった場合</li>
                <li>料金等の支払債務の不履行があった場合</li>
                <li>当社からの連絡に対し、一定期間返答がない場合</li>
                <li>本サービスについて、最終の利用から一定期間利用がない場合</li>
                <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第7条（免責事項）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                1. 当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                2. 当社は、本サービスに起因して利用者に生じたあらゆる損害について一切の責任を負いません。
                ただし、本サービスに関する当社と利用者との間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第8条（サービス内容の変更等）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、利用者に通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによって利用者に生じた損害について一切の責任を負いません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第9条（利用規約の変更）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。
                なお、本規約の変更後、本サービスの利用を開始した場合には、当該利用者は変更後の規約に同意したものとみなします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">第10条（準拠法・裁判管轄）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                1. 本規約の解釈にあたっては、日本法を準拠法とします。
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                2. 本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
              </p>
            </section>

            <div className="bg-gray-50 p-6 rounded-lg mt-8">
              <h3 className="font-semibold text-gray-800 mb-2">お問い合わせ</h3>
              <p className="text-gray-600 text-sm">
                本規約に関するお問い合わせは、<Link href="/contact" className="text-[var(--bg-primary)] hover:text-blue-500 underline">お問い合わせページ</Link>よりご連絡ください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}