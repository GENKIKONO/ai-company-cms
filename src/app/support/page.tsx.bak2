import { Metadata } from 'next';
import InfoPageShell from '@/components/common/InfoPageShell';
import { SITE_CONFIG } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'サポート | AIO Hub',
  description: 'AIO Hubのサポートセンターです。よくある質問や問い合わせ方法をご確認いただけます。',
};

export default function SupportPage() {
  const sections = [
    {
      title: 'よくある質問',
      description: 'AIO Hubに関するよくある質問と回答をまとめています。',
      items: [
        {
          title: 'アカウント登録・ログインについて',
          body: 'アカウントの作成、パスワードの変更、ログインに関するトラブルシューティング'
        },
        {
          title: '企業情報の登録・編集',
          body: '会社概要、サービス、FAQの登録方法と編集手順'
        },
        {
          title: '料金・支払いについて',
          body: 'プラン変更、支払い方法、請求書に関する質問'
        },
        {
          title: 'API・埋め込み機能',
          body: 'APIキーの取得、ウィジェットの埋め込み方法'
        }
      ]
    },
    {
      title: '技術サポート',
      description: '技術的な問題や不具合についてのサポート情報です。',
      items: [
        {
          title: 'システム障害・メンテナンス',
          body: '現在のシステム状況は「システム状況」ページでご確認いただけます。'
        },
        {
          title: 'API利用時のエラー',
          body: 'APIドキュメントとエラーコード一覧をご確認ください。'
        },
        {
          title: '埋め込みウィジェットの表示問題',
          body: 'ブラウザの互換性やCSS設定についてのトラブルシューティング'
        }
      ]
    },
    {
      title: 'お問い合わせ',
      description: `上記で解決しない場合は、${SITE_CONFIG.supportEmail} までお気軽にお問い合わせください。`,
      items: [
        {
          title: '営業時間',
          body: '平日 9:00-18:00（土日祝日を除く）'
        },
        {
          title: '回答時間',
          body: 'お問い合わせから原則24時間以内にご回答いたします。'
        }
      ]
    }
  ];

  return (
    <InfoPageShell
      title="サポートセンター"
      description="AIO Hubのご利用に関するサポート情報"
      sections={sections}
    />
  );
}