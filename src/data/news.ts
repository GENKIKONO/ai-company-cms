// News/Announcements Data
// 管理者編集場所: このファイルまたは将来的にSupabaseテーブル
// 日付は実際の開発日または未来ではない日付のみを使用

export interface NewsItem {
  id: string;
  date: string;
  category: 'general' | 'maintenance' | 'release';
  title: string;
  body: string;
  last_modified?: string;
}

export const newsData: NewsItem[] = [
  {
    id: '2025-01-15-1',
    date: '2025-01-15',
    category: 'general',
    title: 'AIO Hub 開発状況のお知らせ',
    body: '現在、管理画面機能の強化を進めています。ユーザビリティの向上とセキュリティの強化に取り組んでおります。',
    last_modified: '2025-01-15'
  },
  {
    id: '2024-12-01-1',
    date: '2024-12-01',
    category: 'release',
    title: 'ダッシュボードの表示速度を改善',
    body: '管理ダッシュボードの読み込み速度を向上させました。大量のデータを扱う際のパフォーマンスが改善されています。',
    last_modified: '2024-12-01'
  },
  {
    id: '2024-11-15-1', 
    date: '2024-11-15',
    category: 'maintenance',
    title: 'セキュリティ機能を強化',
    body: '管理者向けページのセキュリティを強化し、より安全にサービスをご利用いただけるようになりました。',
    last_modified: '2024-11-15'
  }
];

// カテゴリー用のスタイル設定
export const getCategoryStyle = (category: NewsItem['category']) => {
  switch (category) {
    case 'general':
      return 'bg-blue-100 text-blue-800';
    case 'release':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// カテゴリーの日本語ラベル
export const getCategoryLabel = (category: NewsItem['category']) => {
  switch (category) {
    case 'general':
      return 'お知らせ';
    case 'release':
      return 'リリース';
    case 'maintenance':
      return 'メンテナンス';
    default:
      return 'その他';
  }
};