import { Metadata } from 'next';
import InfoPageShell from '@/components/common/InfoPageShell';

export const metadata: Metadata = {
  title: 'セキュリティとデータ保護 | AIO Hub',
  description: 'AIO Hubのセキュリティポリシー、データ保護の取り組みについて説明します。',
};

export default function SecurityPage() {
  const sections = [
    {
      title: 'データ保護の取り組み',
      description: 'お客様の大切な情報を安全に保護するための技術的対策',
      items: [
        {
          title: '通信の暗号化',
          body: 'すべての通信はTLS 1.3で保護されています'
        },
        {
          title: 'データベース暗号化',
          body: '保存データは256ビットAES暗号化で保護されています'
        },
        {
          title: 'アクセス制御',
          body: '最小権限の原則に基づいたアクセス制御を実装しています'
        },
        {
          title: '定期的な監査',
          body: 'アクセス権の定期監査と脅威検出を実施しています'
        }
      ]
    },
    {
      title: 'プライバシー保護',
      description: '個人情報・企業情報の適切な取り扱いについて',
      items: [
        {
          title: '収集する情報',
          body: '企業情報、利用状況データ、技術的情報を適切な範囲で収集します'
        },
        {
          title: '利用目的',
          body: 'サービス提供・改善、カスタマーサポート、法令遵守のための記録保持に使用します'
        },
        {
          title: 'GDPR準拠',
          body: 'EU一般データ保護規則（GDPR）に準拠したデータ処理を実施しています'
        },
        {
          title: '個人情報保護法対応',
          body: '日本の個人情報保護法に完全準拠した取り扱いを行っています'
        }
      ]
    },
    {
      title: 'インフラストラクチャセキュリティ',
      description: 'SOC 2 Type IIコンプライアントなクラウド基盤による24時間365日の監視体制',
      items: [
        {
          title: 'リアルタイム監視',
          body: 'システムの異常を即座に検知・対応します'
        },
        {
          title: '脅威検出',
          body: '不審なアクティビティの自動検出システムを運用しています'
        },
        {
          title: 'インシデント対応',
          body: '万一の際は即座の封じ込め、調査、通知、復旧の手順で対応します'
        }
      ]
    }
  ];

  return (
    <InfoPageShell
      title="セキュリティとデータ保護"
      description="お客様の大切な情報を安全に保護するための取り組み"
      sections={sections}
    />
  );
}