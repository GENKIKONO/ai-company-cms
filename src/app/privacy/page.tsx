import { Metadata } from 'next';
import InfoPageShell from '@/components/common/InfoPageShell';
import { SITE_CONFIG } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | AIO Hub',
  description: 'AIO Hub（LuxuCare株式会社）のプライバシーポリシーです。',
};

export default function PrivacyPage() {
  const sections = [
    {
      title: '基本方針',
      description: `${SITE_CONFIG.companyName}（以下「当社」）は、お客様の個人情報を適切に保護することの重要性を深く認識し、個人情報の保護に関する法律、その他の関係法令等を遵守するとともに、以下のプライバシーポリシー（以下「本ポリシー」）に従って、個人情報を適切に取り扱います。`
    },
    {
      title: '収集する個人情報',
      description: '当社は、AIO Hub（以下「本サービス」）の提供にあたり、以下の個人情報を収集いたします。',
      items: [
        {
          title: '利用者から直接収集する情報',
          body: '氏名、メールアドレス、会社名・組織名、その他お客様が入力・送信する情報'
        },
        {
          title: '本サービスの利用により自動的に収集される情報',
          body: 'IPアドレス、ブラウザの種類とバージョン、オペレーティングシステム、アクセス日時、閲覧ページのURL、リファラー情報、Cookie情報'
        }
      ]
    },
    {
      title: '個人情報の利用目的',
      items: [
        {
          title: '主な利用目的',
          body: '本サービスの提供・運営・維持・改善、利用者への連絡・通知、利用者からのお問い合わせへの対応、本サービスの利用状況の分析、不正利用の防止・検出、法令に基づく対応、その他本サービスの適切な運営に必要な業務'
        }
      ]
    },
    {
      title: '個人情報の安全管理',
      description: '当社は、個人情報の不正アクセス、紛失、破壊、改ざん、漏洩等を防ぐため、適切な技術的・組織的安全管理措置を講じています。',
      items: [
        {
          title: 'セキュリティ対策',
          body: 'データの暗号化、アクセス制御、定期的なセキュリティ監査、従業員への教育・研修を実施しています。'
        }
      ]
    },
    {
      title: 'お問い合わせ',
      description: `本ポリシーに関するお問い合わせ、個人情報の開示・訂正・削除等のご依頼は、${SITE_CONFIG.supportEmail} までご連絡ください。`
    }
  ];

  return (
    <InfoPageShell
      title="プライバシーポリシー"
      description="AIO Hubにおける個人情報の取り扱いについて"
      sections={sections}
      variant="policy"
    />
  );
}