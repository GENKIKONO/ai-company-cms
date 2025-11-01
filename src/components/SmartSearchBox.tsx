'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { smartSearchEngine } from '@/lib/smart-search';

interface SmartSearchBoxProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function SmartSearchBox({ 
  placeholder = "自然言語で検索（例：東京のIT企業、新しいスタートアップなど）", 
  onSearch,
  className = ""
}: SmartSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 検索候補の生成
  useEffect(() => {
    if (query.length > 1) {
      const autocompleteSuggestions = smartSearchEngine.autocompleteQuery(query);
      const searchSuggestions = smartSearchEngine.generateSearchSuggestions(query);
      setSuggestions([...autocompleteSuggestions, ...searchSuggestions].slice(0, 6));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  }, [query]);

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSearch(suggestions[selectedIndex]);
        } else {
          handleSearch(query);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 検索実行
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const parsed = smartSearchEngine.parseQuery(searchQuery);
    
    // Analytics追跡

    // フィルターをURLパラメータに変換
    const params = new URLSearchParams();
    Object.entries(parsed.filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, String(value));
      }
    });

    // 検索意図に応じて遷移
    switch (parsed.parsed.intent) {
      case 'compare':
        router.push(`/directory?${params.toString()}&intent=compare`);
        break;
      case 'recommend':
        router.push(`/directory?${params.toString()}&intent=recommend`);
        break;
      default:
        router.push(`/directory?${params.toString()}`);
    }

    // 検索ボックスをクリア
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();

    // 親コンポーネントに通知
    onSearch?.(searchQuery);
  };

  // 候補選択
  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  // フォーカス外れた時の処理
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 1 && setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] focus:border-transparent"
        />
        
        {/* 検索アイコン */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* AIアイコン */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[var(--aio-primary)] font-medium">AI</span>
            <button
              onClick={() => handleSearch(query)}
              disabled={!query.trim()}
              className="p-1 text-[var(--aio-primary)] hover:text-blue-800 disabled:text-gray-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 検索候補 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* クエリ解析プレビュー */}
      {query.length > 3 && (
        <div className="absolute z-40 w-full mt-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-[var(--aio-primary)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-blue-900 font-medium">AI解析結果</p>
              {(() => {
                const parsed = smartSearchEngine.parseQuery(query);
                const hints: string[] = [];
                
                if (parsed.parsed.industries.length > 0) {
                  hints.push(`業界: ${parsed.parsed.industries.join(', ')}`);
                }
                if (parsed.parsed.locations.length > 0) {
                  hints.push(`地域: ${parsed.parsed.locations.join(', ')}`);
                }
                if (parsed.parsed.sizes.length > 0) {
                  hints.push(`規模: ${parsed.parsed.sizes.join(', ')}`);
                }
                if (parsed.parsed.intent !== 'search') {
                  hints.push(`意図: ${parsed.parsed.intent === 'compare' ? '比較' : '推薦'}`);
                }
                
                return hints.length > 0 ? (
                  <p className="text-blue-700 text-xs mt-1">{hints.join(' | ')}</p>
                ) : (
                  <p className="text-blue-700 text-xs mt-1">より具体的に入力すると精度が向上します</p>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}