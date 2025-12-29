'use client';

import { useState } from 'react';
import { newsData, NewsItem, getCategoryStyle, getCategoryLabel } from '@/data/news';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface NewsFormData {
  date: string;
  category: NewsItem['category'];
  title: string;
  body: string;
}

export default function AdminNewsPage() {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<NewsFormData>({
    date: new Date().toISOString().split('T')[0],
    category: 'general',
    title: '',
    body: ''
  });
  const { addToast } = useToast();

  const handleSelectNews = (news: NewsItem) => {
    setSelectedNews(news);
    setIsCreating(false);
    setFormData({
      date: news.date,
      category: news.category,
      title: news.title,
      body: news.body
    });
  };

  const handleNewNews = () => {
    setSelectedNews(null);
    setIsCreating(true);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'general',
      title: '',
      body: ''
    });
  };

  const handleSave = async () => {
    // ニュースはファイル運用のため、編集内容をJSON形式で表示
    const newsJson = JSON.stringify({
      id: selectedNews?.id || `${formData.date}-${Date.now()}`,
      ...formData,
      last_modified: new Date().toISOString().split('T')[0]
    }, null, 2);

    addToast({
      type: 'info',
      title: '保存方法',
      message: `ニュースはファイル（src/data/news.ts）で管理しています。以下の内容をファイルに反映してデプロイしてください：\n\n${newsJson}`,
      duration: 10000
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 section-y">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-title1 text-gray-900 mb-2">ニュース管理</h1>
          <p className="text-body-large text-gray-600">
            ニュースはファイル（src/data/news.ts）で管理しています。変更はGit管理下のファイル編集→デプロイで反映されます。
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* News List (Left) */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-title3 text-gray-900">既存のニュース一覧</h2>
                <Button
                  onClick={handleNewNews}
                  variant="default"
                  size="sm"
                  className="spring-bounce"
                >
                  ＋ 新しいニュースを追加
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {newsData.map((news) => (
                  <div
                    key={news.id}
                    onClick={() => handleSelectNews(news)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 spring-bounce ${
                      selectedNews?.id === news.id
                        ? 'border-[var(--aio-primary)] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryStyle(news.category)}`}>
                        {getCategoryLabel(news.category)}
                      </span>
                      <span className="text-caption text-gray-500">
                        {new Date(news.date).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    {/* line-clamp-2: Limits title display to 2 lines for consistent card height */}
                    <h3 className="text-body text-gray-900 font-medium line-clamp-2">
                      {news.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Edit Form (Right) */}
          <div className="lg:col-span-3">
            <div className="glass-card p-6">
              <h2 className="text-title3 text-gray-900 mb-6">
                {isCreating ? '新しいニュースを作成' : selectedNews ? 'ニュースを編集' : '編集するニュースを選択してください'}
              </h2>

              {(selectedNews || isCreating) && (
                <form className="space-y-6">
                  {/* Date */}
                  <div>
                    <label className="block text-body-small font-medium text-gray-700 mb-2">
                      公開日
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--aio-primary)] focus:border-transparent"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-body-small font-medium text-gray-700 mb-2">
                      カテゴリ
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as NewsItem['category'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--aio-primary)] focus:border-transparent"
                    >
                      <option value="general">お知らせ</option>
                      <option value="release">リリース</option>
                      <option value="maintenance">メンテナンス</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-body-small font-medium text-gray-700 mb-2">
                      タイトル
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--aio-primary)] focus:border-transparent"
                      placeholder="ニュースのタイトルを入力"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-body-small font-medium text-gray-700 mb-2">
                      本文
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--aio-primary)] focus:border-transparent resize-vertical"
                      placeholder="ニュースの本文を入力"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={handleSave}
                      variant="default"
                      className="spring-bounce"
                    >
                      保存
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedNews(null);
                        setIsCreating(false);
                      }}
                      variant="outline"
                      className="spring-bounce"
                    >
                      キャンセル
                    </Button>
                  </div>
                </form>
              )}

              {!selectedNews && !isCreating && (
                <div className="text-center py-12">
                  <p className="text-body text-gray-500 mb-4">編集するニュースを左から選択するか、新しいニュースを作成してください。</p>
                  <Button
                    onClick={handleNewNews}
                    variant="outline"
                    className="spring-bounce"
                  >
                    ＋ 新しいニュースを追加
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}