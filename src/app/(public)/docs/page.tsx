import { Metadata } from 'next';
import InfoPageShell from '@/components/common/InfoPageShell';

export const metadata: Metadata = {
  title: 'ドキュメント | AIO Hub',
  description: 'AIO Hubの使い方や機能についてのドキュメントです。',
};

export default function DocsPage() {
  const sections = [
    {
      title: 'サービス概要',
      description: 'AIO Hubは企業情報をAI検索エンジンで見つけやすくするプラットフォームです。',
      items: [
        {
          title: '企業情報管理',
          body: '会社概要、サービス、FAQの一元管理'
        },
        {
          title: 'AI検索最適化',
          body: 'AI検索エンジンでの見つけやすさを向上'
        },
        {
          title: '埋め込みウィジェット',
          body: '企業情報をWebサイトに簡単埋め込み'
        },
        {
          title: 'アナリティクス',
          body: 'アクセス状況と検索パフォーマンスの分析'
        }
      ]
    },
    {
      title: 'よくある質問',
      items: [
        {
          title: 'AIO Hubとは何ですか？',
          body: 'AIO Hubは、企業情報をAI検索エンジンで見つけやすくするためのプラットフォームです。ChatGPTやBardなどのAI検索で企業が適切に表示されるよう最適化します。'
        },
        {
          title: 'どのような企業に適していますか？',
          body: 'BtoB企業、コンサルティング会社、技術系企業など、AI検索での認知度向上を求める全ての企業に適しています。'
        }
      ]
    }
  ];

  return (
    <InfoPageShell
      title="AIO Hub ドキュメント"
      description="AIO Hubの機能と使い方について詳しく説明します。"
      sections={sections}
    />
  );
}