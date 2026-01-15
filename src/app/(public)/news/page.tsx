import { Metadata } from 'next';
import { newsData, getCategoryStyle, getCategoryLabel } from '@/data/news';

export const metadata: Metadata = {
  title: 'お知らせ | AIOHub',
  description: 'AIOHubの最新情報、機能追加、メンテナンス情報をお知らせします。',
};

export default function NewsPage() {
  // Sort by date (newest first)
  const sortedNews = [...newsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 section-y">
        <div className="text-center mb-12">
          <h1 className="text-title1 text-gray-900 mb-4">最新のお知らせ</h1>
          <p className="text-body-large text-gray-600">
            AIOHubの最新情報、機能追加、重要な更新をお知らせします
          </p>
        </div>

        <div className="space-y-8">
          {sortedNews.map((item) => (
            <article key={item.id} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryStyle(item.category)}`}>
                  {getCategoryLabel(item.category)}
                </span>
                <time className="text-sm text-gray-500">
                  {new Date(item.date).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              <h2 className="text-title3 text-gray-900 mb-3">
                {item.title}
              </h2>
              <p className="text-body text-gray-700 leading-relaxed">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        {/* サイドバー的な情報 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="glass-card p-6">
            <h3 className="text-title3 text-blue-900 mb-3">📢 重要なお知らせ</h3>
            <ul className="space-y-2 text-body text-blue-800">
              <li>• 定期メンテナンス: 毎月第3日曜日 2:00-4:00（JST）</li>
              <li>• メールサポート（平日対応）</li>
              <li>• システム監視: 24時間365日体制</li>
            </ul>
          </div>
        </div>

        {/* お問い合わせリンク */}
        <div className="mt-8 text-center">
          <div className="glass-card p-6">
            <p className="text-body text-gray-600">
              ご質問やお困りのことがございましたら、
              <a href="/contact" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] mx-1">
                お問い合わせページ
              </a>
              からご連絡ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}