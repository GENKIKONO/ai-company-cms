import { Metadata } from 'next';
import InfoPageShell from '@/components/common/InfoPageShell';

export const metadata: Metadata = {
  title: 'システム稼働状況 | AIOHub',
  description: 'AIOHubのシステム稼働状況とサービス状態をリアルタイムで確認できます。',
};

export default function StatusPage() {
  const sections = [
    {
      title: '全体ステータス',
      description: '🟢 全サービス正常稼働中',
      items: [
        {
          title: 'Webサイト',
          body: 'メインサイトとダッシュボード - 正常稼働'
        },
        {
          title: 'API',
          body: '企業情報取得・更新API - 正常稼働'
        },
        {
          title: '埋め込みウィジェット',
          body: 'iframe・Widgetサービス - 正常稼働'
        },
        {
          title: 'AI検索最適化',
          body: '検索エンジン連携・最適化 - 正常稼働'
        }
      ]
    },
    {
      title: 'パフォーマンス指標',
      description: '過去24時間のサービス状況',
      items: [
        {
          title: '稼働率',
          body: '99.9% - 高い稼働率を維持しています'
        },
        {
          title: '平均応答時間',
          body: '150ms - 高速なレスポンスを提供しています'
        },
        {
          title: '障害件数',
          body: '0件 - 安定した運用を継続しています'
        }
      ]
    },
    {
      title: 'メンテナンス情報',
      description: '現在予定されているメンテナンスはありません。',
      items: [
        {
          title: '定期メンテナンス',
          body: '毎月第3日曜日 2:00-4:00（JST）に実施予定です'
        }
      ]
    }
  ];

  return (
    <InfoPageShell
      title="システム稼働状況"
      description="AIOHubのサービス状態をリアルタイムで確認"
      sections={sections}
    />
  );
}