'use client';

import { useState, useRef, useEffect } from 'react';
import { DashboardButton } from '@/components/dashboard/ui';
import { logger } from '@/lib/utils/logger';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    content: string;
    file_id: string;
    display_name: string;
    object_path: string;
    similarity: number;
    chunk_index: number;
  }>;
  timestamp: Date;
}

interface ChatInterfaceProps {
  organizationId: string;
}

export default function ChatInterface({ organizationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'こんにちは！アップロードされた文書について何でもお聞きください。まず文書をアップロードしてからご質問ください。',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState<{ [key: number]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/my/org-docs/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          organization_id: organizationId,
          similarity_threshold: 0.7,
          max_results: 5
        })
      });

      const result = await response.json().catch(() => ({ success: false, error: 'Invalid response format' }));

      if (!response.ok || !result.success) {
        logger.error('[CHAT] API error:', { data: result });
        
        let errorMessage = 'チャット処理中にエラーが発生しました。';
        
        if (response.status === 401) {
          errorMessage = '認証が必要です。再度ログインしてください。';
        } else if (response.status === 403) {
          errorMessage = 'この組織のチャット機能にアクセスする権限がありません。';
        } else if (response.status === 429) {
          errorMessage = 'API利用制限に達しました。しばらく時間をおいてからお試しください。';
        } else if (result.error) {
          errorMessage = result.error;
        }

        const errorAssistantMessage: ChatMessage = {
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorAssistantMessage]);
        return;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.answer || '回答を生成できませんでした。',
        sources: result.sources || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      logger.error('[CHAT] Unexpected error', { 
        data: error instanceof Error ? error : new Error(String(error)) 
      });
      
      const errorAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: '予期しないエラーが発生しました。しばらく後でお試しください。',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSources = (messageIndex: number) => {
    setShowSources(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-96 lg:h-[600px]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--dashboard-card-border)] p-4">
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">AIチャット</h3>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
          アップロードした文書をもとに回答します（β版）
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-[var(--aio-indigo)] text-white'
                  : 'bg-[var(--aio-surface)] text-[var(--color-text-primary)]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Sources */}
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => toggleSources(index)}
                    className="text-xs text-[var(--aio-indigo)] hover:text-[var(--aio-indigo)] flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    参考資料 ({message.sources.length}件)
                  </button>
                  
                  {showSources[index] && (
                    <div className="mt-2 space-y-1">
                      {message.sources.map((source, sourceIndex) => (
                        <div key={sourceIndex} className="text-xs bg-white p-2 rounded border">
                          <div className="font-medium text-[var(--color-text-secondary)]">{source.display_name}</div>
                          <div className="text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                            {source.content.slice(0, 100)}...
                          </div>
                          <div className="text-[var(--color-text-tertiary)] mt-1 flex justify-between">
                            <span>類似度: {Math.round(source.similarity * 100)}%</span>
                            <span>チャンク: {source.chunk_index + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs opacity-75 mt-2">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-[var(--aio-surface)]">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[var(--color-icon-muted)] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[var(--color-icon-muted)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-[var(--color-icon-muted)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] ml-2">回答を生成中...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[var(--dashboard-card-border)] p-4">
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="文書について質問してください..."
            className="flex-1 resize-none border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--aio-indigo)] focus:border-[var(--aio-indigo)]"
            rows={2}
            disabled={isLoading}
          />
          <DashboardButton
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '送信'
            )}
          </DashboardButton>
        </div>
        
        <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">
          Enter で送信、Shift + Enter で改行
        </div>
      </div>
    </div>
  );
}