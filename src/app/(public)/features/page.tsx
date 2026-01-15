import { Metadata } from 'next';
import InfoPageShell from '@/components/common/InfoPageShell';

// P4-2: ISR設定（静的ページ）
export const revalidate = 1800; // 30分間隔での再生成

export const metadata: Metadata = {
  title: '機能一覧 | AIOHub',
  description: 'AIOHubで現在提供している機能の一覧です。',
};

export default function FeaturesPage() {
  const sections = [
    {
      title: '主要機能',
      description: 'AIOHubで現在提供している機能の一覧です。',
      items: [
        {
          title: 'AI検索最適化',
          body: 'AI検索エンジンでの見つけやすさを向上させる機能'
        },
        {
          title: '構造化データ自動生成',
          body: 'Schema.org準拠のJSON-LDデータを自動生成'
        },
        {
          title: '企業ディレクトリ公開',
          body: '企業情報を公開ディレクトリで表示する機能'
        },
        {
          title: '埋め込みウィジェット',
          body: '企業情報をWebサイトに簡単埋め込み'
        },
        {
          title: '管理ダッシュボード',
          body: '企業情報の管理・更新を行うダッシュボード'
        },
        {
          title: 'API連携',
          body: '外部システムとの連携機能'
        }
      ]
    }
  ];

  return (
    <InfoPageShell
      title="機能一覧"
      description="AIOHubで現在提供している機能の一覧です。"
      sections={sections}
    />
  );
}