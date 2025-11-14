'use client';

import React, { useState } from 'react';
import { Search, User, Mail, Loader2 } from 'lucide-react';
import { HIGButton } from '@/components/ui/HIGButton';
import { Input } from '@/components/ui/input';
import { 
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardContent
} from '@/components/ui/HIGCard';

interface UserSearchProps {
  onUserSelect: (userId: string) => void;
  loading?: boolean;
}

interface SearchResult {
  id: string;
  email: string;
  account_status: string;
  created_at: string;
}

export default function UserSearch({ onUserSelect, loading = false }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchError('ユーザーIDまたはメールアドレスを入力してください');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      // UUIDかメールアドレスかを判定
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim());
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim());

      if (isUUID) {
        // UUIDの場合は直接選択
        onUserSelect(query.trim());
      } else if (isEmail) {
        // メールアドレスの場合は検索API（仮）
        // 実装简化：現在はメールアドレス検索はサポートしない
        setSearchError('現在はユーザーIDのみ対応しています。メールアドレス検索は今後実装予定です。');
      } else {
        setSearchError('有効なユーザーIDまたはメールアドレスを入力してください');
      }
    } catch (error) {
      setSearchError('検索中にエラーが発生しました');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !searching && !loading) {
      handleSearch();
    }
  };

  return (
    <HIGCard>
      <HIGCardHeader>
        <HIGCardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          ユーザー検索
        </HIGCardTitle>
      </HIGCardHeader>
      <HIGCardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="ユーザーID (UUID)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={searching || loading}
              className="flex-1"
            />
            <HIGButton
              onClick={handleSearch}
              disabled={searching || loading || !query.trim()}
              className="shrink-0"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              検索
            </HIGButton>
          </div>

          {searchError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {searchError}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>ユーザーID: UUID形式（例: 123e4567-e89b-12d3-a456-426614174000）</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>メールアドレス: 今後実装予定</span>
              </div>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">検索結果</h4>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => onUserSelect(user.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.id}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        登録: {new Date(user.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.account_status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : user.account_status === 'warned'
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.account_status === 'suspended'
                          ? 'bg-orange-100 text-orange-800'
                          : user.account_status === 'frozen'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.account_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </HIGCardContent>
    </HIGCard>
  );
}