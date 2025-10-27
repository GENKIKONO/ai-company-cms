'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { QAEntry, QACategory } from '@/types/database';
import { logger } from '@/lib/utils/logger';

interface QAPublicDisplayProps {
  organizationSlug: string;
  className?: string;
}

interface QAWithCategory extends QAEntry {
  qa_categories?: QACategory;
}

export default function QAPublicDisplay({ organizationSlug, className = '' }: QAPublicDisplayProps) {
  const [entries, setEntries] = useState<QAWithCategory[]>([]);
  const [categories, setCategories] = useState<QACategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchQAData = async () => {
    try {
      const params = new URLSearchParams({
        org_slug: organizationSlug,
        limit: '50'
      });

      if (selectedCategory !== 'all') {
        params.append('category_id', selectedCategory);
      }

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/qa/public?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.data || []);
        setCategories(data.categories || []);
      }
    } catch (error) {
      logger.error('Error fetching Q&A data', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationSlug) {
      fetchQAData();
    }
  }, [organizationSlug, selectedCategory, searchTerm]);

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
      // Q&A閲覧統計のログ送信（新規展開時のみ）
      logQAView(entryId);
    }
    setExpandedItems(newExpanded);
  };

  const logQAView = async (qnaId: string) => {
    try {
      // 重複計測防止: sessionStorageで同一セッション内の重複viewを防ぐ
      const sessionKey = `qna_view_${qnaId}`;
      const hasAlreadyViewed = sessionStorage.getItem(sessionKey);
      
      if (hasAlreadyViewed) {
        logger.debug('Debug', `Q&A ${qnaId} already viewed in this session, skipping duplicate log`);
        return;
      }

      // 統計ログ送信
      const response = await fetch('/api/qna/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qna_id: qnaId,
          action: 'view',
          user_agent: navigator.userAgent,
        }),
      });

      // 成功時のみセッションフラグを設定
      if (response.ok) {
        sessionStorage.setItem(sessionKey, new Date().toISOString());
      }
      
    } catch (error) {
      // サイレントエラー：統計ログの失敗はユーザー体験に影響させない
      logger.warn('Failed to log Q&A view', error);
    }
  };

  const groupedEntries = entries.reduce((groups, entry) => {
    const categoryName = entry.qa_categories?.name || 'その他';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(entry);
    return groups;
  }, {} as Record<string, QAWithCategory[]>);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (entries.length === 0 && !searchTerm && selectedCategory === 'all') {
    return null; // Don't show anything if no Q&A entries exist
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            ナレッジベース
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="質問を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
              >
                <option value="all">全カテゴリ</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Q&A Entries */}
          {Object.keys(groupedEntries).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedEntries).map(([categoryName, categoryEntries]) => (
                <div key={categoryName}>
                  {Object.keys(groupedEntries).length > 1 && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Badge variant="outline">{categoryName}</Badge>
                      <span className="text-sm text-gray-500">({categoryEntries.length}件)</span>
                    </h3>
                  )}
                  
                  <div className="space-y-3">
                    {categoryEntries.map((entry) => (
                      <Card key={entry.id} className="border border-gray-200">
                        <CardContent className="p-0">
                          <button
                            onClick={() => toggleExpanded(entry.id)}
                            className="w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 pr-4">
                                {entry.question}
                              </h4>
                              {expandedItems.has(entry.id) ? (
                                <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                            
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </button>
                          
                          {expandedItems.has(entry.id) && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                              <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                  {entry.answer}
                                </p>
                              </div>
                              
                              {entry.published_at && (
                                <p className="text-xs text-gray-500 mt-3">
                                  更新日: {new Date(entry.published_at).toLocaleDateString('ja-JP')}
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? '検索条件に一致する質問が見つかりませんでした。'
                : 'よくある質問はまだありません。'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}