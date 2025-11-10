import { Metadata } from 'next';
import InfoPageShell from '@/components/common/InfoPageShell';
import { SITE_CONFIG } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '利用規約 | AIO Hub',
  description: 'AIO Hub（LuxuCare株式会社）の利用規約です。',
};

export default function TermsPage() {
  const sections = [
    {
      title: '第1条（適用）',
      description: `本利用規約（以下「本規約」）は、${SITE_CONFIG.companyName}（以下「当社」）が提供するAIO Hub（以下「本サービス」）の利用に関して、本サービスを利用するお客様（以下「利用者」）と当社との間の権利義務関係を定めることを目的とし、利用者と当社との間の本サービスの利用に関わる一切の関係に適用されます。`
    },
    {
      title: '第2条（利用登録）',
      items: [
        {
          title: '利用登録の申請',
          body: '本サービスの利用を希望する者は、本規約に同意の上、当社の定める方法によって利用登録を申請するものとします。'
        },
        {
          title: '登録承認の判断',
          body: '当社は、利用登録の申請者に虚偽の事項の届出、本規約違反の履歴、その他当社が利用登録を相当でないと判断した事由がある場合、利用登録の申請を承認しないことがあります。'
        }
      ]
    },
    {
      title: '第3条（禁止事項）',
      description: '利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。',
      items: [
        {
          title: '基本的禁止事項',
          body: '法令または公序良俗に違反する行為、犯罪行為に関連する行為、知的財産権を侵害する行為、サーバーまたはネットワークの機能を破壊・妨害する行為'
        },
        {
          title: 'サービス運営に関わる禁止事項',
          body: '不正アクセス、個人情報の不正収集、商業的利用、サービス運営の妨害、その他当社が不適切と判断する行為'
        }
      ]
    },
    {
      title: '第4条（サービス提供の停止等）',
      description: '当社は、システムの保守点検、不可抗力による障害、その他サービス提供が困難と判断した場合、事前通知なくサービスの全部または一部を停止・中断することができます。'
    },
    {
      title: '第5条（著作権・知的財産権）',
      description: '利用者は適切な権利を有する情報のみを投稿でき、投稿された情報の著作権は利用者に留保されますが、当社はサービス改良等の目的で必要な範囲で利用することができます。'
    },
    {
      title: '第6条（免責事項）',
      description: '当社は本サービスの瑕疵について保証せず、利用者に生じた損害について原則として責任を負いません。ただし、消費者契約法が適用される場合を除きます。'
    },
    {
      title: '第7条（準拠法・管轄）',
      items: [
        {
          title: '準拠法',
          body: '本規約の解釈にあたっては、日本法を準拠法とします。'
        },
        {
          title: '管轄裁判所',
          body: '本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。'
        }
      ]
    },
    {
      title: 'お問い合わせ',
      description: `本規約に関するお問い合わせは、${SITE_CONFIG.supportEmail} までご連絡ください。`
    }
  ];

  return (
    <InfoPageShell
      title="利用規約"
      description="AIO Hubサービスのご利用にあたって"
      sections={sections}
      variant="policy"
    />
  );
}